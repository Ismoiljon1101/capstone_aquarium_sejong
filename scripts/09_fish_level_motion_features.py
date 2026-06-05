from pathlib import Path
import sys
import math
import pandas as pd
import numpy as np

# =========================
# CONFIG
# =========================

BASE_DIR = Path(r"C:\Users\Maral\Desktop\capstone_aquarium_sejong")

# Default input. You can override from command line.
DEFAULT_DETECTIONS_CSV = BASE_DIR / "data" / "fish_detections.csv"

OUTPUT_TRACKS_CSV = BASE_DIR / "outputs" / "fish_level_motion_tracks.csv"
OUTPUT_SUMMARY_CSV = BASE_DIR / "outputs" / "fish_level_motion_summary.csv"

# Approximate video size if CSV does not contain frame_width/frame_height.
# Change if needed.
DEFAULT_FRAME_WIDTH = 1280
DEFAULT_FRAME_HEIGHT = 720

# Simple nearest-center tracking settings
MAX_MATCH_DISTANCE = 90          # pixels
MAX_MISSING_FRAMES = 8           # delete track after missing this many frames
MIN_TRACK_LENGTH = 4             # only analyze tracks with at least this many detections

# Behavior thresholds
LOW_SPEED_THRESHOLD = 3.0        # px/frame
HIGH_SPEED_THRESHOLD = 35.0      # px/frame
ERRATIC_TURN_THRESHOLD = 90.0    # degrees
SURFACE_ZONE_RATIO = 0.25        # top 25%
BOTTOM_ZONE_RATIO = 0.75         # bottom 25%

# Repeated behavior thresholds
REPEATED_RATIO_THRESHOLD = 0.60


# =========================
# HELPERS
# =========================

def get_col(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    raise ValueError(f"Missing required column. Tried: {candidates}")


def normalize_detections(df):
    """
    Supports your Roboflow CSV format:
    frame_index, frame_file, fish_index, class, confidence, x_center, y_center, width, height

    Also supports common names:
    x, y, w, h
    """
    frame_col = get_col(df, ["frame_index", "frame", "frame_id"])
    x_col = get_col(df, ["x_center", "x", "center_x"])
    y_col = get_col(df, ["y_center", "y", "center_y"])
    w_col = get_col(df, ["width", "w"])
    h_col = get_col(df, ["height", "h"])

    conf_col = None
    for c in ["confidence", "conf", "score"]:
        if c in df.columns:
            conf_col = c
            break

    norm = pd.DataFrame()
    norm["frame_index"] = df[frame_col].astype(int)
    norm["x_center"] = df[x_col].astype(float)
    norm["y_center"] = df[y_col].astype(float)
    norm["width"] = df[w_col].astype(float)
    norm["height"] = df[h_col].astype(float)

    if conf_col:
        norm["confidence"] = df[conf_col].astype(float)
    else:
        norm["confidence"] = 1.0

    if "frame_file" in df.columns:
        norm["frame_file"] = df["frame_file"].astype(str)
    else:
        norm["frame_file"] = ""

    return norm.sort_values(["frame_index"]).reset_index(drop=True)


def distance(p1, p2):
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)


def angle_between(v1, v2):
    """
    Returns angle difference in degrees between two vectors.
    """
    x1, y1 = v1
    x2, y2 = v2

    mag1 = math.sqrt(x1 * x1 + y1 * y1)
    mag2 = math.sqrt(x2 * x2 + y2 * y2)

    if mag1 == 0 or mag2 == 0:
        return 0.0

    dot = x1 * x2 + y1 * y2
    cos_angle = max(-1.0, min(1.0, dot / (mag1 * mag2)))

    return math.degrees(math.acos(cos_angle))


def get_zone(y, frame_height):
    if y <= frame_height * SURFACE_ZONE_RATIO:
        return "surface"
    if y >= frame_height * BOTTOM_ZONE_RATIO:
        return "bottom"
    return "middle"


# =========================
# SIMPLE TRACKER
# =========================

