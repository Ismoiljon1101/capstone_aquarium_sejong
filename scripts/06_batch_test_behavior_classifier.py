from pathlib import Path
import json
import csv
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

BASE_DIR = Path(r"C:\Users\Maral\Desktop\capstone_aquarium_sejong")

MODEL_PATH = BASE_DIR / "models" / "behavior_frame_classifier" / "best_behavior_frame_classifier.pt"
CLASS_NAMES_PATH = BASE_DIR / "models" / "behavior_frame_classifier" / "class_names.json"

TEST_ROOT = BASE_DIR / "data" / "behavior_dataset_processed" / "split" / "test"
OUTPUT_CSV = BASE_DIR / "outputs" / "behavior_frame_classifier_test_results.csv"

IMG_SIZE = 224
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def load_model():
    with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
        class_names = json.load(f)

    model = models.mobilenet_v3_small(weights=None)
    model.classifier[-1] = nn.Linear(model.classifier[-1].in_features, len(class_names))

    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(DEVICE)
    model.eval()

    return model, class_names


def main():
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)

    model, class_names = load_model()

    transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225]),
    ])

    rows = []
    total = 0
    correct = 0

    for class_dir in sorted(TEST_ROOT.iterdir()):
        if not class_dir.is_dir():
            continue

        true_class = class_dir.name

        for image_path in sorted(class_dir.iterdir()):
            if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue

            image = Image.open(image_path).convert("RGB")
            image_tensor = transform(image).unsqueeze(0).to(DEVICE)

            with torch.no_grad():
                outputs = model(image_tensor)
                probs = torch.softmax(outputs, dim=1)[0]

            top_probs, top_indices = torch.topk(probs, k=3)

            pred_class = class_names[top_indices[0].item()]
            confidence = top_probs[0].item()

            top2_class = class_names[top_indices[1].item()]
            top2_confidence = top_probs[1].item()

            top3_class = class_names[top_indices[2].item()]
            top3_confidence = top_probs[2].item()

            is_correct = pred_class == true_class

            total += 1
            correct += int(is_correct)

            rows.append({
                "image_path": str(image_path),
                "true_class": true_class,
                "predicted_class": pred_class,
                "confidence": round(confidence, 4),
                "top2_class": top2_class,
                "top2_confidence": round(top2_confidence, 4),
                "top3_class": top3_class,
                "top3_confidence": round(top3_confidence, 4),
                "correct": is_correct,
            })

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    accuracy = correct / total if total else 0

    print("=" * 70)
    print(f"Total tested: {total}")
    print(f"Correct: {correct}")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Saved CSV: {OUTPUT_CSV}")
    print("=" * 70)

    print("Wrong predictions:")
    for row in rows:
        if not row["correct"]:
            print(
                f'{row["true_class"]} -> {row["predicted_class"]} '
                f'conf={row["confidence"]} | {Path(row["image_path"]).name}'
            )


if __name__ == "__main__":
    main()