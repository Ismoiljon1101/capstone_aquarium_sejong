"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { playAlertSound, requestAudioPermission } from "@/app/lib/sound";
import { Bell, AlertTriangle, Thermometer, Droplets, Activity, Save, RotateCcw, Volume2, VolumeX, Play } from "lucide-react";

type AlertThresholds = {
  pH: { min: number; max: number; enabled: boolean };
  temp_c: { min: number; max: number; enabled: boolean };
  do_mg_l: { min: number; max: number; enabled: boolean };
  quality_ai: { min: number; max: number; enabled: boolean };
};

type NotificationSettings = {
  toastEnabled: boolean; soundEnabled: boolean; emailEnabled: boolean;
  frequency: "immediate" | "batched";
  quietHours: { enabled: boolean; start: string; end: string };
};

const DEFAULT_THRESHOLDS: AlertThresholds = {
  pH: { min: 6.5, max: 8.0, enabled: true }, temp_c: { min: 20, max: 30, enabled: true },
  do_mg_l: { min: 5.0, max: 12.0, enabled: true }, quality_ai: { min: 6.0, max: 10.0, enabled: true },
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  toastEnabled: true, soundEnabled: false, emailEnabled: false, frequency: "immediate",
  quietHours: { enabled: false, start: "22:00", end: "08:00" },
};

const THRESHOLD_CONFIGS = [
  { key: "pH" as const, label: "pH Level", icon: Droplets, unit: "", step: 0.1, color: "text-blue-400" },
  { key: "temp_c" as const, label: "Temperature", icon: Thermometer, unit: "°C", step: 0.5, color: "text-orange-400" },
  { key: "do_mg_l" as const, label: "Dissolved Oxygen", icon: Activity, unit: "mg/L", step: 0.1, color: "text-green-400" },
  { key: "quality_ai" as const, label: "AI Quality Score", icon: AlertTriangle, unit: "/10", step: 0.1, color: "text-purple-400" },
];

const Toggle = ({ value, onToggle, size = "lg" }: { value: boolean; onToggle: () => void; size?: "sm" | "lg" }) => (
  <button onClick={onToggle} className={`relative inline-flex items-center rounded-full transition-colors ${size === "sm" ? "h-5 w-9" : "h-6 w-11"} ${value ? "bg-blue-500" : "bg-gray-600"}`}>
    <span className={`inline-block transform rounded-full bg-white transition-transform ${size === "sm" ? "h-3 w-3" : "h-4 w-4"} ${value ? (size === "sm" ? "translate-x-5" : "translate-x-6") : "translate-x-1"}`} />
  </button>
);

/**
 * AlertSettings — threshold configuration and notification preferences.
 */