class Track:
    def __init__(self, track_id, frame_index, x, y, w, h, confidence):
        self.track_id = track_id
        self.last_frame = frame_index
        self.last_position = (x, y)
        self.missing = 0
        self.rows = []

        self.add_detection(frame_index, x, y, w, h, confidence)

    def add_detection(self, frame_index, x, y, w, h, confidence):
        self.rows.append({
            "track_id": self.track_id,
            "frame_index": int(frame_index),
            "x_center": float(x),
            "y_center": float(y),
            "width": float(w),
            "height": float(h),
            "confidence": float(confidence),
        })
        self.last_frame = int(frame_index)
        self.last_position = (float(x), float(y))
        self.missing = 0

    def mark_missing(self):
        self.missing += 1


def build_tracks(detections):
    active_tracks = []
    finished_tracks = []
    next_track_id = 0

    all_frames = sorted(detections["frame_index"].unique())

    for frame_index in all_frames:
        frame_dets = detections[detections["frame_index"] == frame_index].copy()

        dets = []
        for _, row in frame_dets.iterrows():
            dets.append({
                "frame_index": int(row["frame_index"]),
                "x": float(row["x_center"]),
                "y": float(row["y_center"]),
                "w": float(row["width"]),
                "h": float(row["height"]),
                "confidence": float(row["confidence"]),
            })

        unmatched_dets = set(range(len(dets)))
        unmatched_tracks = set(range(len(active_tracks)))

        # Match tracks to detections using nearest center
        candidate_matches = []

        for ti, track in enumerate(active_tracks):
            for di, det in enumerate(dets):
                dist = distance(track.last_position, (det["x"], det["y"]))
                if dist <= MAX_MATCH_DISTANCE:
                    candidate_matches.append((dist, ti, di))

        candidate_matches.sort(key=lambda x: x[0])

        matched_tracks = set()
        matched_dets = set()

        for dist, ti, di in candidate_matches:
            if ti in matched_tracks or di in matched_dets:
                continue

            track = active_tracks[ti]
            det = dets[di]

            track.add_detection(
                frame_index=det["frame_index"],
                x=det["x"],
                y=det["y"],
                w=det["w"],
                h=det["h"],
                confidence=det["confidence"],
            )

            matched_tracks.add(ti)
            matched_dets.add(di)

        unmatched_dets = unmatched_dets - matched_dets
        unmatched_tracks = unmatched_tracks - matched_tracks

        # Mark unmatched tracks as missing
        still_active = []

        for ti, track in enumerate(active_tracks):
            if ti in unmatched_tracks:
                track.mark_missing()

            if track.missing > MAX_MISSING_FRAMES:
                finished_tracks.append(track)
            else:
                still_active.append(track)

        active_tracks = still_active

        # Create new tracks from unmatched detections
        for di in unmatched_dets:
            det = dets[di]
            new_track = Track(
                track_id=next_track_id,
                frame_index=det["frame_index"],
                x=det["x"],
                y=det["y"],
                w=det["w"],
                h=det["h"],
                confidence=det["confidence"],
            )
            active_tracks.append(new_track)
            next_track_id += 1

    finished_tracks.extend(active_tracks)

    rows = []
    for track in finished_tracks:
        rows.extend(track.rows)

    tracks_df = pd.DataFrame(rows)

    if tracks_df.empty:
        raise RuntimeError("No tracks created.")

    return tracks_df.sort_values(["track_id", "frame_index"]).reset_index(drop=True)


# =========================
# FEATURE EXTRACTION
# =========================

