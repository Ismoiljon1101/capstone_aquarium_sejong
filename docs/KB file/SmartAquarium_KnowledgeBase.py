import os
import sqlite3
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DB_PATH     = os.path.join(BASE_DIR, "smart_aquarium.db")
RESULTS_DIR = os.path.join(BASE_DIR, "results")

os.makedirs(RESULTS_DIR, exist_ok=True)

print(f"Libraries loaded — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"DB: {DB_PATH}")


def init_knowledge_base():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS disease_knowledge (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            disease_class     TEXT NOT NULL UNIQUE,
            display_name      TEXT NOT NULL,
            disease_type      TEXT NOT NULL,
            description       TEXT,
            primary_pathogens TEXT,
            symptoms          TEXT,
            water_triggers    TEXT,
            treatment_steps   TEXT,
            prevention        TEXT,
            contagious        INTEGER DEFAULT 0,
            mortality_risk    TEXT,
            recovery_time     TEXT
        );

        CREATE TABLE IF NOT EXISTS pathogen_catalog (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            disease_class    TEXT NOT NULL,
            pathogen_name    TEXT NOT NULL,
            scientific_name  TEXT,
            pathogen_type    TEXT,
            description      TEXT,
            optimal_pH_min   REAL,
            optimal_pH_max   REAL,
            optimal_temp_min REAL,
            optimal_temp_max REAL,
            low_DO_risk      INTEGER DEFAULT 0,
            treatment        TEXT,
            notes            TEXT
        );

        CREATE TABLE IF NOT EXISTS diagnosis_log (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp        TEXT NOT NULL,
            fish_id          INTEGER,
            disease_class    TEXT NOT NULL,
            severity         TEXT NOT NULL,
            confidence       REAL,
            pH               REAL,
            DO               REAL,
            temperature      REAL,
            primary_pathogen TEXT,
            diagnosis_text   TEXT,
            treatment_plan   TEXT,
            risk_factors     TEXT,
            water_ok         INTEGER DEFAULT 1
        );
    """)
    conn.commit()
    conn.close()
    print("Knowledge base tables ready")

init_knowledge_base()


def populate_disease_knowledge():
    conn = sqlite3.connect(DB_PATH)

    diseases = [
        {
            "disease_class"    : "BD Bacterial Disease",
            "display_name"     : "Bacterial Disease",
            "disease_type"     : "Bacterial",
            "description"      : "Bacterial infections caused by gram-negative and gram-positive bacteria. Enter through wounds, poor water quality, or stress.",
            "primary_pathogens": "Aeromonas hydrophila, Pseudomonas fluorescens, Flavobacterium columnare, Streptococcus iniae",
            "symptoms"         : "Fin rot, open sores/ulcers, hemorrhaging, pop-eye, loss of scales, bloating, lethargy, red streaks on body",
            "water_triggers"   : "pH below 6.5 or above 8.5, low dissolved oxygen below 4 mg/L, temperature above 28C, overcrowding",
            "treatment_steps"  : "1. Isolate infected fish. 2. 30% water change. 3. Increase aeration. 4. Aquarium salt 1 tsp/gallon. 5. Kanamycin or Erythromycin. 6. Maintain pH 7.0-7.5. 7. Monitor 7-14 days.",
            "prevention"       : "Regular water changes, avoid overcrowding, stable water parameters, quarantine new fish 2 weeks",
            "contagious"       : 1,
            "mortality_risk"   : "Medium to High if untreated",
            "recovery_time"    : "7-21 days with treatment",
        },
        {
            "disease_class"    : "FD Fungal Disease",
            "display_name"     : "Fungal Disease",
            "disease_type"     : "Fungal",
            "description"      : "Secondary infections appearing after injury or bacterial infection. Saprolegnia appears as white/gray cotton-like growth.",
            "primary_pathogens": "Saprolegnia parasitica, Achlya bisexualis, Aphanomyces invadans, Branchiomyces sanguinis",
            "symptoms"         : "White/gray cotton patches on body/fins, skin discoloration, ulcers under fungal growth, difficulty swimming",
            "water_triggers"   : "Temperature below 15C or above 30C, pH below 6.0, high organic waste, low DO below 5 mg/L",
            "treatment_steps"  : "1. Quarantine tank. 2. Methylene Blue 0.1 mg/L or Malachite Green. 3. Salt bath 3% for 5-10 min. 4. Improve aeration. 5. Raise temp to 24-26C.",
            "prevention"       : "Avoid handling injuries, maintain optimal temperature, regular water changes, good filtration",
            "contagious"       : 0,
            "mortality_risk"   : "Low to Medium — rarely fatal if caught early",
            "recovery_time"    : "14-28 days with consistent treatment",
        },
        {
            "disease_class"    : "PD Parasitic Disease",
            "display_name"     : "Parasitic Disease",
            "disease_type"     : "Parasitic",
            "description"      : "Most common fish diseases. Ich (white spot) is most frequently encountered. Parasites thrive when fish are stressed.",
            "primary_pathogens": "Ichthyophthirius multifiliis (Ich), Trichodina sp., Gyrodactylus sp., Dactylogyrus sp., Chilodonella sp.",
            "symptoms"         : "White spots on body and fins, excessive mucus, fish rubbing against surfaces, clamped fins, rapid gill movement",
            "water_triggers"   : "Temperature drops, pH below 6.5, low DO below 5 mg/L, high nitrates above 40 ppm",
            "treatment_steps"  : "1. Raise temperature to 28-30C. 2. Aquarium salt 1 tbsp/5 gallons. 3. Copper sulfate 0.2 mg/L. 4. Daily 25% water changes. 5. Treat minimum 10 days.",
            "prevention"       : "Quarantine new fish 2 weeks, stable temperature, avoid sudden changes",
            "contagious"       : 1,
            "mortality_risk"   : "High if untreated — can kill entire tank",
            "recovery_time"    : "10-21 days with correct treatment",
        },
        {
            "disease_class"    : "HF Healthy Fish",
            "display_name"     : "Healthy Fish",
            "disease_type"     : "None",
            "description"      : "Fish appears healthy. Normal behavior, coloration, and physical appearance. Continue routine monitoring.",
            "primary_pathogens": "None detected",
            "symptoms"         : "No disease symptoms. Active swimming, good appetite, normal coloration, clear eyes, intact fins",
            "water_triggers"   : "N/A — fish is healthy. Monitor water parameters.",
            "treatment_steps"  : "No treatment needed. Maintain: pH 6.5-8.5, DO above 5 mg/L, Temperature 18-28C",
            "prevention"       : "Regular water changes weekly, proper feeding 2x daily, good filtration, avoid overcrowding",
            "contagious"       : 0,
            "mortality_risk"   : "None — fish is healthy",
            "recovery_time"    : "N/A",
        },
    ]

    for d in diseases:
        conn.execute("""
            INSERT OR REPLACE INTO disease_knowledge
            (disease_class, display_name, disease_type, description,
             primary_pathogens, symptoms, water_triggers, treatment_steps,
             prevention, contagious, mortality_risk, recovery_time)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """, (d['disease_class'], d['display_name'], d['disease_type'],
              d['description'], d['primary_pathogens'], d['symptoms'],
              d['water_triggers'], d['treatment_steps'], d['prevention'],
              d['contagious'], d['mortality_risk'], d['recovery_time']))

    conn.commit()
    conn.close()
    print(f"Disease knowledge populated: {len(diseases)} diseases")

populate_disease_knowledge()


def populate_pathogen_catalog():
    conn = sqlite3.connect(DB_PATH)

    existing = conn.execute("SELECT COUNT(*) FROM pathogen_catalog").fetchone()[0]
    if existing > 0:
        print(f"Pathogen catalog already has {existing} entries — skipping")
        conn.close()
        return

    pathogens = [
        ("BD Bacterial Disease", "Columnaris", "Flavobacterium columnare",
         "Bacteria", "Saddle-shaped lesions, fin erosion, grayish-white patches. Very contagious.",
         6.5, 8.0, 20, 35, 1,
         "Tetracycline or Oxytetracycline, salt bath, improve oxygenation",
         "Thrives in warm water and low oxygen. Most dangerous above 25C."),

        ("BD Bacterial Disease", "Aeromonas", "Aeromonas hydrophila",
         "Bacteria", "Hemorrhagic septicemia — red spots, ulcers, fin rot, bloating.",
         6.0, 8.5, 10, 35, 1,
         "Kanamycin or Enrofloxacin, clean water, salt treatment",
         "Almost always linked to poor water quality or immune-suppressed fish."),

        ("BD Bacterial Disease", "Pseudomonas", "Pseudomonas fluorescens",
         "Bacteria", "Fin rot, skin ulcers, hemorrhages at fin base.",
         6.5, 8.0, 15, 30, 0,
         "Erythromycin or Kanamycin, water quality improvement",
         "Usually a secondary infection following injury."),

        ("BD Bacterial Disease", "Streptococcosis", "Streptococcus iniae",
         "Bacteria", "Pop-eye, spiral swimming, hemorrhaging around eyes, pale gills.",
         7.0, 8.5, 22, 32, 1,
         "Florfenicol or Erythromycin, water change, reduce stress",
         "Warm water bacteria — more common in tropical tanks above 25C."),

        ("FD Fungal Disease", "Saprolegnia", "Saprolegnia parasitica",
         "Fungus", "White/gray cotton wool patches on skin, fins, or eggs.",
         5.5, 7.5, 5, 25, 0,
         "Methylene Blue 0.1 mg/L, salt bath 3% for 10 min, Malachite Green",
         "Thrives in cold water. Almost always secondary to injury."),

        ("FD Fungal Disease", "Branchiomycosis", "Branchiomyces sanguinis",
         "Fungus", "Gill rot — gills mottled brown/grey, labored breathing, gasping at surface.",
         5.0, 7.0, 20, 30, 0,
         "Malachite Green bath, improve water quality urgently, increase aeration",
         "Linked to high organic load in water."),

        ("FD Fungal Disease", "Achlyosis", "Achlya bisexualis",
         "Fungus", "White cottony growth, mainly on wounds or dead tissue.",
         5.5, 7.5, 10, 28, 0,
         "Methylene Blue or salt bath — same as Saprolegnia",
         "Often confused with Saprolegnia. Both treated identically."),

        ("PD Parasitic Disease", "Ich", "Ichthyophthirius multifiliis",
         "Protozoan Parasite", "White spot disease — tiny white dots covering body and fins. Most common fish disease worldwide.",
         5.5, 8.5, 10, 25, 1,
         "Raise temp to 28-30C, aquarium salt, Copper sulfate 0.2 mg/L",
         "Life cycle speeds up at high temperature — treat 10+ days."),

        ("PD Parasitic Disease", "Trichodina", "Trichodina sp.",
         "Protozoan Parasite", "Microscopic saucer-shaped parasite. Causes excess mucus, scratching, respiratory distress.",
         6.0, 8.5, 15, 30, 1,
         "Salt bath 3% for 5 min, Formalin 25 mg/L, improve water quality",
         "Strongly linked to poor water quality and overcrowding."),

        ("PD Parasitic Disease", "Gyrodactylus", "Gyrodactylus sp.",
         "Monogenean Fluke", "Skin flukes — scratching, excess mucus, frayed fins, lethargy.",
         6.0, 8.0, 5, 25, 1,
         "Praziquantel 2 mg/L for 3 hours, salt bath, Formalin dip",
         "Gives birth to live young — reproduces rapidly. Treat entire tank."),

        ("PD Parasitic Disease", "Chilodonella", "Chilodonella sp.",
         "Protozoan Parasite", "Blue-grey film on skin, rapid gill movement, gasping at surface.",
         5.5, 7.5, 5, 20, 1,
         "Salt bath 3%, Formalin 25 mg/L, raise temperature above 22C",
         "Cold water parasite — outbreaks common in winter."),
    ]

    conn.executemany("""
        INSERT INTO pathogen_catalog
        (disease_class, pathogen_name, scientific_name, pathogen_type,
         description, optimal_pH_min, optimal_pH_max,
         optimal_temp_min, optimal_temp_max, low_DO_risk,
         treatment, notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """, pathogens)

    conn.commit()
    n = conn.execute("SELECT COUNT(*) FROM pathogen_catalog").fetchone()[0]
    conn.close()
    print(f"Pathogen catalog populated: {n} pathogens")

populate_pathogen_catalog()


def get_latest_sensor_reading(parameter):
    try:
        conn = sqlite3.connect(DB_PATH)
        tables = [r[0] for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()]
        if 'sensor_readings' not in tables:
            conn.close()
            return None
        val = conn.execute(f"""
            SELECT {parameter} FROM sensor_readings
            ORDER BY timestamp DESC LIMIT 1
        """).fetchone()
        conn.close()
        return val[0] if val else None
    except:
        return None


def diagnose_fish(disease_class, severity, confidence,
                  pH=None, DO=None, temperature=None,
                  fish_id=None, log_to_db=True):

    conn = sqlite3.connect(DB_PATH)

    row = conn.execute(
        "SELECT * FROM disease_knowledge WHERE disease_class=?",
        (disease_class,)).fetchone()

    cols = ['id', 'disease_class', 'display_name', 'disease_type', 'description',
            'primary_pathogens', 'symptoms', 'water_triggers', 'treatment_steps',
            'prevention', 'contagious', 'mortality_risk', 'recovery_time']
    disease = dict(zip(cols, row)) if row else {}

    pathogens = conn.execute(
        "SELECT * FROM pathogen_catalog WHERE disease_class=?",
        (disease_class,)).fetchall()

    pcols = ['id', 'disease_class', 'pathogen_name', 'scientific_name', 'pathogen_type',
             'description', 'optimal_pH_min', 'optimal_pH_max',
             'optimal_temp_min', 'optimal_temp_max', 'low_DO_risk', 'treatment', 'notes']

    best, best_score = None, -99
    for p_row in pathogens:
        p = dict(zip(pcols, p_row))
        score = 0
        try:
            if pH is not None and p['optimal_pH_min'] and p['optimal_pH_max']:
                score += 3 if p['optimal_pH_min'] <= pH <= p['optimal_pH_max'] else -1
            if temperature is not None and p['optimal_temp_min'] and p['optimal_temp_max']:
                score += 3 if p['optimal_temp_min'] <= temperature <= p['optimal_temp_max'] else -1
            if DO is not None and DO < 5 and p['low_DO_risk']:
                score += 2
        except:
            pass
        if score > best_score:
            best_score, best = score, p

    risks = []
    water_ok = True

    if pH is not None:
        if pH < 6.5:
            risks.append(f"pH {pH:.1f} too low — suppresses fish immunity")
            water_ok = False
        elif pH > 8.5:
            risks.append(f"pH {pH:.1f} too high — stresses fish")
            water_ok = False
        else:
            risks.append(f"pH {pH:.1f} within safe range")

    if DO is not None:
        if DO < 3:
            risks.append(f"DO {DO:.1f} mg/L critical — immune system severely compromised")
            water_ok = False
        elif DO < 5:
            risks.append(f"DO {DO:.1f} mg/L low — reduces ability to fight infection")
            water_ok = False
        else:
            risks.append(f"DO {DO:.1f} mg/L adequate")

    if temperature is not None:
        if temperature < 15:
            risks.append(f"Temp {temperature:.1f}C too cold — promotes fungal infection")
            water_ok = False
        elif temperature > 30:
            risks.append(f"Temp {temperature:.1f}C too hot — accelerates pathogen growth")
            water_ok = False
        else:
            risks.append(f"Temp {temperature:.1f}C within safe range")

    print("=" * 60)
    print("SMART AQUARIUM — FISH DIAGNOSIS REPORT")
    print("=" * 60)
    if fish_id:
        print(f"Fish ID      : #{fish_id}")
    print(f"Time         : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Severity     : {severity}  |  Confidence: {confidence:.1%}")
    print(f"Disease      : {disease.get('display_name', 'Unknown')}")
    print(f"Type         : {disease.get('disease_type', 'Unknown')}")
    print(f"Mortality    : {disease.get('mortality_risk', 'Unknown')}")
    print(f"Recovery     : {disease.get('recovery_time', 'Unknown')}")
    print(f"Contagious   : {'YES — isolate immediately' if disease.get('contagious') else 'No'}")
    print()

    if best and disease_class != 'HF Healthy Fish':
        print(f"Most Likely Pathogen:")
        print(f"  Name       : {best['pathogen_name']}")
        print(f"  Scientific : {best['scientific_name']}")
        print(f"  Type       : {best['pathogen_type']}")
        print(f"  Treatment  : {str(best['treatment'])[:120]}")
        print(f"  Note       : {str(best['notes'])[:120]}")
        print()

    if risks:
        print("Water Condition Analysis:")
        for r in risks:
            print(f"  {r}")
        print()

    print("Key Symptoms:")
    for s in str(disease.get('symptoms', 'None listed')).split(',')[:4]:
        print(f"  - {s.strip()}")
    print()

    if disease_class != 'HF Healthy Fish':
        print("Treatment Plan:")
        for step in str(disease.get('treatment_steps', '')).split('. ')[:6]:
            if step.strip():
                print(f"  {step.strip()}.")
    else:
        print("Prevention:")
        for tip in str(disease.get('prevention', '')).split('.')[:4]:
            if tip.strip():
                print(f"  - {tip.strip()}")
    print()

    if log_to_db:
        primary_path = best['pathogen_name'] if best else 'Unknown'
        conn.execute("""
            INSERT INTO diagnosis_log
            (timestamp, fish_id, disease_class, severity, confidence,
             pH, DO, temperature, primary_pathogen,
             diagnosis_text, treatment_plan, risk_factors, water_ok)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
              fish_id, disease_class, severity, confidence,
              pH, DO, temperature, primary_path,
              f"{disease.get('display_name', '')} — {severity}",
              str(disease.get('treatment_steps', ''))[:200],
              " | ".join(risks),
              1 if water_ok else 0))
        conn.commit()
        print("Diagnosis saved to database")

    conn.close()
    print("=" * 60)


