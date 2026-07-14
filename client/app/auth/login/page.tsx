"use client";

import Navbar from "@/components/Navbar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/auth/send-otp", { phone });
      localStorage.setItem("phone", phone);
      alert(response.data.message);
      const redirect = searchParams.get("redirect");
      router.push(`/auth/otp${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`);
    } catch (error) {
      alert("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col">
      {/* Background Animated Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md animate-scale-in">
          <Card style={{padding:"25px",marginTop:"50px"}} className="glass-morphism border-white/10 backdrop-blur-xl p-8 md:p-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-4xl mb-6 shadow-lg shadow-blue-500/20 animate-float">
                👤
              </div>
              <h1 style={{color:"white"}} className="text-3xl font-black text-white tracking-tight mb-2">
                Welcome Back
              </h1>
              <p className="text-slate-400 font-medium">
                Sign in to your customer account
              </p>
            </div>

            <form onSubmit={sendOtp} className="space-y-6">
              <div className="space-y-2">
                <label style={{color:"white",margin:"5px"}} className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Phone Number
                </label>
                <div className="relative group">
                  <input
                  style={{color:"white", padding:"5px",paddingLeft:"40px",margin:"10px"}}
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit number"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold group-focus-within:text-blue-500 transition-colors">
                    +91
                  </div>
                </div>
              </div>

              <Button
              style={{margin:"10px"}}
                size="xl"
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600"
                loading={isLoading}
                disabled={isLoading}
              >
                Send Verification Code
              </Button>
            </form>

            <div style={{margin:"10px"}} className="mt-8 flex items-center gap-4">
              <div className="h-[1px] flex-grow bg-white/10"></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Other Portals</span>
              <div className="h-[1px] flex-grow bg-white/10"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Link href="/admin/login">
                <Button style={{color:"white",padding:"5px"}} variant="secondary" className="w-full text-[10px] py-3" size="sm">
                  Admin Login
                </Button>
              </Link>
              <Link href="/delivery/login">
                <Button style={{color:"white",padding:"5px"}} variant="secondary" className="w-full text-[10px] py-3" size="sm">
                  Delivery Login
                </Button>
              </Link>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <Link href="/">
                <Button style={{color:"white",padding:"5px",margin:"5px"}} variant="ghost" className="text-slate-400 hover:text-white transition-colors">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </Card>

          <p className="text-center mt-8 text-slate-500 text-sm">
            By signing in, you agree to our <span className="text-blue-400 hover:underline cursor-pointer">Terms of Service</span>
          </p>
        </div>
      </main>
    </div>
  );
}
