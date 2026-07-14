"use client";

import Card from "@/components/Card";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface ActivityOrder {
  id: string | number;
  customer: string;
  time: string;
  end_time?: string;
  total: string;
  status: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStatsData(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const pollInterval = setInterval(fetchStats, 10000); // Background poll every 10s

    // Real-time WebSocket
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace("http", "ws") + "/ws/admin";
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_ORDER") {
        // Add notification
        const newNotif = {
          id: Date.now(),
          title: "New Order Arrived!",
          message: `Customer: ${data.customer} · Total: ₹${data.total}`,
          orderId: data.order_id
        };
        setNotifications(prev => [newNotif, ...prev]);
        
        // Refresh data
        fetchStats();

        // Audio cue
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.play();
        } catch (e) {}

        // Auto-remove notification after 8 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
        }, 8000);
      }
    };

    return () => {
      clearInterval(pollInterval);
      ws.close();
    };
  }, []);

  const stats = [
    { label: "Total Revenue", value: statsData?.revenue || "₹0", trend: "Live", icon: "💰", color: "from-emerald-400 to-teal-500" },
    { label: "Active Orders", value: statsData?.active_orders?.toString() || "0", trend: "Operational", icon: "📦", color: "from-blue-400 to-indigo-500" },
    { label: "Pending Tasks", value: statsData?.pending_tasks?.toString() || "0", trend: "Awaiting Action", icon: "⚡", color: "from-orange-400 to-amber-500" },
    { label: "Fleet Status", value: "95%", trend: "Optimal", icon: "🚛", color: "from-purple-400 to-pink-500" },
  ];

  const recentOrders: ActivityOrder[] = statsData?.recent || [];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "success";
      case "in_delivery": return "warning";
      case "pending": return "info";
      default: return "info";
    }
  };

  return (
    <div style={{padding:"20px"}} className="animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 animate-fade-in-down">
          <div>
            <h1 style={{color:"white"}} className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
              Command <span className="text-gradient">Center</span>
            </h1>
            <p style={{marginBottom:"20px"}} className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              Real-time synchronization for your event rental empire.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin/orders" className="relative group">
              <Button style={{padding:"5px"}} className="px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-2xl shadow-2xl hover:scale-105 transition-all">
                Global Orders
              </Button>
              {statsData?.unassigned_orders > 0 && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-rose-600 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-lg animate-bounce">
                  {statsData.unassigned_orders}
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Dynamic Stats Grid */}
        <div style={{margin:"10px",padding:"5px"}} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="group relative p-8 rounded-[32px] bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 animate-fade-in-up hover:-translate-y-2 transition-all duration-500"
              style={{ animationDelay: `${idx * 0.1}s`,padding:"10px" }}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 rounded-bl-[100px] transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-500">{stat.icon}</div>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                <div className="flex items-baseline gap-3">
                  <h3 style={{color:"white",margin:"5px"}} className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
                  <span className="text-emerald-500 font-bold text-sm">{stat.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Dashboard Panel */}
          <div className="lg:col-span-2 space-y-10">
            {/* Live Notifications */}
            <Card style={{margin:"10px",padding:"10px"}} className="p-0 overflow-hidden border-0 shadow-2xl shadow-purple-500/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl animate-fade-in-left">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 style={{color:"white", margin:"5px"}} className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Live Activity</h2>
                <Badge variant="danger" className="animate-pulse px-4 py-1">2 NEW</Badge>
              </div>
              <div className="p-4 space-y-4">
                {recentOrders.map((order: ActivityOrder, i: number) => (
                  <div style={{margin:"10px"}} key={i} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-purple-200 dark:hover:border-purple-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30">
                        {order.customer.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{order.customer}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">#{order.id} · {order.time}{order.end_time ? ` - ${order.end_time}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="font-black text-lg text-slate-900 dark:text-white">{order.total}</p>
                      <Badge variant={getStatusVariant(order.status)} className="min-w-[100px] text-center">
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Management */}
            <div style={{margin:"20px"}} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 animate-fade-in-up">
              <Link style={{padding:"10px"}} href="/admin/items" className="group p-8 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                <h3 className="text-2xl font-black text-white mb-2">Inventory</h3>
                <p className="text-white/70 text-sm font-medium">Manage master catalog and basic item details.</p>
                <div className="mt-8 text-white font-bold flex items-center gap-2">Explore System <span>→</span></div>
              </Link>
              <Link style={{padding:"10px"}} href="/admin/pricing" className="group p-8 rounded-[32px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 hover:scale-[1.02] active:scale-95 transition-all">
                <h3 style={{color:"white"}} className="text-2xl font-black text-slate-900 dark:text-white mb-2">Pricing Strategy</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Update rental rates and delivery fees.</p>
                <div className="mt-8 text-primary font-bold flex items-center gap-2">Revenue Hub <span>→</span></div>
              </Link>
              <Link style={{padding:"10px"}} href="/admin/stock" className="group p-8 rounded-[32px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 hover:scale-[1.02] active:scale-95 transition-all">
                <h3 style={{color:"white"}} className="text-2xl font-black text-slate-900 dark:text-white mb-2">Logistics Center</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Track fleet movement and availability.</p>
                <div className="mt-8 text-primary font-bold flex items-center gap-2">View Logistics <span>→</span></div>
              </Link>
              <Link style={{padding:"10px"}} href="/admin/agents" className="group p-8 rounded-[32px] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-white">
                <h3 className="text-2xl font-black mb-2">Agent Management</h3>
                <p className="text-emerald-50/70 text-sm font-medium">Add, remove, and manage delivery agent accounts.</p>
                <div className="mt-8 font-bold flex items-center gap-2">Manage Fleet <span>→</span></div>
              </Link>
              <Link style={{padding:"10px"}} href="/admin/order-proofs" className="group p-8 rounded-[32px] bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-500/20 hover:scale-[1.02] active:scale-95 transition-all text-white">
                <h3 className="text-2xl font-black mb-2">📸 Order Proofs</h3>
                <p className="text-violet-50/70 text-sm font-medium">Capture and store delivery & pickup photo evidence.</p>
                <div className="mt-8 font-bold flex items-center gap-2">View Proofs <span>→</span></div>
              </Link>
              <Link style={{padding:"10px"}} href="/admin/customers" className="group p-8 rounded-[32px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                <h3 style={{color:"white"}} className="text-2xl font-black text-slate-900 dark:text-white mb-2">👥 Customers</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">View profiles, order history, and suspend accounts.</p>
                <div className="mt-8 text-primary font-bold flex items-center gap-2">Manage Customers <span>→</span></div>
              </Link>
              <Link style={{padding:"10px"}} href="/admin/refunds" className="group p-8 rounded-[32px] bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all text-white">
                <h3 className="text-2xl font-black mb-2">💰 Refunds</h3>
                <p className="text-amber-50/70 text-sm font-medium">Manage deposit returns, refunds, and financial resolutions.</p>
                <div className="mt-8 font-bold flex items-center gap-2">Manage Refunds <span>→</span></div>
              </Link>
            </div>
          </div>

          {/* Sidebar / Secondary Content */}
          <div className="space-y-10 animate-fade-in-right">
            <Card style={{margin:"10px",padding:"10px"}}className="p-8 border-0 shadow-2xl bg-slate-900 text-white rounded-[40px] overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.3),transparent)]" />
              <div className="relative z-10">
                <h2 style={{color:"white"}} className="text-3xl font-black mb-6">System Health</h2>
                <div className="space-y-6">
                  {[
                    { label: "Server Load", value: 42 },
                    { label: "Active Sessions", value: 88 },
                    { label: "Database Latency", value: 12 },
                  ].map((s, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-slate-400">
                        <span>{s.label}</span>
                        <span>{s.value}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full" style={{ width: `${s.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <Button style={{color:"white",margin:"5px",padding:"5px"}} variant="secondary" className="w-full mt-10 bg-white/10 hover:bg-white text-white hover:text-slate-900 font-bold border-0">
                  Full Diagnostics
                </Button>
              </div>
            </Card>

            <Card style={{padding:"10px",margin:"10px"}} className="p-8 border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-[40px]">
              <h2 style={{color:"white",margin:"5px"}} className="text-2xl font-black mb-8 text-slate-900 dark:text-white uppercase tracking-tighter">Recent Analytics</h2>
              <div className="flex items-center justify-center p-10 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                 <div className="text-center">
                    <p className="text-slate-400 font-bold mb-4 italic text-sm">Revenue Distribution Chart</p>
                    <div className="flex gap-2 justify-center">
                       <div className="w-3 h-16 bg-primary rounded-full animate-bounce-slow" style={{animationDelay: "0.1s"}} />
                       <div className="w-3 h-32 bg-secondary rounded-full animate-bounce-slow" style={{animationDelay: "0.2s"}} />
                       <div className="w-3 h-24 bg-accent rounded-full animate-bounce-slow" style={{animationDelay: "0.3s"}} />
                       <div className="w-3 h-28 bg-primary rounded-full animate-bounce-slow" style={{animationDelay: "0.4s"}} />
                    </div>
                 </div>
              </div>
            </Card>
          </div>
        </div>

      {/* Floating Notifications */}
      <div className="fixed bottom-8 right-8 z-[100] space-y-4 max-w-sm w-full">
        {notifications.map(notif => (
          <div 
            key={notif.id}
            className="bg-slate-900 border border-primary/50 rounded-3xl p-6 shadow-2xl animate-fade-in-right relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-[60px] -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
            
            <div className="flex items-start gap-4">
              <div className="text-3xl">🔔</div>
              <div className="flex-1">
                <h4 style={{color:"white"}} className="font-black text-white uppercase tracking-tighter text-lg">{notif.title}</h4>
                <p className="text-slate-400 text-sm font-medium mt-1">{notif.message}</p>
                <div className="mt-4 flex items-center justify-between">
                   <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Live Update</span>
                   <button 
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                    className="text-slate-500 hover:text-white transition-colors"
                   >
                     Dismiss
                   </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}