from pathlib import Path
import cv2
import numpy as np
import shutil

BASE_DIR = Path(r"C:\Users\Maral\Desktop\capstone_aquarium_sejong")

INPUT_ROOT = BASE_DIR / "data" / "behavior_labeled_raw"
OUTPUT_ROOT = BASE_DIR / "data" / "behavior_dataset_processed" / "frames"

FRAMES_PER_VIDEO = 10
CLEAR_OUTPUT = True

VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".m4v"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def extract_frames_from_video(video_path: Path, output_class_dir: Path):
    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        print(f"ERROR: Could not open video: {video_path}")
        return 0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total_frames <= 0:
        print(f"ERROR: 0 readable frames in: {video_path}")
        cap.release()
        return 0

    start = int(total_frames * 0.10)
    end = int(total_frames * 0.90)

    if end <= start:
        start = 0
        end = total_frames - 1

    frame_indices = np.linspace(start, end, FRAMES_PER_VIDEO, dtype=int)

    saved = 0
    video_stem = video_path.stem.replace(" ", "_").replace("-", "_")

    for idx, frame_id in enumerate(frame_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(frame_id))
        ret, frame = cap.read()

        if not ret:
            print(f"WARNING: Could not read frame {frame_id} from {video_path.name}")
            continue

        out_name = f"{video_stem}_frame_{idx:03d}.jpg"
        out_path = output_class_dir / out_name

        ok = cv2.imwrite(str(out_path), frame)
        if ok:
            saved += 1
        else:
            print(f"WARNING: Could not save frame to {out_path}")

    cap.release()
    return saved


def copy_image(image_path: Path, output_class_dir: Path):
    img = cv2.imread(str(image_path))
    if img is None:
        print(f"ERROR: Could not read image: {image_path}")
        return 0

    clean_name = image_path.stem.replace(" ", "_").replace("-", "_")
    out_path = output_class_dir / f"{clean_name}{image_path.suffix.lower()}"

    ok = cv2.imwrite(str(out_path), img)
    return 1 if ok else 0


def main():
    print("Behavior frame extraction started.")
    print(f"Input root : {INPUT_ROOT}")
    print(f"Output root: {OUTPUT_ROOT}")

    if not INPUT_ROOT.exists():
        print(f"ERROR: Input folder does not exist: {INPUT_ROOT}")
        return

    if CLEAR_OUTPUT and OUTPUT_ROOT.exists():
        shutil.rmtree(OUTPUT_ROOT)

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

    class_dirs = [p for p in INPUT_ROOT.iterdir() if p.is_dir()]

    if not class_dirs:
        print("ERROR: No class folders found.")
        return

    print(f"Found {len(class_dirs)} behavior classes.")

    total_saved = 0

    for class_dir in sorted(class_dirs):
        class_name = class_dir.name
        output_class_dir = OUTPUT_ROOT / class_name
        output_class_dir.mkdir(parents=True, exist_ok=True)

        files = [p for p in class_dir.rglob("*") if p.is_file()]

        print("=" * 70)
        print(f"Class: {class_name}")
        print(f"Files found: {len(files)}")

        class_saved = 0

        for file_path in files:
            ext = file_path.suffix.lower()

            if ext in VIDEO_EXTENSIONS:
                class_saved += extract_frames_from_video(file_path, output_class_dir)

            elif ext in IMAGE_EXTENSIONS:
                class_saved += copy_image(file_path, output_class_dir)

            else:
                print(f"Skipping unsupported file: {file_path}")

        print(f"Saved images for {class_name}: {class_saved}")
        total_saved += class_saved

    print("=" * 70)
    print("DONE")
    print(f"Total saved images: {total_saved}")
    print(f"Output folder: {OUTPUT_ROOT}")


if __name__ == "__main__":
    main()
