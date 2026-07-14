"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Card from "@/components/Card";
import Button from "@/components/Button";

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300;
const RESEND_COOLDOWN = 60;

export default function OTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [expiryLeft, setExpiryLeft] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (expiryLeft <= 0) return;
    const t = setInterval(() => setExpiryLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [expiryLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    setError("");
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const newDigits = [...digits];
    for (let i = 0; i < text.length; i++) newDigits[i] = text[i];
    setDigits(newDigits);
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = useCallback(async () => {
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }
    if (expiryLeft <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    setIsVerifying(true);
    setError("");
    try {
      const phone = localStorage.getItem("phone");
      const res = await api.post("/auth/verify-otp", { phone, otp });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", String(res.data.id));
      localStorage.setItem("role", res.data.role || "CUSTOMER");
      setSuccess(true);
      const redirect = searchParams.get("redirect") || "/customer/home";
      setTimeout(() => router.push(redirect), 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Invalid OTP. Please try again.";
      setError(detail);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  }, [digits, expiryLeft, router, searchParams]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError("");
    try {
      const phone = localStorage.getItem("phone");
      await api.post("/auth/send-otp", { phone });
      setResendCooldown(RESEND_COOLDOWN);
      setExpiryLeft(OTP_EXPIRY_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Failed to resend OTP.";
      setError(detail);
    } finally {
      setIsResending(false);
    }
  };

  const phone = typeof window !== "undefined" ? localStorage.getItem("phone") : null;
  const maskedPhone = phone ? `******${phone.slice(-4)}` : "your number";

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
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${success ? 'from-green-500 to-emerald-500 shadow-green-500/20' : 'from-blue-500 to-cyan-500 shadow-blue-500/20'} text-4xl mb-6 shadow-lg animate-float`}>
                {success ? "✅" : "🔐"}
              </div>
              <h1 style={{color:"white"}} className="text-3xl font-black text-white tracking-tight mb-2">
                {success ? "Verified!" : "Verify OTP"}
              </h1>
              <p style={{margin:"10px"}} className="text-slate-400 font-medium">
                {success ? "Redirecting to your dashboard..." : <>Code sent to <span className="text-blue-400 font-bold">{maskedPhone}</span></>}
              </p>
            </div>

            {!success && (
              <div className="space-y-8">
                {/* 6-box OTP input */}
                <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                    style={{color:"white"}}
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className={`w-12 h-16 sm:w-14 sm:h-20 text-center text-2xl font-black rounded-2xl border-2 bg-white/5 text-white outline-none transition-all duration-300 ${
                        error ? "border-red-500/50 focus:border-red-500" : d ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "border-white/10 focus:border-blue-500"
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm text-center animate-shake">
                    ⚠️ {error}
                  </div>
                )}

                <div style={{margin:"10px"}} className="text-center">
                  {expiryLeft > 0 ? (
                    <p className="text-slate-500 text-sm font-medium">
                      Code expires in <span className={`font-black tabular-nums ${expiryLeft < 60 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(expiryLeft)}</span>
                    </p>
                  ) : (
                    <p className="text-red-400 text-sm font-black">⏰ OTP Expired</p>
                  )}
                </div>

                <Button
                  size="xl"
                  style={{margin:"10px"}}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
                  onClick={handleVerify}
                  loading={isVerifying}
                  disabled={isVerifying || digits.join("").length < OTP_LENGTH || expiryLeft <= 0}
                >
                  Verify Account
                </Button>

                <div className="text-center space-y-4">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Didn't get the code?</p>
                  <button
                  style={{color:"white",margin:"10px"}}
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isResending}
                    className={`text-sm font-black transition-colors ${resendCooldown > 0 || isResending ? 'text-slate-700 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'}`}
                  >
                    {isResending ? "RESENDING..." : resendCooldown > 0 ? `RESEND IN ${resendCooldown}S` : "RESEND OTP NOW"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <Link href="/auth/login">
                <Button style={{color:"white",margin:"5px"}} variant="ghost" className="text-slate-400 hover:text-white transition-colors">
                  ← Back to Login
                </Button>
              </Link>
            </div>
          </Card>

          <p className="text-center mt-8 text-slate-600 text-xs uppercase tracking-widest font-black">
            Secure Verification Powered by RentalApp
          </p>
        </div>
      </main>
    </div>
  );
}