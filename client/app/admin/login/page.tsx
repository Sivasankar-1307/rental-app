"use client";

import Card from "@/components/Card";
import Button from "@/components/Button";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", {
        username: formData.email,
        password: formData.password
      });
      if (res.data.role !== "ADMIN") {
        alert("Permission Denied: Not an Admin account");
        setIsLoading(false);
        return;
      }
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.id);
      window.location.href = "/admin/dashboard";
    } catch (error) {
      alert("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col">
      {/* Background Animated Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>



      <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md animate-scale-in">
          <Card style={{padding:"20px",marginTop:"50px"}} className="glass-morphism border-white/10 backdrop-blur-xl p-8 md:p-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-4xl mb-6 shadow-lg shadow-purple-500/20 animate-float">
                👨‍💼
              </div>
              <h1 style={{color:"white"}} className="text-3xl font-black text-white tracking-tight mb-2">
                Admin Portal
              </h1>
              <p className="text-slate-400 font-medium">
                Secure access for administrators
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label style={{color:"white",margin:"5px"}} className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    style={{color:"white",padding:"5px",margin:"5px",borderRadius:"10px"}}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@rental.com"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label style={{color:"white",margin:"5px"}} className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <input
                  style={{color:"white",padding:"5px",margin:"5px",borderRadius:"10px"}}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-300 pr-12"
                  />
                  <button
                  style={{color:"skyblue"}}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L4.62 4.62"/><path d="M1 1l22 22"/><path d="M12 7V3"/><path d="M21 12c0 4.97-4.03 9-9 9-1.42 0-2.75-.33-3.92-.92"/><path d="M18.36 5.64A9 9 0 0 1 21 12"/><path d="M3 12c0-4.97 4.03-9 9-9 1.42 0 2.75.33 3.92.92"/><path d="M5.64 18.36A9 9 0 0 1 3 12"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>


              <Button
              style={{padding:"5px",margin:"10px",color:"white"}}
                size="xl"
                className="w-full mt-4"
                loading={isLoading}
                disabled={isLoading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <Link href="/">
                <Button style={{color:"white",margin:"5px"}} variant="ghost" className="text-slate-400 hover:text-white transition-colors">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </Card>

          <p className="text-center mt-8 text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Rental App Admin Panel
          </p>
        </div>
      </main>
    </div>
  );
}
