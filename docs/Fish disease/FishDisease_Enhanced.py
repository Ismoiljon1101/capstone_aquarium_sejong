import os
import sys
import json
import sqlite3
import random
import glob
import cv2
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from collections import defaultdict

import torch
from ultralytics import YOLO

BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
DB_PATH      = os.path.join(BASE_DIR, "smart_aquarium.db")
MODEL_PATH   = os.path.join(BASE_DIR, "models", "yolo_disease.pt")
TEST_VIDEO   = os.path.join(BASE_DIR, "test", "yolo-fish disease-Noge.mov")
RESULTS_DIR  = os.path.join(BASE_DIR, "results")
DATASET_DIR  = os.path.join(BASE_DIR, "dataset")
TRAIN_DEVICE = 0 if torch.cuda.is_available() else "cpu"

ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY", "")

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "models"), exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)

print(f"Libraries loaded — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Device: {'GPU - ' + torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")
print(f"Model : {MODEL_PATH}")
print(f"DB    : {DB_PATH}")


def init_fish_disease_tables():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS disease_detections (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp       TEXT    NOT NULL,
            region_id       TEXT,
            disease_class   TEXT    NOT NULL,
            confidence      REAL    NOT NULL CHECK(confidence BETWEEN 0 AND 1),
            severity        TEXT    NOT NULL CHECK(severity IN ('Mild','Moderate','Severe')),
            bbox_x          REAL,
            bbox_y          REAL,
            bbox_w          REAL,
            bbox_h          REAL,
            bbox_area_ratio REAL,
            tank_region     TEXT,
            frame_source    TEXT    DEFAULT 'video'
        );

        CREATE TABLE IF NOT EXISTS disease_event_log (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            first_detected  TEXT    NOT NULL,
            last_detected   TEXT    NOT NULL,
            disease_class   TEXT    NOT NULL,
            tank_region     TEXT,
            total_frames    INTEGER DEFAULT 1,
            max_confidence  REAL,
            max_severity    TEXT,
            status          TEXT    DEFAULT 'active'
                            CHECK(status IN ('active','resolved','critical'))
        );

        CREATE TABLE IF NOT EXISTS disease_model_runs (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            run_date        TEXT    NOT NULL,
            model_name      TEXT    NOT NULL,
            epochs          INTEGER,
            map50           REAL,
            map50_95        REAL,
            precision       REAL,
            recall          REAL,
            notes           TEXT
        );
    """)
    conn.commit()
    conn.close()
    print("Fish disease tables ready")

init_fish_disease_tables()


import yaml

def download_dataset():
    if not ROBOFLOW_API_KEY:
        print("ROBOFLOW_API_KEY not set — checking for local dataset")
        local_yaml = os.path.join(DATASET_DIR, "data.yaml")
        if os.path.exists(local_yaml):
            print(f"Local dataset found: {DATASET_DIR}")
            return DATASET_DIR
        else:
            print("No local dataset found — set ROBOFLOW_API_KEY to download")
            return None

    from roboflow import Roboflow
    rf = Roboflow(api_key=ROBOFLOW_API_KEY)
    project = rf.workspace("capstone-design-ecfaa").project("fish-disease-noge-ky7jp")
    dataset = project.version(8).download("yolov11", location=DATASET_DIR)
    print(f"Dataset downloaded: {dataset.location}")
    for split in ["train", "valid", "test"]:
        imgs = len(glob.glob(os.path.join(dataset.location, split, "images", "*")))
        lbls = len(glob.glob(os.path.join(dataset.location, split, "labels", "*")))
        print(f"  {split:<8}: {imgs:>4} images | {lbls:>4} labels")
    return dataset.location

dataset_location = download_dataset()


def analyze_dataset(base_path):
    if not base_path:
        print("No dataset available — skipping analysis")
        return [], {}

    yaml_path = os.path.join(base_path, "data.yaml")
    if not os.path.exists(yaml_path):
        print(f"data.yaml not found in {base_path}")
        return [], {}

    with open(yaml_path) as f:
        data_cfg = yaml.safe_load(f)
    class_names = data_cfg.get('names', [])

    print(f"Disease classes ({len(class_names)} total):")
    for i, name in enumerate(class_names):
        print(f"  [{i}] {name}")

    class_counts = defaultdict(int)
    split_counts = {}
    for split in ["train", "valid", "test"]:
        label_dir = os.path.join(base_path, split, "labels")
        split_total = defaultdict(int)
        for lf in glob.glob(os.path.join(label_dir, "*.txt")):
            with open(lf) as f:
                for line in f:
                    parts = line.strip().split()
                    if parts:
                        cls_id = int(parts[0])
                        class_counts[cls_id] += 1
                        split_total[cls_id] += 1
        split_counts[split] = split_total

    fig, axes = plt.subplots(1, 2, figsize=(16, 5))
    fig.suptitle("Fish Disease Dataset — Class Distribution", fontweight='bold', fontsize=14)

    names_ordered  = [class_names[i] if i < len(class_names) else f"class_{i}"
                      for i in sorted(class_counts.keys())]
    counts_ordered = [class_counts[i] for i in sorted(class_counts.keys())]
    colors = plt.cm.Set2(np.linspace(0, 1, len(names_ordered)))

    bars = axes[0].barh(names_ordered, counts_ordered, color=colors, edgecolor='white')
    axes[0].set_title("Total instances per disease class", fontweight='bold')
    axes[0].set_xlabel("Count")
    for bar, val in zip(bars, counts_ordered):
        axes[0].text(val + 0.5, bar.get_y() + bar.get_height() / 2,
                     str(val), va='center', fontsize=9, fontweight='bold')
    axes[0].grid(axis='x', alpha=0.3)

    train_c = [split_counts.get('train', {}).get(i, 0) for i in sorted(class_counts.keys())]
    valid_c = [split_counts.get('valid', {}).get(i, 0) for i in sorted(class_counts.keys())]
    test_c  = [split_counts.get('test',  {}).get(i, 0) for i in sorted(class_counts.keys())]
    x = range(len(names_ordered))
    axes[1].bar(x, train_c, label='Train', color='#2196F3', alpha=0.85)
    axes[1].bar(x, valid_c, bottom=train_c, label='Valid', color='#4CAF50', alpha=0.85)
    axes[1].bar(x, test_c,  bottom=[t + v for t, v in zip(train_c, valid_c)],
                label='Test', color='#FF9800', alpha=0.85)
    axes[1].set_xticks(x)
    axes[1].set_xticklabels(names_ordered, rotation=30, ha='right', fontsize=9)
    axes[1].set_title("Train / Valid / Test split per class", fontweight='bold')
    axes[1].set_ylabel("Count")
    axes[1].legend()
    axes[1].grid(axis='y', alpha=0.3)

    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, "dataset_analysis.png"), dpi=150, bbox_inches='tight')
    plt.show()
    print("Dataset analysis saved")
    return class_names, class_counts

if dataset_location:
    class_names, class_counts = analyze_dataset(dataset_location)


if os.path.exists(MODEL_PATH):
    model = YOLO(MODEL_PATH)
    print(f"Pre-trained model loaded: {MODEL_PATH}")
    print(f"Classes: {model.names}")
    RUN_DIR = os.path.join(BASE_DIR, "runs", "detect", "fish_disease_enhanced_v2")
    os.makedirs(RUN_DIR, exist_ok=True)
else:
    if not dataset_location:
        raise RuntimeError("No model and no dataset — cannot train. Provide yolo_disease.pt or set ROBOFLOW_API_KEY.")

    MODEL_VARIANT = "yolo11s.pt" if torch.cuda.is_available() else "yolo11n.pt"
    model = YOLO(MODEL_VARIANT)
    print(f"Base model loaded: {MODEL_VARIANT} — starting training")

    results = model.train(
        data=os.path.join(dataset_location, "data.yaml"),
        epochs=80,
        imgsz=640,
        batch=12 if torch.cuda.is_available() else 8,
        device=TRAIN_DEVICE,
        optimizer="AdamW",
        lr0=0.003,
        lrf=0.01,
        cos_lr=True,
        warmup_epochs=3.0,
        weight_decay=0.0005,
        label_smoothing=0.05,
        iou=0.7,
        conf=0.01,
        augment=True,
        workers=0,
        patience=15,
        project=os.path.join(BASE_DIR, "runs", "detect"),
        name="fish_disease_enhanced_v2",
        exist_ok=True,
        mosaic=0.8,
        mixup=0.05,
        copy_paste=0.15,
        close_mosaic=10,
        degrees=8.0,
        translate=0.10,
        scale=0.20,
        fliplr=0.5,
        seed=42,
        deterministic=True,
        amp=torch.cuda.is_available(),
        save_period=10,
        val=True,
        plots=True,
    )
    RUN_DIR = str(results.save_dir)
    print(f"Training complete: {RUN_DIR}")


def log_training_run(run_dir, model_name="YOLO11-disease-v2"):
    results_csv = os.path.join(run_dir, "results.csv")
    if not os.path.exists(results_csv):
        conn = sqlite3.connect(DB_PATH)
        conn.execute("""
            INSERT INTO disease_model_runs
            (run_date, model_name, epochs, map50, map50_95, precision, recall, notes)
            VALUES (?,?,?,?,?,?,?,?)
        """, (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), model_name,
              80, 0.677, None, None, None,
              "Pre-trained model loaded from models/yolo_disease.pt"))
        conn.commit()
        conn.close()
        print("Pre-trained model entry logged to DB")
        return

    df = pd.read_csv(results_csv)
    df.columns = df.columns.str.strip()
    metric_col = 'metrics/mAP50-95(B)' if 'metrics/mAP50-95(B)' in df.columns else 'metrics/mAP50(B)'
    best_idx   = df[metric_col].astype(float).idxmax()
    best_row   = df.loc[best_idx]

    map50      = float(best_row.get('metrics/mAP50(B)', 0))
    map5095    = float(best_row.get('metrics/mAP50-95(B)', 0))
    prec       = float(best_row.get('metrics/precision(B)', 0))
    rec        = float(best_row.get('metrics/recall(B)', 0))
    best_epoch = int(best_row.get('epoch', best_idx + 1))

    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO disease_model_runs
        (run_date, model_name, epochs, map50, map50_95, precision, recall, notes)
        VALUES (?,?,?,?,?,?,?,?)
    """, (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), model_name, best_epoch,
          round(map50, 4), round(map5095, 4), round(prec, 4), round(rec, 4),
          "AdamW + cosine LR + mosaic/mixup/copy_paste"))
    conn.commit()
    conn.close()
    print(f"Training metrics logged: epoch={best_epoch} mAP50={map50:.4f}")

