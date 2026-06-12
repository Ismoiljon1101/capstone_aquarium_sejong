// Fishlinic Smart Aquaculture Capstone — Presentation builder
// Ocean Gradient + premium dark sandwich design

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const path = require("path");

// Global module path workaround for Windows global installs
process.env.NODE_PATH = "C:\\Users\\ismoi\\AppData\\Roaming\\npm\\node_modules";
require("module").Module._initPaths();

const Fa = require("react-icons/fa");
const Md = require("react-icons/md");
const Hi = require("react-icons/hi");
const Bi = require("react-icons/bi");
const Tb = require("react-icons/tb");

// ─── Color Palette (Ocean Gradient + extras) ─────────────────────────────────
const COLOR = {
  bgDark:    "020617",    // near-black slate
  bgPanel:   "0F172A",    // card bg
  bgLight:   "F8FAFC",    // light content slide bg
  navy:      "065A82",    // deep blue
  teal:      "1C7293",    // teal
  midnight:  "21295C",    // accent
  cyan:      "06B6D4",    // bright accent
  cyanGlow:  "22D3EE",
  white:     "FFFFFF",
  text:      "0F172A",    // body text on light bg
  textMute:  "475569",    // muted body
  textInv:   "E2E8F0",    // body text on dark bg
  textInvMute: "94A3B8",
  border:    "E2E8F0",    // light border
  borderDark:"1E293B",    // dark card border
  emerald:   "10B981",
  amber:     "F59E0B",
  rose:      "F43F5E",
};

const FONT_HEADER = "Calibri";
const FONT_BODY = "Calibri";

