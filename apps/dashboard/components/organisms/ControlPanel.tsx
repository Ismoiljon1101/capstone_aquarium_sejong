"use client";

import React, { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useSocket } from "../../hooks/useSocket";

function Toggle({ active, color }: { active: boolean; color: string }) {
  return (
    <div
      className="w-10 h-6 rounded-full flex items-center px-0.5 transition-all duration-200"
      style={{ background: active ? color + "aa" : "rgba(255,255,255,0.08)", border: `1px solid ${active ? color + "66" : "rgba(255,255,255,0.1)"}` }}
    >
      <div
        className="w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: active ? "translateX(16px)" : "translateX(0)" }}
      />
    </div>
  );
}

export const ControlPanel: React.FC = () => {
  const { triggerFeed, togglePump, toggleLed, getActuatorState } = useApi();
  const { actuatorState } = useSocket();
  const [pump, setPump] = useState(false);
  const [led, setLed] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [pumpL, setPumpL] = useState(false);
  const [ledL, setLedL] = useState(false);

  useEffect(() => {
    getActuatorState().then((r) => {
      if (r.data) { setPump(!!r.data.pump); setLed(!!r.data.led); }
    }).catch(() => null);
  }, []);

  // Sync with real-time actuator events
  useEffect(() => {
    if (!actuatorState) return;
    if (actuatorState.type === "AIR_PUMP") setPump(actuatorState.state);
    if (actuatorState.type === "LED_STRIP") setLed(actuatorState.state);
  }, [actuatorState]);

  const handleFeed = async () => {
    setFeeding(true);
    await triggerFeed(3).catch(() => null);
    setTimeout(() => setFeeding(false), 3000);
  };

  const handlePump = async () => {
    setPumpL(true);
    await togglePump(!pump).catch(() => null);
    setPump((p) => !p);
    setPumpL(false);
  };

  const handleLed = async () => {
    setLedL(true);
    await toggleLed(!led).catch(() => null);
    setLed((l) => !l);
    setLedL(false);
  };

  const devices = [
    { label: "Air Pump",  desc: "Oxygenation system",  active: pump,  loading: pumpL, color: "#06b6d4", onPress: handlePump, icon: "💨" },
    { label: "LED Strip", desc: "12V aquarium lighting", active: led,  loading: ledL, color: "#f59e0b", onPress: handleLed,  icon: "💡" },
  ];

  return (
    <section className="bg-slate-900/80 border border-white/[0.07] rounded-2xl p-5" style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.3)" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">⚡</span>
        <h2 className="text-base font-black text-slate-100 tracking-tight">Hardware Controls</h2>
      </div>

      {/* Feed CTA */}
      <button
        onClick={handleFeed}
        disabled={feeding}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 mb-4 group"
        style={{
          background: feeding ? "rgba(56,189,248,0.08)" : "rgba(56,189,248,0.05)",
          borderColor: feeding ? "#38bdf8aa" : "rgba(56,189,248,0.2)",
          boxShadow: feeding ? "0 0 20px rgba(56,189,248,0.15)" : "none",
        }}
      >
        <span className="text-2xl">{feeding ? "⏳" : "🍽️"}</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-cyan-400">{feeding ? "Dispensing Feed…" : "Feed Fish Now"}</p>
          <p className="text-[11px] text-slate-600">Activates feeder relay · one cycle</p>
        </div>
        {!feeding && <span className="text-slate-600 group-hover:text-slate-400 transition-colors">›</span>}
      </button>

      {/* Device toggles */}
      <div className="space-y-3">
        {devices.map((d) => (
          <button
            key={d.label}
            onClick={d.onPress}
            disabled={d.loading}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200"
            style={{
              background: d.active ? d.color + "0D" : "rgba(255,255,255,0.03)",
              borderColor: d.active ? d.color + "44" : "rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: d.active ? d.color + "22" : "rgba(255,255,255,0.05)" }}
            >
              {d.loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: d.color }} />
              ) : (
                <span className="text-lg">{d.icon}</span>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-slate-200">{d.label}</p>
              <p className="text-[11px] text-slate-600">{d.desc}</p>
            </div>
            <Toggle active={d.active} color={d.color} />
          </button>
        ))}
      </div>

      {/* Relay status summary */}
      <div className="mt-4 pt-4 border-t border-white/[0.05]">
        <p className="text-[10px] font-bold text-slate-600 tracking-widest uppercase mb-2">Relay Status</p>
        <div className="flex gap-2">
          {[
            { label: "Feeder", active: feeding, color: "#38bdf8" },
            { label: "Pump",   active: pump,    color: "#06b6d4" },
            { label: "LED",    active: led,     color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center">
              <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: s.active ? s.color : "#334155" }} />
              <p className="text-[10px] text-slate-500">{s.label}</p>
              <p className="text-[10px] font-bold" style={{ color: s.active ? s.color : "#475569" }}>
                {s.active ? "ON" : "OFF"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
