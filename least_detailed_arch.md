graph TB

subgraph HARDWARE["🔌 Hardware — Sarvar"]
    HW["Dual Arduino\n+ ESP32-CAM\n+ Sensors + Relays"]
end

subgraph BRIDGE["⚙️ Serial Bridge — Sarvar"]
    SB["Node.js\nUSB Serial → HTTP"]
end

subgraph BACKEND["🖥️ Backend — Ismail"]
    BE["NestJS · TypeScript\nREST · WebSocket · Cron"]
end

subgraph DATABASE["🗄️ Database — Maral"]
    DB[("PostgreSQL\nSupabase Cloud")]
end

subgraph AI["🧠 AI Services — Firdavs"]
    direction LR
    FP["FastAPI · Python\nYOLO · ConvLSTM · Random Forest"]
    OL["Ollama\nGemma LLM"]
end

subgraph VOICE["🎙️ Voice Assistant — Firdavs"]
    VA["Python Desktop App\nopenWakeWord → Whisper.cpp → Kokoro-82M"]
end

subgraph CLIENTS["📱 Client Apps — Hamidullo"]
    direction LR
    WEB["Web Dashboard\nNext.js 15 · React 19\nTailwind · Socket.IO"]
    MOB["Mobile App\nReact Native\nSocket.IO"]
end

%% Connections
HW -->|USB Serial| SB
SB -->|POST /serial/reading| BE
BE -->|Relay Commands| SB

BE -->|TypeORM| DB
BE -->|HTTP /predict| FP
BE -->|HTTP /api/chat| OL
VA -->|POST /voice/query| BE

BE -->|WebSocket| WEB
BE -->|WebSocket| MOB
WEB -->|REST| BE
MOB -->|REST| BE

%% Styles
classDef hw fill:#0d2820,stroke:#00e676,color:#00e676
classDef br fill:#0d2020,stroke:#1de9b6,color:#1de9b6
classDef be fill:#0d1a30,stroke:#2979ff,color:#2979ff
classDef db fill:#1a1030,stroke:#7c4dff,color:#c3b1e1
classDef ai fill:#1a0d28,stroke:#d500f9,color:#d500f9
classDef va fill:#1a0d20,stroke:#e040fb,color:#e040fb
classDef cl fill:#201800,stroke:#ffab00,color:#ffab00

class HW hw
class SB br
class BE be
class DB db
class FP,OL ai
class VA va
class WEB,MOB cl
