"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useApi } from "../../hooks/useApi";

const STATUS_COLOR: Record<string, string> = {
  ok: "text-emerald-400",
  warn: "text-amber-400",
  warning: "text-amber-400",
  critical: "text-red-400",
};
const STATUS_BADGE: Record<string, string> = {
  ok: "bg-emerald-400/10 border-emerald-400/25 text-emerald-400",
  warn: "bg-amber-400/10 border-amber-400/25 text-amber-400",
  warning: "bg-amber-400/10 border-amber-400/25 text-amber-400",
  critical: "bg-red-400/10 border-red-400/25 text-red-400",
};

function SensorCard({
  icon, label, value, unit, safeRange, status, accent,
}: {
  icon: string; label: string; value: number | null;
  unit: string; safeRange: string; status: string; accent: string;
}) {
  const col = STATUS_COLOR[status] ?? STATUS_COLOR.ok;
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.ok;
  return (
    <div
      className="relative bg-slate-900/90 border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-2.5 overflow-hidden group hover:border-white/15 transition-all"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.35)" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xl leading-none">{icon}</span>
        <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full border ${badge}`}>
          {status === "critical" ? "CRIT" : status === "warn" || status === "warning" ? "WARN" : "OK"}
        </span>
      </div>
      <div>
        <div className="flex items-end gap-1">
          <span
            className={`text-[2rem] leading-none font-black tabular-nums ${status !== "ok" ? col : "text-slate-100"}`}
          >
            {value !== null ? value.toFixed(1) : "—"}
          </span>
          <span className="text-sm text-slate-500 mb-0.5">{unit}</span>
        </div>
        <p className="text-sm font-semibold text-slate-400 mt-1">{label}</p>
      </div>
      <p className="text-[11px] text-slate-600">
        Safe: <span className="text-slate-500 font-medium">{safeRange}</span>
      </p>
    </div>
  );
}

export const LiveTelemetry: React.FC = () => {
  const { telemetry, connected } = useSocket();
  const { getLatest } = useApi();
  const [snapshot, setSnapshot] = useState<any>(null);

  useEffect(() => {
    getLatest().then((r) => { if (r.data) setSnapshot(r.data); }).catch(() => null);
  }, []);

  const d = telemetry ?? snapshot ?? {};

  const sensors = [
    { icon: "🧪", label: "pH Level",      value: d.pH ?? d.ph ?? null,       unit: "pH",   safeRange: "6.8 – 7.5", status: d.phStatus  ?? d.status ?? "ok", accent: "#38bdf8" },
    { icon: "🌡️", label: "Temperature",   value: d.temp_c ?? null,            unit: "°C",   safeRange: "24 – 28",   status: d.tempStatus ?? d.status ?? "ok", accent: "#f59e0b" },
    { icon: "💨", label: "Dissolved O₂",  value: d.do_mg_l ?? null,           unit: "mg/L", safeRange: "6 – 9",     status: d.doStatus  ?? d.status ?? "ok", accent: "#34d399" },
    { icon: "☁️", label: "CO₂",           value: d.co2_ppm ?? d.CO2 ?? null,  unit: "ppm",  safeRange: "< 40",      status: d.co2Status ?? d.status ?? "ok", accent: "#a78bfa" },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">Live Telemetry</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time aquarium sensor readings</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: connected ? "#34d399" : "#f87171" }}
          />
          <span className={`text-[11px] font-semibold ${connected ? "text-emerald-400" : "text-red-400"}`}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sensors.map((s) => <SensorCard key={s.label} {...s} />)}
      </div>
    </section>
  );
};
