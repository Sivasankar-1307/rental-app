"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import Button from "@/components/Button";

const s = {
  page: { minHeight: "100vh", background: "#020817", color: "white", paddingBottom: 80 } as React.CSSProperties,
   main: { width: "100%" } as React.CSSProperties,
  inp: { width: "100%", background: "#1e293b", border: "2px solid #334155", borderRadius: 12, padding: "10px 14px", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  label: { display: "block" as const, fontSize: 10, fontWeight: 900 as const, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.15em", marginBottom: 6 },
  badge: (color: string, bg: string) => ({ fontSize: 10, fontWeight: 700 as const, color, background: bg, padding: "2px 10px", borderRadius: 20 }),
};

const STATUS_COLOR: Record<string, [string, string]> = {
  active:    ["#10b981", "rgba(16,185,129,0.12)"],
  suspended: ["#ef4444", "rgba(239,68,68,0.12)"],
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.get("/admin/customers").then(res => setCustomers(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = async (c: any) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/customers/${c.id}`);
      setSelected(res.data);
    } catch { setSelected(c); }
    finally { setDetailLoading(false); }
  };

  const toggleSuspend = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/customers/${selected.id}`, { is_active: !selected.is_active });
      setSelected((p: any) => ({ ...p, is_active: !p.is_active }));
      setCustomers(prev => prev.map(c => c.id === selected.id ? { ...c, is_active: !c.is_active } : c));
    } catch (err: any) { alert(err.response?.data?.detail || "Failed."); }
    finally { setActionLoading(false); }
  };

  const refundColors: Record<string, string> = { none: "#64748b", pending: "#f59e0b", approved: "#6366f1", processed: "#10b981", rejected: "#ef4444" };

  return (
    <div>
      <div style={{...s.main,padding:"20px"}}>
        <Link href="/admin/dashboard" className="mb-6 inline-block">
          <Button style={{padding:"20px",margin:"10px"}} variant="secondary" size="sm" className="gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          </Button>
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", margin: 0 }}>👥 Customer Management</h1>
            <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>{customers.length} registered customers</p>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name, phone, username..." style={{ ...s.inp, maxWidth: 320, borderRadius: 20 }}
            onFocus={e => (e.target.style.borderColor = "#6366f1")} onBlur={e => (e.target.style.borderColor = "#334155")} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20 }}>
          {/* Customer table */}
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, overflow: "hidden" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>Loading customers…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>No customers found.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e293b" }}>
                    {["Customer", "Phone", "Orders", "Total Spent", "Status", "Action"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #0f172a", background: selected?.id === c.id ? "rgba(99,102,241,0.06)" : i % 2 === 0 ? "#0f172a" : "#0a1628", cursor: "pointer" }}
                      onClick={() => openDetail(c)}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.07)")}
                      onMouseLeave={e => (e.currentTarget.style.background = selected?.id === c.id ? "rgba(99,102,241,0.06)" : i % 2 === 0 ? "#0f172a" : "#0a1628")}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#6366f1", flexShrink: 0 }}>
                            {(c.name || c.phone || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>{c.name || "—"}</p>
                            <p style={{ color: "#475569", fontSize: 10, margin: 0 }}>{c.username || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{c.phone}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ color: "#6366f1", fontWeight: 800, fontSize: 14 }}>{c.order_count}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#10b981", fontWeight: 700, fontSize: 13 }}>₹{c.total_spent.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={s.badge(...(STATUS_COLOR[c.is_active ? "active" : "suspended"]))}>
                          {c.is_active ? "● Active" : "● Suspended"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={e => { e.stopPropagation(); openDetail(c); }} style={{ padding: "5px 12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, color: "#818cf8", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: 20, maxHeight: "82vh", overflowY: "auto", position: "sticky", top: 100 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#6366f1" }}>
                    {(selected.name || selected.phone || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color: "white", fontWeight: 800, fontSize: 16, margin: 0 }}>{selected.name || "—"}</p>
                    <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>{selected.phone}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e293b", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>✕</button>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Total Orders", val: selected.orders?.length || 0, color: "#6366f1" },
                  { label: "Total Spent", val: `₹${selected.orders?.reduce((a: number, o: any) => a + (o.total_price || 0), 0).toLocaleString() || 0}`, color: "#10b981" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#1e293b", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                    <p style={{ color: "#64748b", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>{stat.label}</p>
                    <p style={{ color: stat.color, fontWeight: 900, fontSize: 18, margin: "4px 0 0" }}>{stat.val}</p>
                  </div>
                ))}
              </div>

              {/* Suspend / Activate */}
              <button onClick={toggleSuspend} disabled={actionLoading}
                style={{ width: "100%", padding: "10px 0", background: selected.is_active ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${selected.is_active ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`, borderRadius: 12, color: selected.is_active ? "#f87171" : "#10b981", fontWeight: 800, cursor: "pointer", fontSize: 13, marginBottom: 20 }}>
                {actionLoading ? "⏳..." : selected.is_active ? "🚫 Suspend Account" : "✅ Reactivate Account"}
              </button>

              {/* Order history */}
              <p style={{ color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 10px" }}>Order History</p>
              {detailLoading ? <p style={{ color: "#475569", textAlign: "center" }}>Loading…</p> :
                (selected.orders || []).length === 0 ? <p style={{ color: "#475569", textAlign: "center", fontSize: 13 }}>No orders yet.</p> :
                (selected.orders || []).map((o: any) => (
                  <div key={o.booking_reference} style={{ background: "#0a1628", borderRadius: 12, padding: "10px 14px", marginBottom: 8, border: "1px solid #1e293b" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <p style={{ color: "#6366f1", fontWeight: 700, fontSize: 12, margin: 0 }}>{o.booking_reference}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 20 }}>{o.status}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                      <span>₹{o.total_price?.toLocaleString()}</span>
                      {o.refund_status !== "none" && o.refund_status && (
                        <span style={{ color: refundColors[o.refund_status] || "#64748b", fontWeight: 700 }}>Refund: {o.refund_status}</span>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
