"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { membershipApi } from "@/lib/api";

interface Tier {
  id: number;
  name: string;
  base_price: string;
  display_duration: string;
  discount_percentage: string;
  status: string;
  category_name: string;
}

interface TariffData {
  monthly_tiers: Tier[];
  half_yearly_tiers: Tier[];
  yearly_tiers: Tier[];
  active_membership: null | {
    tier_name: string;
    display_duration: string;
    end_date: string;
    days_remaining: number;
  };
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } },
};

export default function TariffPage() {
  const [data, setData] = useState<TariffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState<"monthly" | "half" | "yearly">("monthly");

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/tariff/", { credentials: "include" })
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getTiers = () => {
    if (!data) return [];
    if (selectedDuration === "monthly") return data.monthly_tiers;
    if (selectedDuration === "half") return data.half_yearly_tiers;
    return data.yearly_tiers;
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Navbar />

      <div className="flex-grow pt-32 pb-32">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center mb-24 max-w-3xl mx-auto">
            <motion.span variants={fadeUp} className="luxury-label block mb-6">Membership Plans</motion.span>
            <motion.h1 variants={fadeUp} className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--text)] tracking-tight mb-8 leading-[1.05]">
              Select Your <em className="not-italic text-[var(--gold)]">Legacy.</em>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-[var(--muted)] text-lg leading-relaxed font-light">
              Access world-class facilities at the District Sports Complex. Our tiered memberships offer priority booking, specialized discounts, and seamless entry.
            </motion.p>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)] mb-4" />
              <p className="luxury-label">Loading Plans</p>
            </div>
          ) : !data ? (
            <div className="text-center py-20 text-[var(--error)]">Failed to load tariff data.</div>
          ) : (
            <>
              {/* Duration Toggle */}
              <div className="flex justify-center mb-16">
                <div className="flex p-1 bg-[var(--surface)] border border-[var(--border)] rounded-md">
                  {[
                    { id: "monthly", label: "Monthly" },
                    { id: "half", label: "6 Months" },
                    { id: "yearly", label: "Annually" }
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      onClick={() => setSelectedDuration(dur.id as any)}
                      className={`px-8 py-3 text-[12px] font-bold uppercase tracking-widest transition-all ${
                        selectedDuration === dur.id 
                          ? "bg-[var(--gold)] text-[#0B0B0A] rounded-sm shadow-sm" 
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plans Grid */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center max-w-5xl mx-auto"
              >
                <AnimatePresence mode="popLayout">
                  {getTiers().map((tier) => (
                    <motion.div
                      key={tier.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      className="glass-card flex flex-col h-full"
                    >
                      <div className="p-10 flex-grow">
                        <span className="luxury-label block mb-6 text-[var(--gold)]">{tier.category_name} Access</span>
                        <div className="mb-6">
                          <span className="font-serif text-5xl font-bold text-[var(--text)]">{formatCurrency(Number(tier.base_price))}</span>
                        </div>
                        <div className="h-px w-full bg-[var(--border)] mb-8" />
                        
                        <ul className="space-y-5">
                          <li className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" />
                            <span className="text-[14px] text-[var(--muted)] font-medium leading-relaxed">Unlimited Facility Bookings</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" />
                            <span className="text-[14px] text-[var(--muted)] font-medium leading-relaxed">Priority Slot Allocation</span>
                          </li>
                          {parseFloat(tier.discount_percentage) > 0 && (
                            <li className="flex items-start gap-3">
                              <Check className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" />
                              <span className="text-[14px] text-[var(--muted)] font-medium leading-relaxed">
                                {tier.discount_percentage}% base tariff discount
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>
                      
                      <div className="p-8 pt-0 mt-auto">
                        <button 
                          onClick={async () => {
                            try {
                              await membershipApi.purchase(tier.id);
                              alert('Membership activated successfully!');
                              window.location.href = '/dashboard';
                            } catch (e: any) {
                              alert(e?.error || e?.detail || 'Failed to activate membership. Please make sure you are logged in.');
                            }
                          }}
                          className="w-full btn-secondary justify-center group"
                        >
                          Select Plan <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              
              {getTiers().length === 0 && (
                <div className="text-center py-20 text-[var(--muted)]">No plans available for this duration.</div>
              )}
            </>
          )}

        </div>
      </div>
      <Footer />
    </main>
  );
}
