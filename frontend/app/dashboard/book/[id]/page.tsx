"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { facilityApi } from "@/lib/api";
import { CalendarDays, Clock, Loader2, AlertCircle, CheckCircle, ArrowLeft, Users, Sunrise, Sunset } from "lucide-react";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } },
};

function getNext14Days(todayStr: string) {
  const days = [];
  const today = new Date(todayStr);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export default function BookFacility() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    facilityApi.detail(Number(id))
      .then((d) => {
        setDetail(d);
        setSelectedDate((d as any).today || "");
      })
      .catch((err) => setError(err.error || "Failed to load facility details."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    if (!selectedDate || selectedSlot === null) return;
    setSubmitting(true);
    setBookError("");
    setSuccessMsg("");
    try {
      const res: any = await facilityApi.book(Number(id), {
        slot_id: selectedSlot,
        booking_date: selectedDate,
      });
      setSuccessMsg(res.message || "Booking successful!");
      setSelectedSlot(null);
      // Refresh detail to get updated availability
      const refreshed: any = await facilityApi.detail(Number(id));
      setDetail(refreshed);
    } catch (err: any) {
      setBookError(err.error || "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mb-4" />
      <p className="text-[var(--muted)] font-medium animate-pulse">Loading facility details...</p>
    </div>
  );

  if (error) return (
    <div className="glass-card p-12 text-center max-w-md mx-auto">
      <AlertCircle className="w-14 h-14 text-[var(--error)] mx-auto mb-4" />
      <p className="text-[var(--error)] font-medium">{error}</p>
      <Link href="/dashboard/facilities" className="text-[var(--primary)] text-sm font-semibold hover:underline mt-3 inline-block">← Back to Facilities</Link>
    </div>
  );

  const facility = detail?.facility;
  const slots = detail?.slots || [];
  const today = detail?.today;
  const availabilityMap = detail?.slot_availability_data || {};
  const capacity = detail?.facility_capacity || 1;
  const hasValidMembership = detail?.has_valid_membership;
  const dates = getNext14Days(today);
  const closures = detail?.closures_data || [];
  const closedDates = closures.map((c: any) => c.date);

  const isSlotFull = (slotId: number) => {
    const booked = availabilityMap[selectedDate]?.[String(slotId)] || 0;
    return booked >= capacity;
  };

  const morningSlots = slots.filter((s: any) => s.session === "morning");
  const eveningSlots = slots.filter((s: any) => s.session === "evening");

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px]">
      
      {/* Left Column: Info & Dates */}
      <div className="lg:col-span-5 space-y-6">
        {/* Back & Info */}
        <motion.div variants={fadeUp}>
          <Link href="/dashboard/facilities" className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] font-semibold text-sm transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Facilities
          </Link>
          <h1 className="text-4xl font-black text-[var(--text)] tracking-tight">{facility?.facility_name}</h1>
          <p className="text-[var(--muted)] mt-1 font-medium">{facility?.description || "Select a date and time slot to book"}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-sm text-[var(--muted)] font-medium">
              <Users className="w-4 h-4" /> Capacity: {capacity} per slot
            </span>
          </div>
        </motion.div>

        {/* Membership warning */}
        {!hasValidMembership && (
          <motion.div variants={fadeUp} className="glass-card p-5 border-[var(--warning)]/30 bg-[var(--warning)]/5 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-[var(--warning)] shrink-0" />
            <div>
              <p className="font-bold text-[var(--text)]">No Active Membership</p>
              <p className="text-sm text-[var(--muted)]">You need an active membership to book facilities.</p>
            </div>
            <Link href="/tariff" className="ml-auto px-4 py-2 rounded-xl bg-[var(--warning)] text-white font-bold text-sm hover:scale-105 transition-transform shrink-0">
              Get Membership
            </Link>
          </motion.div>
        )}

        {/* Success/Error messages */}
        {successMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] font-medium">
            <CheckCircle className="w-5 h-5 shrink-0" /> {successMsg}
          </motion.div>
        )}
        {bookError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" /> {bookError}
          </motion.div>
        )}

        {/* Date picker */}
        <motion.div variants={fadeUp} className="glass-card p-6">
          <h2 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[var(--gold)]" /> Select Date
          </h2>
          <div className="flex flex-wrap gap-2">
            {dates.map((date) => {
              const isClosed = closedDates.includes(date);
              const isSelected = selectedDate === date;
              const dateObj = new Date(date);
              return (
                <button
                  key={date}
                  disabled={isClosed || !hasValidMembership}
                  onClick={() => { setSelectedDate(date); setSelectedSlot(null); setBookError(""); setSuccessMsg(""); }}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 min-w-[52px] ${
                    isClosed ? "opacity-30 cursor-not-allowed border-[var(--error)]/30 bg-[var(--error)]/5 text-[var(--error)]" :
                    isSelected ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)] shadow-md" :
                    "border-[var(--glass-border)] text-[var(--muted)] hover:border-[var(--glass-border-highlight)] hover:text-[var(--text)]"
                  }`}
                >
                  <span className="text-xs font-bold">{dateObj.toLocaleString("en", { weekday: "short" })}</span>
                  <span className="text-lg font-black">{dateObj.getDate()}</span>
                  <span className="text-[10px]">{dateObj.toLocaleString("en", { month: "short" })}</span>
                  {isClosed && <span className="text-[9px] font-bold text-[var(--error)] mt-0.5">CLOSED</span>}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Right Column: Slots & Book */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        {selectedDate ? (
          <motion.div variants={fadeUp} className="glass-card p-6 flex-grow flex flex-col">
            <h2 className="text-lg font-bold text-[var(--text)] mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--gold)]" /> Select Time Slot
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
              
              {/* Morning Slots */}
              <div className="space-y-3">
                <h3 className="text-[12px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3 border-b border-[var(--border)] pb-2 flex items-center gap-2">
                  <Sunrise className="w-4 h-4 text-[var(--gold)]" /> Morning Shifts
                </h3>
                {morningSlots.length > 0 ? morningSlots.map((slot: any) => {
                  const full = isSlotFull(slot.id);
                  const isSelected = selectedSlot === slot.id;
                  const booked = availabilityMap[selectedDate]?.[String(slot.id)] || 0;
                  return (
                    <button
                      key={slot.id}
                      disabled={full || !hasValidMembership}
                      onClick={() => { setSelectedSlot(slot.id); setBookError(""); setSuccessMsg(""); }}
                      className={`w-full p-3 rounded-xl border text-left transition-all duration-200 ${
                        full ? "opacity-40 cursor-not-allowed border-[var(--error)]/30 bg-[var(--error)]/5" :
                        isSelected ? "border-[var(--gold)] bg-[var(--gold)]/15 shadow-md" :
                        "border-[var(--glass-border)] hover:border-[var(--glass-border-highlight)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-[var(--text)] text-sm">{slot.start_time_display || slot.start_time} – {slot.end_time_display || slot.end_time}</p>
                        {full ? (
                          <span className="text-[10px] font-bold text-[var(--error)] bg-[var(--error)]/10 px-2 py-0.5 rounded-full">FULL</span>
                        ) : (
                          <span className="text-[10px] font-bold text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-full">{capacity - booked} left</span>
                        )}
                      </div>
                    </button>
                  );
                }) : <p className="text-[12px] text-[var(--muted)]">No morning shifts available.</p>}
              </div>

              {/* Evening Slots */}
              <div className="space-y-3">
                <h3 className="text-[12px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3 border-b border-[var(--border)] pb-2 flex items-center gap-2">
                  <Sunset className="w-4 h-4 text-[var(--gold)]" /> Evening Shifts
                </h3>
                {eveningSlots.length > 0 ? eveningSlots.map((slot: any) => {
                  const full = isSlotFull(slot.id);
                  const isSelected = selectedSlot === slot.id;
                  const booked = availabilityMap[selectedDate]?.[String(slot.id)] || 0;
                  return (
                    <button
                      key={slot.id}
                      disabled={full || !hasValidMembership}
                      onClick={() => { setSelectedSlot(slot.id); setBookError(""); setSuccessMsg(""); }}
                      className={`w-full p-3 rounded-xl border text-left transition-all duration-200 ${
                        full ? "opacity-40 cursor-not-allowed border-[var(--error)]/30 bg-[var(--error)]/5" :
                        isSelected ? "border-[var(--gold)] bg-[var(--gold)]/15 shadow-md" :
                        "border-[var(--glass-border)] hover:border-[var(--glass-border-highlight)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-[var(--text)] text-sm">{slot.start_time_display || slot.start_time} – {slot.end_time_display || slot.end_time}</p>
                        {full ? (
                          <span className="text-[10px] font-bold text-[var(--error)] bg-[var(--error)]/10 px-2 py-0.5 rounded-full">FULL</span>
                        ) : (
                          <span className="text-[10px] font-bold text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-full">{capacity - booked} left</span>
                        )}
                      </div>
                    </button>
                  );
                }) : <p className="text-[12px] text-[var(--muted)]">No evening shifts available.</p>}
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="glass-card p-6 flex-grow flex items-center justify-center min-h-[300px]">
            <p className="text-[var(--muted)] font-medium">Select a date to view available time slots.</p>
          </motion.div>
        )}

        {/* Book button */}
        {selectedDate && selectedSlot && hasValidMembership && (
          <motion.div variants={fadeUp} className="mt-auto">
            <button
              onClick={handleBook}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-md bg-[var(--gold)] text-[#0B0B0A] font-bold uppercase tracking-widest text-sm shadow-lg hover:bg-[#D4B577] hover:scale-[1.01] transition-all duration-300 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {submitting ? "Confirming Booking..." : "Confirm Booking"}
            </button>
          </motion.div>
        )}
      </div>

    </motion.div>
  );
}