export function AlertSettings() {
  const toast = useToast();
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("alertThresholds");
    const n = localStorage.getItem("notificationSettings");
    if (t) { try { setThresholds(JSON.parse(t)); } catch { /**/ } }
    if (n) { try { setNotifications(JSON.parse(n)); } catch { /**/ } }
  }, []);

  useEffect(() => {
    const tOrig = localStorage.getItem("alertThresholds");
    const nOrig = localStorage.getItem("notificationSettings");
    setHasChanges(
      JSON.stringify(thresholds) !== (tOrig || JSON.stringify(DEFAULT_THRESHOLDS)) ||
      JSON.stringify(notifications) !== (nOrig || JSON.stringify(DEFAULT_NOTIFICATIONS))
    );
  }, [thresholds, notifications]);

  const handleSave = () => {
    localStorage.setItem("alertThresholds", JSON.stringify(thresholds));
    localStorage.setItem("notificationSettings", JSON.stringify(notifications));
    toast.show("success", "Alert settings saved successfully!", 3000);
    setHasChanges(false);
  };

  const handleTestSound = async () => {
    const ok = await requestAudioPermission();
    if (!ok) { toast.show("error", "Audio permission required.", 3000); return; }
    playAlertSound('warning');
    toast.show("info", "Test sound played!", 2000);
  };

  const updateThreshold = (metric: keyof AlertThresholds, field: string, value: number | boolean) =>
    setThresholds(prev => ({ ...prev, [metric]: { ...prev[metric], [field]: value } }));

  const updateNotification = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) =>
    setNotifications(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "rgb(var(--text-primary))" }}>Alert Settings</h3>
        <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Configure thresholds and notification preferences for water quality alerts</p>
      </div>

      {/* Thresholds */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium flex items-center gap-2" style={{ color: "rgb(var(--text-primary))" }}><AlertTriangle className="w-5 h-5" />Alert Thresholds</h4>
        {THRESHOLD_CONFIGS.map(cfg => {
          const Icon = cfg.icon;
          const t = thresholds[cfg.key];
          return (
            <div key={cfg.key} className="p-4 rounded-lg border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${cfg.color}`} /><span className="font-medium" style={{ color: "rgb(var(--text-primary))" }}>{cfg.label}</span></div>
                <Toggle value={t.enabled} onToggle={() => updateThreshold(cfg.key, "enabled", !t.enabled)} size="sm" />
              </div>
              {t.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  {(["min", "max"] as const).map(field => (
                    <div key={field}>
                      <label className="block text-xs font-medium mb-1" style={{ color: "rgb(var(--text-muted))" }}>{field === "min" ? "Minimum" : "Maximum"} {cfg.unit}</label>
                      <input type="number" step={cfg.step} value={t[field]} onChange={e => updateThreshold(cfg.key, field, parseFloat(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm" style={{ color: "rgb(var(--text-primary))" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium flex items-center gap-2" style={{ color: "rgb(var(--text-primary))" }}><Bell className="w-5 h-5" />Notification Preferences</h4>
        <div className="flex items-center justify-between p-3 rounded-lg border border-white/10">
          <div className="flex items-center gap-2"><Bell className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /><div><div className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Toast Notifications</div><div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Show alerts in the dashboard</div></div></div>
          <Toggle value={notifications.toastEnabled} onToggle={() => updateNotification("toastEnabled", !notifications.toastEnabled)} />
        </div>
        <div className="p-3 rounded-lg border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">{notifications.soundEnabled ? <Volume2 className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /> : <VolumeX className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} />}<div><div className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Sound Alerts</div><div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Play sound for critical alerts</div></div></div>
            <Toggle value={notifications.soundEnabled} onToggle={() => updateNotification("soundEnabled", !notifications.soundEnabled)} />
          </div>
          <button onClick={handleTestSound} className="w-full btn btn-ghost btn-sm flex items-center justify-center gap-2"><Play className="w-4 h-4" />Test Sound</button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Alert Frequency</label>
          <div className="grid grid-cols-2 gap-3">
            {(["immediate", "batched"] as const).map(f => (
              <button key={f} onClick={() => updateNotification("frequency", f)}
                className={`p-3 rounded-lg border transition-all ${notifications.frequency === f ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 hover:bg-white/5"}`}
                style={notifications.frequency !== f ? { color: "rgb(var(--text-primary))" } : {}}>
                <div className="text-sm font-medium">{f === "immediate" ? "Immediate" : "Batched"}</div>
                <div className="text-xs opacity-70">{f === "immediate" ? "Alert as soon as detected" : "Group alerts every 5 minutes"}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <button onClick={() => { setThresholds(DEFAULT_THRESHOLDS); setNotifications(DEFAULT_NOTIFICATIONS); }} className="btn btn-ghost btn-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" />Reset to Defaults</button>
        <button onClick={handleSave} disabled={!hasChanges} className={`btn btn-sm flex items-center gap-2 ${hasChanges ? "btn-primary" : "btn-ghost opacity-50 cursor-not-allowed"}`}><Save className="w-4 h-4" />Save Changes</button>
      </div>
    </div>
  );
}