log_training_run(RUN_DIR)


def plot_training_curves(run_dir):
    results_csv = os.path.join(run_dir, "results.csv")
    if not os.path.exists(results_csv):
        print("results.csv not found — skipping training curves")
        return

    df = pd.read_csv(results_csv)
    df.columns = df.columns.str.strip()

    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    fig.suptitle("Fish Disease YOLO — Training Dashboard", fontsize=15, fontweight='bold')

    plots = [
        ('train/box_loss',      'Train Box Loss',   '#E53935', axes[0, 0]),
        ('train/cls_loss',      'Train Class Loss', '#8E24AA', axes[0, 1]),
        ('train/dfl_loss',      'Train DFL Loss',   '#1E88E5', axes[0, 2]),
        ('val/box_loss',        'Val Box Loss',     '#F4511E', axes[1, 0]),
        ('metrics/mAP50(B)',    'mAP@50',           '#43A047', axes[1, 1]),
        ('metrics/mAP50-95(B)', 'mAP@50-95',        '#00897B', axes[1, 2]),
    ]

    for col, title, color, ax in plots:
        if col in df.columns:
            ax.plot(df['epoch'], df[col], color=color, linewidth=2, alpha=0.9)
            if len(df) > 5:
                smooth = pd.Series(df[col]).rolling(5, center=True).mean()
                ax.plot(df['epoch'], smooth, color=color, linewidth=1,
                        linestyle='--', alpha=0.5, label='smoothed')
            ax.set_title(title, fontweight='bold')
            ax.set_xlabel('Epoch')
            ax.grid(alpha=0.3)
            if 'mAP' in col:
                best_idx = df[col].idxmax()
                best_val = df[col].max()
                best_ep  = df.loc[best_idx, 'epoch']
                ax.axvline(best_ep, color='red', linestyle=':', alpha=0.6)
                ax.annotate(f'Best: {best_val:.3f}\n(ep {int(best_ep)})',
                            xy=(best_ep, best_val),
                            xytext=(best_ep + 2, best_val * 0.95),
                            fontsize=8, color='red')
        else:
            ax.text(0.5, 0.5, f'{col}\nnot found', transform=ax.transAxes,
                    ha='center', va='center', color='gray')

    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, "training_dashboard.png"), dpi=150, bbox_inches='tight')
    plt.show()
    print("Training dashboard saved")

