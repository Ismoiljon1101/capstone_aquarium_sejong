"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/app/contexts/ToastContext";

type Phase = "entering" | "visible" | "exiting";

/** Hook: manages fish swimming animation phases and position for FishToast. */
export function useFishAnimation() {
  const { toast, hideToast } = useToast();
  const [phase, setPhase] = useState<Phase>("entering");
  const [pos, setPos] = useState({ x: -600, y: 0 });
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cancelAll = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const swimOut = (onDone: () => void) => {
    setPhase("exiting");
    const start = Date.now();
    const dur = 800;
    const vw = typeof window !== "undefined" ? window.innerWidth : 600;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const ease = p * p * p;
      setPos({ x: ease * (vw / 2 + 100), y: Math.sin((1 - p) * Math.PI * 2) * 3 });
      if (p < 1) { frameRef.current = requestAnimationFrame(tick); } else { onDone(); }
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (!toast) {
      setPhase("entering");
      setPos({ x: typeof window !== "undefined" ? -(window.innerWidth / 2) - 100 : -600, y: 0 });
      return;
    }
    cancelAll();
    setPhase("entering");
    const start = Date.now();
    const dur = 800;
    const vw = typeof window !== "undefined" ? window.innerWidth : 600;
    const fromX = -(vw / 2) - 100;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setPos({ x: fromX + (0 - fromX) * ease, y: Math.sin(p * Math.PI * 2) * 3 });
      if (p < 1) { frameRef.current = requestAnimationFrame(tick); } else { setPhase("visible"); setPos({ x: 0, y: 0 }); }
    };
    frameRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(() => swimOut(hideToast), toast.duration);
    return cancelAll;
  }, [toast, hideToast]);

  const dismiss = () => {
    if (phase === "exiting") return;
    cancelAll();
    swimOut(hideToast);
  };

  return { toast, phase, pos, dismiss };
}
