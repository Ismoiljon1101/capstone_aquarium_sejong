from pathlib import Path
import sys
import json
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from collections import Counter, defaultdict

# =========================
# CONFIG
# =========================

BASE_DIR = Path(r"C:\Users\Maral\Desktop\capstone_aquarium_sejong")

MODEL_PATH = BASE_DIR / "models" / "behavior_frame_classifier" / "best_behavior_frame_classifier.pt"
CLASS_NAMES_PATH = BASE_DIR / "models" / "behavior_frame_classifier" / "class_names.json"

IMG_SIZE = 224

# More frames = more stable video-level prediction
FRAMES_PER_VIDEO = 20

# If a frame confidence is below this, strict vote becomes "uncertain_behavior"
# Raw vote is still saved and used for backup decision.
UNCERTAIN_THRESHOLD = 0.60

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# =========================
# MODEL LOADING
# =========================

def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    if not CLASS_NAMES_PATH.exists():
        raise FileNotFoundError(f"Class names file not found: {CLASS_NAMES_PATH}")

    with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
        class_names = json.load(f)

    model = models.mobilenet_v3_small(weights=None)
    model.classifier[-1] = nn.Linear(
        model.classifier[-1].in_features,
        len(class_names)
    )

    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
    model.load_state_dict(checkpoint["model_state_dict"])

    model.to(DEVICE)
    model.eval()

    return model, class_names


# =========================
# VIDEO FRAME SAMPLING
# =========================

def extract_sample_frames(video_path: Path):
    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total_frames <= 0:
        cap.release()
        raise RuntimeError(f"Video has 0 readable frames: {video_path}")

    # Avoid the first and last 10% because clips often have transition/noisy frames.
    start = int(total_frames * 0.10)
    end = int(total_frames * 0.90)

    if end <= start:
        start = 0
        end = total_frames - 1

    frame_indices = np.linspace(start, end, FRAMES_PER_VIDEO, dtype=int)

    frames = []

    for frame_id in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(frame_id))
        ret, frame = cap.read()

        if not ret:
            print(f"WARNING: Could not read frame {frame_id}")
            continue

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append((int(frame_id), Image.fromarray(frame_rgb)))

    cap.release()
    return frames


# =========================
# PREDICTION
# =========================

def predict_frame(model, class_names, pil_image, transform):
    image_tensor = transform(pil_image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(image_tensor)
        probs = torch.softmax(outputs, dim=1)[0]

    top_probs, top_indices = torch.topk(probs, k=min(3, len(class_names)))

    pred_class = class_names[top_indices[0].item()]
    confidence = top_probs[0].item()

    top2_class = class_names[top_indices[1].item()]
    top2_confidence = top_probs[1].item()

    top3_class = class_names[top_indices[2].item()]
    top3_confidence = top_probs[2].item()

    return {
        "pred_class": pred_class,
        "confidence": confidence,
        "top2_class": top2_class,
        "top2_confidence": top2_confidence,
        "top3_class": top3_class,
        "top3_confidence": top3_confidence,
    }


# =========================
# FINAL DECISION LOGIC
# =========================

def decide_final_behavior(strict_counts, raw_counts, confidence_by_strict_class, confidence_by_raw_class, total_frames):
    strict_final, strict_count = strict_counts.most_common(1)[0]
    raw_final, raw_count = raw_counts.most_common(1)[0]

    strict_ratio = strict_count / total_frames
    raw_ratio = raw_count / total_frames

    raw_avg_conf = float(np.mean(confidence_by_raw_class[raw_final]))

    # Case 1:
    # Strict majority is a real class, not uncertain.
    # Trust confident votes.
    if strict_final != "uncertain_behavior":
        final_class = strict_final
        decision_source = "confident_vote"
        final_ratio = strict_ratio
        final_avg_conf = float(np.mean(confidence_by_strict_class[strict_final]))

        if final_ratio >= 0.80 and final_avg_conf >= 0.75:
            reliability = "high"
        elif final_ratio >= 0.60:
            reliability = "moderate"
        else:
            reliability = "low_to_moderate"

    # Case 2:
    # Strict majority is uncertain.
    # Fall back to raw majority, but lower reliability.
    else:
        final_class = raw_final
        decision_source = "raw_vote_after_uncertain"
        final_ratio = raw_ratio
        final_avg_conf = raw_avg_conf

        if raw_ratio >= 0.80 and raw_avg_conf >= 0.60:
            reliability = "moderate"
        elif raw_ratio >= 0.60:
            reliability = "low_to_moderate"
        else:
            reliability = "low"

    return final_class, decision_source, final_ratio, final_avg_conf, reliability


# =========================
# MAIN
# =========================

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print(r'python scripts\07_predict_behavior_video.py "C:\path\to\video.mp4"')
        return

    video_path = Path(sys.argv[1])

    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    print(f"Using device: {DEVICE}")

    model, class_names = load_model()

    transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            [0.485, 0.456, 0.406],
            [0.229, 0.224, 0.225]
        ),
    ])

    frames = extract_sample_frames(video_path)

    if not frames:
        raise RuntimeError("No frames extracted from video.")

    strict_votes = []
    raw_votes = []

    confidence_by_strict_class = defaultdict(list)
    confidence_by_raw_class = defaultdict(list)

    print("=" * 70)
    print(f"Video: {video_path}")
    print(f"Frames tested: {len(frames)}")
    print("-" * 70)

    for frame_id, pil_image in frames:
        result = predict_frame(model, class_names, pil_image, transform)

        pred_class = result["pred_class"]
        confidence = result["confidence"]

        raw_votes.append(pred_class)
        confidence_by_raw_class[pred_class].append(confidence)

        strict_label = pred_class if confidence >= UNCERTAIN_THRESHOLD else "uncertain_behavior"

        strict_votes.append(strict_label)
        confidence_by_strict_class[strict_label].append(confidence)

        print(
            f"Frame {frame_id}: {strict_label} "
            f"(raw={pred_class}, conf={confidence:.4f}, "
            f"top2={result['top2_class']}:{result['top2_confidence']:.4f}, "
            f"top3={result['top3_class']}:{result['top3_confidence']:.4f})"
        )

    strict_counts = Counter(strict_votes)
    raw_counts = Counter(raw_votes)

    final_class, decision_source, final_ratio, final_avg_conf, reliability = decide_final_behavior(
        strict_counts=strict_counts,
        raw_counts=raw_counts,
        confidence_by_strict_class=confidence_by_strict_class,
        confidence_by_raw_class=confidence_by_raw_class,
        total_frames=len(frames),
    )

    print("-" * 70)
    print("Strict vote counts:")
    for cls, count in strict_counts.most_common():
        avg_conf = float(np.mean(confidence_by_strict_class[cls]))
        print(f"{cls}: {count}/{len(strict_votes)} | avg_conf={avg_conf:.4f}")

    print("-" * 70)
    print("Raw vote counts:")
    for cls, count in raw_counts.most_common():
        avg_conf = float(np.mean(confidence_by_raw_class[cls]))
        print(f"{cls}: {count}/{len(raw_votes)} | avg_conf={avg_conf:.4f}")

    print("-" * 70)
    print(f"FINAL VIDEO BEHAVIOR: {final_class}")
    print(f"DECISION SOURCE: {decision_source}")
    print(f"VOTE RATIO: {final_ratio:.2f}")
    print(f"AVG CONFIDENCE: {final_avg_conf:.4f}")
    print(f"RELIABILITY: {reliability}")
    print("=" * 70)


if __name__ == "__main__":
    main()