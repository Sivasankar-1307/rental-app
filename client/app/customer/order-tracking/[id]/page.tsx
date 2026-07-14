"use client";

import Navbar from "@/components/Navbar";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Link from "next/link";
import { use, useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import Chatbot from "@/components/Chatbot";
import dynamic from "next/dynamic";

const TrackingMap = dynamic(() => import("@/components/TrackingMap"), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-800 animate-pulse rounded-[2.5rem]" />
});

export default function OrderTrackingPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const id = params.id;
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await api.get(`/orders/${id}/tracking`);
        setTracking(res.data);
      } catch (err) {
        console.error("Failed to fetch tracking:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();

    // Setup real-time WebSocket connection
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace("http", "ws") + "/ws/admin";
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.order_id === id) {
              console.log("Real-time update received:", data);
              
              // Play a premium sound effect to notify client of timeline change
              try {
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.volume = 0.5;
                audio.play();
              } catch (e) {}

              fetchTracking();
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
          ws?.close();
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    // Keep the polling interval as a fallback
    const interval = setInterval(fetchTracking, 10000);

    return () => {
      clearInterval(interval);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [id]);

  // ── Cancel ──
  const [isCancelled, setIsCancelled] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      await api.put(`/orders/${id}/status`, { status: "cancelled" });
      setIsCancelled(true);
    } catch {
      alert("Failed to cancel order");
    } finally {
      setIsCancelling(false);
      setIsCancelModalOpen(false);
    }
  };

  // ── Contact Support ──
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [supportMsg, setSupportMsg] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [supportSent, setSupportSent] = useState(false);

  const handleSupportSubmit = async () => {
    if (!supportMsg.trim()) { alert("Please describe your issue."); return; }
    setSupportSending(true);
    // Simulate submit (can wire to a real API later)
    await new Promise(r => setTimeout(r, 1200));
    setSupportSent(true);
    setSupportSending(false);
    setTimeout(() => { setSupportSent(false); setSupportMsg(""); setIsSupportOpen(false); }, 2000);
  };

  // ── Feedback ──
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const FEEDBACK_TAGS = [
    "Fast Delivery", "Good Quality Items", "Helpful Staff", "Easy Booking",
    "Clean Equipment", "On Time", "Good Value", "Professional",
  ];
  const NEGATIVE_TAGS = ["Late Delivery", "Damaged Items", "Poor Communication", "Billing Issue"];

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleFeedbackSubmit = async () => {
    if (rating === 0) { alert("Please select a star rating."); return; }
    setFeedbackSending(true);
    try {
      await api.post(`/orders/${id}/feedback`, {
        rating: rating,
        comment: feedbackText,
        tags: selectedTags
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error("Feedback submission failed:", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setFeedbackSending(false);
      setTimeout(() => {
        setFeedbackSent(false); setRating(0); setSelectedTags([]); setFeedbackText(""); setIsFeedbackOpen(false);
      }, 2200);
    }
  };

  // ── Helpers ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-bold animate-pulse">Initializing Tracking...</p>
      </div>
    </div>
  );

  if (!tracking) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Booking Not Found</h2>
        <Link href="/"><Button>Back to Home</Button></Link>
      </div>
    </div>
  );

  const currentStatus = isCancelled ? "cancelled" : tracking.current_status;
  const canCancel = (s: string) => s === "pending" || s === "confirmed";

  const getStatusColor = (s: string) => {
    if (s === "delivered" || s === "completed") return "success";
    if (s === "cancelled") return "danger";
    if (s === "in_progress" || s === "in_delivery") return "warning";
    return "info";
  };

  const getStatusText = (s: string) => {
    const map: Record<string, string> = {
      pending: "Order Placed", confirmed: "Confirmed", in_progress: "Processing",
      in_delivery: "Out for Delivery", delivered: "Delivered", completed: "Completed", cancelled: "Cancelled",
    };
    return map[s] || s;
  };

  const starLabel = ["", "Terrible", "Bad", "Okay", "Good", "Excellent!"];

  return (
    <div>
      <Navbar />
      <main style={{ margin: "20px", marginTop: "120px", marginBottom: "100px" }}>
        <h1 style={{ color: "white" }} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-gray-900 animate-fade-in-down">
          Order Tracking
        </h1>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 md:mb-10 animate-fade-in-up">
          <p style={{ color: "white", margin: "0" }} className="text-base md:text-lg text-gray-400">
            Booking ID: <span className="text-white font-bold">{tracking.id}</span>
          </p>
          <div className="hidden md:block w-1 h-6 bg-slate-700 mx-2" />
          <div style={{ padding: "5px" }} className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl">
            <span className="text-primary text-xl">🔑</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none">Delivery OTP</p>
              <p className="text-lg font-black text-primary leading-tight">{tracking.delivery_otp}</p>
            </div>
          </div>
        </div>

        {/* Rental Period Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 md:mb-10 animate-fade-in-up" style={{ margin:"10px",animationDelay: "0.05s" }}>
          <div style={{padding:"15px",margin:"10px",borderRadius:"24px"}} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 backdrop-blur-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl">📅</div>
            <div>
              <p style={{color:"white",opacity:0.6}} className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Start Date</p>
              <p style={{color:"white"}} className="text-xl font-black text-white">{tracking.start_date ? new Date(tracking.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</p>
            </div>
          </div>
          <div style={{padding:"15px",margin:"10px",borderRadius:"24px"}} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 backdrop-blur-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-2xl">🏁</div>
            <div>
              <p style={{color:"white",opacity:0.6}} className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/60">End Date</p>
              <p style={{color:"white"}} className="text-xl font-black text-white">{tracking.end_date ? new Date(tracking.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <Card className="mb-8 md:mb-10 animate-fade-in-down" style={{ animationDelay: "0.1s", margin: "20px", padding: "10px" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ color: "white", margin: "5px" }} className="text-2xl md:text-3xl font-bold text-gray-900">Current Status</h2>
            <div className="flex items-center gap-4">
              {canCancel(currentStatus) && (
                <Button variant="danger" size="sm" onClick={() => setIsCancelModalOpen(true)}>Cancel Order</Button>
              )}
              <Badge variant={getStatusColor(currentStatus)}>{getStatusText(currentStatus)}</Badge>
            </div>
          </div>

          {tracking.driver && tracking.driver.name !== "Assigning Agent..." && (
            <>
              {/* Map Section Trigger */}
              {tracking.live_tracking && tracking.shipping_address && (
                <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                  <button 
                  style={{padding:"20px",marginBottom:"30px"}}
                    onClick={() => setIsMapOpen(true)}
                    className="w-full p-6 bg-slate-800/40 hover:bg-slate-800/60 border border-white/5 hover:border-primary/50 rounded-3xl backdrop-blur-xl transition-all duration-300 flex items-center justify-between group shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📍</div>
                      <div className="text-left">
                        <p className="text-white font-black tracking-tight">Live Tracking Map</p>
                        <p style={{color:"white"}} className="text-[10px] font-black uppercase tracking-widest text-primary/60">Click to view agent location</p>
                      </div>
                    </div>
                    <div style={{color:"white"}} className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] group-hover:translate-x-1 transition-transform">
                      Open Map <span>→</span>
                    </div>
                  </button>
                </div>
              )}

              <div style={{padding:"15px"}} className="mb-10 p-8 bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl animate-fade-in-up">
                <div style={{margin:"10px"}} className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-xl shadow-inner">🚚</div>
                    <div>
                      <h3 style={{color:"white"}} className="text-xl font-black text-white tracking-tight">Delivery Professional</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Assigned Agent</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span style={{padding:"5px"}} className="text-[10px] font-black uppercase tracking-widest text-green-500">Live Agent</span>
                    </div>
                  </div>
                </div>
                
                <div style={{padding:"15px"}} className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    {tracking.driver.image ? (
                      <img src={tracking.driver.image} className="relative w-28 h-28 rounded-[1.8rem] object-cover border border-white/10 shadow-2xl" alt={tracking.driver.name} />
                    ) : (
                      <div style={{color:"white"}}className="relative w-28 h-28 bg-gradient-to-br from-primary to-purple-700 rounded-[1.8rem] flex items-center justify-center text-4xl font-black text-white shadow-2xl border border-white/10">
                        {tracking.driver.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 p-1.5 rounded-2xl border border-white/10 shadow-xl">
                      <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 shadow-sm shadow-green-500/50" />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h4 style={{color:"white"}} className="text-3xl font-black text-white mb-1 tracking-tight leading-none">{tracking.driver.name}</h4>
                    <p style={{color:"white"}} className="text-gray-400 font-bold mb-6 flex items-center justify-center md:justify-start gap-2">
                      <span className="text-primary/80">Vehicle:</span> {tracking.driver.vehicle || "Premium Service Vehicle"}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <a style={{padding:"5px",margin:"5px"}} href={`tel:${tracking.driver.phone}`} className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-primary border border-white/10 hover:border-primary rounded-2xl transition-all duration-300 group shadow-lg hover:shadow-primary/20">
                        <span className="text-xl group-hover:scale-110 transition-transform">📞</span>
                        <span style={{color:"white"}} className="text-sm font-black text-white tracking-wide">{tracking.driver.phone}</span>
                      </a>
                      <button style={{padding:"5px",margin:"5px"}} className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 group">
                        <span className="text-xl group-hover:rotate-12 transition-transform">💬</span>
                        <span className="text-sm font-black text-gray-300 tracking-wide">Message</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-px h-px md:h-24 bg-gradient-to-b from-transparent via-white/5 to-transparent" />

                  <div className="flex flex-col items-center gap-2 px-6">
                    <div className="flex items-center gap-1 text-yellow-400 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} className={`text-lg ${i <= Math.round(tracking.driver.rating || 5) ? "opacity-100" : "opacity-30"}`}>⭐</span>
                        ))}
                    </div>
                    <p className="text-2xl font-black text-white leading-none">{tracking.driver.rating || "5.0"}/5.0</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{tracking.driver.reviews_count || 0} Reviews</p>
                  </div>
                </div>

                {tracking.live_tracking?.estimated_arrival && (
                  <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-3 h-3 bg-primary rounded-full animate-ping opacity-75" />
                        <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-[0.15em] text-gray-400">Live Status: <span className="text-white ml-2">En Route</span></p>
                    </div>
                    <div style={{padding:"5px",margin:"5px"}} className="flex items-center gap-4 bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">ETA</span>
                      <p className="text-2xl font-black text-primary tracking-tighter">{tracking.live_tracking.estimated_arrival}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-3">
            <h3 style={{ color: "white", margin: "8px" }} className="font-semibold text-lg text-gray-900 uppercase tracking-wide">Items in This Order</h3>
            {tracking.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fade-in-up hover:bg-purple-50 transition-colors duration-300"
                style={{ animationDelay: `${idx * 0.1}s`, margin: "10px", padding: "5px" }}>
                <div className="flex items-center gap-4">
                  {item.image && <img src={item.image} className="w-10 h-10 object-cover rounded" alt="" />}
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-gray-700 text-sm mt-1">Qty: {item.quantity}</p>
                  </div>
                </div>
                <Badge variant={getStatusColor(tracking.current_status)}>{getStatusText(tracking.current_status)}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Timeline */}
        <Card className="mb-8 md:mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s", margin: "20px", padding: "10px" }}>
          <h2 style={{ color: "white", margin: "10px" }} className="text-2xl md:text-3xl font-bold mb-8 text-gray-900 uppercase tracking-wide">Delivery Timeline</h2>
          <div className="relative">
            {tracking.timeline.map((milestone: any, idx: number) => {
              const isCurrent = milestone.status === tracking.current_status;
              return (
                <div key={idx} className="flex gap-4 pb-6 last:pb-0 animate-fade-in-left" style={{ animationDelay: `${0.2 + idx * 0.1}s`, margin: "5px" }}>
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center relative ${
                      milestone.completed ? "bg-green-500 border-green-500 scale-110 shadow-lg shadow-green-500/20"
                        : isCurrent ? "bg-primary border-primary animate-pulse shadow-lg shadow-primary/30"
                        : "border-gray-300 bg-white"}`}>
                      {milestone.completed ? <span className="text-white text-xs">✓</span>
                        : isCurrent ? <div className="w-2 h-2 bg-white rounded-full animate-ping" /> : null}
                    </div>
                    {idx < tracking.timeline.length - 1 && (
                      <div className={`w-1 h-12 my-1 transition-colors duration-300 ${milestone.completed ? "bg-green-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div  style={{padding:"10px",margin:"5px"}} className={`flex-1 p-4 rounded-2xl border transition-all duration-300 ${isCurrent ? "bg-primary/5 border-primary/20 scale-[1.02]" : "bg-white/5 border-white/5 hover:border-white/10"}`}>
                    <div className="flex items-center justify-between">
                      <h3 style={{ color: "white" }} className={`font-bold text-lg ${milestone.completed ? "text-green-500" : isCurrent ? "text-primary" : "text-gray-400"}`}>
                        {milestone.label}
                      </h3>
                      {isCurrent && (
                        <span style={{padding:"5px"}} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest animate-pulse border border-primary/30">
                          <span style={{padding:"5px"}} className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />Live Update
                        </span>
                      )}
                    </div>
                    <p style={{ color: "white" }} className="text-gray-400 text-sm mt-1">
                      {milestone.completed
                        ? (milestone.timestamp ? new Date(milestone.timestamp).toLocaleString() : "Updated")
                        : "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Payment Summary */}
        <Card className="mb-8 md:mb-10 animate-fade-in-up" style={{ animationDelay: "0.5s", margin: "20px", padding: "10px" }}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">💳</span>
            <h2 style={{ color: "white", margin: "0" }} className="text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">Payment Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div style={{ margin: "10px" }} className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Total Order Value</span>
                <span className="font-black text-gray-900 dark:text-white">₹{tracking.total_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Paid Amount (Advance)</span>
                <span className="font-black text-green-500">₹{tracking.paid_amount?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Balance to Pay</span>
                <span className="font-black text-rose-500 text-xl">₹{tracking.balance_amount?.toLocaleString() || 0}</span>
              </div>
            </div>
            <div style={{ padding: "10px" }} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-white/5 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Payment Method</p>
                <p className="font-bold text-gray-900 dark:text-white uppercase">{tracking.payment_method || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Security Deposit</p>
                <p className="font-bold text-primary">
                  {tracking.deposit_option === "online" ? "Paid Online" : tracking.deposit_option === "link" ? "Pay via Link" : "Pending"}
                </p>
              </div>
              {tracking.balance_amount > 0 && (
                <div className="pt-2"><Badge variant="warning">Pay Balance on Delivery</Badge></div>
              )}
            </div>
          </div>
        </Card>

        {/* Actions — Contact Support & Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-12 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>

          {/* Contact Support Card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.05) 100%)",
            border: "1px solid rgba(99,102,241,0.2)", borderRadius: 24, padding: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎧</div>
              <div>
                <h3 style={{ color: "white", fontWeight: 800, fontSize: 17, margin: 0 }}>Need Help?</h3>
                <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>We're here 24/7 for you</p>
              </div>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
              Contact our support team if you face any issues with your order.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => setIsSupportOpen(true)}
                style={{ padding: "11px 0", background: "#6366f1", border: "none", borderRadius: 14, color: "white", fontWeight: 800, cursor: "pointer", fontSize: 13, letterSpacing: "0.04em" }}>
                🎧 Open Support Ticket
              </button>
              <button onClick={() => setIsChatOpen(true)}
                style={{ padding: "11px 0", background: "transparent", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 14, color: "#818cf8", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                💬 Chat with AI Assistant
              </button>
            </div>
          </div>

          {/* Feedback Card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(249,115,22,0.04) 100%)",
            border: "1px solid rgba(245,158,11,0.2)", borderRadius: 24, padding: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⭐</div>
              <div>
                <h3 style={{ color: "white", fontWeight: 800, fontSize: 17, margin: 0 }}>Feedback</h3>
                <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Help us serve you better</p>
              </div>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
              Rate your experience and share what we did right — or what we can improve.
            </p>
            <button onClick={() => setIsFeedbackOpen(true)}
              style={{ width: "100%", padding: "11px 0", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14, color: "#f59e0b", fontWeight: 800, cursor: "pointer", fontSize: 13, letterSpacing: "0.04em" }}>
              ⭐ Rate Your Experience
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-10 md:mt-12 animate-fade-in-up" style={{ animationDelay: "0.7s", margin: "20px", marginBottom: "50px" }}>
          <Link href="/"><Button style={{ color: "white", margin: "5px", padding: "5px" }} className="hover:scale-105">Back to Home</Button></Link>
        </div>
      </main>

      {/* ══════════════════════════════════════════
          CANCEL ORDER MODAL (unchanged)
      ══════════════════════════════════════════ */}
      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Order">
        <div className="space-y-6">
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20">
            <p className="text-rose-600 dark:text-rose-400 font-medium">
              Are you sure you want to cancel order <span className="font-bold">#{id}</span>?
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white">Cancellation Rules:</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              {["Orders can only be cancelled while in \"Processing\" or \"Confirmed\" status.",
                "Cancellation must be made at least 24 hours before the scheduled delivery.",
                "A full refund will be initiated to your original payment method."].map((r, i) => (
                <li key={i} className="flex items-start gap-2"><span className="text-primary mt-1">●</span>{r}</li>
              ))}
            </ul>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsCancelModalOpen(false)}>Go Back</Button>
            <Button variant="danger" className="flex-1" onClick={handleCancelOrder} loading={isCancelling}>Yes, Cancel Order</Button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════
          CONTACT SUPPORT MODAL
      ══════════════════════════════════════════ */}
      {isSupportOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(2,8,23,0.88)", backdropFilter: "blur(14px)" }}>
          <div style={{ background: "#0f172a", borderRadius: 28, width: "100%", maxWidth: 560, border: "1px solid #1e293b", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg,rgba(99,102,241,0.08),transparent)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎧</div>
                <div>
                  <h3 style={{ color: "white", fontWeight: 900, fontSize: 17, margin: 0 }}>Contact Support</h3>
                  <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>Booking #{id}</p>
                </div>
              </div>
              <button onClick={() => setIsSupportOpen(false)} style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e293b", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Quick contact options */}
              <p style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 12px" }}>Quick Contact</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>

                {/* Call */}
                <a href="tel:+917010286162" style={{ textDecoration: "none" }}>
                  <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: "14px 10px", textAlign: "center", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,185,129,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>📞</div>
                    <p style={{ color: "#10b981", fontWeight: 800, fontSize: 12, margin: 0 }}>Call Us</p>
                    <p style={{ color: "#475569", fontSize: 10, margin: "3px 0 0" }}>+91 98765 43210</p>
                  </div>
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/917010286162?text=Hi%2C%20I%20need%20help%20with%20my%20order%20${encodeURIComponent(id)}`}
                  target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 14, padding: "14px 10px", textAlign: "center", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,211,102,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>💬</div>
                    <p style={{ color: "#25d366", fontWeight: 800, fontSize: 12, margin: 0 }}>WhatsApp</p>
                    <p style={{ color: "#475569", fontSize: 10, margin: "3px 0 0" }}>Chat instantly</p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:evrgrnsiva@gmail.com?subject=Support%20for%20Order%20${encodeURIComponent(id)}&body=Hi%20Team%2C%0A%0AI%20need%20help%20with%20my%20order%20${encodeURIComponent(id)}.%0A%0A`}
                  style={{ textDecoration: "none" }}>
                  <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: "14px 10px", textAlign: "center", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>📧</div>
                    <p style={{ color: "#6366f1", fontWeight: 800, fontSize: 12, margin: 0 }}>Email Us</p>
                    <p style={{ color: "#475569", fontSize: 10, margin: "3px 0 0" }}>support@antigrav.in</p>
                  </div>
                </a>

              </div>

              {/* Message form */}
              <p style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 10px" }}>Or send us a message</p>
              <textarea
                value={supportMsg}
                onChange={e => setSupportMsg(e.target.value)}
                placeholder={`Describe your issue with order ${id}...\n\nExample: "My delivery is late" or "I received damaged items"`}
                rows={5}
                style={{ width: "100%", background: "#1e293b", border: "2px solid #334155", borderRadius: 14, padding: "12px 14px", color: "white", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = "#6366f1")}
                onBlur={e => (e.target.style.borderColor = "#334155")}
              />
              <p style={{ color: "#475569", fontSize: 11, margin: "6px 0 20px" }}>Our team typically responds within 2–4 hours on business days.</p>

              {supportSent ? (
                <div style={{ textAlign: "center", padding: 16, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14 }}>
                  <p style={{ fontSize: 28, margin: 0 }}>✅</p>
                  <p style={{ color: "#10b981", fontWeight: 800, margin: "8px 0 0" }}>Ticket submitted! We'll get back to you soon.</p>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleSupportSubmit} disabled={supportSending}
                    style={{ flex: 1, padding: "13px 0", background: "#6366f1", border: "none", borderRadius: 14, color: "white", fontWeight: 900, cursor: supportSending ? "wait" : "pointer", fontSize: 14, opacity: supportSending ? 0.8 : 1 }}>
                    {supportSending ? "⏳ Sending..." : "📩 Submit Ticket"}
                  </button>
                  <button onClick={() => setIsSupportOpen(false)}
                    style={{ padding: "13px 20px", background: "transparent", border: "1px solid #334155", borderRadius: 14, color: "#94a3b8", fontWeight: 700, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          FEEDBACK MODAL
      ══════════════════════════════════════════ */}
      {isFeedbackOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(2,8,23,0.88)", backdropFilter: "blur(14px)" }}>
          <div style={{ background: "#0f172a", borderRadius: 28, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", border: "1px solid #1e293b", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>

            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg,rgba(245,158,11,0.06),transparent)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(8px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⭐</div>
                <div>
                  <h3 style={{ color: "white", fontWeight: 900, fontSize: 17, margin: 0 }}>Rate Your Experience</h3>
                  <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>Booking #{id}</p>
                </div>
              </div>
              <button onClick={() => setIsFeedbackOpen(false)} style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e293b", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>

            <div style={{ padding: 24 }}>

              {/* Star rating */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <p style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 16px" }}>Overall Rating</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: "none", border: "none", fontSize: 44, cursor: "pointer", transition: "transform 0.15s", transform: (hoverRating || rating) >= star ? "scale(1.2)" : "scale(1)", filter: (hoverRating || rating) >= star ? "brightness(1)" : "brightness(0.3)" }}>
                      ⭐
                    </button>
                  ))}
                </div>
                {(hoverRating || rating) > 0 && (
                  <p style={{ color: "#f59e0b", fontWeight: 800, fontSize: 15, margin: 0, transition: "all 0.2s" }}>
                    {starLabel[hoverRating || rating]}
                  </p>
                )}
              </div>

              {/* Positive tags */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 10px" }}>What went well?</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {FEEDBACK_TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${selectedTags.includes(tag) ? "#10b981" : "#1e293b"}`, background: selectedTags.includes(tag) ? "rgba(16,185,129,0.1)" : "transparent", color: selectedTags.includes(tag) ? "#10b981" : "#64748b", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}>
                      {selectedTags.includes(tag) ? "✓ " : ""}{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Negative tags */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 10px" }}>Any issues?</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {NEGATIVE_TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${selectedTags.includes(tag) ? "#ef4444" : "#1e293b"}`, background: selectedTags.includes(tag) ? "rgba(239,68,68,0.1)" : "transparent", color: selectedTags.includes(tag) ? "#f87171" : "#64748b", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}>
                      {selectedTags.includes(tag) ? "✓ " : ""}{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Written review */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 10px" }}>Tell us more <span style={{ color: "#475569", fontWeight: 400, textTransform: "none" }}>(optional)</span></p>
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Share your experience in detail. Your feedback helps us improve!"
                  rows={4}
                  style={{ width: "100%", background: "#1e293b", border: "2px solid #334155", borderRadius: 14, padding: "12px 14px", color: "white", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
                  onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                  onBlur={e => (e.target.style.borderColor = "#334155")}
                />
              </div>

              {/* Submit */}
              {feedbackSent ? (
                <div style={{ textAlign: "center", padding: 20, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 16 }}>
                  <p style={{ fontSize: 32, margin: 0 }}>🎉</p>
                  <p style={{ color: "#f59e0b", fontWeight: 900, fontSize: 16, margin: "10px 0 4px" }}>Thank you for your feedback!</p>
                  <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Your review helps us serve you better.</p>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleFeedbackSubmit} disabled={feedbackSending}
                    style={{ flex: 1, padding: "14px 0", background: "linear-gradient(135deg,#f59e0b,#f97316)", border: "none", borderRadius: 14, color: "white", fontWeight: 900, cursor: feedbackSending ? "wait" : "pointer", fontSize: 14, opacity: feedbackSending ? 0.8 : 1 }}>
                    {feedbackSending ? "⏳ Submitting..." : "⭐ Submit Feedback"}
                  </button>
                  <button onClick={() => setIsFeedbackOpen(false)}
                    style={{ padding: "14px 20px", background: "transparent", border: "1px solid #334155", borderRadius: 14, color: "#94a3b8", fontWeight: 700, cursor: "pointer" }}>
                    Skip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          LIVE TRACKING MAP MODAL
      ══════════════════════════════════════════ */}
      {isMapOpen && (
        <div style={{ position: "fixed",margin:"10px",inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(2,8,23,0.92)", backdropFilter: "blur(20px)" }}>
          <div style={{ background: "#0f172a", borderRadius: 32, width: "100%", maxWidth: 900, border: "1px solid #1e293b", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", overflow: "hidden" }} className="animate-fade-in-up">
            
            {/* Header */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg,rgba(99,102,241,0.1),transparent)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📍</div>
                <div>
                  <h3 style={{ color: "white", fontWeight: 900, fontSize: 20, margin: 0, letterSpacing: "-0.02em" }}>Live Order Tracking</h3>
                  <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Agent: <span className="text-primary font-bold">{tracking.driver.name}</span> • Booking #{id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMapOpen(false)} 
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors border border-white/10"
              >✕</button>
            </div>

            <div style={{ padding: 8 }}>
              <div style={{ height: 500, width: "100%", borderRadius: 24, overflow: "hidden" }}>
                <TrackingMap 
                  agentPos={[tracking.live_tracking.lat, tracking.live_tracking.lng]}
                  customerPos={[tracking.shipping_address.lat, tracking.shipping_address.lng]}
                  agentName={tracking.driver.name}
                />
              </div>
            </div>

            <div style={{ padding: "16px 32px", background: "rgba(15,23,42,0.5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Live Connection Active</span>
               </div>
               <button 
                onClick={() => setIsMapOpen(false)}
                className="px-6 py-2 bg-primary hover:bg-primary/80 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
               >Close Tracking</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbot */}
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