print("\nScenario 1 — Parasitic Disease + Bad Water")
diagnose_fish(
    disease_class="PD Parasitic Disease",
    severity="Severe", confidence=0.89,
    pH=6.1, DO=2.8, temperature=19.0, fish_id=3
)

print("\nScenario 2 — Bacterial Disease + High Temperature")
diagnose_fish(
    disease_class="BD Bacterial Disease",
    severity="Moderate", confidence=0.74,
    pH=7.8, DO=4.2, temperature=31.0, fish_id=7
)

print("\nScenario 3 — Fungal Disease + Cold Water")
diagnose_fish(
    disease_class="FD Fungal Disease",
    severity="Mild", confidence=0.61,
    pH=6.8, DO=6.1, temperature=13.0, fish_id=2
)

print("\nScenario 4 — Healthy Fish + Good Water")
diagnose_fish(
    disease_class="HF Healthy Fish",
    severity="Mild", confidence=0.82,
    pH=7.2, DO=7.5, temperature=24.0, fish_id=1
)


conn = sqlite3.connect(DB_PATH)

fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle("Fish Disease Knowledge Base — Overview", fontsize=15, fontweight='bold')

df_p = pd.read_sql_query("""
    SELECT disease_class, COUNT(*) as count
    FROM pathogen_catalog GROUP BY disease_class
""", conn)
colors = ['#EF4444', '#F59E0B', '#3B82F6', '#22C55E']
bars = axes[0, 0].bar(
    df_p['disease_class'].str.replace(' Disease', '').str.replace(' Fish', ''),
    df_p['count'], color=colors, edgecolor='white'
)
axes[0, 0].set_title('Pathogens per Disease Class', fontweight='bold')
axes[0, 0].set_ylabel('Number of Pathogens')
for bar, val in zip(bars, df_p['count']):
    axes[0, 0].text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.05,
                    str(val), ha='center', fontweight='bold')
