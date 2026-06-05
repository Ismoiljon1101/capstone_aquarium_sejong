from pathlib import Path
import random
import shutil

BASE_DIR = Path(r"C:\Users\Maral\Desktop\capstone_aquarium_sejong")

INPUT_ROOT = BASE_DIR / "data" / "behavior_dataset_processed" / "frames"
OUTPUT_ROOT = BASE_DIR / "data" / "behavior_dataset_processed" / "split"

TRAIN_RATIO = 0.70
VALID_RATIO = 0.15
TEST_RATIO = 0.15

SEED = 42
CLEAR_OUTPUT = True

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def main():
    random.seed(SEED)

    if CLEAR_OUTPUT and OUTPUT_ROOT.exists():
        shutil.rmtree(OUTPUT_ROOT)

    for split in ["train", "valid", "test"]:
        (OUTPUT_ROOT / split).mkdir(parents=True, exist_ok=True)

    class_dirs = [p for p in INPUT_ROOT.iterdir() if p.is_dir()]

    if not class_dirs:
        print(f"ERROR: No class folders found in {INPUT_ROOT}")
        return

    print(f"Found {len(class_dirs)} classes.")

    for class_dir in sorted(class_dirs):
        class_name = class_dir.name

        images = [
            p for p in class_dir.iterdir()
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        ]

        random.shuffle(images)

        n = len(images)
        n_train = int(n * TRAIN_RATIO)
        n_valid = int(n * VALID_RATIO)

        train_files = images[:n_train]
        valid_files = images[n_train:n_train + n_valid]
        test_files = images[n_train + n_valid:]

        split_map = {
            "train": train_files,
            "valid": valid_files,
            "test": test_files,
        }

        print("=" * 60)
        print(f"Class: {class_name}")
        print(f"Total: {n}")
        print(f"Train: {len(train_files)} | Valid: {len(valid_files)} | Test: {len(test_files)}")

        for split_name, files in split_map.items():
            out_class_dir = OUTPUT_ROOT / split_name / class_name
            out_class_dir.mkdir(parents=True, exist_ok=True)

            for src_path in files:
                dst_path = out_class_dir / src_path.name
                shutil.copy2(src_path, dst_path)

    print("=" * 60)
    print("DONE")
    print(f"Split dataset saved to: {OUTPUT_ROOT}")


if __name__ == "__main__":
    main()