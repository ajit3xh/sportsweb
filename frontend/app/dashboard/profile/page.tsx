"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { userApi } from "@/lib/api";
import { Loader2, AlertCircle, User, Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    userApi.profile()
      .then((data) => setProfile(data))
      .catch((err) => setError(err.error || "Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)] mb-4" />
        <span className="luxury-label">Loading Profile</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 max-w-md mx-auto text-center">
        <AlertCircle className="w-10 h-10 text-[var(--error)] mb-4" />
        <p className="text-[var(--text)]">{error}</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="max-w-4xl mx-auto space-y-10">
      <div className="border-b border-[var(--border)] pb-8">
        <span className="luxury-label block mb-4">Personal Information</span>
        <h1 className="font-serif text-4xl font-bold text-[var(--text)] tracking-tight">My Profile</h1>
      </div>

      <div className="glass-card p-10 flex flex-col md:flex-row gap-12 items-start border-[var(--border-strong)]">
        <div className="flex-shrink-0 flex flex-col items-center text-center w-full md:w-auto">
          <div className="w-36 h-36 rounded-full border border-[var(--gold)]/30 flex items-center justify-center bg-[var(--gold)]/5 mb-6">
            <User className="w-14 h-14 text-[var(--gold)]" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-[var(--text)] mb-1">{profile?.full_name || profile?.username}</h2>
          <p className="text-[var(--gold)] text-[11px] font-bold tracking-widest uppercase">{profile?.category || "Standard Member"}</p>
          
          <div className="mt-6 flex items-center gap-2 bg-[var(--success)]/10 text-[var(--success)] px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] border border-[var(--success)]/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Account
          </div>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="bg-[var(--surface-2)] p-6 rounded-lg border border-[var(--border)] transition-colors hover:bg-[var(--surface)]">
            <div className="flex items-center gap-3 text-[var(--muted)] mb-3">
              <Mail className="w-4 h-4 text-[var(--gold)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Email Address</span>
            </div>
            <p className="text-[var(--text)] font-medium text-lg">{profile?.email || "Not Provided"}</p>
          </div>
          
          <div className="bg-[var(--surface-2)] p-6 rounded-lg border border-[var(--border)] transition-colors hover:bg-[var(--surface)]">
            <div className="flex items-center gap-3 text-[var(--muted)] mb-3">
              <Phone className="w-4 h-4 text-[var(--gold)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Phone Number</span>
            </div>
            <p className="text-[var(--text)] font-medium text-lg">{profile?.phone_number || "Not Provided"}</p>
          </div>
          
          <div className="bg-[var(--surface-2)] p-6 rounded-lg border border-[var(--border)] md:col-span-2 transition-colors hover:bg-[var(--surface)]">
            <div className="flex items-center gap-3 text-[var(--muted)] mb-3">
              <MapPin className="w-4 h-4 text-[var(--gold)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Registered Address</span>
            </div>
            <p className="text-[var(--text)] font-medium text-lg">{profile?.address || "Not Provided"}</p>
          </div>
          
          <div className="bg-[var(--surface-2)] p-6 rounded-lg border border-[var(--border)] md:col-span-2 transition-colors hover:bg-[var(--surface)]">
            <div className="flex items-center gap-3 text-[var(--muted)] mb-3">
              <User className="w-4 h-4 text-[var(--gold)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Aadhaar / ID Number</span>
            </div>
            <p className="text-[var(--text)] font-mono text-lg tracking-wider">
              {profile?.aadhaar_number ? `XXXX-XXXX-${String(profile.aadhaar_number).slice(-4)}` : "Not Provided"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
