"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Video, VideoOff, ChevronDown, AlertTriangle, RefreshCw } from "lucide-react";
import { API } from "@/app/api/endpoints";

const STORAGE_KEY = "veronica.cameraUid";

type CameraDevice = { index: number; name: string; uid: string };
type SelectedCamera = CameraDevice | null;

function readStoredUid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredUid(uid: string | null) {
  try {
    if (uid) window.localStorage.setItem(STORAGE_KEY, uid);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore persistence failures */
  }
}

/**
 * Live Camera card. The selected camera here is the single source of truth for
 * the whole vision pipeline: the choice (a stable AVFoundation uid, NOT the
 * volatile index) is persisted to localStorage and written to the backend
 * (POST /vision/camera), which resolves the uid to the current OpenCV index and
 * uses it for both this live preview (/vision/stream) and every Scan / Refresh
 * Scan / analysis snapshot.
 */
export function VeronicaLiveVideo() {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [streamNonce, setStreamNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const didInit = useRef(false);

  // Push a uid to the backend so scans + stream resolve to the same camera.
  const selectOnBackend = useCallback(
    async (uid: string | null): Promise<{ ok: boolean; selected: SelectedCamera }> => {
      const res = await fetch(API.vision.setCamera, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: uid ?? "" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [],
  );

  // Initial resolve: read the persisted uid and re-resolve it to a live device.
  const initFromStorage = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(API.vision.cameras);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { devices: CameraDevice[]; selected: SelectedCamera } = await res.json();
      const list = data.devices ?? [];
      setDevices(list);

      const storedUid = readStoredUid();
      if (storedUid && list.some((d) => d.uid === storedUid)) {
        // Re-resolve the persisted camera to its current index on the backend.
        const result = await selectOnBackend(storedUid);
        if (result.ok && result.selected) {
          setSelectedUid(result.selected.uid);
        } else {
          writeStoredUid(null);
          setSelectedUid(data.selected?.uid ?? null);
          setNotice("Saved camera is unavailable — using the default camera.");
        }
      } else if (storedUid) {
        // Persisted camera is gone entirely — fall back and clear it.
        writeStoredUid(null);
        await selectOnBackend(null);
        setSelectedUid(null);
        setNotice("Saved camera is no longer connected — switched to the default camera.");
      } else {
        setSelectedUid(data.selected?.uid ?? null);
      }
    } catch {
      setError("Could not reach the camera service.");
      setDevices([]);
    } finally {
      setBusy(false);
    }
  }, [selectOnBackend]);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    void initFromStorage();
  }, [initFromStorage]);

  // Switch cameras live, without reloading the page.
  const onSelectCamera = useCallback(
    async (uid: string) => {
      setSelectedUid(uid);
      writeStoredUid(uid);
      setNotice(null);
      setError(null);
      try {
        await selectOnBackend(uid);
      } catch {
        setError("Failed to switch camera.");
        return;
      }
      setStreamNonce((n) => n + 1);
    },
    [selectOnBackend],
  );

  // Re-enumerate devices and re-resolve the saved camera's uid to a fresh index.
  const refreshCameras = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(API.vision.refreshCameras, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { devices: CameraDevice[]; selected: SelectedCamera; fellBack: boolean } =
        await res.json();
      setDevices(data.devices ?? []);
      setSelectedUid(data.selected?.uid ?? null);
      if (data.fellBack) {
        writeStoredUid(null);
        setNotice("Selected camera disconnected — switched to the default camera.");
      } else {
        setNotice(null);
      }
      if (isLive) setStreamNonce((n) => n + 1);
    } catch {
      setError("Could not refresh cameras.");
    } finally {
      setBusy(false);
    }
  }, [isLive]);

  const toggleLive = useCallback(async () => {
    if (isLive) {
      setIsLive(false);
      return;
    }
    // Re-resolve before going live so a reshuffled/yanked index is corrected.
    await refreshCameras();
    setStreamNonce((n) => n + 1);
    setIsLive(true);
  }, [isLive, refreshCameras]);

  const activeName =
    devices.find((d) => d.uid === selectedUid)?.name ?? "Default camera (auto)";

  const streamSrc = `${API.vision.stream}?_=${streamNonce}`;

  return (
    <div className="card-glass animate-slide-in" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "rgb(var(--text-primary))" }}>
          Live Camera
        </h3>
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="flex items-center gap-2 bg-black/40 rounded-full px-2.5 py-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-white">LIVE</span>
            </div>
          )}
          <button
            onClick={refreshCameras}
            disabled={busy}
            className="btn btn-ghost btn-sm"
            title="Re-enumerate cameras and re-resolve the saved one"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
            Refresh Cameras
          </button>
        </div>
      </div>

      {/* Preview (backend MJPEG, follows the selected device) */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/10 mb-3">
        {isLive ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={streamSrc}
            alt="Live camera stream"
            className="w-full h-full object-cover"
            onError={() => setError("Live stream unavailable — is the camera connected?")}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <VideoOff className="w-10 h-10 mb-2 text-gray-400" />
            <span className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
              Camera off — press Live to start
            </span>
          </div>
        )}
      </div>

      {/* Live button + camera selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLive}
          disabled={busy}
          className={`btn btn-sm ${isLive ? "btn-secondary" : "btn-primary"}`}
          title={isLive ? "Stop preview" : "Start preview"}
        >
          {isLive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          {isLive ? "Stop" : "Live"}
        </button>

        <div className="relative flex-1">
          <select
            value={selectedUid ?? ""}
            onChange={(e) => onSelectCamera(e.target.value)}
            className="input-glass w-full appearance-none pr-8 text-sm"
            title="Select camera"
          >
            {devices.length === 0 && <option value="">No cameras detected</option>}
            {devices.map((d) => (
              <option key={d.uid} value={d.uid}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
        </div>
      </div>

      {/* Active camera name */}
      <p className="text-xs mt-2" style={{ color: "rgb(var(--text-secondary))" }}>
        Active: <span className="font-medium">{activeName}</span>
        <span className="opacity-50"> — used for all scans &amp; analysis</span>
      </p>

      {notice && (
        <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="mt-3 p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
