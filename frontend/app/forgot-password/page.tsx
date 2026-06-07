"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export default function ForgotPassword() {
  const router = useRouter();
  
  useEffect(() => {
    authApi.checkAuth().then((res: any) => {
      if (res.authenticated) {
        router.replace("/dashboard");
      }
    }).catch(() => {});
  }, [router]);

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md glass-card p-8">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-6 text-center">Reset Password</h2>
          <input type="email" placeholder="Email Address" className="w-full p-3 glass-input mb-4" />
          <button className="w-full btn-primary">Send Reset Link</button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
