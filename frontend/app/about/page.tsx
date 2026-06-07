"use client";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ParticleField } from "@/components/effects/ParticleField";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <ParticleField count={20} />
      <Navbar />
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-5xl md:text-7xl font-black text-[var(--text)] mb-6">About <span className="gradient-text">Us</span></h1>
            <p className="text-xl text-[var(--muted)] max-w-3xl mx-auto">Kathua Indoor Stadium is a state-of-the-art facility dedicated to promoting sports and wellness in the community. Our mission is to provide world-class infrastructure for athletes of all levels.</p>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
