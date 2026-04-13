"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useApi } from "../../hooks/useApi";

const PARAM_LABELS = [
  { key: "phStatus",       label: "pH",          icon: "🧪" },
  { key: "tempStatus",     label: "Temperature",  icon: "🌡️" },
  { key: "doStatus",       label: "Dissolved O₂", icon: "💨" },
  { key: "visualStatus",   label: "Visual Check", icon: "👁️" },
  { key: "behaviorStatus", label: "Behavior",     icon: "🧠" },
];

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ok:       "bg-emerald-400/12 text-emerald-400 border-emerald-400/25",
    warn:     "bg-amber-400/12   text-amber-400   border-amber-400/25",
    warning:  "bg-amber-400/12   text-amber-400   border-amber-400/25",
    critical: "bg-red-400/12     text-red-400     border-red-400/25",
    normal:   "bg-emerald-400/12 text-emerald-400 border-emerald-400/25",
    good:     "bg-emerald-400/12 text-emerald-400 border-emerald-400/25",
  };
  const cls = map[status?.toLowerCase()] ?? map.ok;
  return (
    <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full border ${cls}`}>
      {status?.toUpperCase() ?? "OK"}
    </span>
  );
}

export const FishHealthPanel: React.FC = () => {
  const { fishData } = useSocket();
  const { getFishCount, getFishHealth, triggerVisionAnalysis } = useApi();
  const [count, setCount] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    Promise.allSettled([getFishCount(), getFishHealth()]).then(([c, h]) => {
      if (c.status === "fulfilled" && c.value.data) setCount(c.value.data);
      if (h.status === "fulfilled" && h.value.data) setHealth(h.value.data);
    });
  }, []);

  // Merge with live socket data
  const liveCount = fishData?.count ?? count;
  const liveHealth = fishData?.health ?? health;

  const overallStatus = liveHealth?.visualStatus ?? "ok";

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try { await triggerVisionAnalysis(); } catch {}
    setTimeout(() => setAnalyzing(false), 4000);
  };

  return (
    <section className="bg-slate-900/80 border border-white/[0.07] rounded-2xl p-5" style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.3)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">AI Health Insights</h2>
          <p className="text-xs text-slate-500 mt-0.5">YOLO · ConvLSTM · Computer Vision</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="text-xs font-bold px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 transition-colors disabled:opacity-50"
        >
          {analyzing ? "Analyzing…" : "Run Analysis"}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "FISH COUNT", value: liveCount?.count ?? "—", sub: "detected" },
          { label: "CONFIDENCE", value: liveCount?.confidence ? `${Math.round((liveCount.confidence) * 100)}%` : "—", sub: "accuracy" },
          { label: "STATUS", value: overallStatus?.toUpperCase(), sub: "overall", status: overallStatus },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 text-center">
            <p className="text-[9px] font-bold text-slate-600 tracking-widest mb-1">{s.label}</p>
            {s.status ? (
              <StatusPill status={s.status} />
            ) : (
              <p className="text-xl font-black text-slate-100 tabular-nums">{s.value}</p>
            )}
            <p className="text-[10px] text-slate-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Parameter status table */}
      <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
        {PARAM_LABELS.map((p, i) => (
          <div
            key={p.key}
            className={`flex items-center px-4 py-2.5 ${i < PARAM_LABELS.length - 1 ? "border-b border-white/[0.04]" : ""}`}
          >
            <span className="text-sm mr-3">{p.icon}</span>
            <span className="flex-1 text-xs text-slate-400 font-medium">{p.label}</span>
            <StatusPill status={liveHealth?.[p.key] ?? "ok"} />
          </div>
        ))}
      </div>

      {liveHealth?.createdAt && (
        <p className="text-[10px] text-slate-600 text-center mt-3">
          Last report: {new Date(liveHealth.createdAt).toLocaleString()}
        </p>
      )}
    </section>
  );
};
