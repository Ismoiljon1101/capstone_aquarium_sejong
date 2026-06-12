# make_crops.py — crop individual fish from healthy frames
from pathlib import Path
from ultralytics import YOLO
import cv2, os

ROOT = Path(r"C:\Users\Maral\Desktop\capstone_aquarium_sejong")
DETECTOR = ROOT / "models" / "disease" / "fish_detector_v2.pt"
OUT = Path(r"C:\Users\Maral\Desktop\Disease\healthy_crops")
os.makedirs(OUT, exist_ok=True)

model = YOLO(str(DETECTOR))
count = 0

for frames_dir in [ROOT/"data"/"my_aquarium_frames", ROOT/"data"/"my_aquarium_frames2"]:
    for img_path in list(frames_dir.glob("*.jpg")) + list(frames_dir.glob("*.png")):
        img = cv2.imread(str(img_path))
        if img is None: continue
        results = model(img, verbose=False, conf=0.35, imgsz=640)[0]
        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            if (x2-x1) > 30 and (y2-y1) > 30:
                crop = img[max(0,y1):y2, max(0,x1):x2]
                cv2.imwrite(str(OUT / f"crop_{count:05d}.jpg"), crop)
                count += 1

print(f"✅ Saved {count} fish crops to {OUT}")