"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { authApi } from "@/lib/api";
import { ArrowRight } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi.checkAuth().then((res: any) => {
      if (res.authenticated) {
        router.replace("/dashboard");
      }
    }).catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.login({ username, password });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.error || err.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center pt-32 pb-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] glass-card p-10 lg:p-14"
        >
          <div className="mb-10 text-center">
            <span className="luxury-label block mb-4">Welcome Back</span>
            <h2 className="font-serif text-4xl font-bold text-[var(--text)] tracking-tight">
              Sign In
            </h2>
          </div>
          
          {error && (
            <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] p-4 rounded-md mb-8 text-sm font-medium text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Password</label>
                <Link href="/forgot-password" className="text-[11px] font-bold uppercase tracking-widest text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors">
                  Forgot?
                </Link>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input" 
                required 
              />
            </div>
            
            <button type="submit" className="w-full btn-primary mt-4" disabled={loading}>
              {loading ? "Authenticating..." : (
                <>Sign In <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-[var(--border)] text-center">
            <p className="text-[13px] text-[var(--muted)]">
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
