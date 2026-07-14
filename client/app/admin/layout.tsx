"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!role || role.toUpperCase() !== "ADMIN") {
      router.push("/admin/login");
      return;
    }

    if (userId) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${baseUrl}/auth/me?user_id=${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch user profile");
          return res.json();
        })
        .then((data) => setUser(data))
        .catch((err) => console.error("Admin profile fetch failed", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [router, isLoginPage]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-[#0f0c29] text-white flex flex-col md:flex-row overflow-hidden relative">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#24243e] via-[#302b63] to-[#0f0c29] -z-10" />
      
      {/* Mobile Header Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/10 z-[50]">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-[#00d4ff]">⚡</span>
          <h1 style={{color:"white"}} className="text-sm font-black text-white tracking-tighter uppercase">
            Admin <span className="text-[#00d4ff]">Panel</span>
          </h1>
        </div>
        <button style={{margin:"5px"}}
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"
        >
          <span style={{margin:"5px"}} className="text-2xl">☰</span>
        </button>
      </div>

      {/* Sidebar */}
      <AdminSidebar 
        user={user} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto relative p-6 md:p-10 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
