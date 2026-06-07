"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ParticleField } from "@/components/effects/ParticleField";
import { CursorGlow } from "@/components/effects/CursorGlow";
import { X, ZoomIn } from "lucide-react";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } },
};

const images = [
  { src: "/stadium-day.jpg", span: "md:col-span-2 md:row-span-2", alt: "Stadium Exterior (Day)", category: "Exterior" },
  { src: "/stadium-night.jpg", span: "md:col-span-1 md:row-span-1", alt: "Night Lights", category: "Lighting" },
  { src: "/stadium-day.jpg", span: "md:col-span-1 md:row-span-1", alt: "Main Court", category: "Interior" },
  { src: "/stadium-night.jpg", span: "md:col-span-2 md:row-span-1", alt: "Evening View", category: "Exterior" },
  { src: "/stadium-day.jpg", span: "md:col-span-1 md:row-span-2", alt: "Training Area", category: "Interior" },
  { src: "/stadium-night.jpg", span: "md:col-span-1 md:row-span-1", alt: "Facade Details", category: "Exterior" },
  { src: "/stadium-day.jpg", span: "md:col-span-2 md:row-span-1", alt: "Spectator Seating", category: "Interior" },
];

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedImage) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedImage]);

  return (
    <main className="min-h-screen bg-[var(--bg)] transition-colors duration-500 overflow-hidden">
      <CursorGlow />
      <div className="fixed inset-0 pointer-events-none z-0"><ParticleField count={30} /></div>
      <div className="fixed inset-0 mesh-bg opacity-30 z-0 pointer-events-none" />
      <Navbar />

      <section className="pt-40 pb-32 relative z-10 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center mb-24 max-w-4xl mx-auto">
            <motion.span variants={fadeUp} className="text-[var(--primary)] font-bold text-sm uppercase tracking-widest block mb-4">
              Visual Tour
            </motion.span>
            <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-black text-[var(--text)] mb-6 tracking-tighter">
              The <span className="gradient-text">Gallery</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-xl text-[var(--muted)] font-medium leading-relaxed">
              Explore the architectural mastery and world-class amenities of Kathua Indoor Stadium.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden" animate="visible" variants={stagger} 
            className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[300px]"
          >
            {images.map((img, i) => {
              const isHovered = hoveredIndex === i;
              const isOtherHovered = hoveredIndex !== null && hoveredIndex !== i;
              
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setSelectedImage(img.src)}
                  className={`relative overflow-hidden rounded-[2rem] cursor-pointer group ${img.span} ${isOtherHovered ? 'opacity-40 grayscale-[50%]' : 'opacity-100'} transition-all duration-500 ease-out`}
                  style={{ transform: isHovered ? "scale(1.02)" : "scale(1)", zIndex: isHovered ? 10 : 1, boxShadow: isHovered ? "var(--depth-shadow-lg)" : "var(--depth-shadow-sm)" }}
                >
                  <motion.div className="absolute inset-0 bg-[var(--bg)] animate-pulse -z-10" />
                  
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute top-6 right-6 w-10 h-10 rounded-full glass-card flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>

                  <div className="absolute bottom-8 left-8 right-8 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                    <span className="text-[var(--primary)] text-sm font-bold uppercase tracking-wider mb-2 block drop-shadow-md">{img.category}</span>
                    <p className="text-white font-black text-2xl md:text-3xl leading-tight drop-shadow-lg">{img.alt}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Cinematic Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-2xl"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-8 right-8 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-50">
              <X className="w-6 h-6" />
            </button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
