"use client";

import { Download, FileText, FileSpreadsheet, FileJson, Archive, Clock, Database, Save, RotateCcw } from "lucide-react";
import { useDataExport } from "@/app/hooks/useDataExport";

const FORMAT_OPTIONS = [
  { value: "csv", label: "CSV", icon: FileText, description: "Comma-separated values, Excel compatible" },
  { value: "json", label: "JSON", icon: FileJson, description: "JavaScript Object Notation, developer friendly" },
  { value: "excel", label: "Excel", icon: FileSpreadsheet, description: "Microsoft Excel format with formatting" },
];

const RETENTION_OPTIONS = [
  { value: 30, label: "30 Days", desc: "1 month" },
  { value: 90, label: "90 Days", desc: "3 months" },
  { value: 180, label: "180 Days", desc: "6 months" },
  { value: 365, label: "365 Days", desc: "1 year" },
];

const FREQ_OPTIONS = [
  { value: "daily", label: "Daily", desc: "Every day" },
  { value: "weekly", label: "Weekly", desc: "Every week" },
  { value: "monthly", label: "Monthly", desc: "Every month" },
];

const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-blue-500" : "bg-gray-600"}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

/**
 * DataExportSettings — UI shell. All logic lives in useDataExport hook.
 */
export function DataExportSettings() {
  const { exportSettings, hasChanges, isExporting, handleSave, handleReset, updateSetting, handleManualExport } = useDataExport();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "rgb(var(--text-primary))" }}>Data & Export Settings</h3>
        <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Configure data export preferences and retention policies</p>
      </div>

      {/* Manual Export */}
      <div className="p-4 rounded-lg border border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-600/10">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium mb-1" style={{ color: "rgb(var(--text-primary))" }}>Export Current Data</h4>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>Download all telemetry data in your preferred format</p>
          </div>
          <button onClick={handleManualExport} disabled={isExporting} className="btn btn-primary flex items-center gap-2">
            {isExporting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Exporting...</> : <><Download className="w-4 h-4" />Export Now</>}
          </button>
        </div>
      </div>

      {/* Format */}
      <div className="space-y-3">
        <div className="flex items-center gap-2"><FileText className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /><label className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Export Format</label></div>
        <div className="space-y-2">
          {FORMAT_OPTIONS.map(f => {
            const Icon = f.icon;
            const isSel = exportSettings.exportFormat === f.value;
            return (
              <button key={f.value} onClick={() => updateSetting("exportFormat", f.value as "csv" | "json" | "excel")}
                className={`w-full p-3 rounded-lg border transition-all text-left ${isSel ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 hover:bg-white/5"}`}
                style={!isSel ? { color: "rgb(var(--text-primary))" } : {}}>
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <div className="flex-1"><div className="font-medium">{f.label}</div><div className="text-xs opacity-70">{f.description}</div></div>
                  {isSel && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto Export */}
      <div className="space-y-3">
        <div className="flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /><label className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Automatic Export</label></div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-white/10">
          <div><div className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Enable Auto Export</div><div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Export data at regular intervals</div></div>
          <Toggle value={exportSettings.autoExport} onToggle={() => updateSetting("autoExport", !exportSettings.autoExport)} />
        </div>
        {exportSettings.autoExport && (
          <div className="ml-4 pl-4 border-l-2 border-blue-500/30 grid grid-cols-3 gap-3">
            {FREQ_OPTIONS.map(o => (
              <button key={o.value} onClick={() => updateSetting("exportFrequency", o.value as "daily" | "weekly" | "monthly")}
                className={`p-3 rounded-lg border transition-all ${exportSettings.exportFrequency === o.value ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 hover:bg-white/5"}`}
                style={exportSettings.exportFrequency !== o.value ? { color: "rgb(var(--text-primary))" } : {}}>
                <div className="text-sm font-medium">{o.label}</div><div className="text-xs opacity-70">{o.desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Export Options</h4>
        <div className="flex items-center justify-between p-3 rounded-lg border border-white/10">
          <div><div className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Include Metadata</div><div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Export timestamps, user info, system data</div></div>
          <Toggle value={exportSettings.includeMetadata} onToggle={() => updateSetting("includeMetadata", !exportSettings.includeMetadata)} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-white/10">
          <div className="flex items-center gap-2"><Archive className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /><div><div className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Compress Files</div><div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>ZIP archives for large exports</div></div></div>
          <Toggle value={exportSettings.compressFiles} onToggle={() => updateSetting("compressFiles", !exportSettings.compressFiles)} />
        </div>
      </div>

      {/* Retention */}
      <div className="space-y-3">
        <div className="flex items-center gap-2"><Database className="w-4 h-4" style={{ color: "rgb(var(--text-primary))" }} /><label className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Data Retention</label></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RETENTION_OPTIONS.map(o => (
            <button key={o.value} onClick={() => updateSetting("retentionDays", o.value as 30 | 60 | 90 | 180 | 365)}
              className={`p-3 rounded-lg border transition-all ${exportSettings.retentionDays === o.value ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-white/10 hover:bg-white/5"}`}
              style={exportSettings.retentionDays !== o.value ? { color: "rgb(var(--text-primary))" } : {}}>
              <div className="text-sm font-medium">{o.label}</div><div className="text-xs opacity-70">{o.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <button onClick={handleReset} className="btn btn-ghost btn-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" />Reset to Defaults</button>
        <button onClick={handleSave} disabled={!hasChanges} className={`btn btn-sm flex items-center gap-2 ${hasChanges ? "btn-primary" : "btn-ghost opacity-50 cursor-not-allowed"}`}><Save className="w-4 h-4" />Save Changes</button>
      </div>
    </div>
  );
}
