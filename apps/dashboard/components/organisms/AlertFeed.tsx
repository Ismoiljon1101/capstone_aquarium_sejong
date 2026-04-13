"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useApi } from "../../hooks/useApi";

const SEV: Record<string, { color: string; border: string; icon: string }> = {
  CRITICAL:  { color: "text-red-400",    border: "border-red-500",    icon: "🛑" },
  EMERGENCY: { color: "text-red-300",    border: "border-red-400",    icon: "⚠️" },
  WARNING:   { color: "text-amber-400",  border: "border-amber-400",  icon: "⚠️" },
  INFO:      { color: "text-blue-400",   border: "border-blue-500",   icon: "ℹ️" },
};

interface Alert { alertId: string; message: string; severity: string; createdAt?: string; }

export const AlertFeed: React.FC = () => {
  const { alerts: socketAlerts, dismissAlert } = useSocket();
  const { getActiveAlerts, acknowledgeAlert } = useApi();
  const [apiAlerts, setApiAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    getActiveAlerts()
      .then((r) => { if (Array.isArray(r.data)) setApiAlerts(r.data); })
      .catch(() => null);
  }, []);

  // Merge: socket alerts up front, then API alerts not already in socket list
  const socketIds = new Set(socketAlerts.map((a) => a.alertId));
  const merged: Alert[] = [
    ...socketAlerts,
    ...apiAlerts.filter((a) => !socketIds.has(a.alertId)),
  ];

  const handleDismiss = (a: Alert) => {
    acknowledgeAlert(a.alertId).catch(() => null);
    dismissAlert(a.alertId);
    setApiAlerts((p) => p.filter((x) => x.alertId !== a.alertId));
  };

  const handleClearAll = () => {
    merged.forEach((a) => acknowledgeAlert(a.alertId).catch(() => null));
    merged.forEach((a) => dismissAlert(a.alertId));
    setApiAlerts([]);
  };

  return (
    <section className="bg-slate-900/80 border border-white/[0.07] rounded-2xl p-5" style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.3)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <h2 className="text-base font-black text-slate-100 tracking-tight">Active Alerts</h2>
          {merged.length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
              {merged.length}
            </span>
          )}
        </div>
        {merged.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-[11px] font-bold text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-3 py-1 rounded-full transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {merged.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {merged.map((a) => {
            const sev = SEV[a.severity?.toUpperCase()] ?? SEV.INFO;
            return (
              <div
                key={a.alertId}
                className={`flex items-start gap-3 bg-slate-800/60 rounded-xl p-3 border-l-2 ${sev.border} border-t border-r border-b border-white/[0.05]`}
              >
                <span className="text-base mt-0.5 shrink-0">{sev.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">{a.message}</p>
                  {a.createdAt && (
                    <p className="text-[10px] text-slate-600 mt-1">
                      {new Date(a.createdAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDismiss(a)}
                  className="shrink-0 text-[10px] text-slate-500 hover:text-slate-300 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <span className="text-3xl">✅</span>
          <p className="text-sm font-semibold text-slate-300">All Clear</p>
          <p className="text-xs text-slate-600">No active alerts. All systems nominal.</p>
        </div>
      )}
    </section>
  );
};
