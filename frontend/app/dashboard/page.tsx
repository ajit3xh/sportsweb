"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CalendarDays, CreditCard, User, Settings, Trophy, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { userApi } from "@/lib/api";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } },
};

export default function DashboardOverview() {
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    userApi.dashboard()
      .then((d) => setDashData(d))
      .catch((err) => setError(err.error || "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gold)] mb-4" />
        <span className="luxury-label">Loading Dashboard</span>
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

  const user = dashData?.user;
  const membership = dashData?.active_membership;
  const daysRemaining = dashData?.days_remaining;
  const validUntil = dashData?.valid_until;
  const recentBookings = dashData?.recent_bookings || [];

  const quickLinks = [
    { href: "/dashboard/facilities", label: "Book a Facility", icon: CalendarDays },
    { href: "/dashboard/bookings", label: "My Bookings", icon: Trophy },
    { href: "/tariff", label: "Membership Plans", icon: CreditCard },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-12">
      
      {/* Header */}
      <motion.div variants={fadeUp} className="border-b border-[var(--border)] pb-8">
        <span className="luxury-label block mb-4">Member Portal</span>
        <h1 className="font-serif text-5xl font-bold text-[var(--text)] tracking-tight">
          Welcome, <em className="not-italic text-[var(--gold)]">{user?.full_name?.split(" ")[0] || user?.username}.</em>
        </h1>
        <p className="text-[var(--muted)] text-lg mt-4 font-light">
          {user?.category ? `${user.category} Access Level` : "Manage your athletic schedule and memberships."}
        </p>
      </motion.div>

      {/* Membership Status */}
      <motion.div variants={fadeUp}>
        {membership ? (
          <div className="running-glow-wrapper rounded-xl group">
            
            {/* Card inner content */}
            <div className="relative bg-[var(--surface)] p-10 flex flex-col md:flex-row md:items-center justify-between rounded-[11px] w-full h-full z-10">
              <div className="flex items-center gap-6 mb-6 md:mb-0">
                <div className="w-14 h-14 rounded-full border border-[var(--gold)]/30 flex items-center justify-center bg-[var(--gold)]/5">
                  <Trophy className="w-6 h-6 text-[var(--gold)]" />
                </div>
                <div>
                  <p className="luxury-label mb-2">Active Status</p>
                  <p className="font-serif text-3xl font-bold text-[var(--text)]">{membership.tier_name || membership.membership_tier_name || "Premium"}</p>
                </div>
              </div>
              <div className="md:text-right border-t md:border-t-0 md:border-l border-[var(--border)] pt-6 md:pt-0 md:pl-10">
                <p className="text-[13px] text-[var(--muted)] uppercase tracking-widest font-bold mb-1">Valid Until</p>
                <p className="text-xl font-bold text-[var(--text)] mb-2">{validUntil}</p>
                <p className="text-[12px] text-[var(--gold)] font-bold uppercase tracking-widest">{daysRemaining} days remaining</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-10 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-6 mb-6 md:mb-0">
              <div className="w-14 h-14 rounded-full border border-[var(--border-strong)] flex items-center justify-center bg-[var(--surface-2)]">
                <CreditCard className="w-6 h-6 text-[var(--muted)]" />
              </div>
              <div>
                <p className="luxury-label mb-2">No Active Membership</p>
                <p className="text-[var(--muted)] font-light">Purchase a plan to start booking facilities.</p>
              </div>
            </div>
            <Link href="/tariff" className="btn-primary">
              View Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={stagger}>
        <motion.span variants={fadeUp} className="luxury-label block mb-6">Quick Actions</motion.span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--border)]">
          {quickLinks.map((link) => (
            <motion.div key={link.href} variants={fadeUp} className="bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors">
              <Link href={link.href} className="flex flex-col items-center text-center p-8 h-full">
                <link.icon className="w-6 h-6 text-[var(--gold)] mb-6" />
                <p className="text-[13px] font-bold uppercase tracking-wider text-[var(--text)]">{link.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Bookings */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-8">
          <span className="luxury-label block">Recent Bookings</span>
          <Link href="/dashboard/bookings" className="text-[12px] font-bold uppercase tracking-widest text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors flex items-center gap-2">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="glass-card overflow-hidden">
          {recentBookings.length === 0 ? (
            <div className="text-center py-20 px-4">
              <CalendarDays className="w-10 h-10 mx-auto mb-6 text-[var(--muted-dark)]" />
              <p className="text-[var(--text)] font-medium mb-2">No bookings yet</p>
              <Link href="/dashboard/facilities" className="text-[var(--gold)] text-sm font-semibold hover:underline">
                Book your first facility →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-6 hover:bg-[var(--surface-2)] transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 border border-[var(--border)] rounded-md flex flex-col items-center justify-center bg-[var(--bg)]">
                      <p className="font-serif text-xl font-bold text-[var(--gold)] leading-none">{b.date}</p>
                      <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest mt-1">{b.month}</p>
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text)] text-lg mb-1">{b.facility_name}</p>
                      <p className="text-sm text-[var(--muted)] font-light">{b.slot_time}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    b.status === "active" ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20" :
                    b.status === "cancelled" ? "bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/20" :
                    "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20"
                  }`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}
