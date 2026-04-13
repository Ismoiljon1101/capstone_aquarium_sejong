"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";

export type VerificationState =
  | { type: "idle" } | { type: "generating" }
  | { type: "active"; data: { token: string; verifyUrl: string; expiresIn: number } }
  | { type: "error"; message: string } | { type: "success" };

/**
 * Hook: manages QR verification token generation and polling.
 */
export function useVerification() {
  const { isAuthenticated, isVerified, refreshSession } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<VerificationState>({ type: "idle" });
  const [timeLeft, setTimeLeft] = useState(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const cdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { if (isAuthenticated && isVerified) router.push("/dashboard"); }, [isAuthenticated, isVerified, router]);

  const generateToken = useCallback(async () => {
    setState({ type: "generating" });
    try {
      const res = await fetch("/api/auth/verification/generate", { method: "POST", credentials: "include" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      const data = await res.json();
      setState({ type: "active", data: { token: data.token, verifyUrl: data.verifyUrl, expiresIn: data.expiresIn } });
      setTimeLeft(data.expiresIn);
    } catch (e) { setState({ type: "error", message: e instanceof Error ? e.message : "Failed to generate code" }); }
  }, []);

  useEffect(() => {
    if (state.type !== "active") return;
    const { token } = state.data;

    pollRef.current = setInterval(async () => {
      try {
        const d = await fetch(`/api/auth/verification/status?token=${token}`).then(r => r.json());
        if (d.valid === false) {
          clearInterval(pollRef.current!); clearInterval(cdRef.current!);
          if (d.used) {
            setState({ type: "success" });
            toast.success("Verification successful! Redirecting...", 10000);
            await refreshSession();
            setTimeout(() => router.push("/dashboard"), 2000);
          } else if (d.expired) {
            setState({ type: "error", message: "Verification code expired. Please generate a new one." });
          }
        }
      } catch { /* ignore polling errors */ }
    }, 2000);

    cdRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(pollRef.current!); clearInterval(cdRef.current!);
          setState(s => s.type === "active" ? { type: "error", message: "Verification code expired." } : s);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { clearInterval(pollRef.current!); clearInterval(cdRef.current!); };
  }, [state.type, state.type === "active" && state.data.token, toast, router, refreshSession]);

  useEffect(() => {
    if (isAuthenticated && !isVerified && state.type === "idle") generateToken();
  }, [isAuthenticated, isVerified, state.type, generateToken]);

  const handleRetry = () => { setState({ type: "idle" }); setTimeLeft(0); generateToken(); };

  return { isAuthenticated, isVerified, state, timeLeft, handleRetry };
}
