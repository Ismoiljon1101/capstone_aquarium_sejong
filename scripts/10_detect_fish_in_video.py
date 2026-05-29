from pathlib import Path
import sys
import os
import csv
import cv2
from inference_sdk import InferenceHTTPClient

# =========================
# CONFIG
# =========================

BASE_DIR = Path(r"C:\Users\Maral\Desktop\capstone_aquarium_sejong")

ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY")

WORKSPACE_NAME = "marals-workspace-rztj2"

# IMPORTANT:
# Your screenshot shows "Detect, Count, and Visualize 7"
# If Roboflow Deploy page gives a different workflow_id, replace this exactly.
WORKFLOW_ID = "detect-count-and-visualize-7"

API_URL = "https://serverless.roboflow.com"

# Process every Nth frame.
# 5 = more accurate but uses more API calls.
# 10 = faster and cheaper.
FRAME_STEP = 5

# Optional safety limit.
# Set to None to process full video.
# Example: MAX_FRAMES_TO_PROCESS = 80
MAX_FRAMES_TO_PROCESS = None

OUTPUT_ROOT = BASE_DIR / "outputs" / "external_tests"


# =========================
# HELPERS
# =========================

def safe_name(video_path: Path):
    return video_path.stem.replace(" ", "_").replace("-", "_")


def create_output_dirs(video_path: Path):
    name = safe_name(video_path)

    out_dir = OUTPUT_ROOT / name
    frames_dir = out_dir / "frames"
    annotated_dir = out_dir / "annotated_frames"

    frames_dir.mkdir(parents=True, exist_ok=True)
    annotated_dir.mkdir(parents=True, exist_ok=True)

    return out_dir, frames_dir, annotated_dir


def init_client():
    if not ROBOFLOW_API_KEY:
        raise RuntimeError(
            "ROBOFLOW_API_KEY is missing. Set it first in PowerShell:\n"
            '$env:ROBOFLOW_API_KEY="YOUR_API_KEY"'
        )

    return InferenceHTTPClient(
        api_url=API_URL,
        api_key=ROBOFLOW_API_KEY
    )


def extract_predictions_from_workflow_result(result):
    """
    Roboflow Workflow outputs vary depending on workflow blocks.
    This recursively searches for prediction dictionaries that contain:
    x, y, width, height.
    """

    predictions = []

    def walk(obj):
        if isinstance(obj, dict):
            if all(k in obj for k in ["x", "y", "width", "height"]):
                predictions.append(obj)

            for value in obj.values():
                walk(value)

        elif isinstance(obj, list):
            for item in obj:
                walk(item)

    walk(result)
    return predictions


def roboflow_detect(client, image_path: Path):
    try:
        result = client.run_workflow(
            workspace_name=WORKSPACE_NAME,
            workflow_id=WORKFLOW_ID,
            images={
                "image": str(image_path)
            },
            use_cache=True
        )
    except Exception as e:
        raise RuntimeError(f"Roboflow workflow failed: {e}")

    predictions = extract_predictions_from_workflow_result(result)
    return predictions, result


