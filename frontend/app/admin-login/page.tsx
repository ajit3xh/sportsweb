"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ShieldAlert, Loader2, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.adminLogin({ username, password });
      router.push("/admin");
    } catch (err: any) {
      if (err.status === 403) {
        setError(err.error || "Access Denied: Not an Admin.");
      } else if (err.status === 401) {
        setError("Invalid username or password. Please try again.");
      } else {
        setError(err.error || err.detail || "Login failed. Check the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--error)]/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass-card p-10 relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--error)] to-[#FF6961] flex items-center justify-center shadow-lg mb-4">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-[var(--text)] tracking-tight">Admin Portal</h1>
          <p className="text-[var(--muted)] text-sm mt-1 font-medium">Restricted access — staff only</p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] p-4 rounded-xl mb-6 text-sm font-medium text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--muted)] block mb-1.5">Username</label>
            <input
              type="text"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3.5 glass-input rounded-xl"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--muted)] block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 glass-input rounded-xl pr-12"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-[var(--error)] to-[#FF6961] text-white font-bold text-base shadow-lg hover:shadow-[var(--error)]/30 hover:scale-[1.02] transition-all duration-300 mt-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Authenticate
              </>
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
