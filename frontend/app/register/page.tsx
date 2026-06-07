"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { authApi } from "@/lib/api";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    authApi.checkAuth().then((res: any) => {
      if (res.authenticated) {
        router.replace("/dashboard");
      }
    }).catch(() => {});
  }, [router]);

  const [formData, setFormData] = useState({
    username: "", email: "", password: "", confirm_password: "",
    full_name: "", phone_number: "", aadhaar_number: "", address: "",
    declaration: false, is_student: false
  });

  const [verificationData, setVerificationData] = useState({
    mobile_otp: "", aadhaar_otp: ""
  });
  
  const [demoOtps, setDemoOtps] = useState<{mobile: string, aadhaar: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res: any = await authApi.register(formData);
      // Backend returns demo OTPs in dev
      if (res.demo_otp_mobile) {
        setDemoOtps({ mobile: res.demo_otp_mobile, aadhaar: res.demo_otp_aadhaar });
      }
      setStep(2); // Move to verification step
    } catch (err: any) {
      setError(err.error || err.detail || JSON.stringify(err) || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await authApi.verifyRegistration(verificationData);
      setStep(3); // Success step
    } catch (err: any) {
      setError(err.error || err.detail || "Verification failed");
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
          className="w-full max-w-[500px] glass-card p-10 lg:p-14"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="mb-10 text-center">
                  <span className="luxury-label block mb-4">Join the Institution</span>
                  <h2 className="font-serif text-4xl font-bold text-[var(--text)] tracking-tight">Create Account</h2>
                </div>
                
                {error && <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] p-4 rounded-md mb-8 text-sm font-medium text-center">{error}</div>}
                
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Full Name</label>
                      <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="glass-input" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Username</label>
                      <input type="text" name="username" value={formData.username} onChange={handleChange} className="glass-input" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Phone Number</label>
                      <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="glass-input" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Aadhaar No.</label>
                      <input type="text" name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} className="glass-input" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="glass-input" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="glass-input" required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Password</label>
                      <input type="password" name="password" value={formData.password} onChange={handleChange} className="glass-input" required minLength={8} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Confirm Password</label>
                      <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="glass-input" required minLength={8} />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center mt-1">
                        <input type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} className="peer sr-only" required />
                        <div className="w-5 h-5 border border-[var(--border-strong)] rounded-sm peer-checked:bg-[var(--gold)] peer-checked:border-[var(--gold)] transition-colors" />
                        <CheckCircle2 className="w-3.5 h-3.5 absolute text-[#0B0B0A] opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[13px] text-[var(--muted)] group-hover:text-[var(--text)] transition-colors leading-relaxed">
                        I declare that the information provided is correct and I agree to the <Link href="/terms" className="text-[var(--gold)]">Terms & Conditions</Link> of Kathua Indoor Stadium.
                      </span>
                    </label>
                  </div>

                  <button type="submit" className="w-full btn-primary mt-6" disabled={loading}>
                    {loading ? "Processing..." : "Continue to Verification"} <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </form>
                
                <div className="mt-8 pt-8 border-t border-[var(--border)] text-center">
                  <p className="text-[13px] text-[var(--muted)]">
                    Already have an account? <Link href="/login" className="font-semibold text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors">Sign In</Link>
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-10 text-center">
                  <span className="luxury-label block mb-4">Identity Verification</span>
                  <h2 className="font-serif text-3xl font-bold text-[var(--text)] tracking-tight">Verify Details</h2>
                  <p className="mt-4 text-[var(--muted)] text-[14px]">Please enter the OTPs sent to your mobile number and linked Aadhaar.</p>
                </div>

                {error && <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] p-4 rounded-md mb-8 text-sm font-medium text-center">{error}</div>}
                
                {demoOtps && (
                  <div className="bg-[var(--surface-2)] border border-[var(--gold)]/30 p-4 rounded-md mb-8">
                    <span className="luxury-label text-[9px] block mb-2">Demo Mode OTPs</span>
                    <div className="flex justify-between text-sm text-[var(--gold)] font-mono">
                      <span>Mobile: {demoOtps.mobile}</span>
                      <span>Aadhaar: {demoOtps.aadhaar}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Mobile OTP</label>
                    <input 
                      type="text" 
                      value={verificationData.mobile_otp}
                      onChange={(e) => setVerificationData(prev => ({...prev, mobile_otp: e.target.value}))}
                      className="glass-input tracking-[0.5em] font-mono text-center" 
                      maxLength={4}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] pl-1">Aadhaar OTP</label>
                    <input 
                      type="text" 
                      value={verificationData.aadhaar_otp}
                      onChange={(e) => setVerificationData(prev => ({...prev, aadhaar_otp: e.target.value}))}
                      className="glass-input tracking-[0.5em] font-mono text-center" 
                      maxLength={4}
                      required 
                    />
                  </div>
                  
                  <button type="submit" className="w-full btn-primary mt-6" disabled={loading}>
                    {loading ? "Verifying..." : "Verify Identity"}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-20 h-20 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-[var(--gold)]" />
                </div>
                <span className="luxury-label block mb-4">Verification Complete</span>
                <h2 className="font-serif text-3xl font-bold text-[var(--text)] mb-6">Welcome to GovSports</h2>
                <p className="text-[var(--muted)] text-[15px] mb-10 leading-relaxed">
                  Your identity has been verified and your account is ready. You can now log in to book facilities and manage your membership.
                </p>
                <Link href="/login" className="btn-primary w-full">
                  Sign In to Dashboard
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