def draw_predictions(frame, predictions):
    annotated = frame.copy()

    for pred in predictions:
        x = float(pred.get("x", 0.0))
        y = float(pred.get("y", 0.0))
        w = float(pred.get("width", 0.0))
        h = float(pred.get("height", 0.0))
        conf = float(pred.get("confidence", 0.0))
        cls = pred.get("class", "Fish")

        x1 = int(x - w / 2)
        y1 = int(y - h / 2)
        x2 = int(x + w / 2)
        y2 = int(y + h / 2)

        # Clip coordinates to frame bounds
        frame_h, frame_w = annotated.shape[:2]
        x1 = max(0, min(x1, frame_w - 1))
        y1 = max(0, min(y1, frame_h - 1))
        x2 = max(0, min(x2, frame_w - 1))
        y2 = max(0, min(y2, frame_h - 1))

        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)

        label = f"{cls} {conf:.2f}"
        cv2.putText(
            annotated,
            label,
            (x1, max(20, y1 - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 255, 0),
            2,
            cv2.LINE_AA,
        )

    return annotated


def write_csv(csv_path: Path, rows):
    fieldnames = [
        "video_name",
        "frame_index",
        "frame_file",
        "fish_index",
        "class",
        "confidence",
        "x_center",
        "y_center",
        "width",
        "height",
        "frame_width",
        "frame_height",
        "fps",
    ]

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def detect_video(video_path: Path):
    client = init_client()

    out_dir, frames_dir, annotated_dir = create_output_dirs(video_path)
    csv_path = out_dir / "fish_detections.csv"

    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = float(cap.get(cv2.CAP_PROP_FPS))
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if total_frames <= 0:
        cap.release()
        raise RuntimeError(f"Video has 0 readable frames: {video_path}")

    print("=" * 70)
    print("ROBOFLOW WORKFLOW FISH DETECTION")
    print(f"Video: {video_path}")
    print(f"Total frames: {total_frames}")
    print(f"FPS: {fps}")
    print(f"Frame size: {frame_width}x{frame_height}")
    print(f"Frame step: {FRAME_STEP}")
    print(f"Workflow: {WORKSPACE_NAME}/{WORKFLOW_ID}")
    print(f"Output: {out_dir}")
    print("-" * 70)

    rows = []
    processed = 0
    total_detections = 0

    frame_index = 0

    while frame_index < total_frames:
        if MAX_FRAMES_TO_PROCESS is not None and processed >= MAX_FRAMES_TO_PROCESS:
            print(f"Reached MAX_FRAMES_TO_PROCESS={MAX_FRAMES_TO_PROCESS}. Stopping early.")
            break

        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        ret, frame = cap.read()

        if not ret:
            print(f"WARNING: Could not read frame {frame_index}. Stopping.")
            break

        frame_file = f"frame_{frame_index:06d}.jpg"
        frame_path = frames_dir / frame_file

        cv2.imwrite(str(frame_path), frame)

        try:
            predictions, _ = roboflow_detect(client, frame_path)
        except Exception as e:
            print(f"ERROR on frame {frame_index}: {e}")
            predictions = []

        annotated = draw_predictions(frame, predictions)
        annotated_path = annotated_dir / frame_file
        cv2.imwrite(str(annotated_path), annotated)

        print(f"Frame {frame_index}: Fish detected: {len(predictions)}")

        for fish_index, pred in enumerate(predictions):
            rows.append({
                "video_name": video_path.name,
                "frame_index": frame_index,
                "frame_file": frame_file,
                "fish_index": fish_index,
                "class": pred.get("class", "Fish"),
                "confidence": pred.get("confidence", 0.0),
                "x_center": pred.get("x", 0.0),
                "y_center": pred.get("y", 0.0),
                "width": pred.get("width", 0.0),
                "height": pred.get("height", 0.0),
                "frame_width": frame_width,
                "frame_height": frame_height,
                "fps": fps,
            })

        processed += 1
        total_detections += len(predictions)

        frame_index += FRAME_STEP

    cap.release()

    write_csv(csv_path, rows)

    avg_detections = total_detections / processed if processed > 0 else 0

    print("-" * 70)
    print("DONE")
    print(f"Processed frames: {processed}")
    print(f"Total detections: {total_detections}")
    print(f"Average detections/frame: {avg_detections:.3f}")
    print(f"Saved CSV: {csv_path}")
    print(f"Saved frames: {frames_dir}")
    print(f"Saved annotated frames: {annotated_dir}")
    print("=" * 70)

    if total_detections == 0:
        print("WARNING: 0 detections saved. Check workflow ID, model block, API key, or workflow output structure.")

    return csv_path


# =========================
# MAIN
# =========================

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print(r'python scripts\10_detect_fish_in_video.py "C:\path\to\video.mp4"')
        return

    video_path = Path(sys.argv[1])

    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    detect_video(video_path)


if __name__ == "__main__":
    main()