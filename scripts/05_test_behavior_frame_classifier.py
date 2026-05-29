from pathlib import Path
import json
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import sys

BASE_DIR = Path(r"C:\Users\Maral\Desktop\capstone_aquarium_sejong")

MODEL_PATH = BASE_DIR / "models" / "behavior_frame_classifier" / "best_behavior_frame_classifier.pt"
CLASS_NAMES_PATH = BASE_DIR / "models" / "behavior_frame_classifier" / "class_names.json"

IMG_SIZE = 224
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Put the image/frame you want to test here
TEST_IMAGE = BASE_DIR / "data" / "behavior_dataset_processed" / "split" / "test" / "surface_gasping" / "PASTE_IMAGE_NAME_HERE.jpg"


def load_model():
    with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
        class_names = json.load(f)

    num_classes = len(class_names)

    model = models.mobilenet_v3_small(weights=None)
    model.classifier[-1] = nn.Linear(model.classifier[-1].in_features, num_classes)

    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(DEVICE)
    model.eval()

    return model, class_names


def predict_image(image_path: Path):
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225]),
    ])

    image = Image.open(image_path).convert("RGB")
    image_tensor = transform(image).unsqueeze(0).to(DEVICE)

    model, class_names = load_model()

    with torch.no_grad():
        outputs = model(image_tensor)
        probs = torch.softmax(outputs, dim=1)[0]

    top_probs, top_indices = torch.topk(probs, k=min(5, len(class_names)))

    print("=" * 70)
    print(f"Test image: {image_path}")
    print("Top predictions:")

    for prob, idx in zip(top_probs, top_indices):
        print(f"{class_names[idx]}: {prob.item():.4f}")

    pred_idx = top_indices[0].item()
    print("-" * 70)
    print(f"FINAL PREDICTION: {class_names[pred_idx]}")
    print(f"CONFIDENCE: {top_probs[0].item():.4f}")
    print("=" * 70)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_path = Path(sys.argv[1])
    else:
        test_path = TEST_IMAGE

    predict_image(test_path)