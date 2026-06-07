"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Calendar, Shield, Users, Zap, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

// ── Motion presets ──────────────────────────────────────────────────────────
const reveal = {
  hidden: { opacity: 0, y: 48 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as any, delay },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] as any } },
};

// ── Data ────────────────────────────────────────────────────────────────────

const sports = [
  { name: "Badminton",    image: "/sports/badm.jpeg"       },
  { name: "Carrom",       image: "/sports/carrom.jpeg"     },
  { name: "Judo",         image: "/sports/judo.jpg"        },
  { name: "Library",      image: "/sports/library.jpeg"    },
  { name: "Table Tennis", image: "/sports/tabletennis.avif"},
  { name: "Taekwondo",    image: "/sports/tae.png"         },
  { name: "Shooting",     image: "/sports/skeet.jpg"       },
];

const features = [
  {
    icon: Zap,
    title: "Instant Booking",
    description: "Reserve your court in moments. Real-time availability, confirmed instantly — no calls, no queues.",
  },
  {
    icon: Shield,
    title: "Aadhaar Verified",
    description: "Every member is identity-verified. A secure, professional environment built on trust.",
  },
  {
    icon: Calendar,
    title: "Flexible Sessions",
    description: "Morning and evening blocks. Choose your time and discipline without compromise.",
  },
  {
    icon: Star,
    title: "Professional Grade",
    description: "International-standard courts maintained for competitive and recreational excellence.",
  },
  {
    icon: Users,
    title: "Youth Concessions",
    description: "Dedicated pricing for school and college athletes — investing in the next generation.",
  },
  {
    icon: MapPin,
    title: "Prime Location",
    description: "Located within the District Sports Stadium complex, Kathua — accessible and prominent.",
  },
];

// ── Stadium Section ─────────────────────────────────────────────────────────

function StadiumSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

  const imgScale    = useTransform(scrollYProgress, [0, 1], [2.2, 1]);
  const imgX        = useTransform(scrollYProgress, [0, 1], ["28%", "0%"]);
  const borderRadius = useTransform(scrollYProgress, [0, 1], ["0px", "12px"]);
  const imgOpacity  = useTransform(scrollYProgress, [0, 0.15, 1], [0, 0.55, 1]);
  const blur        = useTransform(scrollYProgress, [0, 0.4, 1], [24, 6, 0]);
  const blurStr     = useTransform(blur, (v) => `blur(${v}px)`);
  const textX       = useTransform(scrollYProgress, [0.3, 1], ["56px", "0px"]);
  const textOpacity = useTransform(scrollYProgress, [0.3, 0.9], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[110vh] overflow-hidden flex items-center"
      style={{ background: "var(--surface)" }}
    >
      <div className="absolute inset-0 mesh-bg pointer-events-none" />
      <div className="section-divider absolute top-0 inset-x-0" />
      <div className="section-divider absolute bottom-0 inset-x-0" />

      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-28 py-24">

          {/* Image */}
          <div className="relative flex-shrink-0 w-full lg:w-[480px] xl:w-[560px]">
            <motion.div
              style={{
                opacity: imgOpacity,
                position: "absolute",
                inset: "-2rem",
                pointerEvents: "none",
                background: "radial-gradient(ellipse at center, rgba(200,169,107,0.1) 0%, transparent 70%)",
              }}
            />
            <motion.div
              style={{ scale: imgScale, x: imgX, borderRadius, filter: blurStr, opacity: imgOpacity, border: "1px solid rgba(200,169,107,0.18)" }}
              className="relative w-full aspect-square overflow-hidden shadow-[0_48px_96px_rgba(0,0,0,0.7)] origin-left"
            >
              <img
                src="/stadium-night.jpg"
                alt="Kathua Indoor Stadium"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Status badge */}
              <motion.div
                style={{ opacity: imgOpacity, background: "rgba(11,11,10,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(200,169,107,0.2)", borderRadius: "4px" }}
                className="absolute top-6 left-6 flex items-center gap-2.5 px-4 py-2.5"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A8C5C] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4A8C5C]" />
                </span>
                <span className="text-xs font-semibold text-[var(--text)] tracking-widest uppercase">Open</span>
              </motion.div>

              {/* Nameplate */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="font-serif text-2xl font-bold text-white mb-1">Kathua Indoor Stadium</p>
                <p className="text-sm text-white/55 font-medium tracking-wide">District Sports Complex · J&K</p>
              </div>
            </motion.div>
          </div>

          {/* Text */}
          <motion.div style={{ x: textX, opacity: textOpacity }} className="flex-1 max-w-[520px]">
            <span className="luxury-label block mb-8">About the Venue</span>
            <h2 className="font-serif text-5xl md:text-6xl font-bold text-[var(--text)] leading-[1.05] mb-8">
              A State&#8209;of&#8209;the&#8209;Art<br />
              <em className="not-italic text-[var(--gold)]">Multi&#8209;Sport Complex</em>
            </h2>
            <p className="text-[var(--muted)] text-lg leading-relaxed font-light mb-8">
              A <strong className="text-[var(--text)] font-semibold">₹4 crore</strong> investment in Kathua's sporting future — located alongside the main District Sports Stadium. Providing year-round, weather-proof facilities for local youth, aspiring athletes, and the wider community.
            </p>
            <div className="h-px bg-[var(--border)] mb-8" />
            <p className="text-[var(--muted-dark)] text-sm tracking-wider uppercase font-semibold">
              Established under J&K Sports Council
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { 
    setMounted(true);
    authApi.checkAuth().then((res: any) => {
      if (res.authenticated) {
        router.replace("/dashboard");
      }
    }).catch(() => {});
  }, [router]);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY       = useTransform(scrollYProgress, [0, 1], [0, 240]);
  const imageScale  = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] flex items-end overflow-hidden">

        {/* Full-bleed background image */}
        <motion.div style={{ scale: imageScale }} className="absolute inset-0 z-0 transform-gpu">
          {mounted && (
            <motion.img
              src="/stadium-night.jpg"
              alt="Kathua Indoor Stadium"
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-[115%] object-cover object-center absolute -top-[8%]"
            />
          )}
          {/* Layered gradient for cinematic depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0A] via-[#0B0B0A]/45 to-[#0B0B0A]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0A]/50 to-transparent" />
        </motion.div>

        {/* Hero content — bottom left anchored */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-[1400px] mx-auto px-8 lg:px-16 pb-20 lg:pb-28"
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            {/* Eyebrow */}
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-8">
              <div className="h-px w-10 bg-[var(--gold)]" />
              <span className="luxury-label">Kathua Indoor Stadium · Est. 2024</span>
            </motion.div>

            {/* Editorial headline */}
            <motion.h1
              variants={fadeUp}
              className="font-serif text-[clamp(3.2rem,8vw,7rem)] font-bold text-[var(--text)] leading-[0.95] mb-8 tracking-tight"
            >
              Where Champions<br />
              <em className="not-italic text-[var(--gold)]">Begin.</em>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-[var(--muted)] text-lg md:text-xl font-light leading-relaxed max-w-xl mb-12"
            >
              Professional sports facilities. Digital access. A legacy built for Kathua's future.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="btn-primary">
                Begin Registration <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/tariff" className="btn-secondary">
                View Membership Plans
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-8 right-8 lg:right-16 z-20 flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-12 bg-gradient-to-b from-[var(--gold)] to-transparent"
          />
          <span className="luxury-label text-[var(--muted-dark)] text-[9px]">Scroll</span>
        </motion.div>
      </section>

      {/* ── STADIUM SECTION ── */}
      <StadiumSection />

      {/* ── FEATURES ── */}
      <section className="py-40" style={{ background: "var(--bg)" }}>
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mb-24"
          >
            <motion.span variants={fadeUp} className="luxury-label block mb-6">The Experience</motion.span>
            <motion.h2
              variants={fadeUp}
              className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--text)] leading-[1.0] max-w-3xl"
            >
              Engineered for<br />
              <em className="not-italic text-[var(--gold)]">Excellence</em>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
            style={{ border: "1px solid var(--border)" }}
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="p-10 lg:p-12 group cursor-default"
                style={{
                  background: "var(--surface)",
                  borderRight: i % 3 !== 2 ? "1px solid var(--border)" : "none",
                  borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                  transition: "background 0.4s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}
              >
                <div className="w-10 h-10 mb-8 flex items-center justify-center" style={{ border: "1px solid var(--border)" }}>
                  <f.icon className="w-5 h-5" style={{ color: "var(--gold)" }} />
                </div>
                <h3 className="font-serif text-xl font-semibold text-[var(--text)] mb-4">{f.title}</h3>
                <p className="text-[var(--muted)] leading-relaxed text-[15px] font-light">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ── FACILITIES REEL ── */}
      <section className="py-32 overflow-hidden" style={{ background: "var(--surface)" }}>
        <div className="section-divider mb-0" />
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16 mb-20 pt-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span variants={fadeUp} className="luxury-label block mb-6">World-Class Venues</motion.span>
            <motion.h2
              variants={fadeUp}
              className="font-serif text-5xl md:text-6xl font-bold text-[var(--text)] leading-[1.0]"
            >
              Our Facilities
            </motion.h2>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="relative w-full py-2">
          <div className="absolute left-0 top-0 bottom-0 w-32 lg:w-64 z-10 pointer-events-none"
            style={{ background: "linear-gradient(90deg, var(--surface), transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-32 lg:w-64 z-10 pointer-events-none"
            style={{ background: "linear-gradient(270deg, var(--surface), transparent)" }} />

          <div className="animate-marquee gap-5 px-4">
            {[...sports, ...sports].map((sport, idx) => (
              <div
                key={`${sport.name}-${idx}`}
                className="flex-shrink-0 relative overflow-hidden group/card"
                style={{
                  width: "340px",
                  height: "440px",
                  border: "1px solid var(--border)",
                }}
              >
                <img
                  src={sport.image}
                  alt={sport.name}
                  className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover/card:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="h-px w-8 bg-[var(--gold)] mb-4 transition-all duration-700 group-hover/card:w-full" />
                  <h3 className="font-serif text-2xl font-bold text-white tracking-tight">{sport.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="section-divider mt-20" />
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-40 overflow-hidden" style={{ background: "var(--bg)" }}>
        <div className="absolute inset-0 mesh-bg pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-[1400px] mx-auto px-8 lg:px-16"
        >
          <div className="max-w-2xl">
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-10">
              <div className="h-px w-10 bg-[var(--gold)]" />
              <span className="luxury-label">Join the Institution</span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold text-[var(--text)] leading-[0.95] mb-10"
            >
              Ready to<br />
              <em className="not-italic text-[var(--gold)]">Play?</em>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="text-[var(--muted)] text-lg font-light leading-relaxed mb-14 max-w-lg"
            >
              Join Kathua's premier sports network. Book facilities, manage your membership, and be part of something lasting.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="btn-primary">
                Create Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/about" className="btn-secondary">
                Learn More
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
