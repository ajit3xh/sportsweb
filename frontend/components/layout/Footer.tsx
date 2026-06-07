"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Lock, Code } from "lucide-react";

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[13px] font-medium tracking-wide transition-colors duration-300"
        style={{ color: "var(--muted)", fontFamily: "'Manrope', sans-serif" }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--gold)"; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--muted)"; }}
      >
        {children}
      </Link>
    </li>
  );
}

export function Footer() {
  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 pt-20 pb-10">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-16">

          {/* Brand */}
          <div className="md:col-span-5">
            <div className="mb-6">
              <p
                className="text-lg font-bold tracking-[0.18em] uppercase text-[var(--text)] leading-none mb-1"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                GOV<span style={{ color: "var(--gold)" }}>SPORTS</span>
              </p>
              <p
                className="text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "var(--muted-dark)", fontFamily: "'Manrope', sans-serif" }}
              >
                Kathua Indoor Stadium
              </p>
            </div>

            <p
              className="text-[15px] leading-relaxed font-light max-w-sm mb-8"
              style={{ color: "var(--muted)", fontFamily: "'Manrope', sans-serif" }}
            >
              The official management portal for Kathua Indoor Stadium. Professional sports facilities, seamless digital access.
            </p>

            <div className="space-y-3">
              {[
                { Icon: MapPin, text: "Kathua Indoor Stadium, Kathua, J&K" },
                { Icon: Phone, text: "+91 XXX-XXX-XXXX"                    },
                { Icon: Mail,  text: "info@govsports.in"                   },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--gold)" }} />
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: "var(--muted)", fontFamily: "'Manrope', sans-serif" }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-3 md:col-start-7">
            <p
              className="text-[10px] font-bold tracking-[0.25em] uppercase mb-6"
              style={{ color: "var(--gold)", fontFamily: "'Manrope', sans-serif" }}
            >
              Navigate
            </p>
            <ul className="space-y-4">
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/tariff">Tariff & Plans</FooterLink>
              <FooterLink href="/gallery">Gallery</FooterLink>
              <FooterLink href="/login">Sign In</FooterLink>
              <FooterLink href="/register">Register</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <p
              className="text-[10px] font-bold tracking-[0.25em] uppercase mb-6"
              style={{ color: "var(--gold)", fontFamily: "'Manrope', sans-serif" }}
            >
              Legal
            </p>
            <ul className="space-y-4">
              <FooterLink href="#">Privacy Policy</FooterLink>
              <FooterLink href="#">Terms of Service</FooterLink>
              <li>
                <Link
                  href="/admin-login"
                  className="flex items-center gap-2 text-[13px] font-medium transition-colors duration-300"
                  style={{ color: "var(--muted-dark)", fontFamily: "'Manrope', sans-serif" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--error)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted-dark)"; }}
                >
                  <Lock className="w-3 h-3" />
                  Admin Access
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--border)" }} className="mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p
            className="text-[12px]"
            style={{ color: "var(--muted-dark)", fontFamily: "'Manrope', sans-serif" }}
          >
            © {new Date().getFullYear()} Kathua Indoor Stadium · J&K Sports Authority · All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <a 
              href="https://github.com/ajit3xh" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[var(--muted-dark)] hover:text-[var(--gold)] transition-colors duration-300"
              title="Developer"
            >
              <Code className="w-4 h-4" />
            </a>
            {["Instagram", "Twitter", "LinkedIn"].map((platform) => (
              <a
                key={platform}
                href="#"
                className="text-[12px] font-medium tracking-[0.06em] transition-colors duration-300"
                style={{ color: "var(--muted-dark)", fontFamily: "'Manrope', sans-serif" }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--gold)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--muted-dark)"; }}
              >
                {platform}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
