"use client";

import { formatDateTime } from "@/app/lib/format";
import type { Telemetry } from "@/app/lib/types";
import { Clock, TestTube, Thermometer, Wind, Fish, Brain, CheckCircle, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";

type MetricType = 'ph' | 'temp' | 'do';

const statusColor = (v: number, t: MetricType): string => {
  if (t === 'ph') return v >= 6.5 && v <= 8.0 ? "text-emerald-400" : v >= 6.0 && v <= 8.5 ? "text-yellow-400" : "text-red-400";
  if (t === 'temp') return v >= 20 && v <= 30 ? "text-emerald-400" : v >= 18 && v <= 32 ? "text-yellow-400" : "text-red-400";
  return v >= 5.0 ? "text-emerald-400" : v >= 3.5 ? "text-yellow-400" : "text-red-400";
};

const StatusIcon = ({ v, t, size = 4 }: { v: number; t: MetricType; size?: number }) => {
  const c = statusColor(v, t);
  const cls = `w-${size} h-${size}`;
  if (c.includes("emerald")) return <CheckCircle className={cls} />;
  if (c.includes("yellow")) return <AlertTriangle className={cls} />;
  return <AlertCircle className={cls} />;
};

const healthColor = (h: number) => h >= 80 ? "text-emerald-400" : h >= 60 ? "text-yellow-400" : "text-red-400";
const aiColor = (s: number) => s >= 8 ? "text-emerald-400" : s >= 6 ? "text-yellow-400" : "text-red-400";

const HEADER_COLS = [
  { icon: Clock, label: "Timestamp" }, { icon: TestTube, label: "pH Level" },
  { icon: Thermometer, label: "Temperature" }, { icon: Wind, label: "Dissolved O₂" },
  { icon: Fish, label: "Fish Health" }, { icon: Brain, label: "AI Score" },
];

/**
 * TelemetryTable — responsive table for telemetry readings.
 * Desktop = 6-col grid. Mobile = stacked cards.
 */
export function TelemetryTable({ rows }: { rows: Telemetry[] }) {
  if (rows.length === 0) return (
    <div className="text-center py-12">
      <Brain className="w-16 h-16 mx-auto mb-3 text-gray-400" />
      <div className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>No telemetry data available</div>
      <div className="text-xs mt-2" style={{ color: "rgb(var(--text-muted))" }}>Data will appear as measurements are collected</div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="bg-white/5 border-b border-white/10">
          <div className="grid grid-cols-6 gap-4 p-4 text-sm font-semibold" style={{ color: "rgb(var(--text-primary))" }}>
            {HEADER_COLS.map(h => <div key={h.label} className="flex items-center gap-2"><h.icon className="w-4 h-4" /><span>{h.label}</span></div>)}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {rows.map((row, i) => (
            <div key={`${row.timestamp}-${i}`} className={`grid grid-cols-6 gap-4 p-4 text-sm border-b border-white/5 hover:bg-white/5 transition-colors animate-fade-in ${i % 2 === 0 ? "bg-white/2" : ""}`} style={{ animationDelay: `${i * 50}ms` }}>
              {/* Timestamp */}
              <div className="flex flex-col"><span className="font-medium" style={{ color: "rgb(var(--text-primary))" }}>{formatDateTime(row.timestamp)}</span><span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{new Date(row.timestamp).toLocaleDateString()}</span></div>
              {/* pH */}
              <div className="flex items-center gap-2"><StatusIcon v={row.pH} t="ph" /><div className="flex flex-col"><span className={`font-bold ${statusColor(row.pH, 'ph')}`}>{row.pH?.toFixed(2) ?? "--"}</span><span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>pH units</span></div></div>
              {/* Temp */}
              <div className="flex items-center gap-2"><StatusIcon v={row.temp_c} t="temp" /><div className="flex flex-col"><span className={`font-bold ${statusColor(row.temp_c, 'temp')}`}>{row.temp_c?.toFixed(1) ?? "--"}°C</span><span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{row.temp_c != null ? ((row.temp_c * 9 / 5) + 32).toFixed(1) : "--"}°F</span></div></div>
              {/* DO */}
              <div className="flex items-center gap-2"><StatusIcon v={row.do_mg_l} t="do" /><div className="flex flex-col"><span className={`font-bold ${statusColor(row.do_mg_l, 'do')}`}>{row.do_mg_l?.toFixed(2) ?? "--"}</span><span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>mg/L</span></div></div>
              {/* Fish health */}
              <div className="flex items-center gap-2">
                {row.fish_health ? <><>{row.fish_health >= 80 ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : row.fish_health >= 60 ? <AlertTriangle className="w-4 h-4 text-yellow-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}</><div className="flex flex-col"><span className={`font-bold ${healthColor(row.fish_health)}`}>{row.fish_health}%</span><span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Health score</span></div></> : <><HelpCircle className="w-4 h-4 opacity-50" /><span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>No data</span></>}
              </div>
              {/* AI score */}
              <div className="flex items-center gap-2">
                {row.quality_ai ? <><Brain className="w-4 h-4 text-blue-400" /><div className="flex flex-col"><span className={`font-bold ${aiColor(row.quality_ai)}`}>{row.quality_ai.toFixed(1)}</span><span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>/10 AI score</span></div></> : <><Clock className="w-4 h-4 opacity-50" /><span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Processing...</span></>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4 p-4">
        {rows.map((row, i) => (
          <div key={`${row.timestamp}-${i}`} className="card p-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: "rgb(var(--text-muted))" }} /><span className="font-medium text-sm" style={{ color: "rgb(var(--text-primary))" }}>{formatDateTime(row.timestamp)}</span></div>
              {row.quality_ai && <div className="flex items-center gap-1"><Brain className="w-4 h-4 text-blue-400" /><span className={`text-sm font-bold ${aiColor(row.quality_ai)}`}>{row.quality_ai.toFixed(1)}/10</span></div>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{icon: TestTube, label: "pH", val: row.pH, fmt: (v: number) => v.toFixed(2), sub: "pH", metric: "ph" as MetricType}, {icon: Thermometer, label: "Temp", val: row.temp_c, fmt: (v: number) => `${v.toFixed(1)}°C`, sub: `${row.temp_c != null ? ((row.temp_c * 9 / 5) + 32).toFixed(1) : "--"}°F`, metric: "temp" as MetricType}, {icon: Wind, label: "DO₂", val: row.do_mg_l, fmt: (v: number) => v.toFixed(2), sub: "mg/L O₂", metric: "do" as MetricType}].map(m => (
                <div key={m.label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2"><m.icon className="w-4 h-4" style={{ color: "rgb(var(--text-muted))" }} />{m.val != null && <StatusIcon v={m.val} t={m.metric} size={3} />}</div>
                  <div><div className={`font-bold text-sm ${m.val != null ? statusColor(m.val, m.metric) : ""}`}>{m.val != null ? m.fmt(m.val) : "--"}</div><div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{m.sub}</div></div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2"><Fish className="w-4 h-4" style={{ color: "rgb(var(--text-muted))" }} />{row.fish_health ? (row.fish_health >= 80 ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : row.fish_health >= 60 ? <AlertTriangle className="w-3 h-3 text-yellow-400" /> : <AlertCircle className="w-3 h-3 text-red-400" />) : <HelpCircle className="w-3 h-3 opacity-50" />}</div>
                <div>{row.fish_health ? <><div className={`font-bold text-sm ${healthColor(row.fish_health)}`}>{row.fish_health}%</div><div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Health</div></> : <div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>No data</div>}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer legend */}
      <div className="bg-white/5 border-t border-white/10 p-4">
        <div className="flex items-center justify-between text-xs" style={{ color: "rgb(var(--text-muted))" }}>
          <div className="flex items-center gap-4">
            {[["bg-emerald-400", "Optimal"], ["bg-yellow-400", "Acceptable"], ["bg-red-400", "Critical"]].map(([c, l]) => <div key={l} className="flex items-center gap-2"><div className={`w-2 h-2 ${c} rounded-full`} /><span>{l}</span></div>)}
          </div>
          <div>Showing {rows.length} most recent measurements</div>
        </div>
      </div>
    </div>
  );
}