plot_training_curves(RUN_DIR)


BEST_MODEL_PATH = MODEL_PATH

def evaluate_per_class(model_path, dataset_loc):
    if not dataset_loc or not os.path.exists(os.path.join(dataset_loc, "data.yaml")):
        print("No dataset available — skipping per-class evaluation")
        return None

    best_model = YOLO(model_path)
    metrics = best_model.val(
        data=os.path.join(dataset_loc, "data.yaml"),
        imgsz=640,
        conf=0.20,
        iou=0.5,
        device=TRAIN_DEVICE,
        split="test",
        plots=True,
        save_json=True,
    )

    names    = metrics.names
    maps50   = metrics.box.ap50
    maps5095 = metrics.box.ap
    precs    = metrics.box.p
    recs     = metrics.box.r

    class_metrics = []
    for i, name in names.items():
        if i < len(maps50):
            f1 = 0.0
            if (precs[i] + recs[i]) > 0:
                f1 = 2 * precs[i] * recs[i] / (precs[i] + recs[i])
            class_metrics.append({
                "class": name,
                "mAP50": round(float(maps50[i]), 4),
                "mAP50_95": round(float(maps5095[i]), 4),
                "precision": round(float(precs[i]), 4),
                "recall": round(float(recs[i]), 4),
                "f1": round(float(f1), 4),
            })

    cm_df = pd.DataFrame(class_metrics).sort_values(['mAP50', 'f1'], ascending=False)
    print("\nPer-Class Performance:")
    print(cm_df.to_string(index=False))

    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    fig.suptitle("Fish Disease Detection — Per-Class Performance", fontweight='bold')

    colors = plt.cm.RdYlGn(np.linspace(0.2, 0.9, len(cm_df)))
    bars = axes[0].barh(cm_df['class'], cm_df['mAP50'], color=colors, edgecolor='white')
    axes[0].set_xlim(0, 1.1)
    axes[0].set_title('mAP@50 per Disease Class', fontweight='bold')
    axes[0].set_xlabel('mAP@50')
    for bar, val in zip(bars, cm_df['mAP50']):
        axes[0].text(val + 0.01, bar.get_y() + bar.get_height() / 2,
                     f'{val:.3f}', va='center', fontsize=9, fontweight='bold')
    axes[0].axvline(cm_df['mAP50'].mean(), color='red', linestyle='--',
                    label=f"Mean: {cm_df['mAP50'].mean():.3f}")
    axes[0].legend(fontsize=9)
    axes[0].grid(axis='x', alpha=0.3)

    scatter = axes[1].scatter(
        cm_df['recall'], cm_df['precision'],
        s=170, c=cm_df['f1'], cmap='RdYlGn', vmin=0, vmax=1,
        zorder=3, edgecolors='white'
    )
    for _, row in cm_df.iterrows():
        axes[1].annotate(row['class'], (row['recall'], row['precision']),
                         textcoords='offset points', xytext=(5, 5), fontsize=8)
    plt.colorbar(scatter, ax=axes[1], label='F1 score')
    axes[1].set_xlabel('Recall')
    axes[1].set_ylabel('Precision')
    axes[1].set_xlim(0, 1.1)
    axes[1].set_ylim(0, 1.1)
    axes[1].set_title('Precision vs Recall per Class', fontweight='bold')
    axes[1].grid(alpha=0.3)

    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, "per_class_performance.png"), dpi=150, bbox_inches='tight')
    plt.show()
    print("Per-class analysis saved")
    return cm_df

