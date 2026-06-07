"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut, CalendarDays, ChevronDown, Settings } from "lucide-react";
import { authApi } from "@/lib/api";

interface NavUser {
  full_name: string;
  username: string;
  is_staff: boolean;
}

export function Navbar({ user: propUser }: { user?: NavUser | null }) {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser]               = useState<NavUser | null>(propUser || null);

  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propUser !== undefined) {
      setUser(propUser);
    } else {
      authApi.checkAuth().then((res: any) => {
        if (res.authenticated) setUser(res.user);
      }).catch(() => {});
    }
  }, [propUser]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        // Only close mobile menu if clicking outside of it.
        // Wait, hamburger button is outside of mobileMenuRef. 
        // Actually, we don't need to close mobile menu on outside click because it takes full screen.
        // But clicking a link inside should close it.
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-700"
        style={{
          background: scrolled ? "rgba(11,11,10,0.96)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(200,169,107,0.1)" : "1px solid transparent",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-4 group shrink-0">
              <div className="flex flex-col">
                <span
                  className="text-lg font-bold tracking-[0.15em] uppercase text-[var(--text)] leading-none"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  GOV<span style={{ color: "var(--gold)" }}>SPORTS</span>
                </span>
                <span
                  className="text-[9px] tracking-[0.25em] uppercase leading-none mt-1"
                  style={{ color: "var(--muted-dark)", fontFamily: "'Manrope', sans-serif" }}
                >
                  Kathua Indoor Stadium
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-10">
              {[
                { href: "/tariff",  label: "Plans"   },
                { href: "/gallery", label: "Gallery"  },
                { href: "/about",   label: "About"    },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[13px] font-semibold tracking-[0.1em] uppercase transition-colors duration-300"
                  style={{ color: "var(--muted)", fontFamily: "'Manrope', sans-serif" }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--gold)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--muted)"; }}
                >
                  {label}
                </Link>
              ))}

              {user && (
                <Link
                  href="/dashboard/facilities"
                  className="text-[13px] font-semibold tracking-[0.1em] uppercase transition-colors duration-300"
                  style={{ color: "var(--muted)", fontFamily: "'Manrope', sans-serif" }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--gold)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--muted)"; }}
                >
                  Facilities
                </Link>
              )}
            </nav>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-6">
              {user ? (
                /* Profile dropdown */
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2.5 text-[13px] font-semibold tracking-[0.08em] uppercase transition-colors duration-300"
                    style={{ color: "var(--muted)", fontFamily: "'Manrope', sans-serif" }}
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[#0B0B0A]"
                      style={{ background: "var(--gold)" }}
                    >
                      {(user.full_name || user.username)[0].toUpperCase()}
                    </div>
                    <span>{user.full_name?.split(" ")[0] || user.username}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${profileOpen ? "rotate-180" : ""}`}
                      style={{ color: "var(--muted-dark)" }}
                    />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-3 w-52 py-1"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {[
                          { href: "/dashboard",          label: "Dashboard",   icon: CalendarDays },
                          { href: "/dashboard/profile",  label: "My Profile",  icon: User        },
                          { href: "/dashboard/bookings", label: "My Bookings", icon: CalendarDays },
                          { href: "/dashboard/settings", label: "Settings",    icon: Settings },
                        ].map(({ href, label, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-3 px-5 py-3 text-[13px] font-medium transition-colors duration-200"
                            style={{ color: "var(--muted)", fontFamily: "'Manrope', sans-serif" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </Link>
                        ))}
                        <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                        <button
                          onClick={async () => {
                            try {
                              await authApi.logout();
                              setUser(null);
                              window.location.href = '/login';
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="flex items-center w-full text-left gap-3 px-5 py-3 text-[13px] font-medium transition-colors duration-200"
                          style={{ color: "var(--error)", fontFamily: "'Manrope', sans-serif" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-5">
                  <Link
                    href="/login"
                    className="text-[13px] font-semibold tracking-[0.1em] uppercase transition-colors duration-300"
                    style={{ color: "var(--muted)", fontFamily: "'Manrope', sans-serif" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--gold)"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--muted)"; }}
                  >
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary !py-3 !px-7 !text-[11px]">
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 transition-colors duration-200"
              style={{ color: "var(--muted)" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 left-0 right-0 z-40 py-6 px-8"
            style={{ background: "rgba(11,11,10,0.98)", borderBottom: "1px solid var(--border)" }}
            ref={mobileMenuRef}
          >
            <nav className="flex flex-col gap-5">
              {[
                { href: "/tariff",  label: "Plans"     },
                { href: "/gallery", label: "Gallery"   },
                { href: "/about",   label: "About"     },
                ...(user ? [
                  { href: "/dashboard/facilities", label: "Facilities" },
                  { href: "/dashboard",            label: "Dashboard"  },
                ] : []),
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-base font-semibold tracking-[0.08em] uppercase"
                  style={{ color: "var(--muted)", fontFamily: "'Manrope', sans-serif" }}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
              {user ? (
              <div className="flex items-center gap-6">
                <button 
                  onClick={async () => {
                    try {
                      await authApi.logout();
                      setUser(null);
                      window.location.href = '/login';
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="text-sm font-semibold tracking-[0.08em] uppercase transition-colors" 
                  style={{ color: "var(--error)", fontFamily: "'Manrope', sans-serif" }}
                >
                  Sign Out
                </button>
              </div>) : (
                <Link href="/register" className="btn-primary w-full justify-center mt-2" onClick={() => setMobileOpen(false)}>
                  Register Now
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
