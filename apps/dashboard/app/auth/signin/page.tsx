"use client";

import { Suspense, useState, FormEvent, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";
import Link from "next/link";
import { LogIn, Mail, Lock, AlertCircle, Loader2, ArrowLeft, UserPlus } from "lucide-react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const hasShownRedirectToast = useRef(false);
  const hasRedirected = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    const protectedPaths = ["/dashboard", "/vassistant"];
    if (protectedPaths.some(p => callbackUrl.startsWith(p)) && !hasShownRedirectToast.current) {
      hasShownRedirectToast.current = true;
      toast.alert("Please sign in to access this page");
    }
  }, [callbackUrl, toast]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      const target = callbackUrl.startsWith("/") ? `${window.location.origin}${callbackUrl}` : callbackUrl;
      window.location.href = target;
    }
  }, [isAuthenticated, authLoading, callbackUrl]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (loading) return;
    setLoading(true);
    try {
      if (isSignUp) {
        const r = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, name: email.split("@")[0] }) });
        const d = await r.json();
        if (!r.ok) { setError(d.error || "Failed to create account"); toast.error(d.error || "Failed to create account"); setLoading(false); return; }
        toast.success("Account created successfully! Signing you in...");
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        const msg = result.error === "InvalidPassword" ? "Incorrect password. Please try again."
          : result.error === "UserNotFound" ? "No account found with this email."
          : "Invalid email or password";
        setError(msg); toast.error(msg); setLoading(false); return;
      }
      if (result?.ok) {
        await new Promise(r => setTimeout(r, 300));
        const target = callbackUrl.startsWith("/") ? `${window.location.origin}${callbackUrl}` : callbackUrl;
        window.location.replace(target); return;
      }
      setError("Authentication failed. Please try again."); setLoading(false);
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : "Unknown"}`);
      toast.error("An unexpected error occurred."); setLoading(false);
    }
  };

  if (authLoading || (isAuthenticated && !hasRedirected.current)) {
    return (
      <div className="bg-gradient-main min-h-screen flex items-center justify-center p-4 -mt-24 sm:-mt-28">
        <div className="text-center">
          <div className="loading w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>{isAuthenticated ? "Redirecting..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-main min-h-screen flex items-center justify-center p-4 -mt-24 sm:-mt-28">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 text-sm hover:text-blue-400 transition-colors" style={{ color: "rgb(var(--text-secondary))" }}>
          <ArrowLeft className="w-4 h-4" />Back to Home
        </Link>
        <div className="card-glass p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              {isSignUp ? <UserPlus className="w-8 h-8 text-white" /> : <LogIn className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-bold mb-2 text-gradient">{isSignUp ? "Create Account" : "Welcome Back"}</h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>{isSignUp ? "Sign up to start monitoring" : "Sign in to access your dashboard"}</p>
          </div>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" /><p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          <div className="mb-6">
            <div className="relative mb-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span style={{ color: "rgb(var(--text-muted))" }} className="px-2 bg-transparent">Or continue with</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => signIn("google", { callbackUrl })} disabled={loading} className="btn btn-secondary flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Google
              </button>
              <button type="button" onClick={() => signIn("kakao", { callbackUrl })} disabled={loading} className="btn btn-secondary flex items-center justify-center gap-2" style={{ backgroundColor: "#FEE500", color: "#000000" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#191919" d="M12 3C7.031 3 3 6.238 3 10.25c0 2.531 1.641 4.781 4.156 6.063l-.969 3.531c-.094.375.188.656.531.469l4.281-2.844c.313.031.625.031.969.031 4.969 0 9-3.281 9-7.25S16.969 3 12 3z"/></svg>Kakao
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: "rgb(var(--text-primary))" }}>Email Address</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none z-10" style={{ color: "rgb(var(--text-muted))" }} />
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className="input w-full" disabled={loading} style={{ paddingLeft: "2.75rem" }} /></div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: "rgb(var(--text-primary))" }}>Password</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none z-10" style={{ color: "rgb(var(--text-muted))" }} />
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required minLength={6} className="input w-full" disabled={loading} style={{ paddingLeft: "2.75rem" }} /></div>
              {isSignUp && <p className="text-xs mt-2" style={{ color: "rgb(var(--text-muted))" }}>Password must be at least 6 characters</p>}
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{isSignUp ? "Creating Account..." : "Signing In..."}</> : <>{isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}{isSignUp ? "Sign Up" : "Sign In"}</>}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm mb-3" style={{ color: "rgb(var(--text-secondary))" }}>{isSignUp ? "Already have an account?" : "Don't have an account?"}</p>
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
              {isSignUp ? "Sign In instead" : "Sign Up here"}
            </button>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-center" style={{ color: "rgb(var(--text-muted))" }}>Sejong University Capstone Project</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="bg-gradient-main min-h-screen flex items-center justify-center"><div className="loading w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" /></div>}>
      <SignInContent />
    </Suspense>
  );
}
