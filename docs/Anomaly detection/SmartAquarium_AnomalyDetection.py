import os
import sys
import cv2
import sqlite3
import collections
import time
import glob
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import roc_auc_score, roc_curve

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DB_PATH    = os.path.join(BASE_DIR, "smart_aquarium.db")
VIDEO_PATH = os.path.join(BASE_DIR, "data", "raw_videos", "video.mp4")
FRAMES_DIR = os.path.join(BASE_DIR, "data", "extracted_frames")
SEQ_DIR    = os.path.join(BASE_DIR, "data", "sequences")
MODEL_PATH = os.path.join(BASE_DIR, "models", "convlstm_vae_anomaly.pth")
TEST_VIDEO = os.path.join(BASE_DIR, "test", "test1.mov")

SEQ_LEN                 = 10
IMG_SIZE                = 64
BATCH_SIZE              = 8
EPOCHS                  = 25
LR                      = 0.0001
VAL_SPLIT               = 0.2
EARLY_STOPPING_PATIENCE = 5
SEV_NORMAL              = 0.08
SEV_SUSPICIOUS          = 0.13
SEV_ANOMALY             = 0.20
THRESHOLD               = SEV_ANOMALY

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {DEVICE}")
print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(SEQ_DIR, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "models"), exist_ok=True)

print(f"Video  : {VIDEO_PATH}")
print(f"Frames : {FRAMES_DIR}")
print(f"Seqs   : {SEQ_DIR}")


