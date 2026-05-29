from pathlib import Path
import sys
import cv2
import numpy as np
import csv

# =========================
# CONFIG
# =========================

BASE_DIR = Path(r"C:\Users\Maral\Desktop\capstone_aquarium_sejong")
OUTPUT_CSV = BASE_DIR / "outputs" / "video_motion_analysis.csv"

RESIZE_WIDTH = 640

# Compare frames separated by this many seconds, not adjacent frames.
FRAME_GAP_SECONDS = 0.25

# Sample every this many seconds.
SAMPLE_EVERY_SECONDS = 0.10

MOTION_THRESHOLD = 35

START_RATIO = 0.10
END_RATIO = 0.90


def resize_keep_aspect(frame, target_width):
    h, w = frame.shape[:2]
    if w == target_width:
        return frame

    scale = target_width / w
    new_h = int(h * scale)
    return cv2.resize(frame, (target_width, new_h))


def active_pixel_motion(frame_a, frame_b, motion_threshold):
    a_gray = cv2.cvtColor(frame_a, cv2.COLOR_BGR2GRAY)
    b_gray = cv2.cvtColor(frame_b, cv2.COLOR_BGR2GRAY)

    a_gray = cv2.GaussianBlur(a_gray, (5, 5), 0)
    b_gray = cv2.GaussianBlur(b_gray, (5, 5), 0)

    diff = cv2.absdiff(a_gray, b_gray)

    _, mask = cv2.threshold(diff, motion_threshold, 255, cv2.THRESH_BINARY)

    active_pixels = int(np.sum(mask == 255))
    total_pixels = mask.shape[0] * mask.shape[1]
    active_ratio = active_pixels / total_pixels

    return active_pixels, active_ratio


def read_frame_at(cap, frame_index, resize_width):
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(frame_index))
    ret, frame = cap.read()

    if not ret:
        return None

    return resize_keep_aspect(frame, resize_width)


def classify_motion(avg_ratio, median_ratio, high_ratio, very_high_ratio, low_ratio):
    """
    These are rough thresholds. We tune them after testing more videos.
    """

    if avg_ratio < 0.004 and median_ratio < 0.004 and low_ratio > 0.75:
        return "very_low_motion"

    if avg_ratio < 0.010 and median_ratio < 0.008 and low_ratio > 0.55:
        return "low_motion"

    if avg_ratio > 0.050 or very_high_ratio > 0.25:
        return "very_high_motion"

    if avg_ratio > 0.025 or high_ratio > 0.30:
        return "high_motion"

    if avg_ratio > 0.015 or high_ratio > 0.15:
        return "moderate_motion"

    return "normal_motion"


def analyze_video_motion(video_path: Path):
    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = float(cap.get(cv2.CAP_PROP_FPS))

    if total_frames <= 0 or fps <= 0:
        cap.release()
        raise RuntimeError(f"Invalid video frames/FPS: {video_path}")

    start_frame = int(total_frames * START_RATIO)
    end_frame = int(total_frames * END_RATIO)

    gap_frames = max(1, int(fps * FRAME_GAP_SECONDS))
    sample_step_frames = max(1, int(fps * SAMPLE_EVERY_SECONDS))

    motion_values = []

    frame_a = start_frame

    while frame_a + gap_frames <= end_frame:
        frame_b = frame_a + gap_frames

        img_a = read_frame_at(cap, frame_a, RESIZE_WIDTH)
        img_b = read_frame_at(cap, frame_b, RESIZE_WIDTH)

        if img_a is not None and img_b is not None:
            _, active_ratio = active_pixel_motion(img_a, img_b, MOTION_THRESHOLD)
            motion_values.append(active_ratio)

        frame_a += sample_step_frames

    cap.release()

    if not motion_values:
        raise RuntimeError("No motion values calculated.")

    motion_values = np.array(motion_values)

    avg_motion = float(np.mean(motion_values))
    median_motion = float(np.median(motion_values))
    max_motion = float(np.max(motion_values))
    min_motion = float(np.min(motion_values))
    std_motion = float(np.std(motion_values))

    low_motion_ratio = float(np.mean(motion_values < 0.008))
    high_motion_ratio = float(np.mean(motion_values > 0.025))
    very_high_motion_ratio = float(np.mean(motion_values > 0.050))

    motion_status = classify_motion(
        avg_ratio=avg_motion,
        median_ratio=median_motion,
        high_ratio=high_motion_ratio,
        very_high_ratio=very_high_motion_ratio,
        low_ratio=low_motion_ratio
    )

    return {
        "video_path": str(video_path),
        "video_name": video_path.name,
        "total_frames": total_frames,
        "fps": round(fps, 3),
        "frames_analyzed_start": start_frame,
        "frames_analyzed_end": end_frame,
        "frame_gap_seconds": FRAME_GAP_SECONDS,
        "gap_frames": gap_frames,
        "sample_every_seconds": SAMPLE_EVERY_SECONDS,
        "sample_step_frames": sample_step_frames,
        "motion_samples": len(motion_values),
        "avg_motion_ratio": round(avg_motion, 6),
        "median_motion_ratio": round(median_motion, 6),
        "max_motion_ratio": round(max_motion, 6),
        "min_motion_ratio": round(min_motion, 6),
        "std_motion_ratio": round(std_motion, 6),
        "low_motion_ratio": round(low_motion_ratio, 4),
        "high_motion_ratio": round(high_motion_ratio, 4),
        "very_high_motion_ratio": round(very_high_motion_ratio, 4),
        "motion_status": motion_status,
    }


def save_result_to_csv(result):
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)

    file_exists = OUTPUT_CSV.exists()

    with open(OUTPUT_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(result.keys()))

        if not file_exists:
            writer.writeheader()

        writer.writerow(result)


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print(r'python scripts\08_video_motion_analysis.py "C:\path\to\video.mp4"')
        return

    video_path = Path(sys.argv[1])

    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    print("=" * 70)
    print("VIDEO MOTION ANALYSIS - FPS NORMALIZED")
    print(f"Video: {video_path}")
    print("-" * 70)

    result = analyze_video_motion(video_path)

    for key, value in result.items():
        print(f"{key}: {value}")

    save_result_to_csv(result)

    print("-" * 70)
    print(f"Saved/updated CSV: {OUTPUT_CSV}")
    print("=" * 70)


if __name__ == "__main__":
    main()