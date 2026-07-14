"use client";

import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Chatbot from "@/components/Chatbot";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

/* ─── Types ─── */
interface UserAddress {
  id: number;
  address_id: string;
  full_name: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  address_type: string;
  is_default: boolean;
  created_at?: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

const emptyForm = (): Omit<UserAddress, "id"|"address_id"|"created_at"> => ({
  full_name: "", phone: "", street: "", landmark: "",
  city: "", state: "", zipcode: "", country: "India",
  address_type: "Home", is_default: false,
});

/* ─── Shared input style helpers ─── */
const label: React.CSSProperties = { display:"block", fontSize:10, fontWeight:900, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:6 };
const inp: React.CSSProperties = { width:"100%", background:"#1e293b", border:"2px solid #334155", borderRadius:12, padding:"12px 14px", color:"white", fontSize:13, outline:"none", boxSizing:"border-box", transition:"border-color 0.15s" };

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [formData, setFormData] = useState({ name:"", phone:"", profile_image:"" });
  const [loading, setLoading] = useState(true);

  /* address state */
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addrForm, setAddrForm] = useState(emptyForm());
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null); // null = add new
  const [addrFormOpen, setAddrFormOpen] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrSuccess, setAddrSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* ── Fetch ── */
  const fetchProfile = useCallback(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { window.location.href = "/auth/login"; return; }
    api.get(`/auth/me?user_id=${userId}`).then(res => {
      setUser(res.data);
      setFormData({ name: res.data.name||"", phone: res.data.phone||"", profile_image: res.data.profile_image||"" });
      setAddresses(res.data.addresses || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  /* ── Profile save ── */
  const saveProfile = async (data: any) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await api.put(`/auth/profile?user_id=${userId}`, data);
      setUser((p: any) => ({ ...p, ...res.data }));
      alert("Profile updated!");
    } catch (err: any) {
      const d = err.response?.data?.detail;
      alert(Array.isArray(d) ? d.map((e: any) => e.msg).join(", ") : d || "Failed to update profile.");
      throw err;
    }
  };

  const handleUpdate = async () => {
    try {
      const payload: any = { name: formData.name, phone: formData.phone };
      if (formData.profile_image !== user?.profile_image) payload.profile_image = formData.profile_image;
      await saveProfile(payload);
      setIsEditing(false);
    } catch {}
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Max 2MB"); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setFormData(p => ({ ...p, profile_image: base64 }));
      await saveProfile({ profile_image: base64 });
      fetchProfile();
    };
    reader.readAsDataURL(file);
  };

  /* ── Address: open add form ── */
  const openAddForm = () => {
    setAddrForm(emptyForm());
    setEditingAddrId(null);
    setAddrFormOpen(true);
    setAddrSuccess(false);
  };

  /* ── Address: open edit form ── */
  const openEditForm = (addr: UserAddress) => {
    setAddrForm({
      full_name: addr.full_name, phone: addr.phone, street: addr.street,
      landmark: addr.landmark||"", city: addr.city, state: addr.state,
      zipcode: addr.zipcode, country: addr.country,
      address_type: addr.address_type, is_default: addr.is_default,
    });
    setEditingAddrId(addr.address_id);
    setAddrFormOpen(true);
    setAddrSuccess(false);
  };

  /* ── Address: save (add or edit) ── */
  const handleAddrSave = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    if (!addrForm.full_name || !addrForm.phone || !addrForm.street || !addrForm.city || !addrForm.state || !addrForm.zipcode) {
      alert("Please fill all required fields."); return;
    }
    if (!/^\d{6}$/.test(addrForm.zipcode)) { alert("Enter a valid 6-digit PIN code."); return; }
    if (!/^\d{10}$/.test(addrForm.phone)) { alert("Enter a valid 10-digit phone number."); return; }

    setAddrSaving(true);
    try {
      if (editingAddrId) {
        const res = await api.put(`/auth/addresses/${editingAddrId}?user_id=${userId}`, addrForm);
        setAddresses(prev => prev.map(a => a.address_id === editingAddrId ? res.data : a));
      } else {
        const res = await api.post(`/auth/addresses?user_id=${userId}`, addrForm);
        setAddresses(prev => [...prev, res.data]);
      }
      setAddrSuccess(true);
      setTimeout(() => { setAddrSuccess(false); setAddrFormOpen(false); }, 1600);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to save address.");
    } finally {
      setAddrSaving(false);
    }
  };

  /* ── Address: delete ── */
  const handleAddrDelete = async (addressId: string) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      await api.delete(`/auth/addresses/${addressId}?user_id=${userId}`);
      setAddresses(prev => prev.filter(a => a.address_id !== addressId));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete address.");
    }
  };

  /* ── Address: set default ── */
  const handleSetDefault = async (addressId: string) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await api.patch(`/auth/addresses/${addressId}/set-default?user_id=${userId}`);
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.address_id === addressId })));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to set default.");
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#020817" }}>
      <div style={{ width:48, height:48, borderRadius:"50%", border:"3px solid transparent", borderTopColor:"#6366f1", animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  /* ── Cards ── */
  const amazonCards = [
    { title:"Your Orders", desc:"Track, return, or buy things again", icon:"📦", link:"/customer/orders" },
    { title:"Login & Security", desc:"Edit login, name, and mobile number", icon:"🔐", action: () => setIsEditing(true) },
    { title:"Your Addresses", desc: addresses.length > 0 ? `${addresses.length} address${addresses.length > 1 ? "es" : ""} saved` : "Manage delivery addresses", icon:"📍", action: () => setIsAddressOpen(true) },
    { title:"Payment Options", desc:"Edit or add payment methods", icon:"💳", link:"/customer/checkout" },
    { title:"Rental History", desc:"View all your past equipment rentals", icon:"🕒", link:"/customer/orders" },
    { title:"Contact Us", desc:"Reach out to our 24/7 support team", icon:"🎧", action: () => setIsChatbotOpen(true) },
  ];

  const typeIcon = (t: string) => t === "Home" ? "🏠" : t === "Work" ? "🏢" : "📌";
  const typeColor = (t: string) => t === "Home" ? "#6366f1" : t === "Work" ? "#06b6d4" : "#f59e0b";

  return (
    <div style={{ minHeight:"100vh", background:"#020817", paddingBottom:80, color:"white" }}>
      <Navbar />
      <main style={{ margin:"20px", marginTop:"100px" }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", marginBottom:40, gap:24, padding:"0 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:24 }}>
            <div style={{ position:"relative" }}>
              <div style={{ width:96, height:96, borderRadius:"50%", overflow:"hidden", border:"4px solid #1e293b", background:"#1e293b", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {user?.profile_image ? <img src={user.profile_image} alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:40 }}>👤</span>}
              </div>
              <label style={{ position:"absolute", bottom:0, right:0, width:32, height:32, background:"#6366f1", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"2px solid #020817" }}>
                <span style={{ fontSize:12 }}>📷</span>
                <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
              </label>
            </div>
            <div>
              <h1 style={{ fontSize:28, fontWeight:900, color:"white", margin:0 }}>Your Account</h1>
              <p style={{ color:"#94a3b8", margin:"4px 0 0" }}>Hello, <span style={{ color:"#6366f1" }}>{user?.name || user?.username}</span></p>
            </div>
          </div>
          <div style={{ display:"flex", gap:16 }}>
            {[{ label:"Total Orders", val: user?.stats?.total_orders||0, color:"#6366f1" }, { label:"Member Since", val: user?.stats?.membership_year||2024, color:"#06b6d4" }].map(s => (
              <div key={s.label} style={{ background:"#0f172a", borderRadius:24, padding:"16px 32px", border:"1px solid #1e293b", textAlign:"center", minWidth:140 }}>
                <p style={{ fontSize:10, fontWeight:900, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.2em", margin:0 }}>{s.label}</p>
                <p style={{ fontSize:24, fontWeight:900, color:s.color, margin:"4px 0 0" }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Card Grid ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:24, marginBottom:64, padding:"0 16px" }}>
          {amazonCards.map((card, idx) => card.link ? (
            <Link key={idx} href={card.link} style={{ textDecoration:"none" }}>
              <div style={{ padding:24, background:"#0f172a", borderRadius:28, border:"1px solid #1e293b", cursor:"pointer", display:"flex", gap:20, minHeight:150 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor="rgba(99,102,241,0.5)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor="#1e293b")}>
                <span style={{ fontSize:40 }}>{card.icon}</span>
                <div><h3 style={{ color:"white", fontWeight:700, fontSize:18, margin:"0 0 8px" }}>{card.title}</h3><p style={{ color:"#94a3b8", fontSize:13, margin:0 }}>{card.desc}</p></div>
              </div>
            </Link>
          ) : (
            <div key={idx} onClick={card.action}
              style={{ padding:24, background:"#0f172a", borderRadius:28, border:"1px solid #1e293b", cursor:"pointer", display:"flex", gap:20, minHeight:150 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor="rgba(99,102,241,0.5)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor="#1e293b")}>
              <span style={{ fontSize:40 }}>{card.icon}</span>
              <div>
                <h3 style={{ color:"white", fontWeight:700, fontSize:18, margin:"0 0 8px" }}>{card.title}</h3>
                <p style={{ color:"#94a3b8", fontSize:13, margin:0 }}>{card.desc}</p>
                {card.title === "Your Addresses" && addresses.length > 0 && (
                  <span style={{ display:"inline-block", marginTop:8, fontSize:10, fontWeight:700, color:"#6366f1", background:"rgba(99,102,241,0.1)", padding:"2px 10px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.1em" }}>
                    ✓ {addresses.length} Saved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent Rentals ── */}
        <section style={{ padding:"0 16px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #1e293b", paddingBottom:24, marginBottom:32 }}>
            <h2 style={{ color:"white", fontSize:22, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>Recent Rentals</h2>
            <Link href="/customer/orders" style={{ color:"#6366f1", fontWeight:900, fontSize:12, textDecoration:"none", textTransform:"uppercase", letterSpacing:"0.15em" }}>View full history →</Link>
          </div>
          {user?.stats?.recent_orders?.length > 0 ? user.stats.recent_orders.map((order: any) => (
            <div key={order.id} style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:32, padding:32, display:"flex", justifyContent:"space-between", alignItems:"center", gap:32, marginBottom:24, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:24 }}>
                <div style={{ width:80, height:80, background:"rgba(99,102,241,0.1)", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>📦</div>
                <div>
                  <p style={{ fontSize:10, fontWeight:900, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.3em", margin:"0 0 4px" }}>ID: {order.booking_reference}</p>
                  <h4 style={{ color:"white", fontWeight:900, fontSize:18, margin:"0 0 4px" }}>Status: <span style={{ color:"#6366f1" }}>#{order.status.toUpperCase()}</span></h4>
                  <p style={{ color:"#94a3b8", fontSize:14, margin:0, fontWeight:700 }}>₹{order.total_price.toLocaleString()}</p>
                </div>
              </div>
              <Link href={`/customer/order-tracking/${order.booking_reference}`}>
                <button style={{ padding:"12px 32px", borderRadius:20, border:"1px solid #334155", background:"transparent", color:"white", fontWeight:900, cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.1em", fontSize:12 }}>TRACK</button>
              </Link>
            </div>
          )) : (
            <div style={{ textAlign:"center", padding:"60px 20px", background:"rgba(15,23,42,0.5)", borderRadius:40, border:"2px dashed #1e293b" }}>
              <p style={{ color:"#475569", fontWeight:900, fontSize:18, margin:"0 0 24px" }}>No recent rentals. Start your journey!</p>
              <Link href="/customer/category"><button style={{ padding:"14px 48px", borderRadius:20, background:"#6366f1", border:"none", color:"white", fontWeight:900, cursor:"pointer" }}>EXPLORE CATALOG</button></Link>
            </div>
          )}
        </section>
      </main>

      {/* ═══════════════════════════════════════════════
          EDIT PROFILE MODAL
      ═══════════════════════════════════════════════ */}
      {isEditing && (
        <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(2,8,23,0.85)", backdropFilter:"blur(12px)" }}>
          <div style={{ background:"#0f172a", borderRadius:32, width:"100%", maxWidth:520, border:"1px solid #1e293b", overflow:"hidden" }}>
            <div style={{ padding:"22px 28px", borderBottom:"1px solid #1e293b", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ color:"white", fontWeight:900, fontSize:18, textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} style={{ width:32, height:32, borderRadius:"50%", background:"#1e293b", border:"none", color:"#94a3b8", cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ padding:28 }}>
              <div style={{ marginBottom:16 }}>
                <label style={label}>Full Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name:e.target.value })} placeholder="Enter your name" style={inp} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={label}>Phone Number</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone:e.target.value })} placeholder="+91 00000 00000" style={inp} />
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <button onClick={handleUpdate} style={{ flex:1, padding:"14px 0", background:"#6366f1", border:"none", borderRadius:14, color:"white", fontWeight:900, cursor:"pointer" }}>SAVE</button>
                <button onClick={() => setIsEditing(false)} style={{ flex:1, padding:"14px 0", background:"transparent", border:"1px solid #334155", borderRadius:14, color:"#94a3b8", fontWeight:900, cursor:"pointer" }}>CANCEL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          ADDRESS MANAGER MODAL
      ═══════════════════════════════════════════════ */}
      {isAddressOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(2,8,23,0.92)", backdropFilter:"blur(16px)" }}>
          <div style={{ background:"#0f172a", borderRadius:28, width:"100%", maxWidth:680, maxHeight:"92vh", overflowY:"auto", border:"1px solid #1e293b", boxShadow:"0 25px 80px rgba(0,0,0,0.6)" }}>

            {/* Header */}
            <div style={{ padding:"20px 24px", borderBottom:"1px solid #1e293b", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"#0f172a", zIndex:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:12, background:"rgba(99,102,241,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📍</div>
                <div>
                  <h3 style={{ color:"white", fontWeight:900, fontSize:17, margin:0 }}>Manage Addresses</h3>
                  <p style={{ color:"#64748b", fontSize:11, margin:0 }}>{addresses.length} address{addresses.length !== 1 ? "es" : ""} saved</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <button onClick={openAddForm}
                  style={{ padding:"8px 18px", background:"#6366f1", border:"none", borderRadius:12, color:"white", fontWeight:800, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:16 }}>+</span> Add New
                </button>
                <button onClick={() => { setIsAddressOpen(false); setAddrFormOpen(false); }}
                  style={{ width:32, height:32, borderRadius:"50%", background:"#1e293b", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:14 }}>✕</button>
              </div>
            </div>

            {/* Address list */}
            {!addrFormOpen && (
              <div style={{ padding:20 }}>
                {addresses.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"48px 20px" }}>
                    <div style={{ fontSize:48, marginBottom:16 }}>🏠</div>
                    <p style={{ color:"#475569", fontWeight:700, fontSize:15, margin:"0 0 20px" }}>No addresses saved yet.</p>
                    <button onClick={openAddForm}
                      style={{ padding:"12px 32px", background:"#6366f1", border:"none", borderRadius:14, color:"white", fontWeight:800, cursor:"pointer", fontSize:14 }}>
                      + Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {addresses.map(addr => (
                      <div key={addr.address_id}
                        style={{ background:addr.is_default ? "rgba(99,102,241,0.07)" : "#0a1628", border:`1.5px solid ${addr.is_default ? "rgba(99,102,241,0.35)" : "#1e293b"}`, borderRadius:20, padding:"18px 20px", position:"relative" }}>

                        {/* Default badge */}
                        {addr.is_default && (
                          <span style={{ position:"absolute", top:14, right:14, fontSize:10, fontWeight:800, color:"#6366f1", background:"rgba(99,102,241,0.12)", padding:"3px 10px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.1em" }}>
                            ★ Default
                          </span>
                        )}

                        <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:12 }}>
                          {/* Type icon */}
                          <div style={{ width:38, height:38, borderRadius:12, background:`rgba(${typeColor(addr.address_type) === "#6366f1" ? "99,102,241" : typeColor(addr.address_type) === "#06b6d4" ? "6,182,212" : "245,158,11"},0.15)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                            {typeIcon(addr.address_type)}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                              <p style={{ color:"white", fontWeight:700, fontSize:14, margin:0 }}>{addr.full_name}</p>
                              <span style={{ fontSize:10, fontWeight:700, color:typeColor(addr.address_type), background:`rgba(${typeColor(addr.address_type) === "#6366f1" ? "99,102,241" : typeColor(addr.address_type) === "#06b6d4" ? "6,182,212" : "245,158,11"},0.1)`, padding:"2px 8px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.1em" }}>
                                {addr.address_type}
                              </span>
                            </div>
                            <p style={{ color:"#94a3b8", fontSize:12, margin:"0 0 2px", lineHeight:1.6 }}>
                              {addr.street}{addr.landmark ? `, ${addr.landmark}` : ""}<br />
                              {addr.city}, {addr.state} – {addr.zipcode}
                            </p>
                            <p style={{ color:"#6366f1", fontSize:12, margin:0, fontWeight:700 }}>📱 +91 {addr.phone}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                          {!addr.is_default && (
                            <button onClick={() => handleSetDefault(addr.address_id)}
                              style={{ padding:"6px 14px", background:"transparent", border:"1px solid #334155", borderRadius:10, color:"#94a3b8", fontWeight:700, cursor:"pointer", fontSize:11, transition:"all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor="#6366f1"; e.currentTarget.style.color="#6366f1"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor="#334155"; e.currentTarget.style.color="#94a3b8"; }}>
                              ★ Set Default
                            </button>
                          )}
                          <button onClick={() => openEditForm(addr)}
                            style={{ padding:"6px 16px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:10, color:"#818cf8", fontWeight:700, cursor:"pointer", fontSize:11, transition:"all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background="rgba(99,102,241,0.2)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background="rgba(99,102,241,0.1)"; }}>
                            ✏️ Edit
                          </button>
                          {deleteConfirm === addr.address_id ? (
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:4 }}>
                              <span style={{ color:"#ef4444", fontSize:11, fontWeight:700 }}>Delete?</span>
                              <button onClick={() => handleAddrDelete(addr.address_id)}
                                style={{ padding:"5px 12px", background:"#ef4444", border:"none", borderRadius:8, color:"white", fontWeight:700, cursor:"pointer", fontSize:11 }}>Yes</button>
                              <button onClick={() => setDeleteConfirm(null)}
                                style={{ padding:"5px 12px", background:"transparent", border:"1px solid #334155", borderRadius:8, color:"#94a3b8", fontWeight:700, cursor:"pointer", fontSize:11 }}>No</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(addr.address_id)}
                              style={{ padding:"6px 14px", background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, color:"#f87171", fontWeight:700, cursor:"pointer", fontSize:11, transition:"all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background="rgba(239,68,68,0.15)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background="rgba(239,68,68,0.07)"; }}>
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Address Form (Add / Edit) ── */}
            {addrFormOpen && (
              <div style={{ padding:20 }}>

                {/* Back button */}
                <button onClick={() => setAddrFormOpen(false)}
                  style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"none", color:"#6366f1", fontWeight:700, fontSize:13, cursor:"pointer", marginBottom:16, padding:0 }}>
                  ← {addresses.length > 0 ? "Back to Addresses" : "Cancel"}
                </button>

                <h4 style={{ color:"white", fontWeight:800, fontSize:15, margin:"0 0 16px", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                  {editingAddrId ? "Edit Address" : "Add New Address"}
                </h4>

                {/* Address Type */}
                <div style={{ marginBottom:16 }}>
                  <label style={label}>Address Type</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {["Home", "Work", "Other"].map(t => (
                      <button key={t} onClick={() => setAddrForm(p => ({ ...p, address_type:t }))}
                        style={{ padding:"8px 18px", borderRadius:20, border:`2px solid ${addrForm.address_type === t ? "#6366f1" : "#1e293b"}`, background: addrForm.address_type === t ? "rgba(99,102,241,0.15)" : "transparent", color: addrForm.address_type === t ? "#6366f1" : "#94a3b8", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                        <span>{t === "Home" ? "🏠" : t === "Work" ? "🏢" : "📌"}</span>{t}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {/* Full Name */}
                  <div style={{ gridColumn:"1 / -1" }}>
                    <label style={label}>Full Name *</label>
                    <input value={addrForm.full_name} onChange={e => setAddrForm(p => ({ ...p, full_name:e.target.value }))} placeholder="e.g. Ravi Kumar" style={inp}
                      onFocus={e => (e.target.style.borderColor="#6366f1")} onBlur={e => (e.target.style.borderColor="#334155")} />
                  </div>
                  {/* Phone */}
                  <div style={{ gridColumn:"1 / -1" }}>
                    <label style={label}>Mobile Number * <span style={{ color:"#64748b", fontWeight:400, textTransform:"none" }}>(10-digit)</span></label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#6366f1", fontWeight:700, fontSize:13 }}>+91</span>
                      <input value={addrForm.phone} onChange={e => setAddrForm(p => ({ ...p, phone:e.target.value.replace(/\D/g,"").slice(0,10) }))} placeholder="98765 43210" maxLength={10}
                        style={{ ...inp, paddingLeft:44 }} onFocus={e => (e.target.style.borderColor="#6366f1")} onBlur={e => (e.target.style.borderColor="#334155")} />
                    </div>
                  </div>
                  {/* Street */}
                  <div style={{ gridColumn:"1 / -1" }}>
                    <label style={label}>House No, Building, Street *</label>
                    <input value={addrForm.street} onChange={e => setAddrForm(p => ({ ...p, street:e.target.value }))} placeholder="e.g. 12B, Anna Nagar Main Road" style={inp}
                      onFocus={e => (e.target.style.borderColor="#6366f1")} onBlur={e => (e.target.style.borderColor="#334155")} />
                  </div>
                  {/* Landmark */}
                  <div style={{ gridColumn:"1 / -1" }}>
                    <label style={label}>Landmark <span style={{ color:"#64748b", fontWeight:400, textTransform:"none" }}>(optional)</span></label>
                    <input value={addrForm.landmark||""} onChange={e => setAddrForm(p => ({ ...p, landmark:e.target.value }))} placeholder="e.g. Near Apollo Hospital" style={inp}
                      onFocus={e => (e.target.style.borderColor="#6366f1")} onBlur={e => (e.target.style.borderColor="#334155")} />
                  </div>
                  {/* Pincode */}
                  <div>
                    <label style={label}>PIN Code *</label>
                    <input value={addrForm.zipcode} onChange={e => setAddrForm(p => ({ ...p, zipcode:e.target.value.replace(/\D/g,"").slice(0,6) }))} placeholder="600001" maxLength={6} style={inp}
                      onFocus={e => (e.target.style.borderColor="#6366f1")} onBlur={e => (e.target.style.borderColor="#334155")} />
                  </div>
                  {/* City */}
                  <div>
                    <label style={label}>City / District *</label>
                    <input value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city:e.target.value }))} placeholder="e.g. Chennai" style={inp}
                      onFocus={e => (e.target.style.borderColor="#6366f1")} onBlur={e => (e.target.style.borderColor="#334155")} />
                  </div>
                  {/* State */}
                  <div>
                    <label style={label}>State *</label>
                    <select value={addrForm.state} onChange={e => setAddrForm(p => ({ ...p, state:e.target.value }))} style={{ ...inp, cursor:"pointer" }}>
                      <option value="" disabled>Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {/* Country */}
                  <div>
                    <label style={label}>Country</label>
                    <input value="India" readOnly style={{ ...inp, opacity:0.5, cursor:"default" }} />
                  </div>
                  {/* Default checkbox */}
                  <div style={{ gridColumn:"1 / -1" }}>
                    <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                      <input type="checkbox" checked={addrForm.is_default} onChange={e => setAddrForm(p => ({ ...p, is_default:e.target.checked }))}
                        style={{ width:16, height:16, accentColor:"#6366f1" }} />
                      <span style={{ color:"#94a3b8", fontSize:13, fontWeight:600 }}>Set as default delivery address</span>
                    </label>
                  </div>
                </div>

                {/* Security note */}
                <div style={{ margin:"16px 0", padding:"10px 14px", background:"rgba(16,185,129,0.07)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:12, display:"flex", alignItems:"center", gap:10 }}>
                  <span>🔒</span>
                  <p style={{ color:"#64748b", fontSize:11, margin:0 }}>Your address is stored securely and used only for order delivery.</p>
                </div>

                {/* Save button */}
                {addrSuccess ? (
                  <div style={{ textAlign:"center", padding:16, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:14 }}>
                    <span style={{ fontSize:24 }}>✅</span>
                    <p style={{ color:"#10b981", fontWeight:700, margin:"8px 0 0" }}>Address saved successfully!</p>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:12 }}>
                    <button onClick={handleAddrSave} disabled={addrSaving}
                      style={{ flex:1, padding:"14px 0", background:"#6366f1", border:"none", borderRadius:14, color:"white", fontWeight:900, cursor:addrSaving ? "wait" : "pointer", fontSize:14, opacity:addrSaving ? 0.8 : 1 }}>
                      {addrSaving ? "⏳ Saving..." : editingAddrId ? "💾 UPDATE ADDRESS" : "💾 SAVE ADDRESS"}
                    </button>
                    <button onClick={() => setAddrFormOpen(false)}
                      style={{ padding:"14px 22px", background:"transparent", border:"1px solid #334155", borderRadius:14, color:"#94a3b8", fontWeight:700, cursor:"pointer" }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chatbot */}
      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1e293b; color: white; }
      `}</style>
    </div>
  );
}