def init_anomaly_tables():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS anomaly_detections (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp       TEXT    NOT NULL,
            sequence_id     INTEGER,
            behavior_score  REAL,
            movement_score  REAL,
            activity_score  REAL,
            anomaly_score   REAL    NOT NULL,
            severity        TEXT    NOT NULL
                            CHECK(severity IN ('Normal','Suspicious','Anomaly','Critical')),
            is_anomaly      INTEGER DEFAULT 0,
            threshold_used  REAL,
            model_version   TEXT,
            source          TEXT    DEFAULT 'camera',
            notes           TEXT
        );

        CREATE TABLE IF NOT EXISTS anomaly_model_runs (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            run_date        TEXT    NOT NULL,
            model_name      TEXT    NOT NULL,
            epochs          INTEGER,
            final_loss      REAL,
            auc_score       REAL,
            best_threshold  REAL,
            n_training_seqs INTEGER,
            notes           TEXT
        );

        CREATE TABLE IF NOT EXISTS anomaly_alerts (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp       TEXT    NOT NULL,
            anomaly_id      INTEGER,
            severity        TEXT    NOT NULL,
            score           REAL,
            alert_sent      INTEGER DEFAULT 0,
            resolved        INTEGER DEFAULT 0,
            resolved_at     TEXT
        );
    """)
    conn.commit()
    conn.close()
    print("Anomaly tables ready")

init_anomaly_tables()


def extract_and_process_frames(video_path, output_dir, img_size=IMG_SIZE):
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Cannot open video: {video_path}")
        return 0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    print(f"Video: {os.path.basename(video_path)} | {total_frames} frames | {fps:.1f} fps")

    count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_resized = cv2.resize(frame, (img_size, img_size))
        cv2.imwrite(os.path.join(output_dir, f"frame_{count:05d}.jpg"), frame_resized)
        count += 1
        if count % 500 == 0:
            print(f"  {count}/{total_frames} frames processed")

    cap.release()
    print(f"Extracted {count} frames")
    return count


def create_sequences(frames_dir, output_dir, seq_len=SEQ_LEN, step=5):
    os.makedirs(output_dir, exist_ok=True)
    frame_files = sorted(glob.glob(os.path.join(frames_dir, "*.jpg")))
    if not frame_files:
        print(f"No frames found in {frames_dir}")
        return 0

    frames = []
    for f in frame_files:
        img = cv2.imread(f)
        if img is None:
            continue
        frames.append(img.astype("float32") / 255.0)

    frames = np.array(frames)
    seq_count = 0
    for start in range(0, len(frames) - seq_len + 1, step):
        seq = frames[start:start + seq_len]
        np.save(os.path.join(output_dir, f"seq_{seq_count:04d}.npy"), seq)
        seq_count += 1

    print(f"Created {seq_count} sequences (step={step})")
    return seq_count


class ConvLSTMCell(nn.Module):
    def __init__(self, input_dim, hidden_dim, kernel_size=3):
        super().__init__()
        padding = kernel_size // 2
        self.hidden_dim = hidden_dim
        self.conv = nn.Conv2d(
            input_dim + hidden_dim,
            4 * hidden_dim,
            kernel_size, padding=padding
        )

    def forward(self, x, h, c):
        x, h, c = x.contiguous(), h.contiguous(), c.contiguous()
        gates = self.conv(torch.cat([x, h], dim=1).contiguous())
        i, f, o, g = torch.chunk(gates, 4, dim=1)
        i, f, o, g = torch.sigmoid(i), torch.sigmoid(f), torch.sigmoid(o), torch.tanh(g)
        c_next = f * c + i * g
        h_next = o * torch.tanh(c_next)
        return h_next, c_next


class BehaviorLayer(nn.Module):
    def __init__(self, input_dim=3, hidden_dim=64, z_dim=256):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.spatial = 16
        self.encoder_cnn = nn.Sequential(
            nn.Conv2d(input_dim, 16, 4, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 32, 4, stride=2, padding=1),
            nn.ReLU()
        )
        self.convlstm = ConvLSTMCell(input_dim=32, hidden_dim=hidden_dim)
        flat_dim = hidden_dim * self.spatial * self.spatial
        self.fc_mu     = nn.Linear(flat_dim, z_dim)
        self.fc_logvar = nn.Linear(flat_dim, z_dim)
        self.fc_decode = nn.Linear(z_dim, flat_dim)
        self.decoder_cnn = nn.Sequential(
            nn.ConvTranspose2d(hidden_dim, 32, 4, stride=2, padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(32, input_dim, 4, stride=2, padding=1),
            nn.Sigmoid()
        )

    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        return mu + std * torch.randn_like(std)

    def forward(self, x):
        B, T, C, H, W = x.size()
        h_t = torch.zeros(B, self.hidden_dim, self.spatial, self.spatial, device=x.device)
        c_t = torch.zeros(B, self.hidden_dim, self.spatial, self.spatial, device=x.device)
        for t in range(T):
            enc = self.encoder_cnn(x[:, t].contiguous()).contiguous()
            h_t, c_t = self.convlstm(enc, h_t, c_t)
        flat   = h_t.reshape(B, -1)
        mu     = self.fc_mu(flat)
        logvar = self.fc_logvar(flat)
        z      = self.reparameterize(mu, logvar)
        dec    = self.fc_decode(z).reshape(B, self.hidden_dim, self.spatial, self.spatial)
        recon  = self.decoder_cnn(dec)
        return recon, mu, logvar


class MovementLayer(nn.Module):
    def __init__(self):
        super().__init__()
        self.flow_encoder = nn.Sequential(
            nn.Conv2d(2, 16, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 32, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d(4),
        )
        self.fc = nn.Sequential(
            nn.Linear(32 * 4 * 4, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    def compute_flow(self, frame1, frame2):
        f1 = (frame1.mean(dim=1).unsqueeze(1) * 255).byte().cpu().numpy()
        f2 = (frame2.mean(dim=1).unsqueeze(1) * 255).byte().cpu().numpy()
        flows = []
        for b in range(f1.shape[0]):
            flow = cv2.calcOpticalFlowFarneback(
                f1[b, 0], f2[b, 0], None, 0.5, 3, 15, 3, 5, 1.2, 0
            )
            flows.append(flow)
        flow_t = torch.tensor(np.stack(flows), dtype=torch.float32).permute(0, 3, 1, 2)
        return flow_t.to(frame1.device)

    def forward(self, x):
        B, T, C, H, W = x.size()
        flow_scores = []
        for t in range(T - 1):
            flow  = self.compute_flow(x[:, t], x[:, t + 1])
            feat  = self.flow_encoder(flow)
            score = self.fc(feat.reshape(B, -1))
            flow_scores.append(score)
        return torch.stack(flow_scores, dim=1).mean(dim=1)


class ActivityLayer(nn.Module):
    def __init__(self, input_dim=3, hidden_dim=32):
        super().__init__()
        self.spatial_enc = nn.Sequential(
            nn.Conv2d(input_dim, 16, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(16, hidden_dim, 3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d(4),
        )
        self.temporal = nn.GRU(
            input_size=hidden_dim * 4 * 4,
            hidden_size=64,
            num_layers=1,
            batch_first=True
        )
        self.classifier = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        B, T, C, H, W = x.size()
        frame_features = []
        for t in range(T):
            feat = self.spatial_enc(x[:, t])
            frame_features.append(feat.reshape(B, -1))
        seq = torch.stack(frame_features, dim=1)
        out, _ = self.temporal(seq)
        return self.classifier(out[:, -1])


class LayeredAnomalyDetector(nn.Module):
    def __init__(self):
        super().__init__()
        self.behavior_layer = BehaviorLayer(input_dim=3, hidden_dim=64, z_dim=256)
        self.movement_layer = MovementLayer()
        self.activity_layer = ActivityLayer(input_dim=3, hidden_dim=32)
        self.weights = nn.Parameter(torch.tensor([0.5, 0.3, 0.2]))

    def forward(self, x):
        recon, mu, logvar = self.behavior_layer(x)
        target = x[:, -1]
        behavior_score = F.mse_loss(recon, target, reduction="none").mean(dim=[1, 2, 3])
        movement_score = self.movement_layer(x).squeeze(1)
        activity_score = self.activity_layer(x).squeeze(1)
        w = torch.softmax(self.weights, dim=0)
        combined = (w[0] * behavior_score +
                    w[1] * movement_score +
                    w[2] * activity_score)
        return combined, behavior_score, movement_score, activity_score, recon, mu, logvar


print("Layered anomaly detector defined")
print("  Layer 1: BehaviorLayer  (ConvLSTM-VAE reconstruction)")
print("  Layer 2: MovementLayer  (optical flow dynamics)")
print("  Layer 3: ActivityLayer  (GRU activity classifier)")


def vae_loss(recon, target, mu, logvar):
    recon_loss = F.mse_loss(recon, target, reduction='mean')
    kl = -0.5 * torch.mean(1 + logvar - mu.pow(2) - logvar.exp())
    return recon_loss + 0.1 * kl, recon_loss, kl


class AnomalyDataset(Dataset):
    def __init__(self, seq_dir, seq_len=SEQ_LEN):
        self.files   = sorted(glob.glob(os.path.join(seq_dir, "*.npy")))
        self.seq_len = seq_len
        print(f"Dataset: {len(self.files)} sequences from {seq_dir}")

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        seq = np.load(self.files[idx])
        if seq.ndim == 4 and seq.shape[-1] == 3:
            seq = np.transpose(seq, (0, 3, 1, 2))
        return torch.tensor(seq, dtype=torch.float32)


model = LayeredAnomalyDetector().to(DEVICE)

if os.path.exists(MODEL_PATH):
    old_weights = torch.load(MODEL_PATH, map_location=DEVICE)
    
    
    new_weights = {}
    for k, v in old_weights.items():
        new_weights[f"behavior_layer.{k}"] = v
    
    
    missing, unexpected = model.load_state_dict(new_weights, strict=False)
    model.eval()
    print(f"Pre-trained weights loaded into BehaviorLayer")
    print(f"  Movement and Activity layers initialized fresh")
    print(f"  Missing keys: {len(missing)} | Unexpected: {len(unexpected)}")
else:
    print("No pre-trained model found — training from scratch")
    n_frames = extract_and_process_frames(VIDEO_PATH, FRAMES_DIR)
    n_seqs   = create_sequences(FRAMES_DIR, SEQ_DIR)

    dataset    = AnomalyDataset(SEQ_DIR)
    val_size   = max(1, int(len(dataset) * VAL_SPLIT))
    train_size = max(1, len(dataset) - val_size)

    split_generator = torch.Generator().manual_seed(42)
    train_dataset, val_dataset = torch.utils.data.random_split(
        dataset, [train_size, val_size], generator=split_generator
    )
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
    val_loader   = DataLoader(val_dataset,   batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    optimizer = optim.Adam(model.parameters(), lr=LR)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

    best_val_loss = float('inf')
    best_state    = None
    wait          = 0
    history       = {'train_loss': [], 'val_loss': []}

    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0.0
        for batch in train_loader:
            batch = batch.to(DEVICE)
            optimizer.zero_grad()
            combined, b_score, m_score, a_score, recon, mu, logvar = model(batch)
            loss, _, _ = vae_loss(recon, batch[:, -1], mu, logvar)
            total = loss + m_score.mean() * 0.1 + a_score.mean() * 0.1
            total.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=2.0)
            optimizer.step()
            total_loss += total.item()

        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch in val_loader:
                batch = batch.to(DEVICE)
                combined, b_score, m_score, a_score, recon, mu, logvar = model(batch)
                loss, _, _ = vae_loss(recon, batch[:, -1], mu, logvar)
                val_loss += loss.item()

        tl = total_loss / max(len(train_loader), 1)
        vl = val_loss   / max(len(val_loader), 1)
        history['train_loss'].append(tl)
        history['val_loss'].append(vl)
        scheduler.step(vl)
        print(f"Epoch {epoch+1:>2}/{EPOCHS} | Train={tl:.4f} | Val={vl:.4f}")

        if vl < best_val_loss - 1e-4:
            best_val_loss = vl
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            wait = 0
        else:
            wait += 1
        if wait >= EARLY_STOPPING_PATIENCE:
            print(f"Early stopping at epoch {epoch+1}")
            break

    if best_state:
        model.load_state_dict(best_state)

    torch.save(model.state_dict(), MODEL_PATH)
    print(f"Model saved: {MODEL_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO anomaly_model_runs
        (run_date, model_name, epochs, final_loss, n_training_seqs, notes)
        VALUES (?,?,?,?,?,?)
    """, (
        datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "LayeredAnomalyDetector-v1",
        EPOCHS,
        round(history['val_loss'][-1], 6),
        len(dataset),
        "3-layer: BehaviorLayer + MovementLayer + ActivityLayer"
    ))
    conn.commit()
    conn.close()
    print("Training run logged to DB")


