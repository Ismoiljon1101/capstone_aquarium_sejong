"use client";

import { useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";

const calcStrength = (pw: string) => {
  if (!pw) return { score: 0, feedback: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Very weak", "Very weak", "Weak", "Weak", "Good", "Strong", "Very strong"];
  return { score, feedback: labels[score] ?? "Very weak" };
};

const strengthColor = (s: number) => s <= 1 ? "bg-red-500" : s <= 3 ? "bg-yellow-500" : s <= 4 ? "bg-blue-500" : "bg-green-500";

/**
 * SecuritySettings — password change form with strength indicator.
 */
export function SecuritySettings() {
  const { user } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [pw, setPw] = useState({ current: "", new: "", confirm: "" });
  const strength = calcStrength(pw.new);
  const isOAuth = !user?.email?.includes("@") || user?.name?.includes("OAuth");

  const handleChange = async () => {
    if (!pw.current || !pw.new || !pw.confirm) { toast.show("error", "Fill in all password fields", 3000); return; }
    if (pw.new !== pw.confirm) { toast.show("error", "Passwords do not match", 3000); return; }
    if (pw.new.length < 8) { toast.show("error", "Minimum 8 characters", 3000); return; }
    if (strength.score < 3) { toast.show("error", "Choose a stronger password", 3000); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/user/password', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.new }) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message || 'Failed'); }
      toast.show("success", "Password changed successfully!", 3000);
      setPw({ current: "", new: "", confirm: "" });
    } catch (e) { toast.show("error", e instanceof Error ? e.message : "Failed to change password", 3000); }
    finally { setBusy(false); }
  };

  const PasswordField = ({ field, placeholder }: { field: keyof typeof pw; placeholder: string }) => (
    <div className="relative">
      <input type={show[field] ? "text" : "password"} value={pw[field]} onChange={e => setPw(p => ({ ...p, [field]: e.target.value }))}
        className="w-full px-3 py-2 pr-10 rounded-lg bg-white/5 border border-white/10 text-sm" style={{ color: "rgb(var(--text-primary))" }}
        placeholder={placeholder} disabled={busy} />
      <button type="button" onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))} className="absolute right-3 top-1/2 -translate-y-1/2" disabled={busy}>
        {show[field] ? <EyeOff className="w-4 h-4" style={{ color: "rgb(var(--text-muted))" }} /> : <Eye className="w-4 h-4" style={{ color: "rgb(var(--text-muted))" }} />}
      </button>
    </div>
  );

  return (
    <div className="card-glass p-6">
      <div className="flex items-center gap-3 mb-6"><Shield className="w-6 h-6" style={{ color: "rgb(var(--text-primary))" }} /><h2 className="text-xl font-semibold" style={{ color: "rgb(var(--text-primary))" }}>Security Settings</h2></div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h3 className="text-lg font-medium" style={{ color: "rgb(var(--text-primary))" }}>Password</h3>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>{isOAuth ? "You signed in with a social account. Password change is not available." : "Change your password to keep your account secure"}</p></div>
          {isOAuth && <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30"><CheckCircle className="w-4 h-4" /><span className="text-sm">OAuth Account</span></div>}
        </div>

        {!isOAuth && (
          <div className="space-y-4 p-4 rounded-lg border border-white/10 bg-white/5">
            <div><label className="block text-sm font-medium mb-2" style={{ color: "rgb(var(--text-primary))" }}>Current Password</label><PasswordField field="current" placeholder="Enter current password" /></div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgb(var(--text-primary))" }}>New Password</label>
              <PasswordField field="new" placeholder="Enter new password" />
              {pw.new && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1"><span style={{ color: "rgb(var(--text-muted))" }}>Password Strength</span>
                    <span className={`font-medium ${strength.score <= 2 ? "text-red-400" : strength.score <= 4 ? "text-yellow-400" : "text-green-400"}`}>{strength.feedback}</span></div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><div className={`h-full transition-all duration-300 ${strengthColor(strength.score)}`} style={{ width: `${(strength.score / 6) * 100}%` }} /></div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "rgb(var(--text-primary))" }}>Confirm New Password</label>
              <PasswordField field="confirm" placeholder="Confirm new password" />
              {pw.confirm && (
                <div className="mt-1 flex items-center gap-2">
                  {pw.new === pw.confirm ? <><CheckCircle className="w-3 h-3 text-green-400" /><span className="text-xs text-green-400">Passwords match</span></>
                    : <><AlertTriangle className="w-3 h-3 text-red-400" /><span className="text-xs text-red-400">Passwords do not match</span></>}
                </div>
              )}
            </div>
            <button onClick={handleChange} disabled={busy || !pw.current || !pw.new || !pw.confirm || pw.new !== pw.confirm || strength.score < 3}
              className={`btn btn-sm flex items-center gap-2 ${busy || !pw.current || !pw.new || !pw.confirm || pw.new !== pw.confirm || strength.score < 3 ? "btn-ghost opacity-50 cursor-not-allowed" : "btn-primary"}`}>
              {busy ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Changing...</> : <><Lock className="w-4 h-4" />Change Password</>}
            </button>
          </div>
        )}

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <h4 className="text-sm font-medium text-blue-400 mb-2">Security Recommendations</h4>
          <ul className="text-xs space-y-1" style={{ color: "rgb(var(--text-muted))" }}>
            <li>• Use a unique password not used elsewhere</li>
            <li>• Include uppercase, lowercase, numbers and symbols</li>
            <li>• Make it at least 12 characters long</li>
            <li>• Consider using a password manager</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