def add_motion_features(tracks_df, frame_height):
    output_rows = []

    for track_id, group in tracks_df.groupby("track_id"):
        group = group.sort_values("frame_index").reset_index(drop=True)

        prev_x = None
        prev_y = None
        prev_frame = None
        prev_vector = None

        for i, row in group.iterrows():
            x = row["x_center"]
            y = row["y_center"]
            frame_index = int(row["frame_index"])

            speed = 0.0
            dx = 0.0
            dy = 0.0
            turn_angle = 0.0

            if prev_x is not None:
                frame_delta = max(1, frame_index - prev_frame)
                dx = x - prev_x
                dy = y - prev_y
                speed = math.sqrt(dx * dx + dy * dy) / frame_delta

                curr_vector = (dx, dy)

                if prev_vector is not None:
                    turn_angle = angle_between(prev_vector, curr_vector)

                prev_vector = curr_vector
            else:
                prev_vector = None

            zone = get_zone(y, frame_height)

            if speed <= LOW_SPEED_THRESHOLD:
                speed_label = "low_speed"
            elif speed >= HIGH_SPEED_THRESHOLD:
                speed_label = "high_speed"
            else:
                speed_label = "normal_speed"

            is_erratic_turn = turn_angle >= ERRATIC_TURN_THRESHOLD

            output_rows.append({
                "track_id": int(track_id),
                "frame_index": frame_index,
                "x_center": x,
                "y_center": y,
                "width": row["width"],
                "height": row["height"],
                "confidence": row["confidence"],
                "dx": round(dx, 3),
                "dy": round(dy, 3),
                "speed_px_per_frame": round(speed, 3),
                "turn_angle_deg": round(turn_angle, 3),
                "zone": zone,
                "speed_label": speed_label,
                "is_erratic_turn": bool(is_erratic_turn),
            })

            prev_x = x
            prev_y = y
            prev_frame = frame_index

    return pd.DataFrame(output_rows)


def summarize_tracks(features_df):
    summaries = []

    for track_id, group in features_df.groupby("track_id"):
        group = group.sort_values("frame_index")

        if len(group) < MIN_TRACK_LENGTH:
            continue

        total = len(group)

        surface_ratio = float(np.mean(group["zone"] == "surface"))
        middle_ratio = float(np.mean(group["zone"] == "middle"))
        bottom_ratio = float(np.mean(group["zone"] == "bottom"))

        low_speed_ratio = float(np.mean(group["speed_label"] == "low_speed"))
        high_speed_ratio = float(np.mean(group["speed_label"] == "high_speed"))
        erratic_turn_ratio = float(np.mean(group["is_erratic_turn"] == True))

        mean_speed = float(group["speed_px_per_frame"].mean())
        max_speed = float(group["speed_px_per_frame"].max())
        mean_turn = float(group["turn_angle_deg"].mean())
        max_turn = float(group["turn_angle_deg"].max())

        behavior_flags = []

        if surface_ratio >= REPEATED_RATIO_THRESHOLD:
            behavior_flags.append("repeated_surface_staying")

        if bottom_ratio >= REPEATED_RATIO_THRESHOLD:
            behavior_flags.append("repeated_bottom_staying")

        if low_speed_ratio >= REPEATED_RATIO_THRESHOLD:
            behavior_flags.append("low_activity_pattern")

        if high_speed_ratio >= 0.35:
            behavior_flags.append("high_activity_pattern")

        if erratic_turn_ratio >= 0.30:
            behavior_flags.append("erratic_turning_pattern")

        if not behavior_flags:
            behavior_flags.append("no_repeated_alert")

        summaries.append({
            "track_id": int(track_id),
            "track_length": total,
            "start_frame": int(group["frame_index"].min()),
            "end_frame": int(group["frame_index"].max()),
            "mean_speed_px_per_frame": round(mean_speed, 3),
            "max_speed_px_per_frame": round(max_speed, 3),
            "mean_turn_angle_deg": round(mean_turn, 3),
            "max_turn_angle_deg": round(max_turn, 3),
            "surface_ratio": round(surface_ratio, 3),
            "middle_ratio": round(middle_ratio, 3),
            "bottom_ratio": round(bottom_ratio, 3),
            "low_speed_ratio": round(low_speed_ratio, 3),
            "high_speed_ratio": round(high_speed_ratio, 3),
            "erratic_turn_ratio": round(erratic_turn_ratio, 3),
            "behavior_flags": " | ".join(behavior_flags),
        })

    return pd.DataFrame(summaries)


