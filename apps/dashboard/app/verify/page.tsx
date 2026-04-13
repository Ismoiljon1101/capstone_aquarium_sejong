"use client";

import { useEffect, useRef } from "react";
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import QRCodeSVG from "react-qr-code";
import { ProtectedPage } from "@/app/components/ProtectedPage";
import { useToast } from "@/app/hooks/useToast";
import { getToastFromUrl } from "@/app/lib/toast-server";
import { useVerification } from "@/app/hooks/useVerification";

function VerifyContent() {
  const { isAuthenticated, isVerified, state, timeLeft, handleRetry } = useVerification();
  const toast = useToast();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      const t = getToastFromUrl();
      if (t) toast.show(t.type as "success" | "error" | "info" | "warning" | "alert" | "update", t.message);
    }
  }, [toast]);

  if (!isAuthenticated) return null;

  if (isVerified) return (
    <div className="bg-gradient-main min-h-screen flex items-center justify-center p-4">
      <div className="card-glass max-w-md w-full text-center animate-fade-in">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gradient mb-2">Already Verified</h1>
        <p className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>Redirecting to dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-main min-h-screen p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity" style={{ color: "rgb(var(--text-secondary))" }}>
            <ArrowLeft className="w-4 h-4" />Back to Home
          </Link>
        </div>
        <div className="card-glass animate-fade-in">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gradient mb-2">Verify Your Account</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>Scan the QR code with the Virtual Assistant to complete verification</p>
          </div>

          {state.type === "generating" && (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "rgb(var(--primary))" }} />
              <p className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>Generating verification code...</p>
            </div>
          )}

          {state.type === "active" && (
            <div className="space-y-6">
              <div className="flex justify-center"><div className="bg-white p-6 rounded-xl shadow-xl"><QRCodeSVG value={state.data.verifyUrl} size={256} /></div></div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "rgb(var(--text-muted))" }} />
                  <span className="text-sm font-medium" style={{ color: "rgb(var(--text-primary))" }}>Expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
                </div>
                <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>Waiting for verification...</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <button onClick={handleRetry} className="btn btn-secondary w-full"><RefreshCw className="w-4 h-4" />Generate New Code</button>
              </div>
            </div>
          )}

          {state.type === "error" && (
            <div className="text-center py-8 space-y-4">
              <XCircle className="w-16 h-16 mx-auto" style={{ color: "rgb(var(--danger))" }} />
              <div><h2 className="text-xl font-semibold mb-2" style={{ color: "rgb(var(--text-primary))" }}>Verification Failed</h2><p className="text-sm mb-6" style={{ color: "rgb(var(--text-secondary))" }}>{state.message}</p></div>
              <button onClick={handleRetry} className="btn btn-primary"><RefreshCw className="w-4 h-4" />Try Again</button>
            </div>
          )}

          {state.type === "success" && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              <div><h2 className="text-xl font-semibold mb-2" style={{ color: "rgb(var(--text-primary))" }}>Verification Successful!</h2><p className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>Redirecting to dashboard...</p></div>
            </div>
          )}
        </div>

        <div className="mt-6 card-glass">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "rgb(var(--warning))" }} />
            <div className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>
              <p className="font-medium mb-1" style={{ color: "rgb(var(--text-primary))" }}>How to verify:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open the Virtual Assistant application</li>
                <li>Use the camera to scan this QR code</li>
                <li>Wait for verification to complete automatically</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return <ProtectedPage><VerifyContent /></ProtectedPage>;
}