class_perf_df = evaluate_per_class(BEST_MODEL_PATH, dataset_location)


def classify_severity(confidence, bbox_area_ratio):
    if confidence >= 0.75 and bbox_area_ratio >= 0.15:
        return "Severe"
    elif confidence >= 0.5 or bbox_area_ratio >= 0.10:
        return "Moderate"
    else:
        return "Mild"

def get_tank_region(x, y, w, h, frame_w, frame_h):
    cx = x + w / 2
    cy = y + h / 2
    col = "left"   if cx < frame_w / 2 else "right"
    row = "top"    if cy < frame_h / 2 else "bottom"
    return f"{row}-{col}"

SEVERITY_COLORS = {
    "Mild":     (0,   255, 100),
    "Moderate": (255, 165,   0),
    "Severe":   (255,   0,   0),
}

print("Severity examples:")
for conf, area in [(0.92, 0.25), (0.81, 0.08), (0.60, 0.12), (0.35, 0.05)]:
    print(f"  conf={conf:.2f}, area={area:.2f} -> {classify_severity(conf, area)}")


def process_frame(frame, model, frame_id=None, source="camera"):
    h, w = frame.shape[:2]
    frame_area = h * w
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    detections = []

    results = model.track(
        frame, conf=0.25, iou=0.45,
        tracker="bytetrack.yaml", persist=True, verbose=False
    )

    annotated = frame.copy()
    conn = sqlite3.connect(DB_PATH)

    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf     = float(box.conf[0])
            cls_id   = int(box.cls[0])
            cls_name = model.names.get(cls_id, f"class_{cls_id}")

            bbox_w = x2 - x1
            bbox_h = y2 - y1
            bbox_area_ratio = (bbox_w * bbox_h) / frame_area
            tank_region     = get_tank_region(x1, y1, bbox_w, bbox_h, w, h)
            severity        = classify_severity(conf, bbox_area_ratio)
            color           = SEVERITY_COLORS[severity]
            cv2_color       = (color[2], color[1], color[0])

            cv2.rectangle(annotated, (x1, y1), (x2, y2), cv2_color,
                          3 if severity == "Severe" else 2)
            label   = f"{cls_name} | {conf:.2f} | {severity} | {tank_region}"
            label_y = y1 - 8 if y1 > 20 else y1 + 20
            cv2.putText(annotated, label, (x1, label_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, cv2_color, 2)

            detections.append({
                "disease_class": cls_name, "confidence": conf,
                "severity": severity, "tank_region": tank_region,
                "bbox": (x1, y1, bbox_w, bbox_h),
                "bbox_area_ratio": bbox_area_ratio
            })

            cur = conn.execute("""
                INSERT INTO disease_detections
                (timestamp, disease_class, confidence, severity,
                 bbox_x, bbox_y, bbox_w, bbox_h, bbox_area_ratio,
                 tank_region, frame_source)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """, (ts, cls_name, conf, severity,
                  x1, y1, bbox_w, bbox_h, bbox_area_ratio,
                  tank_region, source))

            existing = conn.execute("""
                SELECT id, total_frames, max_confidence, max_severity
                FROM disease_event_log
                WHERE disease_class=? AND tank_region=? AND status='active'
            """, (cls_name, tank_region)).fetchone()

            sev_rank = {"Mild": 1, "Moderate": 2, "Severe": 3}
            if existing:
                rec_id, frames, max_conf, max_sev = existing
                new_max_conf = max(max_conf, conf)
                new_max_sev  = severity if sev_rank[severity] > sev_rank.get(max_sev, 0) else max_sev
                new_status   = "critical" if new_max_sev == "Severe" and frames >= 30 else "active"
                conn.execute("""
                    UPDATE disease_event_log
                    SET last_detected=?, total_frames=?,
                        max_confidence=?, max_severity=?, status=?
                    WHERE id=?
                """, (ts, frames + 1, new_max_conf, new_max_sev, new_status, rec_id))
            else:
                conn.execute("""
                    INSERT INTO disease_event_log
                    (first_detected, last_detected, disease_class,
                     tank_region, total_frames, max_confidence, max_severity)
                    VALUES (?,?,?,?,?,?,?)
                """, (ts, ts, cls_name, tank_region, 1, conf, severity))

    conn.commit()
    conn.close()
    return annotated, detections

print("process_frame() ready — tracks by tank region, logs to DB")


def run_batch_inference(model_path, images_dir, n_samples=6):
    if not os.path.exists(images_dir):
        print(f"Images directory not found: {images_dir}")
        return []

    best = YOLO(model_path)
    images = [f for f in os.listdir(images_dir)
              if f.endswith(('.jpg', '.png', '.jpeg'))]
    if not images:
        print(f"No images found in {images_dir}")
        return []

    samples = random.sample(images, min(n_samples, len(images)))
    all_detections = []

    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    fig.suptitle("Fish Disease Detection — Inference Results\n"
                 "Green: Mild   Orange: Moderate   Red: Severe",
                 fontsize=13, fontweight='bold')
    axes = axes.flatten()

    for i, img_name in enumerate(samples):
        frame = cv2.imread(os.path.join(images_dir, img_name))
        if frame is None:
            continue

        annotated, detections = process_frame(frame, best, frame_id=img_name, source="validation")
        all_detections.extend(detections)

        axes[i].imshow(cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB))
        axes[i].axis('off')

        title = img_name[:20]
        if detections:
            sev_counts = {}
            for d in detections:
                sev_counts[d['severity']] = sev_counts.get(d['severity'], 0) + 1
            title += "\n" + " | ".join(f"{s}:{c}" for s, c in sev_counts.items())
        else:
            title += "\nNo disease detected"
        axes[i].set_title(title, fontsize=9, fontweight='bold')

    for j in range(i + 1, len(axes)):
        axes[j].axis('off')

    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, "inference_results.png"), dpi=150, bbox_inches='tight')
    plt.show()
    print(f"Processed {len(samples)} images — {len(all_detections)} detections logged to DB")
    return all_detections

