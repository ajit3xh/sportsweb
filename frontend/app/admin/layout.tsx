"use client";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <main className="max-w-[1400px] mx-auto p-6 md:p-12 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
