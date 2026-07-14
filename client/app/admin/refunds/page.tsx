"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import Button from "@/components/Button";

const REFUND_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  none:      { label: "No Refund",  color: "#475569", bg: "rgba(71,85,105,0.12)" },
  pending:   { label: "Pending",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  approved:  { label: "Approved",   color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  rejected:  { label: "Rejected",   color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  processed: { label: "Processed",  color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

const s = {
  page: { minHeight: "100vh", background: "#020817", color: "white", paddingBottom: 80 } as React.CSSProperties,
  main: { width: "100%" } as React.CSSProperties,
  inp: { width: "100%", background: "#1e293b", border: "2px solid #334155", borderRadius: 12, padding: "10px 14px", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  card: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: 20, marginBottom: 16 } as React.CSSProperties,
  btn: (bg: string, border = "transparent") => ({ padding: "8px 16px", background: bg, border: `1px solid ${border}`, borderRadius: 10, color: "white", fontWeight: 800, cursor: "pointer", fontSize: 12 }) as React.CSSProperties,
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Initiate refund modal state
  const [showInitiate, setShowInitiate] = useState(false);
  const [initiateRef, setInitiateRef] = useState("");
  const [initiateAmount, setInitiateAmount] = useState("");
  const [initiateNotes, setInitiateNotes] = useState("");
  const [initiating, setInitiating] = useState(false);

  const fetchRefunds = () => {
    setLoading(true);
    api.get("/admin/refunds").then(res => setRefunds(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRefunds(); }, []);

  const filtered = refunds.filter(r => {
    const matchStatus = filter === "all" || r.refund_status === filter;
    const matchSearch = !search ||
      r.booking_reference?.toLowerCase().includes(search.toLowerCase()) ||
      r.customer?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search);
    return matchStatus && matchSearch;
  });

  const doAction = async (ref: string, action: string, body?: any) => {
    setActionLoading(true);
    try {
      if (action === "initiate") {
        await api.post(`/admin/orders/${ref}/refund/initiate`, body);
      } else {
        await api.patch(`/admin/orders/${ref}/refund/${action}`, body || {});
      }
      fetchRefunds();
      if (selected?.booking_reference === ref) setSelected((p: any) => ({ ...p, refund_status: action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "process" ? "processed" : p.refund_status }));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitiate = async () => {
    if (!initiateRef || !initiateAmount) { alert("Fill all fields."); return; }
    setInitiating(true);
    await doAction(initiateRef, "initiate", { refund_amount: parseFloat(initiateAmount), refund_notes: initiateNotes || undefined });
    setShowInitiate(false); setInitiateRef(""); setInitiateAmount(""); setInitiateNotes("");
    setInitiating(false);
  };

  const statusCounts = Object.fromEntries(
    ["none","pending","approved","rejected","processed"].map(s => [s, refunds.filter(r => r.refund_status === s).length])
  );

  const sm = REFUND_STATUS_META;

  return (
    <div style={{padding:"20px"}}>
      <Link href="/admin/dashboard" className="mb-6 inline-block">
          <Button style={{padding:"20px",margin:"10px"}} variant="secondary" size="sm" className="gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          </Button>
        </Link>
      <div style={s.main}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "white", margin: 0 }}>💰 Refund & Deposit Management</h1>
            <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Manage refunds, deposits, and financial resolutions</p>
          </div>
          <button onClick={() => setShowInitiate(true)} style={{ padding: "10px 22px", background: "#6366f1", border: "none", borderRadius: 14, color: "white", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>
            + Initiate Refund
          </button>
        </div>

        {/* Status cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
          {Object.entries(sm).map(([key, meta]) => (
            <div key={key} onClick={() => setFilter(filter === key ? "all" : key)}
              style={{ background: filter === key ? meta.bg : "#0f172a", border: `1px solid ${filter === key ? meta.color : "#1e293b"}`, borderRadius: 16, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s" }}>
              <p style={{ color: "#64748b", fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 4px" }}>{meta.label}</p>
              <p style={{ color: meta.color, fontWeight: 900, fontSize: 22, margin: 0 }}>{statusCounts[key] || 0}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by booking ref, customer name, phone…"
          style={{ ...s.inp, marginBottom: 20, borderRadius: 20 }}
          onFocus={e => (e.target.style.borderColor = "#6366f1")} onBlur={e => (e.target.style.borderColor = "#334155")} />

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: 20 }}>
          {/* Table */}
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, overflow: "hidden" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>No records found for this filter.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e293b" }}>
                    {["Booking", "Customer", "Order Total", "Refund Amt", "Status", "Action"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const meta = sm[r.refund_status] || sm.none;
                    return (
                      <tr key={r.booking_reference} style={{ borderBottom: "1px solid #0a1628", background: selected?.booking_reference === r.booking_reference ? "rgba(99,102,241,0.06)" : i % 2 === 0 ? "#0f172a" : "#0a1628", cursor: "pointer" }}
                        onClick={() => setSelected(r)}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.07)")}
                        onMouseLeave={e => (e.currentTarget.style.background = selected?.booking_reference === r.booking_reference ? "rgba(99,102,241,0.06)" : i % 2 === 0 ? "#0f172a" : "#0a1628")}>
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ color: "#6366f1", fontWeight: 700, fontSize: 12, margin: 0 }}>{r.booking_reference}</p>
                          <p style={{ color: "#475569", fontSize: 10, margin: 0 }}>{r.status}</p>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>{r.customer || "—"}</p>
                          <p style={{ color: "#475569", fontSize: 10, margin: 0 }}>{r.phone}</p>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 13 }}>₹{r.total_price?.toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", color: r.refund_amount > 0 ? "#f59e0b" : "#475569", fontWeight: 700, fontSize: 13 }}>
                          {r.refund_amount > 0 ? `₹${r.refund_amount.toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, background: meta.bg, padding: "3px 10px", borderRadius: 20 }}>
                            {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button onClick={e => { e.stopPropagation(); setSelected(r); }} style={s.btn("rgba(99,102,241,0.1)", "rgba(99,102,241,0.25)")}>
                            <span style={{ color: "#818cf8" }}>Manage →</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: 22, position: "sticky", top: 100, maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ color: "white", fontWeight: 900, fontSize: 16, margin: 0 }}>{selected.booking_reference}</h3>
                <button onClick={() => setSelected(null)} style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e293b", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>✕</button>
              </div>

              {/* Financial summary */}
              <div style={{ background: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                {[
                  { label: "Order Total", val: `₹${selected.total_price?.toLocaleString()}`, color: "white" },
                  { label: "Amount Paid", val: `₹${selected.paid_amount?.toLocaleString()}`, color: "#10b981" },
                  { label: "Balance Due", val: `₹${selected.balance_amount?.toLocaleString()}`, color: "#f87171" },
                  { label: "Late Fee", val: `₹${selected.late_fee?.toLocaleString()}`, color: "#f59e0b" },
                  { label: "Damage Fee", val: `₹${selected.damage_fee?.toLocaleString()}`, color: "#f87171" },
                  { label: "Refund Amount", val: selected.refund_amount > 0 ? `₹${selected.refund_amount.toLocaleString()}` : "—", color: "#6366f1" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #0f172a" }}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 700, fontSize: 12 }}>{row.val}</span>
                  </div>
                ))}
              </div>

              {/* Refund status */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 6px" }}>Refund Status</p>
                <span style={{ fontSize: 13, fontWeight: 800, color: (sm[selected.refund_status] || sm.none).color, background: (sm[selected.refund_status] || sm.none).bg, padding: "4px 14px", borderRadius: 20 }}>
                  {(sm[selected.refund_status] || sm.none).label}
                </span>
              </div>

              {selected.refund_notes && (
                <div style={{ background: "#0a1628", borderRadius: 12, padding: "10px 14px", marginBottom: 16, border: "1px solid #1e293b" }}>
                  <p style={{ color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase", margin: "0 0 4px" }}>Notes</p>
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>{selected.refund_notes}</p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selected.refund_status === "none" && (
                  <button onClick={() => { setInitiateRef(selected.booking_reference); setShowInitiate(true); }}
                    style={{ ...s.btn("#6366f1"), textAlign: "center" }}>
                    💰 Initiate Refund
                  </button>
                )}
                {selected.refund_status === "pending" && (
                  <>
                    <button onClick={() => doAction(selected.booking_reference, "approve")} disabled={actionLoading}
                      style={{ ...s.btn("rgba(99,102,241,0.15)", "rgba(99,102,241,0.3)"), color: "#6366f1", textAlign: "center" }}>
                      ✅ Approve Refund
                    </button>
                    <button onClick={() => { const note = prompt("Reason for rejection?"); if (note !== null) doAction(selected.booking_reference, "reject", { refund_amount: 0, refund_notes: note }); }}
                      disabled={actionLoading} style={{ ...s.btn("rgba(239,68,68,0.1)", "rgba(239,68,68,0.25)"), color: "#f87171", textAlign: "center" }}>
                      ❌ Reject Refund
                    </button>
                  </>
                )}
                {selected.refund_status === "approved" && (
                  <button onClick={() => doAction(selected.booking_reference, "process")} disabled={actionLoading}
                    style={{ ...s.btn("#10b981"), textAlign: "center" }}>
                    {actionLoading ? "⏳ Processing…" : "💸 Mark as Processed"}
                  </button>
                )}
                {selected.refund_status === "processed" && (
                  <div style={{ padding: "12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, textAlign: "center", color: "#10b981", fontWeight: 700, fontSize: 13 }}>
                    ✅ Refund Processed
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Initiate Refund Modal */}
      {showInitiate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,8,23,0.88)", backdropFilter: "blur(12px)" }}>
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 24, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: "white", fontWeight: 900, fontSize: 17, margin: 0 }}>💰 Initiate Refund</h3>
              <button onClick={() => setShowInitiate(false)} style={{ width: 28, height: 28, borderRadius: "50%", background: "#1e293b", border: "none", color: "#94a3b8", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>Booking Reference *</label>
              <input value={initiateRef} onChange={e => setInitiateRef(e.target.value.toUpperCase())} placeholder="BOOK-XXXXXXXX" style={s.inp} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>Refund Amount (₹) *</label>
              <input type="number" value={initiateAmount} onChange={e => setInitiateAmount(e.target.value)} placeholder="e.g. 5000" style={s.inp} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>Notes (optional)</label>
              <input value={initiateNotes} onChange={e => setInitiateNotes(e.target.value)} placeholder="Reason for refund…" style={s.inp} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleInitiate} disabled={initiating} style={{ ...s.btn("#6366f1"), flex: 1, textAlign: "center" }}>
                {initiating ? "⏳ Initiating…" : "💰 Submit Refund"}
              </button>
              <button onClick={() => setShowInitiate(false)} style={{ ...s.btn("transparent", "#334155"), color: "#94a3b8" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
