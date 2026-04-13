"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";

export type ExportSettings = {
  autoExport: boolean;
  exportFormat: "csv" | "json" | "excel";
  exportFrequency: "daily" | "weekly" | "monthly";
  includeMetadata: boolean;
  compressFiles: boolean;
  retentionDays: 30 | 60 | 90 | 180 | 365;
};

const DEFAULT_EXPORT: ExportSettings = {
  autoExport: false, exportFormat: "csv", exportFrequency: "weekly",
  includeMetadata: true, compressFiles: false, retentionDays: 90,
};

/**
 * Hook: manages export settings state, persistence, and manual export trigger.
 */
export function useDataExport() {
  const toast = useToast();
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("exportSettings");
    if (saved) { try { setExportSettings(JSON.parse(saved)); } catch { /* use defaults */ } }
  }, []);

  useEffect(() => {
    const original = localStorage.getItem("exportSettings");
    setHasChanges(JSON.stringify(exportSettings) !== (original || JSON.stringify(DEFAULT_EXPORT)));
  }, [exportSettings]);

  const handleSave = () => {
    localStorage.setItem("exportSettings", JSON.stringify(exportSettings));
    toast.show("success", "Export settings saved successfully!", 3000);
    setHasChanges(false);
  };

  const handleReset = () => setExportSettings(DEFAULT_EXPORT);

  const updateSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    setExportSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleManualExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/telemetry/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: exportSettings.exportFormat, includeMetadata: exportSettings.includeMetadata, compress: exportSettings.compressFiles }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().split('T')[0];
      const ext = exportSettings.exportFormat === 'excel' ? 'xlsx' : exportSettings.exportFormat;
      a.download = `telemetry-data-${ts}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.show("success", "Data exported successfully!", 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Export failed. Please try again.";
      toast.show("error", msg, 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportSettings, hasChanges, isExporting, handleSave, handleReset, updateSetting, handleManualExport };
}
