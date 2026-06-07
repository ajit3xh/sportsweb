"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Lock, Shield, Eye, ArrowRight, Mail, MessageSquare, Monitor, Moon, Sun } from "lucide-react";

type Tab = 'security' | 'notifications' | 'preferences';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('security');
  
  // Settings States
  const [notifications, setNotifications] = useState({
    booking: true,
    promotional: false,
    security: true,
    sms: false
  });
  const [darkMode, setDarkMode] = useState(true);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const variants = {
    hidden: { opacity: 0, x: -10 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="max-w-4xl mx-auto space-y-10">
      <div className="border-b border-[var(--border)] pb-8">
        <span className="luxury-label block mb-4">Account Management</span>
        <h1 className="font-serif text-4xl font-bold text-[var(--text)] tracking-tight">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="space-y-2 sticky top-24">
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-lg text-sm font-bold uppercase tracking-widest text-left transition-colors ${activeTab === 'security' ? 'bg-[var(--surface-2)] text-[var(--gold)] border border-[var(--border)]' : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] border border-transparent'}`}
          >
            <Lock className="w-4 h-4" /> Security
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-lg text-sm font-bold uppercase tracking-widest text-left transition-colors ${activeTab === 'notifications' ? 'bg-[var(--surface-2)] text-[var(--gold)] border border-[var(--border)]' : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] border border-transparent'}`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-lg text-sm font-bold uppercase tracking-widest text-left transition-colors ${activeTab === 'preferences' ? 'bg-[var(--surface-2)] text-[var(--gold)] border border-[var(--border)]' : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] border border-transparent'}`}
          >
            <Eye className="w-4 h-4" /> Preferences
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'security' && (
              <motion.div key="security" variants={variants} initial="hidden" animate="enter" exit="exit" transition={{ duration: 0.3 }} className="space-y-8">
                <div className="glass-card p-8 border-[var(--border-strong)]">
                  <div className="flex items-center gap-3 mb-6 border-b border-[var(--border)] pb-4">
                    <Lock className="w-5 h-5 text-[var(--gold)]" />
                    <h2 className="font-serif text-2xl font-bold text-[var(--text)]">Change Password</h2>
                  </div>
                  
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Current Password</label>
                      <input type="password" placeholder="••••••••" className="w-full p-4 glass-input bg-[var(--surface-2)]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full p-4 glass-input bg-[var(--surface-2)]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">Confirm New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full p-4 glass-input bg-[var(--surface-2)]" />
                    </div>
                    <button type="button" className="btn-primary w-full mt-4">
                      Update Password <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                <div className="glass-card p-8 border-[var(--border-strong)]">
                  <div className="flex items-center gap-3 mb-6 border-b border-[var(--border)] pb-4">
                    <Shield className="w-5 h-5 text-[var(--gold)]" />
                    <h2 className="font-serif text-2xl font-bold text-[var(--text)]">Two-Factor Authentication</h2>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
                    <div>
                      <h3 className="font-bold text-[var(--text)] mb-1">Protect your account</h3>
                      <p className="text-sm text-[var(--muted)]">Add an extra layer of security.</p>
                    </div>
                    <button className="mt-4 sm:mt-0 px-6 py-2 bg-transparent border border-[var(--gold)] text-[var(--gold)] rounded text-[11px] font-bold uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[#000] transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" variants={variants} initial="hidden" animate="enter" exit="exit" transition={{ duration: 0.3 }} className="space-y-8">
                <div className="glass-card p-8 border-[var(--border-strong)]">
                  <div className="flex items-center gap-3 mb-6 border-b border-[var(--border)] pb-4">
                    <Bell className="w-5 h-5 text-[var(--gold)]" />
                    <h2 className="font-serif text-2xl font-bold text-[var(--text)]">Notification Preferences</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                      <div className="flex items-start gap-4">
                        <Mail className="w-5 h-5 text-[var(--gold)] mt-0.5" />
                        <div>
                          <h3 className="font-bold text-[var(--text)] mb-1 text-sm">Booking Reminders</h3>
                          <p className="text-xs text-[var(--muted)]">Email alerts 24 hours before your scheduled facility slot.</p>
                        </div>
                      </div>
                      <button onClick={() => handleToggle('booking')} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 flex-shrink-0 ${notifications.booking ? 'bg-[var(--gold)]' : 'bg-[var(--surface-3)]'}`}>
                        <div className={`w-4 h-4 rounded-full bg-[#0B0B0A] transition-transform ${notifications.booking ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                      <div className="flex items-start gap-4">
                        <MessageSquare className="w-5 h-5 text-[var(--gold)] mt-0.5" />
                        <div>
                          <h3 className="font-bold text-[var(--text)] mb-1 text-sm">SMS Alerts</h3>
                          <p className="text-xs text-[var(--muted)]">Get instant text messages for urgent stadium updates.</p>
                        </div>
                      </div>
                      <button onClick={() => handleToggle('sms')} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 flex-shrink-0 ${notifications.sms ? 'bg-[var(--gold)]' : 'bg-[var(--surface-3)]'}`}>
                        <div className={`w-4 h-4 rounded-full bg-[#0B0B0A] transition-transform ${notifications.sms ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                      <div className="flex items-start gap-4">
                        <Shield className="w-5 h-5 text-[var(--gold)] mt-0.5" />
                        <div>
                          <h3 className="font-bold text-[var(--text)] mb-1 text-sm">Security Alerts</h3>
                          <p className="text-xs text-[var(--muted)]">Notifications about new logins and password changes.</p>
                        </div>
                      </div>
                      <button onClick={() => handleToggle('security')} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 flex-shrink-0 ${notifications.security ? 'bg-[var(--gold)]' : 'bg-[var(--surface-3)]'}`}>
                        <div className={`w-4 h-4 rounded-full bg-[#0B0B0A] transition-transform ${notifications.security ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div key="preferences" variants={variants} initial="hidden" animate="enter" exit="exit" transition={{ duration: 0.3 }} className="space-y-8">
                <div className="glass-card p-8 border-[var(--border-strong)]">
                  <div className="flex items-center gap-3 mb-6 border-b border-[var(--border)] pb-4">
                    <Eye className="w-5 h-5 text-[var(--gold)]" />
                    <h2 className="font-serif text-2xl font-bold text-[var(--text)]">Display Preferences</h2>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-4">Color Theme</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setDarkMode(true)} 
                          className={`p-6 rounded-lg border flex flex-col items-center gap-3 transition-colors ${darkMode ? 'border-[var(--gold)] text-[var(--gold)] bg-[var(--gold)]/5' : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)] bg-[var(--surface-2)]'}`}
                        >
                          <Moon className="w-6 h-6" />
                          <span className="font-bold text-[11px] tracking-widest uppercase">Dark Mode</span>
                        </button>
                        <button 
                          onClick={() => setDarkMode(false)} 
                          className={`p-6 rounded-lg border flex flex-col items-center gap-3 transition-colors ${!darkMode ? 'border-[var(--gold)] text-[var(--gold)] bg-[var(--gold)]/5' : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)] bg-[var(--surface-2)]'}`}
                        >
                          <Sun className="w-6 h-6" />
                          <span className="font-bold text-[11px] tracking-widest uppercase">Light Mode</span>
                        </button>
                      </div>
                      {!darkMode && (
                        <p className="text-xs text-[var(--gold)] mt-3 text-center">Note: This platform is optimized for Dark Mode luxury aesthetics.</p>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-[var(--border)]">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-4">Regional Settings</label>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text)] mb-2">Language</label>
                          <select className="w-full p-4 glass-input bg-[var(--surface-2)] appearance-none cursor-not-allowed opacity-70" disabled>
                            <option>English (UK)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[var(--text)] mb-2">Time Zone</label>
                          <select className="w-full p-4 glass-input bg-[var(--surface-2)] appearance-none cursor-not-allowed opacity-70" disabled>
                            <option>Asia/Kolkata (IST)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
