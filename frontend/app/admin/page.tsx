"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, CalendarDays, IndianRupee, Activity, CheckCircle, XCircle, Clock, Loader2, AlertCircle, Edit3, Save, X, LogOut } from "lucide-react";
import { adminApi, authApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Trash2, ImagePlus, UserX, UserCheck, Settings2, Plus } from "lucide-react";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } },
};

interface AdminData {
  total_revenue: number;
  total_bookings: number;
  active_bookings: number;
  total_users: number;
  total_facilities: number;
  active_bookings_list: any[];
}

interface Plan {
  id: number;
  name: string;
  category_name: string;
  display_duration: string;
  base_price: string;
  discount_percentage: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "bookings" | "facilities" | "users" | "gallery" | "plans" | "calendar">("dashboard");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<{bookings: any[], closures: any[]}>({ bookings: [], closures: [] });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [forceBookForm, setForceBookForm] = useState({ user_id: "", facility_id: "", slot_id: "" });
  const [data, setData] = useState<AdminData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ id?: number | string; msg: string; ok: boolean } | null>(null);
  
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ base_price: "", discount_percentage: "", is_active: true });

  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [facilityForm, setFacilityForm] = useState({ facility_name: "", capacity_per_slot: 1, slot_duration_minutes: 40, is_active: true });

  const [closures, setClosures] = useState<any[]>([]);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [closureForm, setClosureForm] = useState({ date: "", description: "", facility_id: "", slot_id: "" });

  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ username: "", full_name: "", phone_number: "", email: "", password: "", category_id: "" });

  const fetchData = async () => {
    try {
      const [dbRes, plansRes, usersRes, facRes, galRes, closuresRes] = await Promise.all([
        adminApi.dashboard() as Promise<AdminData>,
        adminApi.plans() as Promise<any>,
        adminApi.users() as Promise<any>,
        adminApi.facilities() as Promise<any>,
        adminApi.gallery() as Promise<any>,
        adminApi.closures() as Promise<any>
      ]);
      
      setData(dbRes);
      setPlans(plansRes.plans || []);
      setUsers(usersRes.users || []);
      setFacilities(facRes.facilities || []);
      setGallery(galRes.images || []);
      setClosures(closuresRes.closures || []);
      setError("");
    } catch (err: any) {
      if (err.status === 403) {
        setError("Access Denied. You must be logged in as an admin.");
      } else {
        setError(err.error || "Failed to load dashboard. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async (year: number, month: number) => {
    try {
      const res = await adminApi.calendar(year, month) as any;
      setCalendarData({ bookings: res.bookings || [], closures: res.closures || [] });
    } catch (err) {
      console.error("Failed to fetch calendar data", err);
    }
  };

  useEffect(() => { fetchData(); }, []);
  
  useEffect(() => {
    fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const handleForceBook = async (e: React.FormEvent<HTMLFormElement>, facilityId: number, slotId: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userId = formData.get('user_id');
    
    setActionLoading(`force-book-${facilityId}-${slotId}`);
    try {
      await adminApi.forceBooking({
        user_id: userId,
        facility_id: facilityId,
        slot_id: slotId,
        date: selectedDay
      });
      setActionMsg({ msg: "Booking created successfully!", ok: true });
      setShowDayModal(false);
      fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
      fetchData();
    } catch (err: any) {
      setActionMsg({ msg: err.error || "Failed to create booking", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await adminApi.approveBooking(id);
      setActionMsg({ id, msg: `Booking #${id} approved!`, ok: true });
      await fetchData();
    } catch (err: any) {
      setActionMsg({ id, msg: err.error || "Failed to approve.", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await adminApi.rejectBooking(id);
      setActionMsg({ id, msg: `Booking #${id} rejected.`, ok: true });
      await fetchData();
    } catch (err: any) {
      setActionMsg({ id, msg: err.error || "Failed to reject.", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const startEditPlan = (plan: Plan) => {
    setEditingPlan(plan.id);
    setEditForm({
      base_price: plan.base_price,
      discount_percentage: plan.discount_percentage,
      is_active: plan.is_active
    });
  };

  const savePlan = async (id: number) => {
    setActionLoading(id);
    try {
      await adminApi.updatePlan(id, editForm);
      setActionMsg({ msg: "Plan updated successfully", ok: true });
      setEditingPlan(null);
      await fetchData();
    } catch (err: any) {
      setActionMsg({ msg: err.error || "Failed to update plan", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleToggleBan = async (id: number, action: 'ban' | 'unban') => {
    setActionLoading(`user-${id}`);
    try {
      await adminApi.toggleBan(id, action);
      setActionMsg({ id: `user-${id}`, msg: `User successfully ${action}ned`, ok: true });
      await fetchData();
    } catch (err: any) {
      setActionMsg({ id: `user-${id}`, msg: err.error || `Failed to ${action} user`, ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    setActionLoading("gallery-upload");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", "Uploaded via Admin");
    
    try {
      await adminApi.uploadGalleryImage(formData);
      setActionMsg({ msg: "Image uploaded successfully!", ok: true });
      await fetchData();
    } catch (err: any) {
      setActionMsg({ msg: err.error || err.detail || err.message || JSON.stringify(err) || "Failed to upload image", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
      e.target.value = ""; // Reset file input
    }
  };

  const handleDeleteGalleryImage = async (id: number) => {
    setActionLoading(`gallery-${id}`);
    try {
      await adminApi.deleteGalleryImage(id);
      setActionMsg({ msg: "Image deleted successfully", ok: true });
      await fetchData();
    } catch (err: any) {
      setActionMsg({ msg: err.error || "Failed to delete image", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("facility-save");
    try {
      await adminApi.createFacility(facilityForm);
      setActionMsg({ msg: "Facility added successfully!", ok: true });
      setShowFacilityModal(false);
      setFacilityForm({ facility_name: "", capacity_per_slot: 1, slot_duration_minutes: 40, is_active: true });
      await fetchData();
    } catch (err: any) {
      setActionMsg({ msg: err.error || "Failed to add facility", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const toggleFacilityStatus = async (id: number, currentStatus: boolean) => {
    setActionLoading(`facility-${id}`);
    try {
      await adminApi.updateFacility(id, { is_active: !currentStatus });
      await fetchData();
    } catch (err: any) {
      console.error("Failed to toggle facility status", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteFacility = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this facility? This may delete associated bookings.")) return;
    
    setActionLoading(`facility-del-${id}`);
    try {
      await adminApi.deleteFacility(id);
      setActionMsg({ msg: "Facility deleted successfully", ok: true });
      await fetchData();
    } catch (err: any) {
      setActionMsg({ msg: err.error || "Failed to delete facility", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("user-save");
    try {
      await adminApi.createUser(userForm);
      setActionMsg({ msg: "User created successfully!", ok: true });
      setShowUserModal(false);
      setUserForm({ username: "", full_name: "", phone_number: "", email: "", password: "", category_id: "" });
      await fetchData();
    } catch (err: any) {
      setActionMsg({ msg: err.error || "Failed to create user", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleSaveClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("closure-save");
    try {
      const payload: any = { date: closureForm.date, description: closureForm.description };
      if (closureForm.facility_id) payload.facility = parseInt(closureForm.facility_id);
      if (closureForm.slot_id) payload.slot = parseInt(closureForm.slot_id);
      
      await adminApi.createClosure(payload);
      setActionMsg({ msg: "Closure created successfully!", ok: true });
      setShowClosureModal(false);
      setClosureForm({ date: "", description: "", facility_id: "", slot_id: "" });
      await fetchData();
      fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
    } catch (err: any) {
      setActionMsg({ msg: err.error || "Failed to create closure", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleDeleteClosure = async (id: number) => {
    if (!window.confirm("Delete this closure?")) return;
    setActionLoading(`closure-del-${id}`);
    try {
      await adminApi.deleteClosure(id);
      await fetchData();
      fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!window.confirm("Force cancel this booking?")) return;
    setActionLoading(`booking-cancel-${id}`);
    try {
      await adminApi.cancelBooking(id);
      setActionMsg({ msg: `Booking #${id} cancelled.`, ok: true });
      await fetchData();
      fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1);
    } catch (err: any) {
      setActionMsg({ msg: err.error || "Failed to cancel booking", ok: false });
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

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

  const statCards = [
    { title: "Total Revenue", value: formatCurrency(data?.total_revenue || 0), icon: IndianRupee },
    { title: "Active Bookings", value: data?.active_bookings || 0, icon: Activity },
    { title: "Total Facilities", value: data?.total_facilities || 0, icon: CalendarDays },
    { title: "Total Users", value: data?.total_users || 0, icon: Users },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-10">
      
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border)] pb-8 gap-6">
        <div>
          <span className="luxury-label block mb-4">Administration</span>
          <h1 className="font-serif text-5xl font-bold text-[var(--text)] tracking-tight">
            System <em className="not-italic text-[var(--gold)]">Overview.</em>
          </h1>
        </div>
        <div className="flex flex-col gap-4 items-end">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={async () => {
                await authApi.logout();
                window.location.href = "/admin-login";
              }}
              className="text-xs font-bold uppercase tracking-widest text-[var(--error)] bg-[var(--error)]/10 px-4 py-2 rounded-md hover:bg-[var(--error)]/20 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-md p-1 self-end flex-wrap gap-1">
          {["dashboard", "bookings", "calendar", "facilities", "users", "gallery", "plans"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab ? "bg-[var(--gold)] text-[#0B0B0A] rounded-sm shadow-sm" : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {tab}
            </button>
          ))}
          </div>
        </div>
      </motion.div>

      {actionMsg && !actionMsg.id && (
        <div className={`p-4 rounded-md border text-sm font-bold uppercase tracking-widest text-center ${actionMsg.ok ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20'}`}>
          {actionMsg.msg}
        </div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, i) => (
                <div key={i} className="glass-card p-6 border-[var(--border)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] font-bold uppercase tracking-widest text-[var(--muted)]">{stat.title}</span>
                    <div className="w-8 h-8 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
                      <stat.icon className="w-4 h-4 text-[var(--gold)]" />
                    </div>
                  </div>
                  <p className="font-serif text-3xl font-bold text-[var(--text)]">{stat.value}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => setActiveTab("facilities")} className="glass-card p-6 border-[var(--border)] hover:border-[var(--gold)]/50 cursor-pointer transition-all group">
                <Settings2 className="w-8 h-8 text-[var(--gold)] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-lg">Manage Facilities</h3>
                <p className="text-sm text-[var(--muted)]">Add or update games</p>
              </div>
              <div onClick={() => setActiveTab("users")} className="glass-card p-6 border-[var(--border)] hover:border-[var(--gold)]/50 cursor-pointer transition-all group">
                <Users className="w-8 h-8 text-[var(--gold)] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-lg">Manage Users</h3>
                <p className="text-sm text-[var(--muted)]">View and moderate athletes</p>
              </div>
              <div onClick={() => setActiveTab("gallery")} className="glass-card p-6 border-[var(--border)] hover:border-[var(--gold)]/50 cursor-pointer transition-all group">
                <ImagePlus className="w-8 h-8 text-[var(--gold)] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-lg">Manage Gallery</h3>
                <p className="text-sm text-[var(--muted)]">Upload stadium images</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "bookings" && (
          <motion.div key="bookings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <span className="luxury-label">Pending & Active Bookings</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Booking ID</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">User</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Facility</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Date & Time</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Status</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data?.active_bookings_list?.length === 0 && (
                    <tr><td colSpan={6} className="p-10 text-center text-[var(--muted)]">No active or pending bookings.</td></tr>
                  )}
                  {data?.active_bookings_list?.map((b: any) => (
                    <tr key={b.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="p-5 font-mono text-sm text-[var(--gold)]">#{b.id}</td>
                      <td className="p-5 font-medium text-[var(--text)]">{b.user}</td>
                      <td className="p-5 text-sm text-[var(--text)]">{b.facility_name}</td>
                      <td className="p-5 text-sm">
                        <div className="flex items-center gap-2 text-[var(--text)]">
                          <CalendarDays className="w-3.5 h-3.5 text-[var(--muted)]" /> {b.date}
                        </div>
                        <div className="flex items-center gap-2 text-[var(--muted)] mt-1">
                          <Clock className="w-3.5 h-3.5 text-[var(--muted)]" /> {b.slot_time}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          b.status === "pending" ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20" :
                          b.status === "active" ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" :
                          "bg-[var(--muted)]/10 text-[var(--muted)] border-[var(--muted)]/20"
                        }`}>
                          {b.status}
                        </span>
                        {actionMsg?.id === b.id && actionMsg && (
                          <p className={`text-xs mt-2 font-bold ${actionMsg.ok ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>{actionMsg.msg}</p>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        {b.status === "pending" && (
                          <div className="flex justify-end gap-2 mb-2">
                            <button 
                              onClick={() => handleApprove(b.id)}
                              disabled={actionLoading === b.id}
                              className="p-2 rounded-md bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 transition-colors border border-[var(--success)]/20"
                              title="Approve"
                            >
                              {actionLoading === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleReject(b.id)}
                              disabled={actionLoading === b.id}
                              className="p-2 rounded-md bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 transition-colors border border-[var(--error)]/20"
                              title="Reject"
                            >
                              {actionLoading === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                        {(b.status === "pending" || b.status === "active") && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleCancelBooking(b.id)}
                              disabled={actionLoading === `booking-cancel-${b.id}`}
                              className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 transition-colors border border-[var(--error)]/20"
                              title="Cancel Booking"
                            >
                              {actionLoading === `booking-cancel-${b.id}` ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />} Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {activeTab === "calendar" && (
          <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="glass-card p-6 border-[var(--border)]">
              <div className="flex justify-between items-center mb-6">
                <span className="luxury-label">Admin Calendar</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 border border-[var(--border)] rounded hover:bg-[var(--surface-2)]">&larr;</button>
                  <h2 className="text-xl font-bold font-serif">{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</h2>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 border border-[var(--border)] rounded hover:bg-[var(--surface-2)]">&rarr;</button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-bold uppercase tracking-widest text-[var(--muted)] p-2">{d}</div>
                ))}
                {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-4" />
                ))}
                {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  
                  // Calculate badges
                  const dayBookings = calendarData.bookings.filter(b => b.date === dateStr);
                  const dayClosures = calendarData.closures.filter(c => c.date === dateStr);
                  
                  const isFullyClosed = dayClosures.some(c => !c.facility_id && !c.slot_id);

                  return (
                    <div 
                      key={day} 
                      onClick={() => { setSelectedDay(dateStr); setShowDayModal(true); }}
                      className={`min-h-[100px] p-2 border border-[var(--border)] rounded cursor-pointer transition-colors hover:border-[var(--gold)]/50 flex flex-col relative ${isFullyClosed ? 'bg-[var(--error)]/5' : 'bg-[var(--surface)]'}`}
                    >
                      <span className="text-sm font-bold">{day}</span>
                      <div className="mt-auto flex flex-col gap-1">
                        {isFullyClosed && <span className="text-[9px] bg-[var(--error)]/20 text-[var(--error)] px-1 rounded truncate">Closed</span>}
                        {!isFullyClosed && dayClosures.length > 0 && <span className="text-[9px] bg-[var(--warning)]/20 text-[var(--warning)] px-1 rounded truncate">{dayClosures.length} Closures</span>}
                        {!isFullyClosed && dayBookings.length > 0 && <span className="text-[9px] bg-[var(--success)]/20 text-[var(--success)] px-1 rounded truncate">{dayBookings.length} Bookings</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {showDayModal && selectedDay && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 border-[var(--gold)]/50 relative">
                  <button onClick={() => setShowDayModal(false)} className="absolute top-4 right-4 p-2 bg-[var(--surface-2)] rounded-full hover:bg-[var(--error)]/20 hover:text-[var(--error)] transition-colors"><X className="w-5 h-5" /></button>
                  <h3 className="font-serif text-3xl font-bold mb-2">Manage Date: {selectedDay}</h3>
                  <div className="flex gap-2 mb-8">
                    <button 
                      onClick={() => { setClosureForm({ ...closureForm, date: selectedDay, facility_id: "", slot_id: "", description: "Admin blocked" }); setShowClosureModal(true); setShowDayModal(false); setActiveTab("facilities"); }}
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 border border-[var(--error)]/20 rounded"
                    >
                      Close Entire Day
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {facilities.map(fac => {
                      const facBookings = calendarData.bookings.filter(b => b.date === selectedDay && b.facility_id === fac.id);
                      const facClosures = calendarData.closures.filter(c => c.date === selectedDay && (c.facility_id === fac.id || !c.facility_id));
                      
                      // Calculate slots
                      const startHour = 6; const endHour = 22;
                      const slotDuration = fac.slot_duration_minutes;
                      const totalMins = (endHour - startHour) * 60;
                      const numSlots = Math.floor(totalMins / slotDuration);
                      
                      return (
                        <div key={fac.id} className="border border-[var(--border)] p-4 rounded bg-[var(--surface)]">
                          <h4 className="font-bold text-lg text-[var(--gold)] mb-3">{fac.facility_name}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {Array.from({length: numSlots}).map((_, i) => {
                              const slotId = i + 1;
                              const startTotalMins = startHour * 60 + (i * slotDuration);
                              const sh = Math.floor(startTotalMins / 60);
                              const sm = startTotalMins % 60;
                              const timeStr = `${sh.toString().padStart(2,'0')}:${sm.toString().padStart(2,'0')}`;
                              
                              const isClosed = facClosures.some(c => !c.slot_id || c.slot_id === slotId);
                              const bookingsForSlot = facBookings.filter(b => b.slot_id === slotId);
                              const isFull = bookingsForSlot.length >= fac.capacity_per_slot;
                              
                              return (
                                <div key={slotId} className={`p-2 border rounded text-xs flex flex-col gap-2 ${isClosed ? 'border-[var(--error)]/30 bg-[var(--error)]/5 text-[var(--error)]' : isFull ? 'border-[var(--warning)]/30 bg-[var(--warning)]/5 text-[var(--warning)]' : 'border-[var(--success)]/30 bg-[var(--success)]/5 text-[var(--success)]'}`}>
                                  <div className="flex justify-between font-bold">
                                    <span>{timeStr}</span>
                                    <span>{isClosed ? 'Closed' : isFull ? 'Full' : 'Open'}</span>
                                  </div>
                                  {!isClosed && !isFull && (
                                    <form onSubmit={(e) => handleForceBook(e, fac.id, slotId)} className="mt-1 flex flex-col gap-1">
                                      <select name="user_id" required defaultValue="" className="bg-transparent border border-[var(--border)] rounded text-[9px] p-1 text-[var(--text)] outline-none">
                                        <option value="" disabled className="bg-black">Select User...</option>
                                        {users.map(u => <option key={u.id} value={u.id} className="bg-black">{u.username}</option>)}
                                      </select>
                                      <button type="submit" disabled={actionLoading === `force-book-${fac.id}-${slotId}`} className="bg-[var(--gold)] text-black rounded p-1 text-[9px] font-bold hover:bg-[var(--gold)]/80 transition-colors disabled:opacity-50">
                                        {actionLoading === `force-book-${fac.id}-${slotId}` ? "..." : "FORCE BOOK"}
                                      </button>
                                    </form>
                                  )}
                                  {!isClosed && bookingsForSlot.map(b => (
                                    <div key={b.id} className="text-[9px] text-[var(--text)] truncate">{b.user_name}</div>
                                  ))}
                                  {!isClosed && (
                                    <button 
                                      type="button"
                                      onClick={() => { setClosureForm({ ...closureForm, date: selectedDay, facility_id: fac.id.toString(), slot_id: slotId.toString(), description: "Admin blocked" }); setShowClosureModal(true); setShowDayModal(false); setActiveTab("facilities"); }}
                                      className="text-[9px] border border-[var(--error)]/50 text-[var(--error)] rounded hover:bg-[var(--error)]/10 p-0.5 mt-auto"
                                    >
                                      Close Slot
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "plans" && (
          <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <span className="luxury-label">Membership Tier Pricing</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Category</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Duration</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Base Price</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Discount %</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="p-5 font-bold text-[var(--text)]">{plan.category_name}</td>
                      <td className="p-5 text-[var(--muted)]">{plan.display_duration}</td>
                      
                      {editingPlan === plan.id ? (
                        <>
                          <td className="p-5">
                            <input 
                              type="number" 
                              value={editForm.base_price} 
                              onChange={(e) => setEditForm({...editForm, base_price: e.target.value})}
                              className="glass-input py-1 px-2 text-sm w-32"
                            />
                          </td>
                          <td className="p-5">
                            <input 
                              type="number" 
                              value={editForm.discount_percentage} 
                              onChange={(e) => setEditForm({...editForm, discount_percentage: e.target.value})}
                              className="glass-input py-1 px-2 text-sm w-24"
                            />
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => savePlan(plan.id)}
                                disabled={actionLoading === plan.id}
                                className="p-2 rounded-md bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 transition-colors border border-[var(--success)]/20"
                              >
                                {actionLoading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => setEditingPlan(null)}
                                className="p-2 rounded-md bg-[var(--muted)]/10 text-[var(--muted)] hover:bg-[var(--muted)]/20 transition-colors border border-[var(--muted)]/20"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-5 font-mono text-[var(--gold)]">{formatCurrency(Number(plan.base_price))}</td>
                          <td className="p-5 text-[var(--text)]">{parseFloat(plan.discount_percentage)}%</td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => startEditPlan(plan)}
                              className="p-2 rounded-md bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20 transition-colors border border-[var(--gold)]/20"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] bg-[var(--surface-2)] flex justify-between items-center">
              <span className="luxury-label">User Management</span>
              <button 
                onClick={() => setShowUserModal(true)}
                className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>

            {showUserModal && (
              <div className="p-6 border-b border-[var(--gold)]/50 bg-[var(--bg)]">
                <h3 className="font-serif text-2xl font-bold mb-4">Add New User</h3>
                <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Username</label>
                    <input required type="text" value={userForm.username} onChange={(e) => setUserForm({...userForm, username: e.target.value})} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Full Name</label>
                    <input required type="text" value={userForm.full_name} onChange={(e) => setUserForm({...userForm, full_name: e.target.value})} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Email</label>
                    <input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Phone Number</label>
                    <input type="text" value={userForm.phone_number} onChange={(e) => setUserForm({...userForm, phone_number: e.target.value})} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Temporary Password</label>
                    <input required type="text" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} className="glass-input w-full" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={actionLoading === "user-save"} className="btn-primary py-3 w-full flex justify-center">
                      {actionLoading === "user-save" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create"}
                    </button>
                    <button type="button" onClick={() => setShowUserModal(false)} className="btn-outline py-3 px-4">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Name</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Phone</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Category</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Status</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-[var(--text)]">{u.full_name || u.username}</div>
                        <div className="text-xs text-[var(--muted)]">{u.email}</div>
                      </td>
                      <td className="p-5 font-mono text-[var(--muted)] text-sm">{u.phone_number || "-"}</td>
                      <td className="p-5 text-[12px] uppercase tracking-widest text-[var(--gold)]">{u.category_name || "N/A"}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          u.is_banned_now ? "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20" : "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
                        }`}>
                          {u.is_banned_now ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        {!u.is_staff && (
                          <button 
                            onClick={() => handleToggleBan(u.id, u.is_banned_now ? 'unban' : 'ban')}
                            disabled={actionLoading === `user-${u.id}`}
                            className={`p-2 rounded-md transition-colors border ${
                              u.is_banned_now 
                                ? "bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 border-[var(--success)]/20" 
                                : "bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 border-[var(--error)]/20"
                            }`}
                            title={u.is_banned_now ? "Unban User" : "Ban User"}
                          >
                            {actionLoading === `user-${u.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                              (u.is_banned_now ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />)
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "facilities" && (
          <motion.div key="facilities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="luxury-label">Facility Management</span>
              <button 
                onClick={() => setShowFacilityModal(true)}
                className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Facility
              </button>
            </div>

            {showFacilityModal && (
              <div className="glass-card p-6 border-[var(--gold)]/50">
                <h3 className="font-serif text-2xl font-bold mb-4">Add New Facility</h3>
                <form onSubmit={handleSaveFacility} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Facility Name</label>
                    <input 
                      required 
                      type="text" 
                      value={facilityForm.facility_name} 
                      onChange={(e) => setFacilityForm({...facilityForm, facility_name: e.target.value})}
                      className="glass-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Capacity</label>
                    <input 
                      required 
                      type="number" 
                      value={facilityForm.capacity_per_slot} 
                      onChange={(e) => setFacilityForm({...facilityForm, capacity_per_slot: parseInt(e.target.value)})}
                      className="glass-input w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={actionLoading === "facility-save"} className="btn-primary py-3 w-full flex justify-center">
                      {actionLoading === "facility-save" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                    </button>
                    <button type="button" onClick={() => setShowFacilityModal(false)} className="btn-outline py-3 px-4">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((fac) => (
                <div key={fac.id} className="glass-card p-6 border-[var(--border)] relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl">{fac.facility_name}</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleFacilityStatus(fac.id, fac.is_active)}
                        disabled={actionLoading === `facility-${fac.id}`}
                        className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                          fac.is_active ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30" : "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/30"
                        }`}
                      >
                        {actionLoading === `facility-${fac.id}` ? "..." : (fac.is_active ? "Active" : "Inactive")}
                      </button>
                      <button 
                        onClick={() => handleDeleteFacility(fac.id)}
                        disabled={actionLoading === `facility-del-${fac.id}`}
                        className="p-1 rounded bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 transition-colors border border-[var(--error)]/20"
                        title="Delete Facility"
                      >
                        {actionLoading === `facility-del-${fac.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-[var(--muted)]">
                    <div className="flex justify-between border-b border-[var(--border)] pb-1">
                      <span>Capacity per slot</span>
                      <span className="text-[var(--text)] font-mono">{fac.capacity_per_slot}</span>
                    </div>
                    <div className="flex justify-between border-b border-[var(--border)] pb-1">
                      <span>Slot Duration</span>
                      <span className="text-[var(--text)] font-mono">{fac.slot_duration_minutes} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 flex justify-between items-center">
              <span className="luxury-label">Facility Closures</span>
              <button 
                onClick={() => setShowClosureModal(true)}
                className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Closure
              </button>
            </div>

            {showClosureModal && (
              <div className="glass-card p-6 border-[var(--gold)]/50">
                <h3 className="font-serif text-2xl font-bold mb-4">Add Closure</h3>
                <form onSubmit={handleSaveClosure} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Date</label>
                    <input required type="date" value={closureForm.date} onChange={(e) => setClosureForm({...closureForm, date: e.target.value})} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Facility (Optional)</label>
                    <select value={closureForm.facility_id} onChange={(e) => setClosureForm({...closureForm, facility_id: e.target.value})} className="glass-input w-full">
                      <option value="">All Facilities</option>
                      {facilities.map(f => <option key={f.id} value={f.id}>{f.facility_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Slot (Optional)</label>
                    <input type="number" placeholder="Slot ID" value={closureForm.slot_id} onChange={(e) => setClosureForm({...closureForm, slot_id: e.target.value})} className="glass-input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Reason</label>
                    <input required type="text" value={closureForm.description} onChange={(e) => setClosureForm({...closureForm, description: e.target.value})} className="glass-input w-full" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={actionLoading === "closure-save"} className="btn-primary py-3 w-full flex justify-center">
                      {actionLoading === "closure-save" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                    </button>
                    <button type="button" onClick={() => setShowClosureModal(false)} className="btn-outline py-3 px-4">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Date</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Facility</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Slot</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">Reason</th>
                    <th className="p-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {closures.map((c: any) => (
                    <tr key={c.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="p-5 font-bold text-[var(--text)]">{c.date}</td>
                      <td className="p-5 text-[var(--gold)]">{c.facility_name}</td>
                      <td className="p-5 text-[var(--muted)]">{c.slot_time}</td>
                      <td className="p-5 text-[var(--muted)]">{c.description}</td>
                      <td className="p-5 text-right">
                        <button 
                          onClick={() => handleDeleteClosure(c.id)}
                          disabled={actionLoading === `closure-del-${c.id}`}
                          className="p-2 rounded-md bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 transition-colors border border-[var(--error)]/20"
                        >
                          {actionLoading === `closure-del-${c.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {closures.length === 0 && (
                    <tr><td colSpan={5} className="p-5 text-center text-[var(--muted)]">No active closures.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </motion.div>
        )}

        {activeTab === "gallery" && (
          <motion.div key="gallery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="luxury-label">Gallery Studio</span>
              <label className="btn-primary py-2 px-4 text-xs flex items-center gap-2 cursor-pointer">
                {actionLoading === "gallery-upload" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Upload Image
                <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" disabled={actionLoading === "gallery-upload"} />
              </label>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.length === 0 && <p className="col-span-full text-center text-[var(--muted)] py-10">No images in gallery.</p>}
              {gallery.map((img) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square bg-[var(--surface-2)] border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image} alt={img.caption || "Gallery image"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <button 
                      onClick={() => handleDeleteGalleryImage(img.id)}
                      disabled={actionLoading === `gallery-${img.id}`}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                      {actionLoading === `gallery-${img.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                    {img.caption && <p className="text-xs text-white line-clamp-2">{img.caption}</p>}
                    <span className="text-[10px] text-gray-400 font-mono mt-1">{new Date(img.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
