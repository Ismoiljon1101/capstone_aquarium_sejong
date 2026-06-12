"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket";
import {
  Activity, Droplets, Thermometer, Wind, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Fish, Microscope, Waves,
  Brain, Clock, TrendingUp, TrendingDown, Minus
} from "lucide-react";

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────────
interface QualityResult {
  status: "ok" | "warn" | "critical";
  condition: "Good" | "Average" | "Bad";
  score: number;
  is_alert: boolean;
  readings: { pH: number; temp_c: number; do_mg_l: number };
  warnings: { param: string; value: number; issue: string }[];
  timestamp: string;
}

interface DiseaseDetection {
  disease: string;
  confidence: number;
  is_alert: number;
  bbox_x1: number; bbox_y1: number; bbox_x2: number; bbox_y2: number;
}

interface DiseaseResult {
  status: string;
  detections: DiseaseDetection[];
  total: number;
  alerts: number;
  summary: "alert" | "healthy" | "no_fish_detected";
}

interface DiseaseStats {
  total_detections: number;
  total_alerts: number;
  by_disease: { disease: string; count: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const statusColor = (s: string) =>
  s === "ok" || s === "healthy" ? "text-emerald-400"
  : s === "warn" ? "text-amber-400"
  : "text-red-400";

const statusBg = (s: string) =>
  s === "ok" || s === "healthy" ? "bg-emerald-400/10 border-emerald-400/20"
  : s === "warn" ? "bg-amber-400/10 border-amber-400/20"
  : "bg-red-400/10 border-red-400/20";

const StatusIcon = ({ status }: { status: string }) =>
  status === "ok" || status === "healthy"
    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
    : status === "warn"
    ? <AlertTriangle className="w-4 h-4 text-amber-400" />
    : <XCircle className="w-4 h-4 text-red-400" />;

const ScoreBar = ({ score, status }: { score: number; status: string }) => (
  <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
    <div
      className={`h-1.5 rounded-full transition-all duration-700 ${
        status === "ok" ? "bg-emerald-400"
        : status === "warn" ? "bg-amber-400"
        : "bg-red-400"
      }`}
      style={{ width: `${Math.min(score, 100)}%` }}
    />
  </div>
);

// ── Sub-components ─────────────────────────────────────────────────────────────

function WaterQualityCard({ sensorData }: { sensorData: any }) {
  const [result, setResult] = useState<QualityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const predict = useCallback(async (pH: number, temp_c: number, do_mg_l: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${AI_URL}/predict/quality`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pH, temp_c, do_mg_l }),
      });
      const data = await res.json();
      setResult(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Quality prediction failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-predict when sensor data arrives
  useEffect(() => {
    if (sensorData?.pH && sensorData?.temp_c && sensorData?.do_mg_l) {
      predict(sensorData.pH, sensorData.temp_c, sensorData.do_mg_l);
    }
  }, [sensorData, predict]);

  // Also predict with defaults on mount
  useEffect(() => {
    const pH = sensorData?.pH ?? 7.0;
    const temp_c = sensorData?.temp_c ?? 25.0;
    const do_mg_l = sensorData?.do_mg_l ?? 7.5;
    predict(pH, temp_c, do_mg_l);
  }, []);

  const sensors = [
    { label: "pH", value: sensorData?.pH ?? 7.0, icon: Droplets, unit: "pH", color: "text-blue-400" },
    { label: "Temp", value: sensorData?.temp_c ?? 25.0, icon: Thermometer, unit: "°C", color: "text-orange-400" },
    { label: "DO", value: sensorData?.do_mg_l ?? 7.5, icon: Wind, unit: "mg/L", color: "text-cyan-400" },
  ];

  return (
    <div className="p-5 bg-white/[0.03] border border-white/[0.07] rounded-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-sm">Water Quality AI</span>
        </div>
        <div className="flex items-center gap-2">
          {result && <StatusIcon status={result.status} />}
          <button
            onClick={() => predict(sensorData?.pH ?? 7.0, sensorData?.temp_c ?? 25.0, sensorData?.do_mg_l ?? 7.5)}
            disabled={loading}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Sensor readings */}
      <div className="grid grid-cols-3 gap-2">
        {sensors.map(s => (
          <div key={s.label} className="p-3 bg-white/5 rounded-xl text-center">
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <div className="text-lg font-bold">{s.value.toFixed(1)}</div>
            <div className="text-[10px] opacity-50">{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div className={`p-3 rounded-xl border ${statusBg(result.status)}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-bold ${statusColor(result.status)}`}>
              {result.condition}
            </span>
            <span className={`text-xs font-mono ${statusColor(result.status)}`}>
              {result.score.toFixed(0)}%
            </span>
          </div>
          <ScoreBar score={result.score} status={result.status} />
        </div>
      )}

      {/* Warnings */}
      {result?.warnings && result.warnings.length > 0 && (
        <div className="space-y-1.5">
          {result.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-amber-400/5 border border-amber-400/10 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-xs opacity-80">{w.issue}</span>
            </div>
          ))}
        </div>
      )}

      {lastChecked && (
        <div className="flex items-center gap-1 text-[10px] opacity-30">
          <Clock className="w-3 h-3" />
          Last checked: {lastChecked}
        </div>
      )}
    </div>
  );
}

function DiseaseDetectionCard() {
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [stats, setStats] = useState<DiseaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePath, setImagePath] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${AI_URL}/disease/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) { /* silent */ }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const runDetection = async () => {
    if (!imagePath.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${AI_URL}/predict/disease`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath: imagePath.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      fetchStats();
    } catch (e: any) {
      setError(e.message || "Detection failed");
    } finally {
      setLoading(false);
    }
  };

  const summary = result?.summary ?? "no_fish_detected";

  return (
    <div className="p-5 bg-white/[0.03] border border-white/[0.07] rounded-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Microscope className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-sm">Disease Detection AI</span>
        </div>
        {result && <StatusIcon status={summary === "alert" ? "critical" : summary === "healthy" ? "ok" : "warn"} />}
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-white/5 rounded-xl text-center">
            <div className="text-lg font-bold">{stats.total_detections}</div>
            <div className="text-[10px] opacity-50">Total Scans</div>
          </div>
          <div className="p-2 bg-red-400/10 rounded-xl text-center">
            <div className="text-lg font-bold text-red-400">{stats.total_alerts}</div>
            <div className="text-[10px] opacity-50">Alerts</div>
          </div>
          <div className="p-2 bg-white/5 rounded-xl text-center">
            <div className="text-lg font-bold">{stats.by_disease.length}</div>
            <div className="text-[10px] opacity-50">Diseases</div>
          </div>
        </div>
      )}

      {/* Image path input */}
      <div className="space-y-2">
        <input
          type="text"
          value={imagePath}
          onChange={e => setImagePath(e.target.value)}
          placeholder="Image path or URL..."
          className="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-400/50 placeholder-white/20"
          onKeyDown={e => e.key === "Enter" && runDetection()}
        />
        <button
          onClick={runDetection}
          disabled={loading || !imagePath.trim()}
          className="w-full py-2 text-xs font-bold rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/20 hover:border-purple-400/40 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Microscope className="w-3.5 h-3.5" />}
          {loading ? "Analyzing..." : "Run Detection"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 bg-red-400/10 border border-red-400/20 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`p-3 rounded-xl border ${
          summary === "alert" ? "bg-red-400/10 border-red-400/20"
          : summary === "healthy" ? "bg-emerald-400/10 border-emerald-400/20"
          : "bg-white/5 border-white/10"
        }`}>
          <div className={`text-sm font-bold mb-2 ${
            summary === "alert" ? "text-red-400"
            : summary === "healthy" ? "text-emerald-400"
            : "opacity-50"
          }`}>
            {summary === "alert" ? "⚠ Disease Detected"
            : summary === "healthy" ? "✓ Healthy Fish"
            : "No fish detected"}
          </div>
          {result.detections.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-t border-white/5">
              <span className={d.is_alert ? "text-red-300" : "text-emerald-300"}>{d.disease}</span>
              <span className="opacity-50 font-mono">{(d.confidence * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Disease breakdown */}
      {stats && stats.by_disease.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] opacity-40 uppercase font-bold">Detection History</div>
          {stats.by_disease.slice(0, 4).map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="opacity-70">{d.disease}</span>
              <span className="font-mono opacity-50">{d.count}x</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BehaviorCard({ healthReport, fishCount }: { healthReport: any; fishCount: any }) {
  const [attitudeStats, setAttitudeStats] = useState<any>(null);

  useEffect(() => {
    fetch(`${AI_URL}/attitude/history?limit=10`)
      .then(r => r.json())
      .then(d => setAttitudeStats(d))
      .catch(() => {});
  }, []);

  const behavior = healthReport?.behaviorStatus ?? "Monitoring fish behavior...";
  const visualStatus = healthReport?.visualStatus ?? "good";
  const count = fishCount?.count ?? 0;

  const recentAlerts = attitudeStats?.data?.filter((d: any) =>
    d.tilt_severity === "moderate_tilt" || d.tilt_severity === "severe_tilt"
  ).length ?? 0;

  return (
    <div className="p-5 bg-white/[0.03] border border-white/[0.07] rounded-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-sm">Behavior & Attitude AI</span>
        </div>
        <StatusIcon status={visualStatus} />
      </div>

      {/* Fish count + attitude */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-white/5 rounded-xl text-center">
          <Fish className="w-4 h-4 mx-auto mb-1 text-blue-400" />
          <div className="text-2xl font-bold">{count}</div>
          <div className="text-[10px] opacity-50">Fish Detected</div>
        </div>
        <div className={`p-3 rounded-xl text-center ${recentAlerts > 0 ? "bg-red-400/10" : "bg-emerald-400/10"}`}>
          <Activity className={`w-4 h-4 mx-auto mb-1 ${recentAlerts > 0 ? "text-red-400" : "text-emerald-400"}`} />
          <div className={`text-2xl font-bold ${recentAlerts > 0 ? "text-red-400" : "text-emerald-400"}`}>{recentAlerts}</div>
          <div className="text-[10px] opacity-50">Tilt Alerts</div>
        </div>
      </div>

      {/* Behavior summary */}
      <div className={`p-3 rounded-xl border ${statusBg(visualStatus)}`}>
        <div className="text-[10px] opacity-40 uppercase font-bold mb-1">Behavior Report</div>
        <p className="text-xs opacity-80 leading-relaxed">{behavior}</p>
      </div>

      {/* Recent attitude data */}
      {attitudeStats?.data && attitudeStats.data.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] opacity-40 uppercase font-bold">Recent Attitude</div>
          {attitudeStats.data.slice(0, 3).map((d: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className={
                  d.tilt_severity === "normal" ? "text-emerald-400"
                  : d.tilt_severity === "mild_tilt" ? "text-amber-400"
                  : "text-red-400"
                }>●</span>
                <span className="opacity-60">{d.region}</span>
              </div>
              <span className="opacity-40 font-mono">{d.swim_angle}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export const AIMonitorPanel: React.FC = () => {
  const { sensorData, fishCount, healthReport, connected } = useSocket();
  const [qualityHistory, setQualityHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${AI_URL}/quality/history?limit=5`)
      .then(r => r.json())
      .then(d => setQualityHistory(d.data ?? []))
      .catch(() => {});
  }, []);

  const overallAlerts = qualityHistory.filter(r => r.is_alert).length;

  return (
    <section className="space-y-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          AI Monitoring
        </h2>
        <div className="flex items-center gap-2">
          {overallAlerts > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-400/10 border border-red-400/20 text-red-400 rounded-full">
              {overallAlerts} alerts
            </span>
          )}
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
            connected ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
          }`}>
            {connected ? "● Live" : "● Offline"}
          </span>
        </div>
      </div>

      {/* Three cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WaterQualityCard sensorData={sensorData} />
        <DiseaseDetectionCard />
        <BehaviorCard healthReport={healthReport} fishCount={fishCount} />
      </div>
    </section>
  );
};
