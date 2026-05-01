import pandas as pd
import numpy as np
import sqlite3
import os
import joblib
import warnings
from datetime import datetime
warnings.filterwarnings('ignore')

import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_validate,
    RandomizedSearchCV,
)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    classification_report,
    confusion_matrix,
    balanced_accuracy_score,
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

print(f"Libraries loaded — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


DB_PATH      = "smart_aquarium.db"
DATASET_PATH = os.path.join("data", "WaterQualityDataset.csv")

def init_database():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT    NOT NULL,
            pH          REAL    NOT NULL CHECK(pH BETWEEN 0 AND 14),
            DO          REAL    NOT NULL CHECK(DO >= 0),
            temperature REAL    NOT NULL,
            source      TEXT    DEFAULT 'csv_import'
        );

        CREATE TABLE IF NOT EXISTS predictions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            reading_id      INTEGER NOT NULL,
            model_name      TEXT    NOT NULL,
            predicted_label TEXT    NOT NULL CHECK(predicted_label IN ('Good','Average','Bad')),
            confidence      REAL,
            confidence_pct  TEXT,
            timestamp       TEXT    NOT NULL,
            FOREIGN KEY (reading_id) REFERENCES sensor_readings(id)
        );

        CREATE TABLE IF NOT EXISTS model_runs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            run_date    TEXT    NOT NULL,
            model_name  TEXT    NOT NULL,
            accuracy    REAL,
            f1_score    REAL,
            precision   REAL,
            recall      REAL,
            cv_mean     REAL,
            cv_std      REAL,
            n_samples   INTEGER,
            notes       TEXT
        );

        CREATE TABLE IF NOT EXISTS anomaly_log (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            reading_id   INTEGER NOT NULL,
            timestamp    TEXT    NOT NULL,
            anomaly_type TEXT    NOT NULL,
            severity     TEXT    NOT NULL CHECK(severity IN ('Low','Medium','High')),
            pH           REAL,
            DO           REAL,
            temperature  REAL,
            FOREIGN KEY (reading_id) REFERENCES sensor_readings(id)
        );
    """)
    conn.commit()
    conn.close()
    print("Database ready:", DB_PATH)

init_database()


def load_and_clean(filepath):
    df = pd.read_csv(filepath)
    original_len = len(df)
    df = df.dropna(subset=['pH', 'DO', 'Temp '])
    df = df[(df['pH'] >= 0) & (df['pH'] <= 14)]
    df = df[df['DO'] >= 0]
    df = df[(df['Temp '] >= -5) & (df['Temp '] <= 50)]
    df = df.reset_index(drop=True)
    df = df.rename(columns={'Temp ': 'temperature'})
    print(f"Original: {original_len} rows | After cleaning: {len(df)} rows ({original_len - len(df)} removed)")
    return df

df = load_and_clean(DATASET_PATH)

def import_to_db(df):
    conn = sqlite3.connect(DB_PATH)
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    records = [
        (timestamp, row['pH'], row['DO'], row['temperature'], 'csv_import')
        for _, row in df.iterrows()
    ]
    conn.executemany(
        "INSERT INTO sensor_readings (timestamp, pH, DO, temperature, source) VALUES (?,?,?,?,?)",
        records
    )
    conn.commit()
    count = conn.execute("SELECT COUNT(*) FROM sensor_readings").fetchone()[0]
    conn.close()
    print(f"{len(records)} readings imported — DB total: {count}")

import_to_db(df)


fig, axes = plt.subplots(2, 3, figsize=(16, 9))
fig.suptitle("Water Quality — Feature Distributions", fontsize=14, fontweight='bold')

features = ['pH', 'DO', 'temperature']
colors   = ['#2196F3', '#4CAF50', '#FF9800']

for i, (feat, col) in enumerate(zip(features, colors)):
    axes[0, i].hist(df[feat], bins=40, color=col, alpha=0.8, edgecolor='white')
    axes[0, i].axvline(df[feat].mean(), color='red', linestyle='--', linewidth=1.5,
                       label=f'Mean: {df[feat].mean():.2f}')
    axes[0, i].set_title(f'{feat} Distribution', fontweight='bold')
    axes[0, i].set_xlabel(feat)
    axes[0, i].set_ylabel('Count')
    axes[0, i].legend(fontsize=8)
    axes[0, i].grid(alpha=0.3)

    axes[1, i].boxplot(df[feat], patch_artist=True, vert=True,
                       boxprops=dict(facecolor=col, alpha=0.7),
                       medianprops=dict(color='red', linewidth=2))
    axes[1, i].set_title(f'{feat} Boxplot', fontweight='bold')
    axes[1, i].set_ylabel(feat)
    axes[1, i].grid(alpha=0.3)

plt.tight_layout()
plt.savefig("eda_distributions.png", dpi=150, bbox_inches='tight')
plt.show()
print("EDA distributions saved")


fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

corr = df[['pH', 'DO', 'temperature']].corr()
sns.heatmap(corr, annot=True, fmt='.3f', cmap='coolwarm', center=0,
            square=True, ax=ax1, cbar_kws={'shrink': 0.8})
ax1.set_title('Feature Correlation Matrix', fontweight='bold')


def classify_condition(row):
    pH, DO, T = row['pH'], row['DO'], row['temperature']
    if (6.5 <= pH <= 8.5) and (DO >= 5) and (20 <= T <= 30):
        return "Good"
    elif (5.5 <= pH < 6.5 or 8.5 < pH <= 9.0) or (3 <= DO < 5) or (15 <= T < 20 or 30 < T <= 35):
        return "Average"
    else:
        return "Bad"


df['Condition'] = df.apply(classify_condition, axis=1)
dist = df['Condition'].value_counts()
bars = ax2.bar(dist.index, dist.values,
               color=['#F44336', '#FF9800', '#4CAF50'], edgecolor='white', linewidth=1.2)
ax2.set_title('Class Distribution', fontweight='bold')
ax2.set_ylabel('Count')
for bar, val in zip(bars, dist.values):
    ax2.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 5,
             f'{val}\n({val / len(df) * 100:.1f}%)', ha='center', fontsize=9, fontweight='bold')
ax2.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig("eda_correlation_class.png", dpi=150, bbox_inches='tight')
plt.show()
print("Class distribution saved")


def detect_and_log_anomalies(df):
    conn = sqlite3.connect(DB_PATH)
    reading_ids = [r[0] for r in conn.execute("SELECT id FROM sensor_readings ORDER BY id").fetchall()]
    anomalies = []

    for feat in ['pH', 'DO', 'temperature']:
        mean, std = df[feat].mean(), df[feat].std()
        for idx, val in df[feat].items():
            z = abs(val - mean) / std
            if z > 3:
                severity = 'High'
            elif z > 2:
                severity = 'Medium'
            elif z > 1.5:
                severity = 'Low'
            else:
                continue
            rid = reading_ids[idx] if idx < len(reading_ids) else idx
            anomalies.append((
                rid,
                datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                f'{feat}_outlier',
                severity,
                df.loc[idx, 'pH'],
                df.loc[idx, 'DO'],
                df.loc[idx, 'temperature']
            ))

    conn.executemany(
        "INSERT INTO anomaly_log (reading_id, timestamp, anomaly_type, severity, pH, DO, temperature)"
        " VALUES (?,?,?,?,?,?,?)",
        anomalies[:500]
    )
    conn.commit()

    summary = conn.execute(
        "SELECT severity, COUNT(*) FROM anomaly_log GROUP BY severity"
    ).fetchall()
    conn.close()

    print(f"Anomalies flagged: {len(anomalies)}")
    for sev, cnt in summary:
        print(f"  {sev}: {cnt}")
    return len(anomalies)

n_anomalies = detect_and_log_anomalies(df)


X = df[['pH', 'DO', 'temperature']]
y = df['Condition']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Train: {len(X_train)} | Test: {len(X_test)}")
for cls, cnt in y_train.value_counts().items():
    print(f"  {cls}: {cnt} ({cnt/len(y_train)*100:.1f}%)")


MODELS = {
    "Logistic Regression": Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=2000, random_state=42, class_weight='balanced'))
    ]),
    "Decision Tree": Pipeline([
        ('scaler', StandardScaler()),
        ('clf', DecisionTreeClassifier(random_state=42, max_depth=8,
                                        min_samples_leaf=3, class_weight='balanced'))
    ]),
    "Random Forest": Pipeline([
        ('scaler', StandardScaler()),
        ('clf', RandomForestClassifier(n_estimators=300, random_state=42,
                                        class_weight='balanced_subsample', min_samples_leaf=2))
    ]),
    "Gradient Boosting": Pipeline([
        ('scaler', StandardScaler()),
        ('clf', GradientBoostingClassifier(n_estimators=200, learning_rate=0.05, random_state=42))
    ]),
    "KNN": Pipeline([
        ('scaler', StandardScaler()),
        ('clf', KNeighborsClassifier(n_neighbors=7, weights='distance'))
    ]),
    "SVM": Pipeline([
        ('scaler', StandardScaler()),
        ('clf', SVC(kernel='rbf', random_state=42, probability=True,
                    class_weight='balanced', C=2.0))
    ]),
}

results = []
fitted_models = {}
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scoring = {'accuracy': 'accuracy', 'f1_weighted': 'f1_weighted'}
conn = sqlite3.connect(DB_PATH)

print("Training 6 models with stratified 5-fold CV...\n")
for name, model in MODELS.items():
    cv_scores = cross_validate(model, X_train, y_train, cv=skf, scoring=scoring, n_jobs=-1)
    model.fit(X_train, y_train)
    fitted_models[name] = model
    y_pred = model.predict(X_test)

    acc  = accuracy_score(y_test, y_pred)
    f1   = f1_score(y_test, y_pred, average='weighted')
    prec = precision_score(y_test, y_pred, average='weighted')
    rec  = recall_score(y_test, y_pred, average='weighted')
    bacc = balanced_accuracy_score(y_test, y_pred)
    cv_mean = np.mean(cv_scores['test_accuracy'])
    cv_std  = np.std(cv_scores['test_accuracy'])

    results.append({
        "model": name, "accuracy": acc, "balanced_accuracy": bacc,
        "f1": f1, "precision": prec, "recall": rec,
        "cv_mean": cv_mean, "cv_std": cv_std,
        "cv_f1": np.mean(cv_scores['test_f1_weighted']),
    })

    conn.execute("""
        INSERT INTO model_runs
        (run_date, model_name, accuracy, f1_score, precision, recall, cv_mean, cv_std, n_samples)
        VALUES (?,?,?,?,?,?,?,?,?)
    """, (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), name, acc, f1, prec, rec,
          cv_mean, cv_std, len(X_train)))

    print(f"{name:<22} Acc={acc:.4f}  BalAcc={bacc:.4f}  F1={f1:.4f}  CV={cv_mean:.4f}+/-{cv_std:.4f}")

conn.commit()
conn.close()

results_df = pd.DataFrame(results).sort_values(
    ['balanced_accuracy', 'f1', 'accuracy'], ascending=False
).reset_index(drop=True)

print("\nAll runs saved to model_runs table")

fig, axes = plt.subplots(1, 3, figsize=(18, 6))
fig.suptitle("Model Performance Comparison — Water Quality", fontsize=14, fontweight='bold')

palette = ['#1a237e', '#283593', '#303f9f', '#3949ab', '#3f51b5', '#5c6bc0']
models_sorted = results_df['model'].tolist()
accs = results_df['accuracy'].tolist()
f1s  = results_df['f1'].tolist()
cvs  = results_df['cv_mean'].tolist()
stds = results_df['cv_std'].tolist()

bars = axes[0].barh(models_sorted, accs, color=palette, edgecolor='white', height=0.6)
axes[0].set_xlim(0.6, 1.05)
axes[0].set_title('Test Accuracy', fontweight='bold')
axes[0].set_xlabel('Accuracy')
for bar, val in zip(bars, accs):
    axes[0].text(val + 0.002, bar.get_y() + bar.get_height() / 2,
                 f'{val:.4f}', va='center', fontsize=9, fontweight='bold')
axes[0].grid(axis='x', alpha=0.3)

bars2 = axes[1].barh(models_sorted, f1s, color=palette, edgecolor='white', height=0.6)
axes[1].set_xlim(0.6, 1.05)
axes[1].set_title('Weighted F1 Score', fontweight='bold')
axes[1].set_xlabel('F1 Score')
for bar, val in zip(bars2, f1s):
    axes[1].text(val + 0.002, bar.get_y() + bar.get_height() / 2,
                 f'{val:.4f}', va='center', fontsize=9, fontweight='bold')
axes[1].grid(axis='x', alpha=0.3)

axes[2].barh(models_sorted, cvs, xerr=stds, color=palette,
             edgecolor='white', height=0.6, capsize=4, ecolor='#333')
axes[2].set_xlim(0.5, 1.1)
axes[2].set_title('5-Fold CV Accuracy (Mean +/- Std)', fontweight='bold')
axes[2].set_xlabel('CV Accuracy')
axes[2].grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig("model_comparison.png", dpi=150, bbox_inches='tight')
plt.show()
print("Model comparison saved")


best_name  = results_df.iloc[0]['model']
best_model = fitted_models[best_name]
y_pred_best = best_model.predict(X_test)
cm = confusion_matrix(y_test, y_pred_best, labels=['Bad', 'Average', 'Good'])

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Bad', 'Average', 'Good'],
            yticklabels=['Bad', 'Average', 'Good'],
            ax=ax1, linewidths=0.5, cbar_kws={'shrink': 0.8})
ax1.set_title(f'Confusion Matrix — {best_name}', fontweight='bold')
ax1.set_ylabel('Actual')
ax1.set_xlabel('Predicted')

rf_model    = fitted_models['Random Forest'].named_steps['clf']
importances = rf_model.feature_importances_
feat_names  = ['pH', 'DO', 'Temperature']
colors_fi   = ['#2196F3', '#4CAF50', '#FF9800']
bars = ax2.bar(feat_names, importances, color=colors_fi, edgecolor='white', linewidth=1.2)
ax2.set_title('Feature Importance (Random Forest)', fontweight='bold')
ax2.set_ylabel('Importance Score')
ax2.set_ylim(0, max(importances) * 1.2)
for bar, val in zip(bars, importances):
    ax2.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.005,
             f'{val:.3f}', ha='center', fontweight='bold')
ax2.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig("confusion_feature_importance.png", dpi=150, bbox_inches='tight')
plt.show()
print(f"Best model: {best_name}")
print(classification_report(y_test, y_pred_best, digits=4))


param_dist = {
    'clf__n_estimators'    : [200, 300, 400, 500],
    'clf__max_depth'       : [None, 8, 12, 16, 24],
    'clf__min_samples_split': [2, 4, 6, 8],
    'clf__min_samples_leaf': [1, 2, 3, 4],
    'clf__max_features'    : ['sqrt', 'log2', None],
}

rf_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', RandomForestClassifier(random_state=42, class_weight='balanced_subsample'))
])

grid_search = RandomizedSearchCV(
    rf_pipeline,
    param_distributions=param_dist,
    n_iter=24,
    cv=skf,
    scoring='f1_weighted',
    n_jobs=-1,
    random_state=42,
    verbose=0
)
grid_search.fit(X_train, y_train)

best_rf = grid_search.best_estimator_
y_pred_tuned = best_rf.predict(X_test)
acc_tuned  = accuracy_score(y_test, y_pred_tuned)
f1_tuned   = f1_score(y_test, y_pred_tuned, average='weighted')
bacc_tuned = balanced_accuracy_score(y_test, y_pred_tuned)

print(f"Best parameters: {grid_search.best_params_}")
print(f"Tuned RF — Accuracy: {acc_tuned:.4f} | F1: {f1_tuned:.4f} | BalAcc: {bacc_tuned:.4f}")
print(f"vs untuned RF accuracy: {results_df[results_df.model=='Random Forest']['accuracy'].values[0]:.4f}")

joblib.dump(best_rf, "best_rf_water_quality.pkl")
print("Tuned pipeline saved: best_rf_water_quality.pkl")


def predict_and_log(pH, DO, temperature, model=best_rf, model_name="Tuned Random Forest"):
    assert 0 <= pH <= 14,          f"pH out of range: {pH}"
    assert DO >= 0,                f"DO cannot be negative: {DO}"
    assert -5 <= temperature <= 50, f"Temp out of range: {temperature}"

    conn = sqlite3.connect(DB_PATH)
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    cur = conn.execute(
        "INSERT INTO sensor_readings (timestamp, pH, DO, temperature, source) VALUES (?,?,?,?,?)",
        (ts, pH, DO, temperature, 'live_sensor')
    )
    reading_id = cur.lastrowid

    X_input    = pd.DataFrame([{'pH': pH, 'DO': DO, 'temperature': temperature}])
    label      = model.predict(X_input)[0]
    proba      = model.predict_proba(X_input)[0]
    confidence = round(float(np.max(proba)), 4)
    conf_pct   = f"{confidence:.1%}"

    conn.execute(
        "INSERT INTO predictions (reading_id, model_name, predicted_label, confidence, confidence_pct, timestamp)"
        " VALUES (?,?,?,?,?,?)",
        (reading_id, model_name, label, confidence, conf_pct, ts)
    )
    conn.commit()
    conn.close()

    print(f"Condition: {label} ({conf_pct} confidence) | pH={pH}, DO={DO}, Temp={temperature}C | reading #{reading_id}")
    return {"reading_id": reading_id, "label": label, "confidence": confidence, "confidence_pct": conf_pct}


print("Live sensor simulation:\n")
predict_and_log(pH=7.2, DO=6.5, temperature=24)
predict_and_log(pH=6.0, DO=4.0, temperature=18)
predict_and_log(pH=4.5, DO=1.5, temperature=40)
predict_and_log(pH=7.8, DO=7.2, temperature=22)


conn = sqlite3.connect(DB_PATH)

n = conn.execute("SELECT COUNT(*) FROM sensor_readings").fetchone()[0]
print(f"Total sensor readings: {n}")

print("\nPrediction breakdown:")
rows = conn.execute("""
    SELECT predicted_label, COUNT(*) as count,
           ROUND(AVG(confidence)*100, 1) as avg_conf
    FROM predictions GROUP BY predicted_label ORDER BY count DESC
""").fetchall()
for label, count, conf in rows:
    print(f"  {label:<10} {count:>4} predictions | avg confidence: {conf}%")

print("\nModel leaderboard:")
rows = conn.execute("""
    SELECT model_name, ROUND(AVG(accuracy)*100,2) as acc,
           ROUND(AVG(f1_score)*100,2) as f1,
           ROUND(AVG(cv_mean)*100,2) as cv
    FROM model_runs GROUP BY model_name ORDER BY acc DESC
""").fetchall()
for i, (name, acc, f1, cv) in enumerate(rows, 1):
    print(f"  {i}. {name:<22} Acc={acc}%  F1={f1}%  CV={cv}%")

print("\nAnomaly summary:")
rows = conn.execute("""
    SELECT severity, anomaly_type, COUNT(*) as cnt
    FROM anomaly_log GROUP BY severity, anomaly_type ORDER BY severity
""").fetchall()
for sev, atype, cnt in rows[:8]:
    print(f"  {sev:<8} {atype:<20} {cnt} cases")

conn.close()
print("\nAll data queryable from:", DB_PATH)
