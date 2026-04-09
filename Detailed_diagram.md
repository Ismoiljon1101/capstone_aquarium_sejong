graph TB

%% ══════════════════════════════════════════
%%  HARDWARE LAYER
%% ══════════════════════════════════════════

subgraph HW["🔌 HARDWARE LAYER — Sarvar"]
    direction TB

    subgraph TANK["Fish Tank"]
        PH["🧪 pH Sensor\nAnalog → A0"]
        DO2["💧 DO2 Sensor\nAnalog → A1"]
        CO2["🌫️ CO2 Sensor\nAnalog → A2"]
        TEMP["🌡️ Temp Sensor\nAnalog → A3"]
        CAM["📷 Camera\nOV2640 / ESP32-CAM"]
    end

    subgraph POWER["Power System"]
        BAT["🔋 12V 6000mAh Battery"]
        BUCK["⚡ LM2596HV\n12V → 5V Buck"]
        BAT --> BUCK
    end

    subgraph ARDUINO["Dual Arduino"]
        ARD1["Arduino MAIN\npH + DO2 + CO2"]
        ARD2["Arduino SECONDARY\nTemp + Relay Control"]
    end

    subgraph RELAY["4-Channel 5V Relay"]
        R1["CH1 — Feeder Motor"]
        R2["CH2 — Air Pump"]
        R3["CH3 — 12V LED Strip"]
        R4["CH4 — Reserved"]
    end

    PH --> ARD1
    DO2 --> ARD1
    CO2 --> ARD1
    TEMP --> ARD2
    BUCK --> ARD1
    BUCK --> ARD2
    ARD2 --> R1
    ARD2 --> R2
    ARD2 --> R3
    ARD2 --> R4
end

%% ══════════════════════════════════════════
%%  SERIAL BRIDGE
%% ══════════════════════════════════════════

subgraph SB["⚙️ SERIAL BRIDGE — Sarvar\nNode.js · services/serial-bridge"]
    PARSER["parser.ts\nRaw string → SensorReading"]
    MOCK["mock.ts\nFake data when no hardware"]
    EMITTER["emitter.ts\nPOST → NestJS /serial/reading"]
    PARSER --> EMITTER
    MOCK --> EMITTER
end

%% ══════════════════════════════════════════
%%  NESTJS BACKEND
%% ══════════════════════════════════════════

subgraph BE["🖥️ NESTJS BACKEND — Ismail\nTypeScript · services/backend · Port 3000"]
    direction TB

    SERIAL_MOD["serial.module\nReceives sensor POSTs"]
    SENSOR_MOD["sensors.module\nThreshold checks\nHistory queries"]
    ACT_MOD["actuators.module\nRelay commands\nEmergency off"]
    ALERT_MOD["alerts.module\nCreate · List · Acknowledge"]
    VISION_MOD["vision.module\nCalls FastAPI\nBuilds health report"]
    VOICE_MOD["voice.module\nBundles text+image+sensors\nCalls Ollama"]
    FISH_MOD["fish.module\nCount · Growth · Health"]
    CRON_MOD["cron.module\n24/7 Scheduler\n7 jobs"]
    GW["gateway.module\nSocket.IO Gateway\nReal-time push"]
    APP_MOD["app.module.ts\nRegisters all modules"]

    APP_MOD --> SERIAL_MOD
    APP_MOD --> SENSOR_MOD
    APP_MOD --> ACT_MOD
    APP_MOD --> ALERT_MOD
    APP_MOD --> VISION_MOD
    APP_MOD --> VOICE_MOD
    APP_MOD --> FISH_MOD
    APP_MOD --> CRON_MOD
    APP_MOD --> GW

    SERIAL_MOD --> SENSOR_MOD
    SERIAL_MOD --> GW
    SENSOR_MOD --> ALERT_MOD
    CRON_MOD --> SENSOR_MOD
    CRON_MOD --> VISION_MOD
    CRON_MOD --> ACT_MOD
    CRON_MOD --> FISH_MOD
    VISION_MOD --> FISH_MOD
    ALERT_MOD --> GW
    FISH_MOD --> GW
    ACT_MOD --> GW
