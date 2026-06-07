"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { authApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ full_name: string; username: string; is_staff: boolean } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authApi.checkAuth()
      .then((res: any) => {
        if (!res.authenticated) {
          router.replace("/login");
        } else {
          setUser(res.user);
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Navbar user={user} />
      <main className="flex-grow pt-28 pb-12 px-4 max-w-[1400px] mx-auto w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
