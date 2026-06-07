"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Loader2, AlertCircle, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { bookingApi } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } },
};

export default function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchBookings = async () => {
    try {
      const res: any = await bookingApi.myBookings();
      setBookings(res.bookings || []);
      setToday(res.today || "");
    } catch (err: any) {
      setError(err.error || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(id);
    try {
      await bookingApi.cancel(id);
      setMsg({ text: "Booking cancelled successfully.", ok: true });
      await fetchBookings();
    } catch (err: any) {
      setMsg({ text: err.error || "Failed to cancel booking.", ok: false });
    } finally {
      setCancelling(null);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mb-4" />
        <p className="text-[var(--muted)] font-medium animate-pulse">Loading your bookings...</p>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => b.booking_date >= today && b.status === "active");
  const pastBookings = bookings.filter(b => b.booking_date < today || b.status !== "active");

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-8">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-[var(--text)] tracking-tight">My Bookings</h1>
          <p className="text-[var(--muted)] font-medium mt-1">{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/facilities" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold text-sm hover:scale-105 transition-transform">
          + New Booking
        </Link>
      </motion.div>

      {/* Flash message */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 p-4 rounded-xl border font-medium text-sm ${msg.ok ? "bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]" : "bg-[var(--error)]/10 border-[var(--error)]/30 text-[var(--error)]"}`}
          >
            {msg.ok ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Upcoming */}
      <motion.div variants={fadeUp}>
        <h2 className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-4">Upcoming &amp; Active</h2>
        {upcomingBookings.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <CalendarDays className="w-14 h-14 mx-auto mb-3 text-[var(--muted)] opacity-30" />
            <p className="text-[var(--muted)] font-medium">No upcoming bookings</p>
            <Link href="/dashboard/facilities" className="text-[var(--primary)] text-sm font-semibold hover:underline mt-1 inline-block">
              Book a facility →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((b: any) => (
              <motion.div key={b.id} variants={fadeUp} className="glass-card p-5 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex flex-col items-center justify-center shadow-md">
                    <p className="text-lg font-black text-white leading-none">{new Date(b.booking_date).getDate()}</p>
                    <p className="text-[10px] font-bold text-white/80">{new Date(b.booking_date).toLocaleString("en", { month: "short", year: "2-digit" })}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text)] text-lg">{b.facility_name}</p>
                    <p className="text-sm text-[var(--muted)]">{b.slot_time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--success)]/20 text-[var(--success)]">Active</span>
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={cancelling === b.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/20 text-xs font-bold hover:bg-[var(--error)]/20 transition-colors disabled:opacity-50"
                  >
                    {cancelling === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                    Cancel
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* History */}
      {pastBookings.length > 0 && (
        <motion.div variants={fadeUp}>
          <h2 className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-4">History</h2>
          <div className="space-y-3">
            {pastBookings.map((b: any) => (
              <div key={b.id} className="glass-card p-5 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex flex-col items-center justify-center">
                    <p className="text-lg font-black text-[var(--muted)] leading-none">{new Date(b.booking_date).getDate()}</p>
                    <p className="text-[10px] font-bold text-[var(--muted)]">{new Date(b.booking_date).toLocaleString("en", { month: "short", year: "2-digit" })}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text)]">{b.facility_name}</p>
                    <p className="text-sm text-[var(--muted)]">{b.slot_time}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  b.status === "cancelled" ? "bg-[var(--error)]/20 text-[var(--error)]" : "bg-[var(--muted)]/20 text-[var(--muted)]"
                }`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
