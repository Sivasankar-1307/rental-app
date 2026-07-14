"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AdminSidebarProps {
  user?: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ user, isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  if (!mounted) return null;

  const menuItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { label: "Inventory", href: "/admin/items", icon: "📦" },
    { label: "Pricing Strategy", href: "/admin/pricing", icon: "💰" },
    { label: "Logistics Center", href: "/admin/stock", icon: "🚛" },
    { label: "Agent Management", href: "/admin/agents", icon: "👥" },
    { label: "Order Proof", href: "/admin/order-proofs", icon: "📸" },
    { label: "Customer Management", href: "/admin/customers", icon: "👤" },
    { label: "Refund", href: "/admin/refunds", icon: "💸" },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:relative z-[60] h-full w-72 bg-black/40 backdrop-blur-[20px] border-r border-white/10 
        flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Section */}
        <div className="p-8 border-b border-white/5 relative">
          <Link style={{padding:"20px"}} href="/admin/dashboard" className="flex items-center gap-3 group">
            <span className="text-3xl transition-transform duration-300 group-hover:rotate-12 text-[#00d4ff]">⚡</span>
            <div>
              <h1 style={{color:"white"}} className="text-xl font-black text-white tracking-tighter uppercase">
                Admin<span className="text-[#00d4ff]">Panel</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Control Center</p>
            </div>
          </Link>
          
          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white md:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{padding:"10px"}} className="flex-grow overflow-y-auto py-6 px-0 space-y-1 custom-scrollbar">
          <p style={{margin:"5px"}} className="px-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Management</p>
          
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768) onClose();
                }}
                className={`flex items-center gap-4 px-8 py-4 transition-all group relative ${
                  isActive 
                    ? "bg-[#00d4ff]/10 text-[#00d4ff] border-l-4 border-[#00d4ff] font-semibold" 
                    : "text-slate-400 hover:text-[#00d4ff] hover:bg-[#00d4ff]/5 border-l-4 border-transparent"
                }`}
              >
                <span className={`text-xl transition-all duration-300 ${isActive ? "scale-110" : "grayscale group-hover:grayscale-0"}`}>
                  {item.icon}
                </span>
                <span className="text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile & Logout Section */}
        <div className="p-6 border-t border-white/5 bg-black/20">
          <div style={{margin:"5px"}} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/20 border border-[#00d4ff]/30 flex items-center justify-center text-xl">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="P" className="w-full h-full object-cover rounded-xl" />
              ) : (
                "👨‍💼"
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-[#00d4ff] uppercase tracking-widest">Admin</p>
              <p className="text-xs font-bold text-white truncate">{user?.name || "Administrator"}</p>
            </div>
          </div>

          <button
          style={{margin:"5px"}}
            onClick={handleLogout}
            className="flex items-center gap-4 w-full p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-black uppercase tracking-widest text-xs group sidebar-logout"
          >
            <span className="text-xl group-hover:translate-x-1 transition-transform">🚪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
