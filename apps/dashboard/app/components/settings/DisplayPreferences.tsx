"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { useTheme } from "next-themes";
import { useSettings } from "@/app/hooks/useSettings";
import { Palette, Monitor, Sun, Moon, Smartphone, BarChart3, Table, Minimize2, Save, RotateCcw } from "lucide-react";

const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-blue-500" : "bg-gray-600"}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

type OptionBtnProps = { label: string; desc: string; active: boolean; onClick: () => void };
const OptionBtn = ({ label, desc, active, onClick }: OptionBtnProps) => (
  <button onClick={onClick} className={`p-3 rounded-lg border transition-all ${active ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 hover:bg-white/5"}`} style={!active ? { color: "rgb(var(--text-primary))" } : {}}>
    <div className="text-sm font-medium">{label}</div>
    <div className="text-xs opacity-70">{desc}</div>
  </button>
);

/**
 * DisplayPreferences — theme, chart type, animation speed, table pagination, compact mode.
 */
export function DisplayPreferences() {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const { settings, saveSettings, isLoaded } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { setLocalSettings(settings); }, [settings]);
  useEffect(() => { setHasChanges(JSON.stringify(localSettings) !== JSON.stringify(settings)); }, [localSettings, settings]);

  const handleSave = () => { saveSettings(localSettings); toast.show("success", "Display preferences saved!", 3000); setHasChanges(false); };
  const handleReset = () => setLocalSettings({ ...settings, chartType: "line" as const, tablePagination: 25 as const, compactMode: false, showGridLines: true, showDataPoints: true, animationSpeed: "normal" as const });
  const upd = <K extends keyof typeof localSettings>(key: K, val: typeof localSettings[K]) => setLocalSettings(p => ({ ...p, [key]: val }));

  if (!isLoaded) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "rgb(var(--text-primary))" }}>Display Preferences</h3>
        <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Customize the visual appearance and layout of your dashboard</p>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <div className="flex items-center gap-2"><Palette className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /><label className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Theme</label></div>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => setTheme("light")} className={`p-3 rounded-lg border transition-all ${theme === "light" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 hover:bg-white/5"}`} style={theme !== "light" ? { color: "rgb(var(--text-primary))" } : {}}><Sun className="w-5 h-5 mx-auto mb-1" /><div className="text-sm font-medium">Light</div><div className="text-xs opacity-70">Bright theme</div></button>
          <button onClick={() => setTheme("dark")} className={`p-3 rounded-lg border transition-all ${theme === "dark" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 hover:bg-white/5"}`} style={theme !== "dark" ? { color: "rgb(var(--text-primary))" } : {}}><Moon className="w-5 h-5 mx-auto mb-1" /><div className="text-sm font-medium">Dark</div><div className="text-xs opacity-70">Dark theme</div></button>
          <button onClick={() => setTheme("system")} className={`p-3 rounded-lg border transition-all ${theme === "system" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 hover:bg-white/5"}`} style={theme !== "system" ? { color: "rgb(var(--text-primary))" } : {}}><Monitor className="w-5 h-5 mx-auto mb-1" /><div className="text-sm font-medium">System</div><div className="text-xs opacity-70">Auto detect</div></button>
        </div>
      </div>

      {/* Chart Type */}
      <div className="space-y-3">
        <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /><label className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Chart Type</label></div>
        <div className="grid grid-cols-3 gap-3">
          {(["line", "area", "bar"] as const).map(v => <OptionBtn key={v} label={`${v.charAt(0).toUpperCase() + v.slice(1)} Chart`} desc={v === "line" ? "Connected points" : v === "area" ? "Filled regions" : "Vertical bars"} active={localSettings.chartType === v} onClick={() => upd("chartType", v)} />)}
        </div>
      </div>

      {/* Chart Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Chart Options</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg border border-white/10">
            <div><div className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Show Grid Lines</div><div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Display background grid for better readability</div></div>
            <Toggle value={localSettings.showGridLines} onToggle={() => upd("showGridLines", !localSettings.showGridLines)} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-white/10">
            <div><div className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Show Data Points</div><div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Display individual data points on charts</div></div>
            <Toggle value={localSettings.showDataPoints} onToggle={() => upd("showDataPoints", !localSettings.showDataPoints)} />
          </div>
        </div>
      </div>

      {/* Animation Speed */}
      <div className="space-y-3">
        <div className="flex items-center gap-2"><Smartphone className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /><label className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Animation Speed</label></div>
        <div className="grid grid-cols-3 gap-3">
          <OptionBtn label="Slow" desc="Smooth & relaxed" active={localSettings.animationSpeed === "slow"} onClick={() => upd("animationSpeed", "slow")} />
          <OptionBtn label="Normal" desc="Balanced speed" active={localSettings.animationSpeed === "normal"} onClick={() => upd("animationSpeed", "normal")} />
          <OptionBtn label="Fast" desc="Quick & snappy" active={localSettings.animationSpeed === "fast"} onClick={() => upd("animationSpeed", "fast")} />
        </div>
      </div>

      {/* Table Pagination */}
      <div className="space-y-3">
        <div className="flex items-center gap-2"><Table className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /><label className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Table Pagination</label></div>
        <div className="grid grid-cols-4 gap-3">
          {([10, 25, 50, 100] as const).map(s => (
            <button key={s} onClick={() => upd("tablePagination", s)} className={`p-3 rounded-lg border transition-all ${localSettings.tablePagination === s ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 hover:bg-white/5"}`} style={localSettings.tablePagination !== s ? { color: "rgb(var(--text-primary))" } : {}}>
              <div className="text-sm font-medium">{s}</div><div className="text-xs opacity-70">rows</div>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Mode */}
      <div className="space-y-3">
        <div className="flex items-center gap-2"><Minimize2 className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /><label className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Layout Options</label></div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-white/10">
          <div><div className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Compact Mode</div><div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Reduce spacing and padding for more content</div></div>
          <Toggle value={localSettings.compactMode} onToggle={() => upd("compactMode", !localSettings.compactMode)} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <button onClick={handleReset} className="btn btn-ghost btn-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" />Reset to Defaults</button>
        <button onClick={handleSave} disabled={!hasChanges} className={`btn btn-sm flex items-center gap-2 ${hasChanges ? "btn-primary" : "btn-ghost opacity-50 cursor-not-allowed"}`}><Save className="w-4 h-4" />Save Changes</button>
      </div>
    </div>
  );
}