axes[0, 0].grid(axis='y', alpha=0.3)

df_t = pd.read_sql_query("""
    SELECT pathogen_type, COUNT(*) as count
    FROM pathogen_catalog GROUP BY pathogen_type
""", conn)
axes[0, 1].pie(df_t['count'], labels=df_t['pathogen_type'],
               autopct='%1.0f%%', colors=['#EF4444', '#F59E0B', '#3B82F6'],
               startangle=90, wedgeprops={'edgecolor': 'white', 'linewidth': 2})
axes[0, 1].set_title('Pathogen Type Distribution', fontweight='bold')

df_temp = pd.read_sql_query("""
    SELECT pathogen_name, optimal_temp_min, optimal_temp_max, disease_class
    FROM pathogen_catalog ORDER BY optimal_temp_min
""", conn)
color_map = {
    'BD Bacterial Disease': '#EF4444',
    'FD Fungal Disease':    '#F59E0B',
    'PD Parasitic Disease': '#3B82F6'
}
for _, row in df_temp.iterrows():
    col = color_map.get(row['disease_class'], '#94A3B8')
    axes[1, 0].barh(row['pathogen_name'],
                    row['optimal_temp_max'] - row['optimal_temp_min'],
                    left=row['optimal_temp_min'],
                    color=col, alpha=0.8, edgecolor='white', height=0.6)
