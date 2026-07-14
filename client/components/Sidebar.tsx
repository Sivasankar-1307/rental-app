"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  role: string | null;
  handleLogout: () => void;
}

export default function Sidebar({ isOpen, onClose, user, role, handleLogout }: SidebarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[300px] md:w-[400px] bg-slate-900 z-[101] shadow-2xl transition-transform duration-500 ease-in-out border-r border-white/10 flex flex-col`}
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          left: 0,
          right: "auto",
        }}
      >
        {/* Close Button - Amazon Style */}
        <button
          onClick={onClose}
          className={`fixed top-6 z-[102] w-12 h-12 flex items-center justify-center text-white text-4xl hover:rotate-90 transition-all duration-500 ${
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"
          }`}
          style={{
            left: isOpen ? "clamp(310px, 80%, 420px)" : "-100px",
          }}
        >
          ✕
        </button>

        {/* Header - Profile Section */}
        <div className="p-8 bg-gradient-to-br from-primary/20 to-slate-900 border-b border-white/10 relative overflow-hidden">
          
          <div className="relative z-10 flex flex-col items-start gap-4 mt-4">
            <div className="w-20 h-20 rounded-2xl border-2 border-primary overflow-hidden bg-slate-800 shadow-xl group cursor-pointer">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Welcome back</p>
              <h2 style={{color:"white"}} className="text-xl font-black text-white truncate max-w-[200px]">
                {user?.name || "Guest User"}
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1">
                {user?.email || (role ? `${role} Account` : "Sign in to explore more")}
              </p>
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        </div>

        {/* Navigation Links */}
        <div className="flex-grow overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
          
          <SidebarLink href="/customer/home" icon="🏠" label="Home" onClick={onClose} />
          <SidebarLink href="/customer/category" icon="🧭" label="Explore" onClick={onClose} />
          
          {role && (
            <>
              <div className="my-6 border-t border-white/5 mx-4" />
              <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Account</p>
              
              {role.toUpperCase() === "ADMIN" && (
                <SidebarLink href="/admin/dashboard" icon="📊" label="Admin Dashboard" onClick={onClose} />
              )}
              {role.toUpperCase() === "DELIVERY" && (
                <SidebarLink href="/delivery/dashboard" icon="🚚" label="Agent Portal" onClick={onClose} />
              )}
              {role.toUpperCase() === "CUSTOMER" && (
                <>
                  <SidebarLink href="/customer/orders" icon="📦" label="My Bookings" onClick={onClose} />
                  <SidebarLink href="/customer/profile" icon="⚙️" label="Settings" onClick={onClose} />
                  <SidebarLink href="/customer/cart" icon="🛒" label="My Cart" onClick={onClose} />
                </>
              )}
            </>
          )}

          {!role && (
            <div className="mt-8 px-4">
              <Link
                href="/auth/login"
                onClick={onClose}
                className="flex items-center justify-center w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        {role && (
          <div className="p-6 border-t border-white/5 bg-slate-900/50">
            <button
              onClick={() => {
                handleLogout();
                onClose();
              }}
              className="flex items-center gap-4 w-full p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all font-black uppercase tracking-widest text-xs"
            >
              <span className="text-xl">🚪</span>
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function SidebarLink({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-300 hover:text-white hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
    >
      <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{icon}</span>
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span>
    </Link>
  );
}