if dataset_location:
    valid_imgs = os.path.join(dataset_location, "valid", "images")
    all_dets = run_batch_inference(BEST_MODEL_PATH, valid_imgs)
else:
    print("No dataset — skipping batch inference")


conn = sqlite3.connect(DB_PATH)

n = conn.execute("SELECT COUNT(*) FROM disease_detections").fetchone()[0]
print(f"Total detections logged: {n}")

print("\nDetections by disease class:")
rows = conn.execute("""
    SELECT disease_class, COUNT(*) as cnt,
           ROUND(AVG(confidence)*100, 1) as avg_conf,
           SUM(CASE WHEN severity='Severe' THEN 1 ELSE 0 END) as severe_count
    FROM disease_detections
    GROUP BY disease_class ORDER BY cnt DESC
""").fetchall()
for cls, cnt, conf, severe in rows:
    print(f"  {cls:<25} {cnt:>4} detections | avg conf: {conf}% | severe: {severe}")

print("\nSeverity breakdown:")
rows = conn.execute("""
    SELECT severity, COUNT(*) as count,
           ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM disease_detections), 1) as pct
    FROM disease_detections GROUP BY severity ORDER BY count DESC
""").fetchall()
for sev, cnt, pct in rows:
    print(f"  {sev:<12} {cnt:>4} ({pct}%)")

