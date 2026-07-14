"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);
  const { cart } = useCart();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedRole = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");
    setRole(storedRole);

    if (userId) {
      const token = localStorage.getItem("token");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${baseUrl}/auth/me?user_id=${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch user profile");
          return res.json();
        })
        .then((data) => setUser(data))
        .catch((err) => console.error("Nav profile fetch failed", err));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    setRole(null);
    setUser(null);
    window.location.href = "/";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      
      // Intelligent redirection: if it matches a known category exactly, go there
      const categories = ["chairs", "tables", "tents", "sound", "lighting", "cooling", "stage"];
      if (categories.includes(q)) {
        router.push(`/customer/category/${q}`);
      } else {
        router.push(`/customer/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        role={role}
        handleLogout={handleLogout}
      />

      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-2 md:py-4">
        <div className="max-w-[1440px] w-full mx-auto px-2 md:px-6">
          <div className="glass-morphism rounded-2xl md:rounded-3xl h-14 md:h-20 flex items-center px-4 md:px-10 gap-2 md:gap-12 border border-white/10 shadow-2xl">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 md:gap-3 group flex-shrink-0">
              <span className="text-xl md:text-3xl transition-transform duration-300 group-hover:rotate-12">🎉</span>
              <span className="text-lg md:text-2xl font-black tracking-tighter text-gradient">
                RENTAFEST
              </span>
            </Link>

            {/* Search Bar - Responsive */}
            <form style={{padding:"5px"}} onSubmit={handleSearch} className="flex-grow max-w-2xl flex items-center bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-3 md:px-5 py-1.5 md:py-2.5 focus-within:bg-white/10 focus-within:border-primary/50 transition-all">
              <span className="text-slate-400 text-xs md:text-base">🔍</span>
              <input
              style={{border:"none",outline:"none",padding:"5px"}}
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none focus:ring-0 w-full px-2 md:px-4 text-[10px] md:text-sm font-bold text-white placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Right Menu */}
            <div className="flex items-center gap-1.5 md:gap-8 ml-auto">
              {(!role || role.toUpperCase() === "CUSTOMER") && (
                <>
                  <div className="hidden lg:flex items-center gap-4">
                    <NavLink href="/customer/home">Home</NavLink>
                    <NavLink href="/customer/category">Explore</NavLink>
                  </div>

                  <Link
                  style={{padding:"5px"}}
                    href="/customer/cart"
                    className="relative p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-lg md:rounded-2xl transition-all group flex items-center gap-2 border border-white/5"
                  >
                    <span className="text-lg md:text-xl">🛒</span>
                    <span className="hidden md:block text-xs font-black text-slate-300 uppercase tracking-widest">Cart</span>
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-primary text-white text-[8px] md:text-[10px] font-bold w-4 h-4 md:w-6 md:h-6 flex items-center justify-center rounded-full shadow-lg border border-slate-900">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {role?.toUpperCase() === "ADMIN" && (
                <div className="hidden lg:flex items-center gap-4">
                  <NavLink href="/admin/dashboard">Dashboard</NavLink>
                </div>
              )}

              {role?.toUpperCase() === "DELIVERY" && (
                <div className="hidden lg:flex items-center gap-4">
                  <NavLink href="/delivery/dashboard">Dashboard</NavLink>
                </div>
              )}

              {!role ? (
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex items-center gap-3 group p-1 pr-3 hover:bg-white/5 rounded-2xl transition-all"
                >
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl border-2 border-slate-700 overflow-hidden flex items-center justify-center bg-slate-800 shadow-lg">
                    <span className="text-lg">👤</span>
                  </div>
                  <Link href="/auth/login">
                  <span className="hidden md:block text-xs font-black text-slate-200 uppercase tracking-widest group-hover:text-primary transition-colors">
                    Sign In
                  </span>
                  </Link>
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="flex items-center gap-3 group p-1 pr-3 hover:bg-white/5 rounded-2xl transition-all"
                  >
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl border-2 border-primary overflow-hidden flex items-center justify-center bg-slate-800 shadow-lg group-hover:border-white transition-all">
                      {user?.profile_image ? (
                        <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <span className="hidden md:block text-xs font-black text-slate-200 uppercase tracking-widest group-hover:text-primary transition-colors truncate max-w-[100px]">
                      {user?.name || "User"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-5 py-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary hover:bg-white/5 rounded-xl transition-all"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest bg-white/5 rounded-2xl text-center border border-white/5"
    >
      {children}
    </Link>
  );
}
