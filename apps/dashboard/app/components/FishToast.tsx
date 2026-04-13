"use client";

import { X } from "lucide-react";
import type { ToastType } from "@/app/contexts/ToastContext";
import { useFishAnimation } from "@/app/hooks/useFishAnimation";

const CONFIGS: Record<ToastType, { color: string; fishColor: string }> = {
  error:   { color: "rgb(239, 68, 68)",   fishColor: "#ef4444" },
  success: { color: "rgb(16, 185, 129)",  fishColor: "#10b981" },
  alert:   { color: "rgb(245, 158, 11)",  fishColor: "#f59e0b" },
  warning: { color: "rgb(245, 158, 11)",  fishColor: "#f59e0b" },
  info:    { color: "rgb(59, 130, 246)",  fishColor: "#3b82f6" },
  update:  { color: "rgb(99, 102, 241)",  fishColor: "#6366f1" },
};

const FishSVG = ({ color }: { color: string }) => (
  <svg width="48" height="32" viewBox="0 0 48 32">
    <ellipse cx="24" cy="16" rx="18" ry="12" fill={color} opacity="0.9" />
    <path d="M 6 16 Q 2 12, 2 16 Q 2 20, 6 16" fill={color} opacity="0.8" />
    <circle cx="28" cy="14" r="3" fill="white" />
    <circle cx="29" cy="13.5" r="1.5" fill="black" />
    <ellipse cx="20" cy="8" rx="4" ry="6" fill={color} opacity="0.7" />
    <ellipse cx="20" cy="24" rx="4" ry="6" fill={color} opacity="0.7" />
  </svg>
);

/**
 * FishToast — animated fish swimming across screen with speech bubble notification.
 * All animation logic lives in useFishAnimation hook.
 */
export function FishToast() {
  const { toast, phase, pos, dismiss } = useFishAnimation();
  if (!toast) return null;
  const cfg = CONFIGS[toast.type];

  return (
    <div className="fixed top-6 left-1/2 z-[9999] pointer-events-none" style={{ marginTop: "1rem", transform: "translateX(-50%)" }}>
      <div className="relative pointer-events-auto" style={{ transform: `translateX(${pos.x}px) translateY(${pos.y}px)`, transition: phase === "visible" ? "transform 0.1s ease-out" : "none" }}>
        {/* Fish */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))", animation: phase === "visible" ? "float 2s ease-in-out infinite" : "none" }}>
          <FishSVG color={cfg.fishColor} />
        </div>

        {/* Speech bubble */}
        <div className="relative" style={{ background: "var(--surface-glass)", backdropFilter: "blur(8px) saturate(120%)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "0.75rem 1rem 0.75rem 3.5rem", minWidth: "200px", maxWidth: "400px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
          {/* Bubble tail */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-0 h-0" style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: "12px solid var(--surface-glass)", filter: "blur(0.5px)" }} />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-0 h-0" style={{ borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderRight: "11px solid var(--border)" }} />

          <p className="text-sm font-medium pr-6" style={{ color: "rgb(var(--text-primary))", lineHeight: "1.5" }}>{toast.message}</p>

          <button onClick={dismiss} className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors" style={{ color: "rgb(var(--text-muted))" }} aria-label="Close toast">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(2deg); }
          50% { transform: translateY(-6px) rotate(0deg); }
          75% { transform: translateY(-4px) rotate(-2deg); }
        }
      `}</style>
    </div>
  );
}