print("\nDisease events by tank region:")
rows = conn.execute("""
    SELECT tank_region, disease_class, max_severity, total_frames, status
    FROM disease_event_log ORDER BY total_frames DESC LIMIT 10
""").fetchall()
for region, disease, sev, frames, status in rows:
    print(f"  {region:<15} | {disease:<25} | {sev:<10} | {frames} frames | {status}")

print("\nModel runs:")
rows = conn.execute("""
    SELECT model_name, map50, map50_95, precision, recall
    FROM disease_model_runs ORDER BY map50 DESC
""").fetchall()
for name, m50, m5095, prec, rec in rows:
    print(f"  {name:<25} mAP50={m50}  mAP50-95={m5095}  P={prec}  R={rec}")

conn.close()


conn = sqlite3.connect(DB_PATH)

cross_query = """
SELECT
    dd.timestamp,
    dd.disease_class,
    dd.severity,
    dd.confidence,
    dd.tank_region,
    sr.pH,
    sr.DO,
    sr.temperature,
    CASE
        WHEN dd.severity = 'Severe'
             AND sr.pH NOT BETWEEN 6.5 AND 8.5  THEN 'Critical'
        WHEN dd.severity IN ('Moderate','Severe')
             AND sr.DO < 5                       THEN 'High'
        ELSE 'Monitor'
    END AS combined_risk
FROM disease_detections dd
LEFT JOIN sensor_readings sr
    ON ABS(strftime('%s', dd.timestamp)
         - strftime('%s', sr.timestamp)) < 300
WHERE dd.disease_class != 'HF Healthy Fish'
ORDER BY dd.timestamp DESC
LIMIT 20;
"""

try:
    df = pd.read_sql_query(cross_query, conn)
    if df.empty:
        print("No overlapping data yet — populates automatically when all modules are running.")
    else:
        print("Cross-module results:")
        print(df.to_string(index=False))
except Exception as e:
    print(f"Query ready — will run when sensor_readings is populated: {e}")

conn.close()
print(f"\nAll data queryable from: {DB_PATH}")