def classify_anomaly_severity(score):
    if   score < SEV_NORMAL:     return "Normal",     False
    elif score < SEV_SUSPICIOUS: return "Suspicious",  False
    elif score < SEV_ANOMALY:    return "Anomaly",     True
    else:                        return "Critical",    True


def evaluate_sequences(model, seq_dir, device=DEVICE):
    model.eval()
    seq_files = sorted(glob.glob(os.path.join(seq_dir, "*.npy")))
    if not seq_files:
        print(f"No sequences found in {seq_dir} — skipping evaluation")
        return None

    scores = []
    behavior_scores = []
    movement_scores = []
    activity_scores = []
    severities = []
    conn = sqlite3.connect(DB_PATH)

    print(f"Scoring {len(seq_files)} sequences...")
    for i, f in enumerate(seq_files):
        seq = np.load(f)
        if seq.ndim == 4 and seq.shape[-1] == 3:
            seq = np.transpose(seq, (0, 3, 1, 2))
        seq_t = torch.tensor(seq, dtype=torch.float32).unsqueeze(0).to(device)

        with torch.no_grad():
            combined, b_score, m_score, a_score, recon, mu, logvar = model(seq_t)
            score = float(combined.item())
            b = float(b_score.item())
            m = float(m_score.item())
            a = float(a_score.item())

        sev, is_anom = classify_anomaly_severity(score)
        ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        scores.append(score)
        behavior_scores.append(b)
        movement_scores.append(m)
        activity_scores.append(a)
        severities.append(sev)

        cur = conn.execute("""
            INSERT INTO anomaly_detections
            (timestamp, sequence_id, behavior_score, movement_score, activity_score,
             anomaly_score, severity, is_anomaly, threshold_used, model_version, source)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (ts, i, round(b, 6), round(m, 6), round(a, 6),
              round(score, 6), sev, 1 if is_anom else 0,
              THRESHOLD, "LayeredAnomalyDetector-v1", "evaluation"))

        if sev == "Critical":
            conn.execute("""
                INSERT INTO anomaly_alerts (timestamp, anomaly_id, severity, score)
                VALUES (?,?,?,?)
            """, (ts, cur.lastrowid, sev, score))

    conn.commit()
    conn.close()

    print(f"Sequences scored : {len(scores)}")
    print(f"Mean score       : {np.mean(scores):.6f}")
    print(f"Threshold used   : {THRESHOLD:.6f}")
    print("\nSeverity breakdown:")
    for sev in ['Normal', 'Suspicious', 'Anomaly', 'Critical']:
        cnt = severities.count(sev)
        pct = cnt / len(severities) * 100
        print(f"  {sev:<12} {cnt:>4} ({pct:.1f}%)")
    print(f"\nLayer contributions:")
    print(f"  Behavior : mean={np.mean(behavior_scores):.6f}")
    print(f"  Movement : mean={np.mean(movement_scores):.6f}")
    print(f"  Activity : mean={np.mean(activity_scores):.6f}")

    return scores, behavior_scores, movement_scores, activity_scores

results = evaluate_sequences(model, SEQ_DIR)
if results:
    scores, b_scores, m_scores, a_scores = results

    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    fig.suptitle("Anomaly Detection — Layer Analysis", fontsize=14, fontweight='bold')

    colors_timeline = []
    for s in scores:
        sev, _ = classify_anomaly_severity(s)
        colors_timeline.append({
            'Normal': '#22C55E', 'Suspicious': '#F59E0B',
            'Anomaly': '#F97316', 'Critical': '#EF4444'
        }[sev])

    axes[0, 0].bar(range(len(scores)), scores, color=colors_timeline, width=1.0, alpha=0.8)
    axes[0, 0].axhline(SEV_NORMAL,     color='#22C55E', linestyle='--', lw=1.5, label='Normal')
    axes[0, 0].axhline(SEV_SUSPICIOUS, color='#F59E0B', linestyle='--', lw=1.5, label='Suspicious')
    axes[0, 0].axhline(SEV_ANOMALY,    color='#EF4444', linestyle='--', lw=1.5, label='Anomaly')
    axes[0, 0].set_title('Combined Anomaly Score', fontweight='bold')
    axes[0, 0].set_xlabel('Sequence')
    axes[0, 0].set_ylabel('Score')
    axes[0, 0].legend(fontsize=9)
    axes[0, 0].grid(alpha=0.3)

    axes[0, 1].plot(b_scores, color='#3B82F6', lw=1.5, alpha=0.8, label='Behavior')
    axes[0, 1].plot(m_scores, color='#F59E0B', lw=1.5, alpha=0.8, label='Movement')
    axes[0, 1].plot(a_scores, color='#EF4444', lw=1.5, alpha=0.8, label='Activity')
    axes[0, 1].set_title('Layer Scores Comparison', fontweight='bold')
    axes[0, 1].set_xlabel('Sequence')
    axes[0, 1].set_ylabel('Score')
    axes[0, 1].legend(fontsize=9)
    axes[0, 1].grid(alpha=0.3)

    sev_counts = {}
    for s in scores:
        sev, _ = classify_anomaly_severity(s)
        sev_counts[sev] = sev_counts.get(sev, 0) + 1
    sev_colors = {'Normal': '#22C55E', 'Suspicious': '#F59E0B',
                  'Anomaly': '#F97316', 'Critical': '#EF4444'}
    labels     = list(sev_counts.keys())
    values     = list(sev_counts.values())
    colors_pie = [sev_colors[l] for l in labels]
    axes[1, 0].pie(values, labels=labels, colors=colors_pie, autopct='%1.1f%%',
                   startangle=90, wedgeprops={'edgecolor': 'white', 'linewidth': 2})
    axes[1, 0].set_title('Severity Distribution', fontweight='bold')

    if len(scores) > 10:
        rolling = pd.Series(scores).rolling(10, center=True).mean()
        axes[1, 1].plot(scores,  alpha=0.3, color='#3B82F6', label='Raw score')
        axes[1, 1].plot(rolling, color='#EF4444', lw=2,      label='Rolling avg (10)')
        axes[1, 1].axhline(THRESHOLD, color='orange', linestyle='--',
                            label=f'Threshold: {THRESHOLD:.4f}')
        axes[1, 1].set_title('Score Trend', fontweight='bold')
        axes[1, 1].set_xlabel('Sequence')
        axes[1, 1].set_ylabel('Score')
        axes[1, 1].legend(fontsize=9)
        axes[1, 1].grid(alpha=0.3)

    plt.tight_layout()
    plt.savefig("anomaly_dashboard.png", dpi=150, bbox_inches='tight')
    plt.show()
    print("Dashboard saved")


def run_realtime_detection(source=TEST_VIDEO, use_camera=False, max_sequences=200):
    model.eval()
    buffer  = collections.deque(maxlen=SEQ_LEN)
    seq_idx = 0
    conn    = sqlite3.connect(DB_PATH)

    cap = cv2.VideoCapture(0 if use_camera else source)
    if not cap.isOpened():
        print(f"Cannot open: {'camera' if use_camera else source}")
        conn.close()
        return

    detection_log = []

    try:
        while seq_idx < max_sequences:
            ret, frame = cap.read()
            if not ret:
                break

            small = cv2.resize(frame, (IMG_SIZE, IMG_SIZE)).astype("float32") / 255.0
            buffer.append(small)

            if len(buffer) < SEQ_LEN:
                continue

            seq_idx += 1
            frames_arr = np.transpose(np.stack(list(buffer), axis=0), (0, 3, 1, 2))
            seq_t = torch.tensor(frames_arr, dtype=torch.float32).unsqueeze(0).to(DEVICE)

            with torch.no_grad():
                combined, b_score, m_score, a_score, recon, mu, logvar = model(seq_t)
                score = float(combined.item())

            sev, is_anom = classify_anomaly_severity(score)
            ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            cur = conn.execute("""
                INSERT INTO anomaly_detections
                (timestamp, sequence_id, behavior_score, movement_score, activity_score,
                 anomaly_score, severity, is_anomaly, threshold_used, model_version, source)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """, (ts, seq_idx,
                  round(float(b_score.item()), 6),
                  round(float(m_score.item()), 6),
                  round(float(a_score.item()), 6),
                  round(score, 6), sev, 1 if is_anom else 0,
                  THRESHOLD, "LayeredAnomalyDetector-v1",
                  "camera" if use_camera else "video"))

            if sev == "Critical":
                conn.execute("""
                    INSERT INTO anomaly_alerts (timestamp, anomaly_id, severity, score)
                    VALUES (?,?,?,?)
                """, (ts, cur.lastrowid, sev, score))
                print(f"CRITICAL ALERT — Seq {seq_idx:04d} | Score {score:.6f}")

            conn.commit()
            detection_log.append({'seq': seq_idx, 'score': score, 'severity': sev})

            if seq_idx % 20 == 0:
                print(f"  Seq {seq_idx:04d} | {sev:<12} | Score {score:.6f}")

    finally:
        cap.release()
        conn.close()

    n_anom = sum(1 for d in detection_log if d['severity'] in ['Anomaly', 'Critical'])
    print(f"Detection complete: {seq_idx} sequences | {n_anom} anomalies ({n_anom/max(seq_idx,1)*100:.1f}%)")
    return detection_log

detection_results = run_realtime_detection(source=TEST_VIDEO, use_camera=False, max_sequences=100)


conn = sqlite3.connect(DB_PATH)

n = conn.execute("SELECT COUNT(*) FROM anomaly_detections").fetchone()[0]
print(f"Total sequences scored: {n}")

rows = conn.execute("""
    SELECT severity, COUNT(*) as cnt,
           ROUND(AVG(anomaly_score), 6) as avg_score,
           ROUND(AVG(behavior_score), 6) as avg_behavior,
           ROUND(AVG(movement_score), 6) as avg_movement,
           ROUND(AVG(activity_score), 6) as avg_activity
    FROM anomaly_detections
    GROUP BY severity ORDER BY avg_score
""").fetchall()

print("\nSeverity breakdown with layer contributions:")
for sev, cnt, avg, avg_b, avg_m, avg_a in rows:
    print(f"  {sev:<12} {cnt:>4} | combined={avg:.4f} | "
          f"behavior={avg_b:.4f} | movement={avg_m:.4f} | activity={avg_a:.4f}")

n_alerts = conn.execute("SELECT COUNT(*) FROM anomaly_alerts").fetchone()[0]
print(f"Critical alerts logged: {n_alerts}")

conn.close()


conn = sqlite3.connect(DB_PATH)

cross_module_query = """
SELECT
    ad.timestamp                    AS anomaly_time,
    ad.severity                     AS anomaly_severity,
    ad.anomaly_score                AS anomaly_score,
    ad.behavior_score               AS behavior_score,
    ad.movement_score               AS movement_score,
    ad.activity_score               AS activity_score,
    sr.pH                           AS water_pH,
    sr.DO                           AS water_DO,
    sr.temperature                  AS water_temp,
    dd.disease_class                AS disease_detected,
    dd.severity                     AS disease_severity,
    CASE
        WHEN ad.severity = 'Critical'
             AND dd.severity = 'Severe'    THEN 'MAXIMUM RISK'
        WHEN ad.severity IN ('Anomaly','Critical')
             AND sr.DO < 5                 THEN 'HIGH RISK'
        WHEN ad.severity = 'Suspicious'    THEN 'ELEVATED RISK'
        ELSE 'MONITOR'
    END AS combined_system_risk
FROM anomaly_detections ad
LEFT JOIN sensor_readings sr
    ON ABS(strftime('%s', ad.timestamp)
         - strftime('%s', sr.timestamp)) < 300
LEFT JOIN disease_detections dd
    ON ABS(strftime('%s', ad.timestamp)
         - strftime('%s', dd.timestamp)) < 300
WHERE ad.is_anomaly = 1
ORDER BY ad.anomaly_score DESC
LIMIT 20;
"""

try:
    df = pd.read_sql_query(cross_module_query, conn)
    if df.empty:
        print("No overlapping data yet — runs automatically when all modules active.")
    else:
        print("Cross-module results:")
        print(df.to_string(index=False))
except Exception as e:
    print(f"Query ready — will run when all modules share live data: {e}")

conn.close()