// ─── Icon → base64 PNG helper ────────────────────────────────────────────────
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}
async function icon(IconComponent, color = "#06B6D4", size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// ─── Reusable shadow factories ───────────────────────────────────────────────
const cardShadow = () => ({ type: "outer", blur: 18, offset: 4, angle: 90, color: "000000", opacity: 0.25 });
const softShadow = () => ({ type: "outer", blur: 12, offset: 3, angle: 90, color: "000000", opacity: 0.18 });

// ─── MAIN ────────────────────────────────────────────────────────────────────
(async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";  // 13.3 × 7.5
  pres.title = "Fishlinic — Smart Aquaculture System";
  pres.author = "Team Fishlinic · Sejong University";
  pres.company = "Sejong University Capstone 2026";

  const W = 13.333, H = 7.5;

  // Pre-render icons we'll reuse
  const ICONS = {
    fish:        await icon(Fa.FaFish, "#22D3EE"),
    fishLight:   await icon(Fa.FaFish, "#0F172A"),
    brain:       await icon(Fa.FaBrain, "#22D3EE"),
    brainLight:  await icon(Fa.FaBrain, "#21295C"),
    chip:        await icon(Fa.FaMicrochip, "#22D3EE"),
    chipLight:   await icon(Fa.FaMicrochip, "#21295C"),
    bolt:        await icon(Fa.FaBolt, "#F59E0B"),
    code:        await icon(Fa.FaCode, "#22D3EE"),
    codeLight:   await icon(Fa.FaCode, "#21295C"),
    mobile:      await icon(Fa.FaMobileAlt, "#22D3EE"),
    mobileLight: await icon(Fa.FaMobileAlt, "#21295C"),
    desktop:     await icon(Fa.FaDesktop, "#22D3EE"),
    server:      await icon(Fa.FaServer, "#22D3EE"),
    serverLight: await icon(Fa.FaServer, "#21295C"),
    network:     await icon(Fa.FaNetworkWired, "#22D3EE"),
    db:          await icon(Fa.FaDatabase, "#22D3EE"),
    dbLight:     await icon(Fa.FaDatabase, "#21295C"),
    flask:       await icon(Fa.FaFlask, "#22D3EE"),
    eye:         await icon(Fa.FaEye, "#22D3EE"),
    eyeLight:    await icon(Fa.FaEye, "#21295C"),
    cam:         await icon(Fa.FaCamera, "#22D3EE"),
    mic:         await icon(Fa.FaMicrophone, "#22D3EE"),
    micLight:    await icon(Fa.FaMicrophone, "#21295C"),
    bell:        await icon(Fa.FaBell, "#22D3EE"),
    cloud:       await icon(Fa.FaCloud, "#22D3EE"),
    rocket:      await icon(Fa.FaRocket, "#22D3EE"),
    shield:      await icon(Fa.FaShieldAlt, "#10B981"),
    chart:       await icon(Fa.FaChartLine, "#22D3EE"),
    chartLight:  await icon(Fa.FaChartLine, "#21295C"),
    clock:       await icon(Fa.FaClock, "#22D3EE"),
    cog:         await icon(Fa.FaCog, "#22D3EE"),
    cogLight:    await icon(Fa.FaCog, "#21295C"),
    react:       await icon(Fa.FaReact, "#22D3EE"),
    nodejs:      await icon(Fa.FaNodeJs, "#10B981"),
    python:      await icon(Fa.FaPython, "#F59E0B"),
    github:      await icon(Fa.FaGithub, "#FFFFFF"),
    user:        await icon(Fa.FaUserCircle, "#22D3EE"),
    users:       await icon(Fa.FaUsers, "#22D3EE"),
    lightbulb:   await icon(Fa.FaLightbulb, "#F59E0B"),
    check:       await icon(Fa.FaCheckCircle, "#10B981"),
    droplet:     await icon(Md.MdWaterDrop, "#22D3EE"),
    dropletLight:await icon(Md.MdWaterDrop, "#21295C"),
    therm:       await icon(Tb.TbTemperature, "#F59E0B"),
    thermLight:  await icon(Tb.TbTemperature, "#21295C"),
    o2:          await icon(Tb.TbAtom2, "#10B981"),
    o2Light:     await icon(Tb.TbAtom2, "#21295C"),
    sparkle:     await icon(Hi.HiSparkles, "#22D3EE"),
    sparkleAmber:await icon(Hi.HiSparkles, "#F59E0B"),
    layer:       await icon(Bi.BiLayer, "#22D3EE"),
    arrow:       await icon(Fa.FaArrowRight, "#22D3EE"),
    lock:        await icon(Fa.FaLock, "#10B981"),
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 1 — Hero / Title (Dark)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgDark };

    // Decorative gradient blobs
    s.addShape(pres.shapes.OVAL, {
      x: -3, y: -3, w: 8, h: 8, fill: { color: COLOR.navy, transparency: 60 }, line: { color: COLOR.navy, transparency: 100 }
    });
    s.addShape(pres.shapes.OVAL, {
      x: 9, y: 4, w: 9, h: 9, fill: { color: COLOR.teal, transparency: 70 }, line: { color: COLOR.teal, transparency: 100 }
    });
    s.addShape(pres.shapes.OVAL, {
      x: 5, y: 1, w: 4, h: 4, fill: { color: COLOR.cyan, transparency: 80 }, line: { color: COLOR.cyan, transparency: 100 }
    });

    // Brand chip
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.7, y: 0.7, w: 2.5, h: 0.5, fill: { color: COLOR.cyan, transparency: 80 }, line: { color: COLOR.cyan, transparency: 50 }, rectRadius: 0.05
    });
    s.addImage({ data: ICONS.fish, x: 0.85, y: 0.78, w: 0.34, h: 0.34 });
    s.addText("FISHLINIC · CAPSTONE 2026", {
      x: 1.25, y: 0.7, w: 1.95, h: 0.5, fontSize: 11, bold: true, color: COLOR.cyanGlow, fontFace: FONT_HEADER, valign: "middle", charSpacing: 4
    });

    // Main title
    s.addText("Smart Aquaculture", {
      x: 0.7, y: 2.0, w: 12, h: 1.4, fontSize: 80, bold: true, color: COLOR.white, fontFace: FONT_HEADER, valign: "middle", margin: 0
    });
    s.addText([
      { text: "powered by ", options: { color: COLOR.textInvMute } },
      { text: "AI ", options: { color: COLOR.cyanGlow, bold: true } },
      { text: "·" , options: { color: COLOR.textInvMute } },
      { text: " Computer Vision ", options: { color: COLOR.cyanGlow, bold: true } },
      { text: "·", options: { color: COLOR.textInvMute } },
      { text: " IoT", options: { color: COLOR.cyanGlow, bold: true } },
    ], {
      x: 0.7, y: 3.3, w: 12, h: 0.8, fontSize: 30, italic: true, fontFace: FONT_HEADER, valign: "middle", margin: 0
    });

    // Subtitle
    s.addText("An autonomous tank that monitors itself, diagnoses fish health,\ncontrols hardware, and explains everything in plain English.", {
      x: 0.7, y: 4.3, w: 12, h: 1.0, fontSize: 18, color: COLOR.textInv, fontFace: FONT_BODY, valign: "top", margin: 0
    });

    // Stat row
    const stats = [
      { num: "9", label: "MODULES" },
      { num: "5", label: "AI MODELS" },
      { num: "3", label: "CLIENTS" },
      { num: "60s", label: "SCHEDULER TICK" },
    ];
    stats.forEach((st, i) => {
      const sx = 0.7 + i * 3.0;
      s.addText(st.num, {
        x: sx, y: 5.6, w: 2.6, h: 0.7, fontSize: 44, bold: true, color: COLOR.cyanGlow, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(st.label, {
        x: sx, y: 6.3, w: 2.6, h: 0.3, fontSize: 10, bold: true, color: COLOR.textInvMute, charSpacing: 4, fontFace: FONT_BODY, margin: 0
      });
    });

    // Footer
    s.addShape(pres.shapes.LINE, { x: 0.7, y: 7.0, w: 12, h: 0, line: { color: COLOR.borderDark, width: 1 } });
    s.addText("Sejong University · Computer Engineering · 2026", {
      x: 0.7, y: 7.05, w: 6, h: 0.35, fontSize: 11, color: COLOR.textInvMute, fontFace: FONT_BODY, margin: 0
    });
    s.addText("Team Fishlinic — 4 engineers", {
      x: 6.7, y: 7.05, w: 6, h: 0.35, fontSize: 11, color: COLOR.textInvMute, align: "right", fontFace: FONT_BODY, margin: 0
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 2 — The Problem (Light)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgLight };

    // Eyebrow + title
    s.addText("THE PROBLEM", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyan, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("Aquaculture is a $300B industry — \nstill run with thermometers and gut feel.", {
      x: 0.7, y: 1.0, w: 12, h: 1.6, fontSize: 38, bold: true, color: COLOR.text, fontFace: FONT_HEADER, margin: 0
    });

    // Three problem columns
    const problems = [
      {
        icon: ICONS.dropletLight,
        title: "Manual water testing",
        body: "Hobbyists test pH, DO₂, temperature 1–2× per week with strips. Fish die from chemistry shifts that happen in hours."
      },
      {
        icon: ICONS.eyeLight,
        title: "Disease caught too late",
        body: "Visible symptoms mean disease has spread for days. Without continuous monitoring there is no early warning."
      },
      {
        icon: ICONS.cogLight,
        title: "No automation",
        body: "Feeders run on dumb timers. Lights ignore sensors. Pump on/off is manual. The system can't react to its own state."
      },
    ];
    problems.forEach((p, i) => {
      const cx = 0.7 + i * 4.2;
      // card bg
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 3.3, w: 3.9, h: 3.5, fill: { color: COLOR.white }, line: { color: COLOR.border, width: 1 }, shadow: softShadow()
      });
      // accent strip
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 3.3, w: 0.08, h: 3.5, fill: { color: COLOR.cyan }, line: { color: COLOR.cyan, transparency: 100 }
      });
      // icon circle
      s.addShape(pres.shapes.OVAL, {
        x: cx + 0.4, y: 3.6, w: 0.7, h: 0.7, fill: { color: "E0F7FA" }, line: { color: "E0F7FA", transparency: 100 }
      });
      s.addImage({ data: p.icon, x: cx + 0.55, y: 3.75, w: 0.4, h: 0.4 });
      // title
      s.addText(p.title, {
        x: cx + 0.4, y: 4.5, w: 3.4, h: 0.5, fontSize: 18, bold: true, color: COLOR.text, fontFace: FONT_HEADER, margin: 0
      });
      // body
      s.addText(p.body, {
        x: cx + 0.4, y: 5.05, w: 3.4, h: 1.6, fontSize: 13, color: COLOR.textMute, fontFace: FONT_BODY, valign: "top", margin: 0
      });
    });

    // Bottom callout bar
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.7, y: 7.0, w: 12, h: 0.4, fill: { color: COLOR.bgDark }, line: { color: COLOR.bgDark, transparency: 100 }, rectRadius: 0.05
    });
    s.addText("→  We built the system that does all three. Continuously. Autonomously. Explainably.", {
      x: 0.9, y: 7.0, w: 11.8, h: 0.4, fontSize: 13, italic: true, color: COLOR.cyanGlow, fontFace: FONT_BODY, valign: "middle", margin: 0
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 3 — Solution Overview (Dark)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgDark };

    s.addText("THE SOLUTION", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyanGlow, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("Fishlinic — one connected stack from sensor to AI", {
      x: 0.7, y: 1.0, w: 12, h: 0.9, fontSize: 34, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
    });

    // 4 pillar cards
    const pillars = [
      { icon: ICONS.chip, title: "SENSE",     body: "Arduino sensors stream pH, temperature, dissolved O₂, CO₂ at 1 Hz over USB serial. Mock mode keeps demos working without hardware." },
      { icon: ICONS.brain, title: "REASON",    body: "Veronica — local LLM agent (Ollama + qwen2.5:3b) with tool-calling. Reads sensors, controls hardware, explains decisions." },
      { icon: ICONS.eye,   title: "SEE",       body: "YOLOv11 disease detector + counting model + ConvLSTM-VAE behavior anomaly detector run continuously on the camera feed." },
      { icon: ICONS.cog,   title: "ACT",       body: "Relay-driven feeder, air pump, LED strip. Cron-style scheduler orchestrates feed times, lighting cycles, and emergency overrides." },
    ];
    pillars.forEach((p, i) => {
      const cx = 0.7 + i * 3.15;
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 2.3, w: 2.95, h: 4.5, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }, shadow: cardShadow()
      });
      // top accent
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 2.3, w: 2.95, h: 0.06, fill: { color: COLOR.cyan }, line: { color: COLOR.cyan, transparency: 100 }
      });
      // icon
      s.addShape(pres.shapes.OVAL, {
        x: cx + 0.4, y: 2.65, w: 1.0, h: 1.0, fill: { color: COLOR.navy, transparency: 30 }, line: { color: COLOR.cyan, width: 1 }
      });
      s.addImage({ data: p.icon, x: cx + 0.65, y: 2.9, w: 0.5, h: 0.5 });
      s.addText(p.title, {
        x: cx + 0.4, y: 3.85, w: 2.5, h: 0.4, fontSize: 11, bold: true, color: COLOR.cyanGlow, charSpacing: 4, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(p.body, {
        x: cx + 0.4, y: 4.25, w: 2.4, h: 2.4, fontSize: 12, color: COLOR.textInv, fontFace: FONT_BODY, valign: "top", margin: 0
      });
    });

    // Bottom strip
    s.addText("All four pillars feed each other.  Reason → Act loop closes the system.", {
      x: 0.7, y: 7.05, w: 12, h: 0.35, fontSize: 13, italic: true, color: COLOR.textInvMute, align: "center", fontFace: FONT_BODY, margin: 0
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 4 — System Architecture (Light)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgLight };

    s.addText("ARCHITECTURE", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyan, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("Five services. One source of truth.", {
      x: 0.7, y: 1.0, w: 12, h: 0.7, fontSize: 32, bold: true, color: COLOR.text, fontFace: FONT_HEADER, margin: 0
    });

    // Architecture diagram — top row hardware
    const diagram = (x, y, w, h, color, fillColor, title, sub) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w, h, fill: { color: fillColor }, line: { color, width: 2 }, shadow: softShadow()
      });
      s.addText(title, {
        x: x + 0.1, y: y + 0.08, w: w - 0.2, h: 0.4, fontSize: 13, bold: true, color: COLOR.text, fontFace: FONT_HEADER, valign: "middle", align: "center", margin: 0
      });
      s.addText(sub, {
        x: x + 0.1, y: y + 0.5, w: w - 0.2, h: h - 0.55, fontSize: 10, color: COLOR.textMute, align: "center", fontFace: FONT_BODY, valign: "top", margin: 0
      });
    };

    // Layer 1: Hardware
    diagram(0.7, 2.0, 3.0, 0.9, COLOR.amber, "FFF7ED", "Arduino · Main", "pH · DO₂ · CO₂");
    diagram(3.9, 2.0, 3.0, 0.9, COLOR.amber, "FFF7ED", "Arduino · Secondary", "Temp · Relays");
    diagram(7.1, 2.0, 3.0, 0.9, COLOR.amber, "FFF7ED", "USB Camera", "1080p · YOLO feed");
    diagram(10.3, 2.0, 2.4, 0.9, COLOR.amber, "FFF7ED", "Hardware actuators", "Feeder · Pump · LED");

    // Layer 2: Bridge
    diagram(2.0, 3.2, 4.5, 0.85, COLOR.cyan, "ECFEFF", "Serial Bridge :3001 (Node.js)", "USB JSON → REST · MOCK_MODE fallback");
    diagram(7.3, 3.2, 4.5, 0.85, COLOR.cyan, "ECFEFF", "AI Predictor :8001 (FastAPI)", "YOLOv11 · ConvLSTM-VAE · Random Forest");

    // Layer 3: Backend
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y: 4.4, w: 12, h: 1.1, fill: { color: COLOR.bgDark }, line: { color: COLOR.bgDark, transparency: 100 }, shadow: cardShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y: 4.4, w: 0.1, h: 1.1, fill: { color: COLOR.cyan }, line: { color: COLOR.cyan, transparency: 100 }
    });
    s.addText("NestJS Backend  ·  :3000", {
      x: 1.0, y: 4.5, w: 11.5, h: 0.4, fontSize: 16, bold: true, color: COLOR.white, fontFace: FONT_HEADER, valign: "middle", margin: 0
    });
    s.addText("9 modules: sensors · alerts · actuators · vision · voice · fish · cron · gateway · management", {
      x: 1.0, y: 4.9, w: 11.5, h: 0.3, fontSize: 11, color: COLOR.textInvMute, fontFace: FONT_BODY, margin: 0
    });
    s.addText("REST + Socket.IO · TypeORM (SQLite/Postgres) · Cron tick @60s", {
      x: 1.0, y: 5.18, w: 11.5, h: 0.3, fontSize: 11, italic: true, color: COLOR.cyanGlow, fontFace: FONT_BODY, margin: 0
    });

    // Layer 4: Clients
    diagram(1.5, 5.85, 3.2, 0.85, COLOR.teal, "F0F9FF", "Mobile App", "Expo SDK 54 · iOS / Android / Web");
    diagram(5.05, 5.85, 3.2, 0.85, COLOR.teal, "F0F9FF", "Dashboard", "Next.js 16 · React 19 · NextAuth");
    diagram(8.6, 5.85, 3.2, 0.85, COLOR.teal, "F0F9FF", "Veronica LLM", "Ollama :11434 · qwen2.5:3b");

    // Connecting lines (vertical)
    [2.2, 5.4, 8.6, 11.5].forEach(x => s.addShape(pres.shapes.LINE, {
      x, y: 2.9, w: 0, h: 0.3, line: { color: COLOR.cyan, width: 1.5 }
    }));
    s.addShape(pres.shapes.LINE, { x: 4.25, y: 4.05, w: 0, h: 0.35, line: { color: COLOR.cyan, width: 1.5 } });
    s.addShape(pres.shapes.LINE, { x: 9.55, y: 4.05, w: 0, h: 0.35, line: { color: COLOR.cyan, width: 1.5 } });
    [3.1, 6.65, 10.2].forEach(x => s.addShape(pres.shapes.LINE, {
      x, y: 5.5, w: 0, h: 0.35, line: { color: COLOR.cyan, width: 1.5 }
    }));

    // Footer
    s.addText("Slide 4 of 16   ·   Architecture", {
      x: 0.7, y: 7.05, w: 12, h: 0.3, fontSize: 9, color: COLOR.textMute, fontFace: FONT_BODY, margin: 0
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 5 — Tech Stack (Dark)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgDark };

    s.addText("TECH STACK", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyanGlow, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("Production-grade tooling, end to end.", {
      x: 0.7, y: 1.0, w: 12, h: 0.7, fontSize: 32, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
    });

    // 2×3 grid of tech cards
    const tech = [
      { icon: ICONS.nodejs, title: "Backend",      stack: "NestJS · TypeScript\nTypeORM · Socket.IO\nClass-validator" },
      { icon: ICONS.react,  title: "Mobile",       stack: "Expo SDK 54 · RN 0.81\nReact 19 · React Native\nKeyboard Controller" },
      { icon: ICONS.react,  title: "Dashboard",    stack: "Next.js 16 · React 19\nTailwind · NextAuth\nServer Components" },
      { icon: ICONS.python, title: "AI Pipeline",  stack: "FastAPI · PyTorch\nUltralytics · scikit-learn\nOpenCV" },
      { icon: ICONS.brain,  title: "LLM Agent",    stack: "Ollama · qwen2.5:3b\nTool-calling protocol\nLocal inference" },
      { icon: ICONS.db,     title: "Storage",      stack: "PostgreSQL (prod)\nSQLite (dev)\nbetter-sqlite3 driver" },
    ];

    const gridX = 0.7, gridY = 2.0, cardW = 3.95, cardH = 2.3, gapX = 0.13, gapY = 0.2;
    tech.forEach((t, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = gridX + col * (cardW + gapX);
      const y = gridY + row * (cardH + gapY);

      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: cardW, h: cardH, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }, shadow: cardShadow()
      });
      // left accent
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 0.08, h: cardH, fill: { color: COLOR.cyan }, line: { color: COLOR.cyan, transparency: 100 }
      });
      // icon
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.3, y: y + 0.3, w: 0.7, h: 0.7, fill: { color: COLOR.navy, transparency: 50 }, line: { color: COLOR.cyan, width: 1 }
      });
      s.addImage({ data: t.icon, x: x + 0.45, y: y + 0.45, w: 0.4, h: 0.4 });
      // title
      s.addText(t.title, {
        x: x + 1.15, y: y + 0.3, w: cardW - 1.3, h: 0.45, fontSize: 17, bold: true, color: COLOR.white, fontFace: FONT_HEADER, valign: "middle", margin: 0
      });
      // stack
      s.addText(t.stack, {
        x: x + 0.3, y: y + 1.15, w: cardW - 0.5, h: cardH - 1.25, fontSize: 12, color: COLOR.textInvMute, fontFace: FONT_BODY, valign: "top", margin: 0
      });
    });

    s.addText("Monorepo: pnpm workspaces · 3 apps + 3 services + shared types · 50k+ LOC TypeScript", {
      x: 0.7, y: 7.0, w: 12, h: 0.4, fontSize: 12, italic: true, color: COLOR.cyanGlow, align: "center", fontFace: FONT_BODY, margin: 0
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 6 — Veronica Agent (Light) — Star feature
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgLight };

    s.addText("FLAGSHIP FEATURE", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyan, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText([
      { text: "Meet ", options: { color: COLOR.text } },
      { text: "Veronica", options: { color: COLOR.cyan, italic: true } },
      { text: " —", options: { color: COLOR.text } },
    ], {
      x: 0.7, y: 1.0, w: 12, h: 0.8, fontSize: 38, bold: true, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("the AI agent that actually runs the tank.", {
      x: 0.7, y: 1.7, w: 12, h: 0.6, fontSize: 24, color: COLOR.textMute, fontFace: FONT_HEADER, italic: true, margin: 0
    });

    // Left side: capabilities
    const caps = [
      { icon: ICONS.brainLight,    title: "Local LLM",         body: "Runs entirely on-device via Ollama. No cloud, no API fees, no privacy concerns." },
      { icon: ICONS.cogLight,      title: "Tool-calling",      body: "Reads sensors, controls hardware, queries history. 6 tools wired into the agent loop." },
      { icon: ICONS.shield,        title: "Confirm-before-act",body: "User mode requires confirmation. Auto mode lets Veronica respond to emergencies alone." },
      { icon: ICONS.chartLight,    title: "Sessioned chat",    body: "Persists every conversation. Restores context across app reopens." },
    ];
    caps.forEach((c, i) => {
      const y = 2.7 + i * 1.05;
      s.addShape(pres.shapes.OVAL, {
        x: 0.7, y, w: 0.7, h: 0.7, fill: { color: "E0F7FA" }, line: { color: "E0F7FA", transparency: 100 }
      });
      s.addImage({ data: c.icon, x: 0.85, y: y + 0.15, w: 0.4, h: 0.4 });
      s.addText(c.title, {
        x: 1.55, y, w: 5.5, h: 0.4, fontSize: 16, bold: true, color: COLOR.text, fontFace: FONT_HEADER, valign: "middle", margin: 0
      });
      s.addText(c.body, {
        x: 1.55, y: y + 0.4, w: 5.5, h: 0.55, fontSize: 12, color: COLOR.textMute, fontFace: FONT_BODY, valign: "top", margin: 0
      });
    });

    // Right side: chat mockup
    const chatX = 7.7, chatY = 2.7, chatW = 5.0, chatH = 4.4;
    s.addShape(pres.shapes.RECTANGLE, {
      x: chatX, y: chatY, w: chatW, h: chatH, fill: { color: COLOR.bgDark }, line: { color: COLOR.borderDark, width: 1 }, shadow: cardShadow()
    });
    // chat header
    s.addShape(pres.shapes.RECTANGLE, {
      x: chatX, y: chatY, w: chatW, h: 0.6, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, transparency: 100 }
    });
    s.addImage({ data: ICONS.fish, x: chatX + 0.2, y: chatY + 0.13, w: 0.35, h: 0.35 });
    s.addText("Veronica · LIVE", {
      x: chatX + 0.65, y: chatY + 0.1, w: 3, h: 0.4, fontSize: 12, bold: true, color: COLOR.white, fontFace: FONT_HEADER, valign: "middle", margin: 0
    });
    s.addShape(pres.shapes.OVAL, {
      x: chatX + 4.5, y: chatY + 0.22, w: 0.18, h: 0.18, fill: { color: COLOR.emerald }, line: { color: COLOR.emerald, transparency: 100 }
    });
    // user msg
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: chatX + 1.5, y: chatY + 0.85, w: 3.3, h: 0.55, fill: { color: COLOR.navy }, line: { color: COLOR.navy, transparency: 100 }, rectRadius: 0.08
    });
    s.addText("How are my fish today?", {
      x: chatX + 1.6, y: chatY + 0.85, w: 3.1, h: 0.55, fontSize: 11, color: COLOR.white, fontFace: FONT_BODY, valign: "middle", margin: 0
    });
    // veronica msg
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: chatX + 0.2, y: chatY + 1.6, w: 4.0, h: 1.2, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, transparency: 100 }, rectRadius: 0.08
    });
    s.addText("pH 7.1, temp 26°C, DO 7.4 mg/L — all healthy. Vision detected 12 active fish, no stress signs. Last feeding 3h ago.", {
      x: chatX + 0.3, y: chatY + 1.65, w: 3.8, h: 1.1, fontSize: 11, color: COLOR.textInv, fontFace: FONT_BODY, valign: "top", margin: 0
    });
    // user msg 2
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: chatX + 1.5, y: chatY + 3.0, w: 3.3, h: 0.55, fill: { color: COLOR.navy }, line: { color: COLOR.navy, transparency: 100 }, rectRadius: 0.08
    });
    s.addText("Turn on the LED.", {
      x: chatX + 1.6, y: chatY + 3.0, w: 3.1, h: 0.55, fontSize: 11, color: COLOR.white, fontFace: FONT_BODY, valign: "middle", margin: 0
    });
    // confirm card
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: chatX + 0.2, y: chatY + 3.7, w: 4.6, h: 0.55, fill: { color: COLOR.cyan, transparency: 80 }, line: { color: COLOR.cyan, width: 1 }, rectRadius: 0.05
    });
    s.addText("⚡  ACTION:  Turn LED ON.  [Cancel] [Confirm]", {
      x: chatX + 0.3, y: chatY + 3.72, w: 4.4, h: 0.5, fontSize: 10, bold: true, color: COLOR.cyanGlow, fontFace: FONT_BODY, valign: "middle", margin: 0
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 7 — Computer Vision (Dark)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgDark };

    s.addText("COMPUTER VISION", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyanGlow, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("Three models. One camera feed.", {
      x: 0.7, y: 1.0, w: 12, h: 0.7, fontSize: 32, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
    });

    // 3 model cards horizontal
    const models = [
      {
        title: "YOLOv11 · DISEASE",
        file: "yolo_disease.pt",
        body: "Trained on a curated set of fungal infection, fin rot, ich, and ulcer images. Runs every camera tick when fish are visible. Bounding boxes + confidence per disease class.",
        stat: "8 classes",
        statLabel: "PATHOLOGIES"
      },
      {
        title: "YOLOv11 · COUNT",
        file: "yolo_count.pt",
        body: "Counts active fish per frame. Drives the population badge in the UI and detects population drops that may indicate mortality events.",
        stat: "± 1 fish",
        statLabel: "ACCURACY"
      },
      {
        title: "ConvLSTM-VAE",
        file: "convlstm_vae.pth",
        body: "Variational autoencoder over 5-frame sequences. Learns 'normal' fish swimming patterns. High reconstruction loss → behavior anomaly (stress, hypoxia, panic).",
        stat: "5 frames",
        statLabel: "TEMPORAL WINDOW"
      },
    ];
    models.forEach((m, i) => {
      const cx = 0.7 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 2.0, w: 3.95, h: 4.5, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }, shadow: cardShadow()
      });
      // glow header
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 2.0, w: 3.95, h: 0.65, fill: { color: COLOR.navy, transparency: 30 }, line: { color: COLOR.navy, transparency: 100 }
      });
      s.addText(m.title, {
        x: cx + 0.2, y: 2.05, w: 3.6, h: 0.55, fontSize: 13, bold: true, color: COLOR.cyanGlow, charSpacing: 4, fontFace: FONT_HEADER, valign: "middle", margin: 0
      });
      // divider
      s.addShape(pres.shapes.LINE, {
        x: cx + 0.2, y: 3.7, w: 3.55, h: 0, line: { color: COLOR.borderDark, width: 1 }
      });
      // file name
      s.addText(m.file, {
        x: cx + 0.2, y: 2.8, w: 3.6, h: 0.3, fontSize: 11, color: COLOR.textInvMute, fontFace: "Consolas", margin: 0
      });
      // body
      s.addText(m.body, {
        x: cx + 0.2, y: 3.85, w: 3.6, h: 1.65, fontSize: 12, color: COLOR.textInv, fontFace: FONT_BODY, valign: "top", margin: 0
      });
      // big stat
      s.addText(m.stat, {
        x: cx + 0.2, y: 5.55, w: 3.6, h: 0.65, fontSize: 30, bold: true, color: COLOR.cyanGlow, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(m.statLabel, {
        x: cx + 0.2, y: 6.2, w: 3.6, h: 0.3, fontSize: 9, bold: true, color: COLOR.textInvMute, charSpacing: 4, fontFace: FONT_BODY, margin: 0
      });
    });

    s.addText("Inference runs in FastAPI service on port 8001 — auto-detects GPU/CPU, batches frames", {
      x: 0.7, y: 7.0, w: 12, h: 0.35, fontSize: 12, italic: true, color: COLOR.textInvMute, align: "center", fontFace: FONT_BODY, margin: 0
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 8 — Real-time Sensor Pipeline (Light)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgLight };

    s.addText("REAL-TIME PIPELINE", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyan, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("From Arduino to your phone in 200 ms.", {
      x: 0.7, y: 1.0, w: 12, h: 0.7, fontSize: 32, bold: true, color: COLOR.text, fontFace: FONT_HEADER, margin: 0
    });

    // Three separate sparkline cards (each scaled to its own range)
    const sensors = [
      { label: "pH",      unit: "",        values: [7.1, 7.0, 7.2, 7.1, 7.0, 7.1], color: COLOR.cyan,    icon: ICONS.dropletLight, current: "7.1" },
      { label: "TEMP",    unit: "°C",      values: [25.4, 25.6, 25.8, 26.0, 26.1, 26.0], color: COLOR.amber, icon: ICONS.thermLight, current: "26.0" },
      { label: "DISS. O₂",unit: "mg/L",    values: [7.5, 7.4, 7.4, 7.3, 7.4, 7.5], color: COLOR.emerald, icon: ICONS.o2Light, current: "7.5" },
    ];
    sensors.forEach((sn, i) => {
      const cy = 2.0 + i * 1.55;
      // card bg
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.7, y: cy, w: 7.5, h: 1.4, fill: { color: COLOR.white }, line: { color: COLOR.border, width: 1 }, shadow: softShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.7, y: cy, w: 0.08, h: 1.4, fill: { color: sn.color }, line: { color: sn.color, transparency: 100 }
      });
      // icon
      s.addShape(pres.shapes.OVAL, {
        x: 0.95, y: cy + 0.3, w: 0.8, h: 0.8, fill: { color: "F1F5F9" }, line: { color: "F1F5F9", transparency: 100 }
      });
      s.addImage({ data: sn.icon, x: 1.13, y: cy + 0.45, w: 0.5, h: 0.5 });
      // label
      s.addText(sn.label, {
        x: 1.95, y: cy + 0.2, w: 1.5, h: 0.3, fontSize: 11, bold: true, color: COLOR.textMute, charSpacing: 4, fontFace: FONT_HEADER, margin: 0
      });
      // big value
      s.addText([
        { text: sn.current, options: { fontSize: 32, bold: true, color: sn.color } },
        { text: " " + sn.unit, options: { fontSize: 13, color: COLOR.textMute, bold: false } },
      ], {
        x: 1.95, y: cy + 0.5, w: 2.0, h: 0.7, fontFace: FONT_HEADER, margin: 0, valign: "middle"
      });
      // status pill
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 4.05, y: cy + 0.55, w: 0.7, h: 0.3, fill: { color: COLOR.emerald, transparency: 80 }, line: { color: COLOR.emerald, width: 1 }, rectRadius: 0.05
      });
      s.addText("OK", {
        x: 4.05, y: cy + 0.55, w: 0.7, h: 0.3, fontSize: 9, bold: true, color: COLOR.emerald, align: "center", fontFace: FONT_BODY, valign: "middle", margin: 0
      });
      // sparkline chart
      s.addChart(pres.charts.LINE, [{
        name: sn.label, labels: ["", "", "", "", "", ""], values: sn.values
      }], {
        x: 5.0, y: cy + 0.15, w: 3.1, h: 1.1,
        chartColors: [sn.color],
        chartArea: { fill: { color: COLOR.white } },
        plotArea: { fill: { color: COLOR.white } },
        catAxisHidden: true,
        valAxisHidden: true,
        catGridLine: { style: "none" },
        valGridLine: { style: "none" },
        lineSize: 2.5,
        lineSmooth: true,
        showLegend: false,
        showValue: false,
      });
    });
    // Stream label
    s.addText("Live sensor stream — last 5 min", {
      x: 0.7, y: 6.7, w: 7.5, h: 0.3, fontSize: 11, italic: true, color: COLOR.textMute, fontFace: FONT_BODY, margin: 0
    });

    // Right: pipeline steps
    const steps = [
      { num: "01", title: "Arduino sample",     time: "10 ms", desc: "ADC reading + JSON encode" },
      { num: "02", title: "USB serial → Bridge",time: "30 ms", desc: "9600 baud · packet validate" },
      { num: "03", title: "REST → Backend",     time: "20 ms", desc: "POST /serial/reading · TypeORM persist" },
      { num: "04", title: "Socket broadcast",   time: "5 ms",  desc: "sensor:update event to all clients" },
      { num: "05", title: "Client UI render",   time: "16 ms", desc: "React state update · 60fps animation" },
    ];
    steps.forEach((step, i) => {
      const sy = 2.0 + i * 0.95;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 8.4, y: sy, w: 4.3, h: 0.85, fill: { color: COLOR.white }, line: { color: COLOR.border, width: 1 }, shadow: softShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: 8.4, y: sy, w: 0.06, h: 0.85, fill: { color: COLOR.cyan }, line: { color: COLOR.cyan, transparency: 100 }
      });
      s.addText(step.num, {
        x: 8.5, y: sy + 0.05, w: 0.5, h: 0.4, fontSize: 18, bold: true, color: COLOR.cyan, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(step.title, {
        x: 9.0, y: sy + 0.05, w: 2.5, h: 0.35, fontSize: 12, bold: true, color: COLOR.text, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(step.time, {
        x: 11.5, y: sy + 0.05, w: 1.1, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyan, align: "right", fontFace: "Consolas", margin: 0
      });
      s.addText(step.desc, {
        x: 9.0, y: sy + 0.4, w: 3.5, h: 0.4, fontSize: 10, color: COLOR.textMute, fontFace: FONT_BODY, margin: 0
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 9 — Mobile App Showcase (Dark)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgDark };

    s.addText("MOBILE", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyanGlow, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("Cross-platform native UI — built once, runs everywhere.", {
      x: 0.7, y: 1.0, w: 12, h: 0.8, fontSize: 28, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
    });

    // 5 features
    const features = [
      { icon: ICONS.chart,   title: "Live Sensors",      body: "Real-time pH, temp, DO gauges with smooth animations." },
      { icon: ICONS.cog,     title: "Tank Controls",     body: "Manual feed trigger, pump and LED toggles, schedule editor." },
      { icon: ICONS.brain,   title: "Veronica Chat",     body: "Voice + text interface to the AI agent with session history." },
      { icon: ICONS.eye,     title: "Fish Health",       body: "Live disease detection feed with confidence scores and trend." },
      { icon: ICONS.bell,    title: "Push Alerts",       body: "Critical thresholds trigger real device push notifications." },
    ];
    features.forEach((f, i) => {
      const cx = 0.7 + i * 2.55;
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 2.3, w: 2.45, h: 4.0, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }, shadow: cardShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 2.3, w: 2.45, h: 0.06, fill: { color: COLOR.cyan }, line: { color: COLOR.cyan, transparency: 100 }
      });
      // icon
      s.addShape(pres.shapes.OVAL, {
        x: cx + 0.85, y: 2.65, w: 0.75, h: 0.75, fill: { color: COLOR.navy, transparency: 50 }, line: { color: COLOR.cyan, width: 1 }
      });
      s.addImage({ data: f.icon, x: cx + 1.05, y: 2.83, w: 0.4, h: 0.4 });
      s.addText(f.title, {
        x: cx + 0.2, y: 3.65, w: 2.05, h: 0.5, fontSize: 14, bold: true, color: COLOR.white, fontFace: FONT_HEADER, align: "center", margin: 0
      });
      s.addText(f.body, {
        x: cx + 0.2, y: 4.2, w: 2.05, h: 2.0, fontSize: 11, color: COLOR.textInvMute, align: "center", fontFace: FONT_BODY, valign: "top", margin: 0
      });
    });

    // Tech ribbon
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y: 6.55, w: 12, h: 0.4, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }
    });
    s.addText("Expo SDK 54  ·  React Native 0.81.5  ·  React 19  ·  Keyboard Controller  ·  AsyncStorage  ·  expo-speech  ·  expo-notifications", {
      x: 0.7, y: 6.55, w: 12, h: 0.4, fontSize: 11, color: COLOR.cyanGlow, align: "center", fontFace: "Consolas", valign: "middle", margin: 0
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 10 — Dashboard Showcase (Light)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgLight };

    s.addText("WEB DASHBOARD", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyan, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("Mission control for your aquaculture operation.", {
      x: 0.7, y: 1.0, w: 12, h: 0.8, fontSize: 30, bold: true, color: COLOR.text, fontFace: FONT_HEADER, margin: 0
    });

    // Mock dashboard window
    const dx = 0.7, dy = 2.1, dw = 7.5, dh = 5.0;
    s.addShape(pres.shapes.RECTANGLE, {
      x: dx, y: dy, w: dw, h: dh, fill: { color: COLOR.bgDark }, line: { color: COLOR.borderDark, width: 1 }, shadow: cardShadow()
    });
    // browser bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: dx, y: dy, w: dw, h: 0.3, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, transparency: 100 }
    });
    [0.15, 0.35, 0.55].forEach((bx, i) => {
      const colors = [COLOR.rose, COLOR.amber, COLOR.emerald];
      s.addShape(pres.shapes.OVAL, {
        x: dx + bx, y: dy + 0.08, w: 0.13, h: 0.13, fill: { color: colors[i] }, line: { color: colors[i], transparency: 100 }
      });
    });
    s.addText("fishlinic.dashboard / live", {
      x: dx + 0.9, y: dy + 0.05, w: 4, h: 0.2, fontSize: 9, color: COLOR.textInvMute, fontFace: "Consolas", valign: "middle", margin: 0
    });
    // header
    s.addText("Fishlinic Monitor · Tank #1", {
      x: dx + 0.3, y: dy + 0.5, w: 5, h: 0.4, fontSize: 16, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
    });
    // mini gauges row
    const gauges = [
      { label: "pH",     val: "7.1", st: "OK",       color: COLOR.emerald },
      { label: "TEMP",   val: "26°", st: "OK",       color: COLOR.emerald },
      { label: "DO",     val: "7.4", st: "OK",       color: COLOR.emerald },
      { label: "FISH",   val: "12",  st: "ACTIVE",   color: COLOR.cyanGlow },
    ];
    gauges.forEach((g, i) => {
      const gx = dx + 0.3 + i * 1.75, gy = dy + 1.1;
      s.addShape(pres.shapes.RECTANGLE, {
        x: gx, y: gy, w: 1.55, h: 1.0, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }
      });
      s.addText(g.label, {
        x: gx + 0.1, y: gy + 0.05, w: 1.4, h: 0.2, fontSize: 8, bold: true, color: COLOR.textInvMute, charSpacing: 4, fontFace: FONT_BODY, margin: 0
      });
      s.addText(g.val, {
        x: gx + 0.1, y: gy + 0.25, w: 1.4, h: 0.5, fontSize: 22, bold: true, color: COLOR.cyanGlow, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(g.st, {
        x: gx + 0.1, y: gy + 0.75, w: 1.4, h: 0.2, fontSize: 8, bold: true, color: g.color, fontFace: FONT_BODY, margin: 0
      });
    });
    // chart panel
    s.addShape(pres.shapes.RECTANGLE, {
      x: dx + 0.3, y: dy + 2.3, w: 6.9, h: 1.8, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }
    });
    s.addText("LIVE TELEMETRY · 24h", {
      x: dx + 0.45, y: dy + 2.4, w: 4, h: 0.3, fontSize: 10, bold: true, color: COLOR.cyanGlow, charSpacing: 4, fontFace: FONT_HEADER, margin: 0
    });
    // fake mini chart
    s.addChart(pres.charts.LINE, [
      { name: "pH", labels: ["00","04","08","12","16","20","24"], values: [7.1, 7.0, 7.0, 7.2, 7.1, 7.0, 7.1] }
    ], {
      x: dx + 0.4, y: dy + 2.7, w: 6.7, h: 1.4,
      chartColors: [COLOR.cyan],
      chartArea: { fill: { color: COLOR.bgPanel } },
      plotArea: { fill: { color: COLOR.bgPanel } },
      catAxisLabelColor: COLOR.textInvMute,
      valAxisLabelColor: COLOR.textInvMute,
      catAxisLabelFontSize: 7,
      valAxisLabelFontSize: 7,
      valGridLine: { color: COLOR.borderDark, size: 0.5 },
      catGridLine: { style: "none" },
      lineSize: 2,
      lineSmooth: true,
      showLegend: false,
    });
    // alert row
    s.addShape(pres.shapes.RECTANGLE, {
      x: dx + 0.3, y: dy + 4.3, w: 6.9, h: 0.55, fill: { color: COLOR.amber, transparency: 80 }, line: { color: COLOR.amber, width: 1 }
    });
    s.addText("⚠  Cleaning reminder · last cleaned 14 days ago", {
      x: dx + 0.5, y: dy + 4.3, w: 6.5, h: 0.55, fontSize: 11, color: COLOR.amber, fontFace: FONT_BODY, valign: "middle", margin: 0
    });

    // Right: feature list
    const feats = [
      { icon: ICONS.chartLight, title: "Live telemetry charts" },
      { icon: ICONS.cogLight,   title: "One-click hardware controls" },
      { icon: ICONS.eyeLight,   title: "Camera feed with detections" },
      { icon: ICONS.brainLight, title: "Embedded Veronica chat" },
      { icon: ICONS.lock,       title: "NextAuth — Google + email" },
      { icon: ICONS.users,      title: "Team profiles + roles" },
    ];
    feats.forEach((f, i) => {
      const sy = 2.2 + i * 0.75;
      s.addShape(pres.shapes.OVAL, {
        x: 8.5, y: sy, w: 0.55, h: 0.55, fill: { color: "E0F7FA" }, line: { color: "E0F7FA", transparency: 100 }
      });
      s.addImage({ data: f.icon, x: 8.6, y: sy + 0.1, w: 0.35, h: 0.35 });
      s.addText(f.title, {
        x: 9.2, y: sy, w: 3.5, h: 0.55, fontSize: 14, bold: true, color: COLOR.text, fontFace: FONT_HEADER, valign: "middle", margin: 0
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 11 — Engineering Highlights (Dark)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgDark };

    s.addText("ENGINEERING HIGHLIGHTS", {
      x: 0.7, y: 0.6, w: 8, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyanGlow, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("The non-obvious decisions that made it work.", {
      x: 0.7, y: 1.0, w: 12, h: 0.8, fontSize: 30, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
    });

    // 6 highlight cards in 2x3
    const items = [
      { icon: ICONS.clock,   title: "60-second cron tick",  body: "Single timer drives all scheduled work — no fragile multiple cron jobs. Feeders, lights, cleaning, alerts all on one beat." },
      { icon: ICONS.shield,  title: "Mock mode everywhere", body: "Backend + bridge fall back to simulated data when hardware is offline. Demos work without an Arduino plugged in." },
      { icon: ICONS.network, title: "Bidirectional sockets",body: "Server emits telemetry; clients emit commands. Single Socket.IO gateway handles both directions with type-safe events." },
      { icon: ICONS.brain,   title: "Tool-calling agent",   body: "Veronica uses Ollama function-calling to read sensors and act. Agent loop with iteration limit + confirmation gating prevents runaway." },
      { icon: ICONS.layer,   title: "Atomic Design",        body: "Atoms → molecules → organisms → screens. Mobile and dashboard share the same component vocabulary across teams." },
      { icon: ICONS.code,    title: "Shared TypeScript",    body: "All services + apps import types from shared/types. One change to a sensor type ripples to mobile, dashboard, backend instantly." },
    ];
    const gx = 0.7, gy = 2.0, cw = 3.95, ch = 2.45, gap = 0.13;
    items.forEach((it, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = gx + col * (cw + gap);
      const y = gy + row * (ch + 0.18);

      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: cw, h: ch, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }, shadow: cardShadow()
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.3, y: y + 0.3, w: 0.65, h: 0.65, fill: { color: COLOR.navy, transparency: 30 }, line: { color: COLOR.cyan, width: 1 }
      });
      s.addImage({ data: it.icon, x: x + 0.43, y: y + 0.43, w: 0.4, h: 0.4 });
      s.addText(it.title, {
        x: x + 1.1, y: y + 0.3, w: cw - 1.25, h: 0.65, fontSize: 14, bold: true, color: COLOR.white, fontFace: FONT_HEADER, valign: "middle", margin: 0
      });
      s.addText(it.body, {
        x: x + 0.3, y: y + 1.05, w: cw - 0.5, h: ch - 1.15, fontSize: 11, color: COLOR.textInvMute, fontFace: FONT_BODY, valign: "top", margin: 0
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 12 — Numbers (Light)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgLight };

    s.addText("BY THE NUMBERS", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyan, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("Six months of work, shipped.", {
      x: 0.7, y: 1.0, w: 12, h: 0.8, fontSize: 32, bold: true, color: COLOR.text, fontFace: FONT_HEADER, margin: 0
    });

    // Big stats grid 3×2
    const stats = [
      { num: "50K+",  label: "Lines of TypeScript",  sub: "Backend, mobile, dashboard, shared" },
      { num: "9",     label: "Backend modules",      sub: "sensors · alerts · actuators · vision · voice · fish · cron · gateway · management" },
      { num: "5",     label: "AI models",            sub: "YOLOv11×2, ConvLSTM-VAE, RF, Qwen2.5" },
      { num: "3",     label: "Client surfaces",      sub: "Mobile (iOS/Android/Web), Dashboard, Voice" },
      { num: "200ms", label: "Sensor → UI latency",  sub: "Arduino → Bridge → API → Socket → Phone" },
      { num: "100%",  label: "Offline-capable",      sub: "Local LLM + mock mode + local DB" },
    ];

    stats.forEach((st, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 0.7 + col * 4.2;
      const y = 2.1 + row * 2.5;

      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 4.0, h: 2.3, fill: { color: COLOR.white }, line: { color: COLOR.border, width: 1 }, shadow: softShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 0.08, h: 2.3, fill: { color: COLOR.cyan }, line: { color: COLOR.cyan, transparency: 100 }
      });
      // big number
      s.addText(st.num, {
        x: x + 0.3, y: y + 0.15, w: 3.6, h: 1.0, fontSize: 60, bold: true, color: COLOR.cyan, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(st.label, {
        x: x + 0.3, y: y + 1.2, w: 3.6, h: 0.4, fontSize: 14, bold: true, color: COLOR.text, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(st.sub, {
        x: x + 0.3, y: y + 1.65, w: 3.6, h: 0.6, fontSize: 10, color: COLOR.textMute, fontFace: FONT_BODY, valign: "top", margin: 0
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 13 — Live Demo Flow (Dark)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgDark };

    s.addText("LIVE DEMO", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyanGlow, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("How it all comes together — one minute, end to end.", {
      x: 0.7, y: 1.0, w: 12, h: 0.8, fontSize: 28, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
    });

    // Timeline
    const flow = [
      { t: "0:00", title: "Tank state",        body: "Open dashboard. Live pH 7.1, temp 26°C, 12 fish counted by YOLO." },
      { t: "0:15", title: "Manual feed",       body: "Tap 'Feed' on mobile. Relay clicks. Camera shows fish swarming." },
      { t: "0:25", title: "Disease detected",  body: "YOLO flags possible fin rot — alert pops up on mobile + dashboard." },
      { t: "0:40", title: "Ask Veronica",      body: "Voice query: 'how are my fish today?' She reads sensors + diagnoses live." },
      { t: "0:55", title: "Autonomous action", body: "Switch to auto mode — Veronica sees high temp, turns on pump unprompted." },
    ];
    flow.forEach((f, i) => {
      const fy = 2.2 + i * 0.95;
      // timeline dot
      s.addShape(pres.shapes.OVAL, {
        x: 1.1, y: fy + 0.2, w: 0.3, h: 0.3, fill: { color: COLOR.cyan }, line: { color: COLOR.cyan, transparency: 100 }
      });
      // line connector
      if (i < flow.length - 1) {
        s.addShape(pres.shapes.LINE, {
          x: 1.25, y: fy + 0.5, w: 0, h: 0.7, line: { color: COLOR.cyan, width: 2 }
        });
      }
      // time badge
      s.addText(f.t, {
        x: 1.6, y: fy + 0.1, w: 1.2, h: 0.45, fontSize: 14, bold: true, color: COLOR.cyanGlow, fontFace: "Consolas", margin: 0
      });
      // card
      s.addShape(pres.shapes.RECTANGLE, {
        x: 3.0, y: fy, w: 9.5, h: 0.85, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }, shadow: cardShadow()
      });
      s.addText(f.title, {
        x: 3.2, y: fy + 0.08, w: 9.1, h: 0.35, fontSize: 14, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(f.body, {
        x: 3.2, y: fy + 0.4, w: 9.1, h: 0.4, fontSize: 11, color: COLOR.textInvMute, fontFace: FONT_BODY, valign: "top", margin: 0
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 14 — The Team (Light)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgLight };

    s.addText("THE TEAM", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyan, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("Four engineers. Four disciplines. One product.", {
      x: 0.7, y: 1.0, w: 12, h: 0.7, fontSize: 30, bold: true, color: COLOR.text, fontFace: FONT_HEADER, margin: 0
    });

    const team = [
      { name: "Ismail",     role: "Lead Architect",      detail: "Backend (NestJS), Mobile (Expo), Veronica AI agent, dashboard integration, system architecture", color: COLOR.cyan },
      { name: "Maral",      role: "Database Specialist", detail: "TypeORM schemas, migrations, Supabase production wiring, data pipeline",            color: COLOR.emerald },
      { name: "Firdavs",    role: "AI Engineer",         detail: "YOLOv11 disease + count, ConvLSTM-VAE behavior model, Random Forest water quality",       color: COLOR.rose },
      { name: "Sarvar",     role: "Hardware Engineer",   detail: "Arduino firmware (main + secondary), USB serial protocol, sensor + relay wiring",   color: COLOR.amber },
    ];

    team.forEach((m, i) => {
      const x = 1.4 + i * 2.7;
      const y = 2.4;
      // card
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 2.5, h: 4.0, fill: { color: COLOR.white }, line: { color: COLOR.border, width: 1 }, shadow: softShadow()
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 2.5, h: 0.15, fill: { color: m.color }, line: { color: m.color, transparency: 100 }
      });
      // avatar circle
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.75, y: y + 0.5, w: 1.0, h: 1.0, fill: { color: m.color, transparency: 80 }, line: { color: m.color, width: 2 }
      });
      s.addImage({ data: ICONS.user, x: x + 0.9, y: y + 0.65, w: 0.7, h: 0.7 });
      // name
      s.addText(m.name, {
        x: x + 0.1, y: y + 1.65, w: 2.3, h: 0.4, fontSize: 18, bold: true, color: COLOR.text, fontFace: FONT_HEADER, align: "center", margin: 0
      });
      // role
      s.addText(m.role, {
        x: x + 0.1, y: y + 2.05, w: 2.3, h: 0.35, fontSize: 11, bold: true, color: m.color, charSpacing: 3, align: "center", fontFace: FONT_HEADER, margin: 0
      });
      // divider
      s.addShape(pres.shapes.LINE, {
        x: x + 0.4, y: y + 2.5, w: 1.7, h: 0, line: { color: COLOR.border, width: 1 }
      });
      // details
      s.addText(m.detail, {
        x: x + 0.2, y: y + 2.65, w: 2.1, h: 1.3, fontSize: 11, color: COLOR.textMute, align: "center", fontFace: FONT_BODY, valign: "top", margin: 0
      });
    });

    s.addText("Sejong University · Computer Engineering Department · Capstone 2026", {
      x: 0.7, y: 7.0, w: 12, h: 0.4, fontSize: 12, italic: true, color: COLOR.textMute, align: "center", fontFace: FONT_BODY, margin: 0
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 15 — Roadmap / What's Next (Dark)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgDark };

    s.addText("WHAT'S NEXT", {
      x: 0.7, y: 0.6, w: 6, h: 0.35, fontSize: 11, bold: true, color: COLOR.cyanGlow, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("From capstone to product.", {
      x: 0.7, y: 1.0, w: 12, h: 0.8, fontSize: 32, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
    });

    // Three phase columns
    const phases = [
      {
        phase: "PHASE 1",
        title: "Production Hardening",
        when: "Q3 2026",
        items: [
          "Multi-tank scaling (1 backend, N tanks)",
          "TimescaleDB for sensor history",
          "AWS / GCP deployment with Terraform",
          "OAuth role-based access (owner/staff)",
        ]
      },
      {
        phase: "PHASE 2",
        title: "Smarter AI",
        when: "Q4 2026",
        items: [
          "Quantize Veronica to 4-bit (Q4_K_M)",
          "Fine-tune on aquarium-specific corpus",
          "Vision-language model for camera Q&A",
          "Predictive maintenance from sensor trends",
        ]
      },
      {
        phase: "PHASE 3",
        title: "Commercial Pilot",
        when: "Q1 2027",
        items: [
          "Partnership with local fish farms",
          "Subscription tier with cloud sync",
          "Industrial-grade sensor packages",
          "Mobile-first marketplace for replacements",
        ]
      },
    ];
    phases.forEach((p, i) => {
      const cx = 0.7 + i * 4.2;
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 2.0, w: 3.95, h: 4.7, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }, shadow: cardShadow()
      });
      // top color band
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 2.0, w: 3.95, h: 0.06, fill: { color: COLOR.cyan }, line: { color: COLOR.cyan, transparency: 100 }
      });
      s.addText(p.phase, {
        x: cx + 0.25, y: 2.2, w: 3.5, h: 0.3, fontSize: 11, bold: true, color: COLOR.cyanGlow, charSpacing: 4, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(p.title, {
        x: cx + 0.25, y: 2.5, w: 3.5, h: 0.6, fontSize: 22, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
      });
      s.addText(p.when, {
        x: cx + 0.25, y: 3.1, w: 3.5, h: 0.35, fontSize: 12, italic: true, color: COLOR.textInvMute, fontFace: FONT_BODY, margin: 0
      });
      // divider
      s.addShape(pres.shapes.LINE, {
        x: cx + 0.25, y: 3.55, w: 3.4, h: 0, line: { color: COLOR.borderDark, width: 1 }
      });
      // bullets
      const bulletItems = p.items.map((it, idx) => ({
        text: it,
        options: { bullet: { code: "25CF" }, breakLine: idx < p.items.length - 1, color: COLOR.textInv }
      }));
      s.addText(bulletItems, {
        x: cx + 0.25, y: 3.75, w: 3.5, h: 2.8, fontSize: 12, color: COLOR.textInv, fontFace: FONT_BODY, paraSpaceAfter: 8, valign: "top"
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SLIDE 16 — Closing / Thank You (Dark)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: COLOR.bgDark };

    // Decorative blobs
    s.addShape(pres.shapes.OVAL, {
      x: -2, y: 4, w: 8, h: 8, fill: { color: COLOR.navy, transparency: 70 }, line: { color: COLOR.navy, transparency: 100 }
    });
    s.addShape(pres.shapes.OVAL, {
      x: 9, y: -2, w: 8, h: 8, fill: { color: COLOR.teal, transparency: 75 }, line: { color: COLOR.teal, transparency: 100 }
    });

    s.addText("Thank you.", {
      x: 0.7, y: 2.2, w: 12, h: 1.5, fontSize: 96, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
    });
    s.addText([
      { text: "Built with ", options: { color: COLOR.textInv } },
      { text: "obsession", options: { color: COLOR.cyanGlow, italic: true, bold: true } },
      { text: " for the fish.  ", options: { color: COLOR.textInv } },
      { text: "🐟", options: { color: COLOR.cyanGlow } },
    ], {
      x: 0.7, y: 3.7, w: 12, h: 0.6, fontSize: 22, fontFace: FONT_HEADER, margin: 0
    });

    // Contact card
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y: 5.3, w: 12, h: 1.4, fill: { color: COLOR.bgPanel }, line: { color: COLOR.borderDark, width: 1 }, shadow: cardShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y: 5.3, w: 0.1, h: 1.4, fill: { color: COLOR.cyan }, line: { color: COLOR.cyan, transparency: 100 }
    });
    s.addText("FISHLINIC", {
      x: 1.0, y: 5.4, w: 5, h: 0.4, fontSize: 11, bold: true, color: COLOR.cyanGlow, charSpacing: 6, fontFace: FONT_HEADER, margin: 0
    });
    s.addText("Smart Aquaculture System · Sejong University Capstone 2026", {
      x: 1.0, y: 5.75, w: 11, h: 0.35, fontSize: 16, bold: true, color: COLOR.white, fontFace: FONT_HEADER, margin: 0
    });
    s.addImage({ data: ICONS.github, x: 1.0, y: 6.2, w: 0.3, h: 0.3 });
    s.addText("github.com/Ismoiljon1101/capstone_aquarium_sejong", {
      x: 1.4, y: 6.2, w: 8, h: 0.35, fontSize: 12, color: COLOR.textInv, fontFace: "Consolas", valign: "middle", margin: 0
    });
    s.addText("Questions?", {
      x: 9, y: 6.0, w: 3.5, h: 0.6, fontSize: 26, italic: true, bold: true, color: COLOR.cyanGlow, fontFace: FONT_HEADER, align: "right", margin: 0
    });
  }

  // ─── Write file ────────────────────────────────────────────────────────────
  await pres.writeFile({ fileName: "Fishlinic_Capstone_Presentation.pptx" });
  console.log("✓ Built Fishlinic_Capstone_Presentation.pptx");
})().catch(err => { console.error(err); process.exit(1); });