axes[1, 0].axvline(24, color='green', linestyle='--', alpha=0.7, label='Optimal tank temp')
axes[1, 0].set_title('Optimal Temperature Range per Pathogen', fontweight='bold')
axes[1, 0].set_xlabel('Temperature (C)')
axes[1, 0].legend(fontsize=9)
axes[1, 0].grid(axis='x', alpha=0.3)

df_diag = pd.read_sql_query("""
    SELECT disease_class, severity, COUNT(*) as count
    FROM diagnosis_log GROUP BY disease_class, severity
""", conn)
if not df_diag.empty:
    sev_colors = {'Mild': '#22C55E', 'Moderate': '#F59E0B', 'Severe': '#EF4444'}
    for sev in ['Mild', 'Moderate', 'Severe']:
        sub = df_diag[df_diag['severity'] == sev]
        if not sub.empty:
            axes[1, 1].bar(sub['disease_class'].str.split().str[0],
                           sub['count'], label=sev,
                           color=sev_colors[sev], alpha=0.85, edgecolor='white')
    axes[1, 1].set_title('Diagnoses Logged by Class and Severity', fontweight='bold')
    axes[1, 1].set_ylabel('Count')
    axes[1, 1].legend()
    axes[1, 1].grid(axis='y', alpha=0.3)