def summarize_video(summary_df):
    if summary_df.empty:
        return {
            "video_motion_interpretation": "no_valid_tracks",
            "dominant_flags": "none",
        }

    all_flags = []

    for flags in summary_df["behavior_flags"]:
        for f in str(flags).split("|"):
            flag = f.strip()
            if flag and flag != "no_repeated_alert":
                all_flags.append(flag)

    if not all_flags:
        dominant_flags = "no_repeated_alert"
    else:
        dominant_flags = " | ".join(pd.Series(all_flags).value_counts().head(5).index.tolist())

    mean_speed = summary_df["mean_speed_px_per_frame"].mean()
    mean_surface = summary_df["surface_ratio"].mean()
    mean_bottom = summary_df["bottom_ratio"].mean()
    mean_low = summary_df["low_speed_ratio"].mean()
    mean_high = summary_df["high_speed_ratio"].mean()
    mean_erratic = summary_df["erratic_turn_ratio"].mean()

    interpretation = []

    if mean_low >= 0.55:
        interpretation.append("tank_level_low_activity")

    if mean_high >= 0.30:
        interpretation.append("tank_level_high_activity")

    if mean_surface >= 0.50:
        interpretation.append("tank_level_surface_staying")

    if mean_bottom >= 0.50:
        interpretation.append("tank_level_bottom_staying")

    if mean_erratic >= 0.25:
        interpretation.append("tank_level_erratic_turning")

    if not interpretation:
        interpretation.append("tank_level_normal_or_mixed_motion")

    return {
        "video_motion_interpretation": " | ".join(interpretation),
        "dominant_flags": dominant_flags,
        "mean_track_speed": round(float(mean_speed), 3),
        "mean_surface_ratio": round(float(mean_surface), 3),
        "mean_bottom_ratio": round(float(mean_bottom), 3),
        "mean_low_speed_ratio": round(float(mean_low), 3),
        "mean_high_speed_ratio": round(float(mean_high), 3),
        "mean_erratic_turn_ratio": round(float(mean_erratic), 3),
    }


# =========================
# MAIN
# =========================

def main():
    if len(sys.argv) >= 2:
        detections_csv = Path(sys.argv[1])
    else:
        detections_csv = DEFAULT_DETECTIONS_CSV

    if not detections_csv.exists():
        raise FileNotFoundError(f"Detections CSV not found: {detections_csv}")

    print("=" * 70)
    print("FISH-LEVEL MOTION FEATURE EXTRACTION")
    print(f"Input detections: {detections_csv}")

    df = pd.read_csv(detections_csv)
    detections = normalize_detections(df)

    frame_width = DEFAULT_FRAME_WIDTH
    frame_height = DEFAULT_FRAME_HEIGHT

    if "frame_width" in df.columns:
        frame_width = int(df["frame_width"].iloc[0])

    if "frame_height" in df.columns:
        frame_height = int(df["frame_height"].iloc[0])

    print(f"Detections loaded: {len(detections)}")
    print(f"Frame size used: {frame_width}x{frame_height}")

    tracks = build_tracks(detections)
    features = add_motion_features(tracks, frame_height)
    summary = summarize_tracks(features)
    video_summary = summarize_video(summary)

    OUTPUT_TRACKS_CSV.parent.mkdir(parents=True, exist_ok=True)

    features.to_csv(OUTPUT_TRACKS_CSV, index=False)
    summary.to_csv(OUTPUT_SUMMARY_CSV, index=False)

    print("-" * 70)
    print(f"Track-level feature rows: {len(features)}")
    print(f"Valid track summaries: {len(summary)}")
    print(f"Saved track features: {OUTPUT_TRACKS_CSV}")
    print(f"Saved track summary : {OUTPUT_SUMMARY_CSV}")

    print("-" * 70)
    print("VIDEO-LEVEL MOTION INTERPRETATION:")
    for key, value in video_summary.items():
        print(f"{key}: {value}")

    print("=" * 70)


if __name__ == "__main__":
    main()