end

%% ══════════════════════════════════════════
%%  DATABASE
%% ══════════════════════════════════════════

subgraph DB["🗄️ DATABASE — Maral\nPostgreSQL · Supabase Cloud"]
    direction LR
    T1[("sensor_reading")]
    T2[("camera_snapshot")]
    T3[("fish_count")]
    T4[("fish_growth")]
    T5[("health_report")]
    T6[("alert")]
    T7[("user_command")]
    T8[("voice_session")]
end

%% ══════════════════════════════════════════
%%  AI PREDICTOR
%% ══════════════════════════════════════════

subgraph AI["🧠 AI PREDICTOR — Firdavs\nFastAPI Python · Port 8000"]
    direction TB
    YOLO["YOLOv8/v11\nFish Disease Detection\nFish Counting"]
    CLSTM["ConvLSTM-VAE\nBehavior Anomaly Detection"]
    RF["Random Forest\nWater Quality Score"]
    OLLAMA["Ollama · LLM\nGemma / Veronica Brain"]
end

%% ══════════════════════════════════════════
%%  VOICE ASSISTANT
%% ══════════════════════════════════════════

subgraph VA["🎙️ VERONICA ASSISTANT — Firdavs\nPython · apps/assistant"]
    WW["openWakeWord\nListens for trigger phrase"]
    STT["Whisper.cpp\nSpeech → Text"]
    TTS["Kokoro-82M\nText → Speech output"]
    WW -->|activated| STT
    STT -->|transcribed text| VOICE_MOD
    VOICE_MOD -->|AI response text| TTS
end

%% ══════════════════════════════════════════
%%  DASHBOARD
%% ══════════════════════════════════════════

subgraph DASH["📱 NEXT.JS DASHBOARD — Hamidullo\nNext.js 15 · React 19 · apps/dashboard · Port 3001"]
    direction TB

    subgraph SCREENS["Screens"]
        S1["Dashboard\npH · Temp · DO2 · CO2 live"]
        S2["Fish Health\nDisease · Behavior · Score"]
        S3["Controls\nFeed · Pump · LED"]
        S4["History\n24h · 1w · 1m charts"]
        S5["Alerts\nFeed + Acknowledge"]
    end

    subgraph HOOKS["Hooks"]
        WSOCK["useSocket.ts\nSocket.IO client\nLive data"]
        UAPI["useApi.ts\nREST calls\nCommands"]
    end

    AUTH["NextAuth\nGoogle · Kakao · Email"]
    GAME["Fish Game 🎮\nCanvas arcade"]
    EXPORT["Export Utility\nCSV · JSON"]

    WSOCK --> S1
    WSOCK --> S2
    WSOCK --> S5
    UAPI --> S3
    UAPI --> S4
end

%% ══════════════════════════════════════════
%%  CRON JOBS DETAIL
%% ══════════════════════════════════════════

subgraph CRON["⏰ CRON JOBS — 24/7"]
    C1["Every 1 min\nCheck sensor thresholds"]
    C2["Every 5 min\nVision analysis + fish count"]
    C3["Every 8 hrs\nAuto feed trigger"]
    C4["Every 6am\nDaily health report"]
    C5["Every 7am\nFish growth monitor"]
    C6["Every 30 min\nEmergency safety check"]
    C7["Every Sunday\nWeekly JSONL export"]
end

%% ══════════════════════════════════════════
%%  CONNECTIONS BETWEEN LAYERS
%% ══════════════════════════════════════════

%% Hardware → Serial Bridge
ARD1 -->|"USB Serial\npH:7.1,DO2:7.8,CO2:0.04"| PARSER
ARD2 -->|"USB Serial\nTEMP:26.4"| PARSER
CAM -->|HTTP snapshot| SB