else:
    axes[1, 1].text(0.5, 0.5, 'Diagnosis log\nwill populate\nas detections run',
                    ha='center', va='center', transform=axes[1, 1].transAxes,
                    fontsize=12, color='gray')
    axes[1, 1].set_title('Diagnoses Logged', fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(RESULTS_DIR, "knowledge_base_overview.png"), dpi=150, bbox_inches='tight')
plt.show()
conn.close()
print("Knowledge base visualization saved")


conn = sqlite3.connect(DB_PATH)

n_d    = conn.execute("SELECT COUNT(*) FROM disease_knowledge").fetchone()[0]
n_p    = conn.execute("SELECT COUNT(*) FROM pathogen_catalog").fetchone()[0]
n_diag = conn.execute("SELECT COUNT(*) FROM diagnosis_log").fetchone()[0]

print(f"\nKnowledge base size:")
print(f"  Diseases catalogued  : {n_d}")
print(f"  Pathogens catalogued : {n_p}")
print(f"  Diagnoses logged     : {n_diag}")

print("\nContagious diseases (require immediate isolation):")
rows = conn.execute("""
    SELECT display_name, mortality_risk, recovery_time
    FROM disease_knowledge WHERE contagious = 1
""").fetchall()
for name, mort, rec in rows:
    print(f"  {name:<25} Risk: {mort:<25} Recovery: {rec}")

print("\nPathogens that thrive in low dissolved oxygen:")
rows = conn.execute("""
    SELECT pathogen_name, scientific_name, disease_class
    FROM pathogen_catalog WHERE low_DO_risk = 1
""").fetchall()
for name, sci, dis in rows:
    print(f"  {name:<20} ({sci}) — {dis.split()[0]}")

if n_diag > 0:
    print("\nRecent diagnoses:")
    rows = conn.execute("""
        SELECT timestamp, fish_id, disease_class, severity,
               primary_pathogen, water_ok
        FROM diagnosis_log ORDER BY timestamp DESC LIMIT 10
    """).fetchall()
    for ts, fid, dis, sev, path, wok in rows:
        water_status = "OK" if wok else "BAD"
        print(f"  Fish#{fid} | {dis[:20]:<20} | {sev:<10} | {path:<20} | Water: {water_status}")

conn.close()
print(f"\nAll data queryable from: {DB_PATH}")
