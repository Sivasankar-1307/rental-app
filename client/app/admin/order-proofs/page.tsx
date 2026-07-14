"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import Button from "@/components/Button";

const s = {
  page: { minHeight: "100vh", background: "#020817", color: "white", paddingBottom: 80 } as React.CSSProperties,
  main: { width: "100%" } as React.CSSProperties,
  heading: { fontSize: 28, fontWeight: 900, color: "white", margin: "0 0 4px" } as React.CSSProperties,
  sub: { color: "#64748b", fontSize: 13, margin: "0 0 32px" } as React.CSSProperties,
  card: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: 20 } as React.CSSProperties,
  inp: { width: "100%", background: "#1e293b", border: "2px solid #334155", borderRadius: 12, padding: "10px 14px", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" } as React.CSSProperties,
  label: { display: "block", fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.15em", marginBottom: 6 },
  btn: (bg: string) => ({ padding: "10px 20px", background: bg, border: "none", borderRadius: 12, color: "white", fontWeight: 800, cursor: "pointer", fontSize: 13 }) as React.CSSProperties,
};

const PROOF_COLORS: Record<string, string> = {
  delivery: "#6366f1",
  pickup: "#f59e0b",
};

export default function OrderProofsPage() {
  const [bookingRef, setBookingRef] = useState("");
  const [searched, setSearched] = useState("");
  const [proofData, setProofData] = useState<any>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [proofError, setProofError] = useState("");

  // Upload state
  const [uploadType, setUploadType] = useState<"delivery" | "pickup">("delivery");
  const [photos, setPhotos] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Lightbox
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fetchProof = async (ref: string) => {
    setLoadingProof(true);
    setProofError("");
    try {
      const res = await api.get(`/admin/orders/${ref}/proof`);
      setProofData(res.data);
      setSearched(ref);
    } catch (err: any) {
      setProofError(err.response?.data?.detail || "Order not found.");
      setProofData(null);
    } finally {
      setLoadingProof(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const readers = files.map(file => new Promise<string>(resolve => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.readAsDataURL(file);
    }));
    Promise.all(readers).then(b64s => {
      setPhotos(prev => [...prev, ...b64s]);
      setCaptions(prev => [...prev, ...b64s.map(() => "")]);
    });
  };

  const removePhoto = (i: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setCaptions(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleUpload = async () => {
    if (!searched) { alert("Search for an order first."); return; }
    if (!photos.length) { alert("Add at least one photo."); return; }
    setUploading(true);
    try {
      await api.post(`/admin/orders/${searched}/proof`, {
        proof_type: uploadType,
        photos,
        captions,
        notes: notes || undefined,
      });
      setUploadSuccess(`${uploadType === "delivery" ? "Delivery" : "Pickup"} proof uploaded!`);
      setPhotos([]); setCaptions([]); setNotes("");
      setTimeout(() => setUploadSuccess(""), 2500);
      fetchProof(searched);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (type: string, idx: number) => {
    if (!confirm("Delete this photo?")) return;
    try {
      await api.delete(`/admin/orders/${searched}/proof/${type}/${idx}`);
      fetchProof(searched);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Delete failed.");
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("data:")) return url; // base64
    const base = "http://localhost:8000"; // Fallback to dev port
    return `${base}${url}`;
  };

  const renderPhotoGrid = (photos: any[], type: string) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginTop: 12 }}>
      {photos.map((p: any, i: number) => (
        <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #1e293b" }}>
          <img src={getImageUrl(p.url)} alt={p.caption || `Photo ${i+1}`} 
            style={{ width: "100%", height: 130, objectFit: "cover", cursor: "pointer", display: "block" }} 
            onClick={() => setLightbox(getImageUrl(p.url))} />
          <div style={{ padding: "6px 8px", background: "#0a1628" }}>
            <p style={{ color: "#94a3b8", fontSize: 10, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.caption || "No caption"}</p>
            <p style={{ color: "#475569", fontSize: 9, margin: "2px 0 0" }}>{p.uploaded_at ? new Date(p.uploaded_at).toLocaleString() : ""}</p>
          </div>
          <button onClick={() => handleDeletePhoto(type, i)} style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.85)", border: "none", color: "white", fontWeight: 900, fontSize: 12, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      ))}
    </div>
  );

  return (
    <div  style={{padding:"20px"}}>
       <Link href="/admin/dashboard" className="mb-6 inline-block">
          <Button style={{padding:"20px",margin:"10px"}} variant="secondary" size="sm" className="gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          </Button>
        </Link>
      <div style={s.main}>
        <h1 style={s.heading}>📸 Order Proof Capture</h1>
        <p style={s.sub}>Upload and manage delivery & pickup photo evidence for orders.</p>

        {/* Search */}
        <div style={{ ...s.card, marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>Booking Reference</label>
            <input value={bookingRef} onChange={e => setBookingRef(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && fetchProof(bookingRef)}
              placeholder="e.g. BOOK-91A3DE11" style={s.inp}
              onFocus={e => (e.target.style.borderColor = "#6366f1")} onBlur={e => (e.target.style.borderColor = "#334155")} />
          </div>
          <button onClick={() => fetchProof(bookingRef)} disabled={loadingProof} style={s.btn("#6366f1")}>
            {loadingProof ? "⏳" : "🔍 Search"}
          </button>
        </div>
        {proofError && <p style={{ color: "#ef4444", fontWeight: 700, marginBottom: 16 }}>⚠ {proofError}</p>}

        {proofData && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
            {/* Delivery Proof */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚚</div>
                <h3 style={{ color: "white", fontWeight: 800, fontSize: 15, margin: 0 }}>Delivery Proof</h3>
                <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "2px 10px", borderRadius: 20 }}>{proofData.delivery_proof.length} photo(s)</span>
                  {proofData.delivered_at && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8" }}>
                      Confirmed: {new Date(proofData.delivered_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              {proofData.delivery_proof.length === 0 ? (
                <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No delivery proof yet</p>
              ) : renderPhotoGrid(proofData.delivery_proof, "delivery")}
            </div>

            {/* Pickup Proof */}
            <div style={s.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📦</div>
                <h3 style={{ color: "white", fontWeight: 800, fontSize: 15, margin: 0 }}>Pickup Proof</h3>
                <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "2px 10px", borderRadius: 20 }}>{proofData.pickup_proof.length} photo(s)</span>
                  {proofData.picked_up_at && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8" }}>
                      Confirmed: {new Date(proofData.picked_up_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              {proofData.pickup_proof.length === 0 ? (
                <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No pickup proof yet</p>
              ) : renderPhotoGrid(proofData.pickup_proof, "pickup")}
            </div>
          </div>
        )}

        {/* Upload Panel */}
      
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={lightbox} alt="Proof" style={{ maxWidth: "92vw", maxHeight: "90vh", borderRadius: 16, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
