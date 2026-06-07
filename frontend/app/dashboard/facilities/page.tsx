"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { facilityApi } from "@/lib/api";
import { ArrowRight, Loader2, AlertCircle, Users, Calendar, Target, CircleDashed, Activity, Circle, Trophy, Star, Feather, CircleDot, MoveHorizontal, Shield } from "lucide-react";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } },
};

export default function Facilities() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    facilityApi.list()
      .then((data: any) => setFacilities(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.error || "Failed to load facilities."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mb-4" />
        <p className="text-[var(--muted)] font-medium animate-pulse">Loading facilities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-12 text-center max-w-md mx-auto">
        <AlertCircle className="w-14 h-14 text-[var(--error)] mx-auto mb-4" />
        <p className="text-[var(--error)] font-medium">{error}</p>
      </div>
    );
  }

  const getFacilityIcon = (name: string) => {
    switch(name.toLowerCase()) {
      case 'shooting': return <Target className="w-7 h-7 text-[var(--gold)]" />;
      case 'basketball': return <CircleDashed className="w-7 h-7 text-[var(--gold)]" />;
      case 'badminton': return <Feather className="w-7 h-7 text-[var(--gold)]" />;
      case 'table tennis': return <MoveHorizontal className="w-7 h-7 text-[var(--gold)]" />;
      case 'tennis': return <CircleDot className="w-7 h-7 text-[var(--gold)]" />;
      case 'volleyball': return <Circle className="w-7 h-7 text-[var(--gold)]" />;
      case 'judo': return <Shield className="w-7 h-7 text-[var(--gold)]" />;
      default: return <Star className="w-7 h-7 text-[var(--gold)]" />;
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
      <motion.div variants={fadeUp}>
        <h1 className="text-4xl font-black text-[var(--text)] tracking-tight">Book a Facility</h1>
        <p className="text-[var(--muted)] font-medium mt-1">
          {facilities.length} facilit{facilities.length !== 1 ? "ies" : "y"} available
        </p>
      </motion.div>

      {facilities.length === 0 ? (
        <motion.div variants={fadeUp} className="glass-card p-16 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-[var(--muted)] opacity-30" />
          <p className="text-[var(--muted)] font-medium text-lg">No facilities available right now</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility: any) => (
            <motion.div key={facility.id} variants={fadeUp}>
              <Link href={`/dashboard/book/${facility.id}`}>
                <div className="glass-card overflow-hidden cursor-pointer group hover:-translate-y-2 transition-all duration-500 border border-[var(--glass-border)] hover:border-[var(--gold)]/30 relative">
                  {/* Subtle gold glow behind */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--gold)]/5 rounded-full blur-[60px] group-hover:bg-[var(--gold)]/15 transition-colors duration-700 pointer-events-none" />
                  
                  <div className="p-8 relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] group-hover:border-[var(--gold)]/30 transition-colors duration-300 shadow-xl shadow-black/40">
                        {getFacilityIcon(facility.facility_name)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--gold)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[var(--gold)]/10 px-3 py-1.5 rounded-full border border-[var(--gold)]/20">
                        Book Now <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-serif font-black text-[var(--text)] mb-2 group-hover:text-[var(--gold)] transition-colors duration-300">{facility.facility_name}</h3>
                    
                    {facility.description && (
                      <p className="text-sm text-[var(--muted)] font-medium mb-6 line-clamp-2 leading-relaxed">{facility.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between pt-5 mt-auto border-t border-[var(--border)] group-hover:border-[var(--gold)]/20 transition-colors">
                      <div className="flex items-center gap-2 text-[11px] text-[var(--muted-dark)] font-bold uppercase tracking-[0.1em]">
                        <Users className="w-4 h-4 text-[var(--muted)]" />
                        <span>Capacity: {facility.capacity_per_slot}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