%% Serial Bridge → Backend
EMITTER -->|"POST /serial/reading\nSensorReading JSON"| SERIAL_MOD

%% Backend → Serial Bridge (commands back)
ACT_MOD -->|"POST /actuator/trigger\nrelay + state"| EMITTER

%% Backend → Database
SENSOR_MOD -->|TypeORM| T1
VISION_MOD -->|TypeORM| T2
FISH_MOD -->|TypeORM| T3
FISH_MOD -->|TypeORM| T4
FISH_MOD -->|TypeORM| T5
ALERT_MOD -->|TypeORM| T6
ACT_MOD -->|TypeORM| T7
VOICE_MOD -->|TypeORM| T8

%% Backend → AI
VISION_MOD -->|"POST /predict/disease\nimage"| YOLO
VISION_MOD -->|"POST /predict/count\nimage"| YOLO
VISION_MOD -->|"POST /predict/behavior\nimage"| CLSTM
VISION_MOD -->|"POST /predict/quality\npH,temp,DO2,CO2"| RF
VOICE_MOD -->|"POST /api/chat\ntext+image+sensors"| OLLAMA

%% Backend → Dashboard (WebSocket)
GW -->|"sensor:update"| WSOCK
GW -->|"alert:new"| WSOCK
GW -->|"fish:count"| WSOCK
GW -->|"actuator:state"| WSOCK
GW -->|"health:report"| WSOCK

%% Dashboard → Backend (REST)
UAPI -->|"POST /actuators/feed"| ACT_MOD
UAPI -->|"POST /actuators/pump"| ACT_MOD
UAPI -->|"POST /actuators/led"| ACT_MOD
UAPI -->|"GET /sensors/:id/readings"| SENSOR_MOD
UAPI -->|"GET /alerts/active"| ALERT_MOD
UAPI -->|"GET /fish/health"| FISH_MOD

%% Cron → Backend Modules
C1 --> SENSOR_MOD
C2 --> VISION_MOD
C3 --> ACT_MOD
C4 --> FISH_MOD
C5 --> FISH_MOD
C6 --> ALERT_MOD
C7 --> EXPORT

CRON_MOD --> C1
CRON_MOD --> C2
CRON_MOD --> C3
CRON_MOD --> C4
CRON_MOD --> C5
CRON_MOD --> C6
CRON_MOD --> C7

%% ══════════════════════════════════════════
%%  STYLES
%% ══════════════════════════════════════════

classDef hardware fill:#0d2820,stroke:#00e676,color:#00e676
classDef bridge fill:#0d2020,stroke:#1de9b6,color:#1de9b6
classDef backend fill:#0d1a30,stroke:#2979ff,color:#2979ff
classDef database fill:#1a1030,stroke:#7c4dff,color:#c3b1e1
classDef ai fill:#1a0d28,stroke:#d500f9,color:#d500f9
classDef voice fill:#1a0d20,stroke:#e040fb,color:#e040fb
classDef dashboard fill:#201800,stroke:#ffab00,color:#ffab00
classDef cron fill:#1a0a0a,stroke:#ff4081,color:#ff4081

class PH,DO2,CO2,TEMP,CAM,BAT,BUCK,ARD1,ARD2,R1,R2,R3,R4 hardware
class PARSER,MOCK,EMITTER bridge
class SERIAL_MOD,SENSOR_MOD,ACT_MOD,ALERT_MOD,VISION_MOD,VOICE_MOD,FISH_MOD,CRON_MOD,GW,APP_MOD backend
class T1,T2,T3,T4,T5,T6,T7,T8 database
class YOLO,CLSTM,RF,OLLAMA ai
class WW,STT,TTS voice
class S1,S2,S3,S4,S5,WSOCK,UAPI,AUTH,GAME,EXPORT dashboard
class C1,C2,C3,C4,C5,C6,C7 cron
