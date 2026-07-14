"use client";

import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Address } from "@/types/product";
import { api } from "@/lib/api";
import './checkout.css';
import Chatbot from "@/components/Chatbot";
import dynamic from 'next/dynamic';

const MapSection = dynamic(() => import("@/components/MapSection"), { 
  ssr: false,
  loading: () => <div className="h-64 bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center text-gray-400">Loading Map Engine...</div>
});



export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bundleId = searchParams.get("bundle");
  const { cart, getTotalPrice, clearCart, setCurrentBooking } = useCart();
  const [step, setStep] = useState(bundleId ? 0 : 1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    message: "",
  });
  const [address, setAddress] = useState<Address>({
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "India",
  });
  const [deliveryZone, setDeliveryZone] = useState("zone-1");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [depositOption, setDepositOption] = useState("online");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [isLocationValid, setIsLocationValid] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [bundleStartDate, setBundleStartDate] = useState("");
  const [bundleEndDate, setBundleEndDate] = useState("");


  useEffect(() => {
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.push("/auth/login?redirect=/customer/checkout");
      return;
    }

    if (role === "ADMIN") {
      router.push("/admin/dashboard");
      return;
    }
    if (role === "DELIVERY") {
      router.push("/delivery/dashboard");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [router]);

  // Fetch all user's saved addresses
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    api.get(`/auth/addresses?user_id=${userId}`)
      .then(res => {
        const list = res.data || [];
        setSavedAddresses(list);
        // Auto-select default
        const def = list.find((a: any) => a.is_default) || list[0];
        if (def) {
          setSelectedAddrId(def.address_id);
          applyAddress(def);
        } else {
          setShowAddrForm(true);
        }
      })
      .catch(() => setShowAddrForm(true));
  }, []);

  const applyAddress = (addr: any) => {
    setAddress({
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      zipcode: addr.zipcode || "",
      country: addr.country || "India",
    });
    // Always overwrite contact fields when switching addresses
    if (addr.phone) setFormData(prev => ({ ...prev, phone: addr.phone }));
    if (addr.full_name) {
      const parts = addr.full_name.split(" ");
      setFormData(prev => ({ ...prev,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || ""
      }));
    }
  };

  const handlePickAddress = (addr: any) => {
    setSelectedAddrId(addr.address_id);
    setShowAddrForm(false);
    applyAddress(addr);
  };

  const DELIVERY_ZONES = [
    { id: "zone-1", name: "Central Chennai", price: 500, estimate: "Same Day Delivery (within 6 hours)", desc: "Radius: 5km" },
    { id: "zone-2", name: "Greater Chennai (OMR/ECR)", price: 1000, estimate: "Next Day Delivery", desc: "Radius: 20km" },
    { id: "zone-3", name: "Outskirts (Kanchipuram/Chengalpattu)", price: 2000, estimate: "2-3 Business Days", desc: "Radius: 50km" },
  ];


  const selectedZone = DELIVERY_ZONES.find(z => z.id === deliveryZone) || DELIVERY_ZONES[0];
  const deliveryFee = selectedZone.price;
  
  const BUNDLE_DETAILS: any = {
    "b1": {
      title: "Wedding Starter Bundle",
      items: [
        { name: "Banquet Chairs", qty: 100, icon: "🪑" },
        { name: "Round Tables", qty: 10, icon: "🏷️" },
        { name: "Basic Lighting Setup", qty: 1, icon: "💡" },
        { name: "Table Covers (White)", qty: 10, icon: "✨" }
      ],
      price: 15000
    },
    "b2": {
      title: "Party Sound & Lights",
      items: [
        { name: "JBL Sound System", qty: 1, icon: "🔊" },
        { name: "LED Par Lights", qty: 8, icon: "🌈" },
        { name: "Fog Machine", qty: 1, icon: "💨" }
      ],
      price: 8500
    },
    "b3": {
      title: "Corporate Setup",
      items: [
        { name: "Stage Platform (16x8)", qty: 1, icon: "🎭" },
        { name: "Acrylic Podium", qty: 1, icon: "🎤" },
        { name: "Premium Seating", qty: 50, icon: "🪑" }
      ],
      price: 12000
    }
  };

  const selectedBundle = bundleId ? BUNDLE_DETAILS[bundleId] : null;

  const subtotal = selectedBundle ? selectedBundle.price : getTotalPrice(); 
  const securityDeposit = Math.max(1000, Math.round(subtotal * 0.2)); // 20% refundable deposit
  const tax = subtotal * 0.18; // 18% GST for India
  const total = subtotal + tax + deliveryFee + securityDeposit;

  const advanceAmount = Math.round((subtotal + tax) * 0.3); // 30% advance
  const logisticsFee = deliveryFee;
  const basePayNow = advanceAmount + logisticsFee;
  const payNowTotal = depositOption === "online" ? basePayNow + securityDeposit : basePayNow;
  const payLaterAmount = total - payNowTotal;


  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: any) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleMapAddressSelect = (addr: any) => {
    setAddress({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipcode: addr.zipcode,
      country: addr.country,
      lat: addr.lat,
      lng: addr.lng
    });
  };

  const handleZoneValidate = (isValid: boolean, zoneId: string) => {
    setIsLocationValid(isValid);
    if (!isValid) {
      setLocationError(`Target location is outside the ${DELIVERY_ZONES.find(z => z.id === zoneId)?.name}. Please select a different zone or adjust the pin.`);
    } else {
      setLocationError("");
    }
  };


  const handleSendOTP = async () => {
    if (!formData.phone) return;
    setIsProcessing(true);
    try {
      await api.post("/auth/send-otp", { phone: formData.phone });
      setIsOtpSent(true);
      // alert("OTP Sent! Check your phone.");
    } catch (error: any) {
      alert("Failed to send OTP: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) return;
    setIsProcessing(true);
    try {
      const res = await api.post("/auth/verify-otp", { 
        phone: formData.phone, 
        otp: otpCode 
      });
      
      // Save user details if returned
      if (res.data.id) {
        localStorage.setItem("userId", res.data.id.toString());
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
      }
      
      setIsOtpVerified(true);
      setStep(3);
    } catch (error: any) {
      alert("Verification failed: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);

    try {
      const userId = localStorage.getItem("userId");
      const payload = {
        products: bundleId ? [] : cart,
        start_date: bundleId ? bundleStartDate : (cart[0]?.start_date || new Date().toISOString()),
        end_date: bundleId ? bundleEndDate : (cart[0]?.end_date || new Date().toISOString()),
        total_price: total,
        shipping_address: address,
        contact_person: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        email: formData.email,
        special_requirements: formData.message || "",
        user_id: userId ? parseInt(userId) : null,
        payment_method: paymentMethod,
        deposit_option: depositOption,
        paid_amount: payNowTotal,
        balance_amount: payLaterAmount,
        total_deposit: securityDeposit
      };

      if (paymentMethod === 'razorpay' || paymentMethod === 'upi' || paymentMethod === 'gateway') {
        const orderRes = await api.post("/orders/razorpay-order", { amount: payNowTotal });
        const { order_id, key } = orderRes.data;

        if (!(window as any).Razorpay) {
          throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
        }

        const options = {
          key: key,
          amount: payNowTotal * 100,
          currency: "INR",
          name: "Antigravity Rental",
          description: "Advance Booking Payment",
          order_id: order_id,
          handler: async function (response: any) {
            try {
              const finalPayload = { 
                ...payload, 
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                status: "confirmed"
              };
              const res = await api.post("/orders", finalPayload);
              handleSuccess(res.data.booking_reference, finalPayload, res.data.delivery_otp);
            } catch (err: any) {
              alert("Payment confirmed but order creation failed: " + (err.response?.data?.detail || err.message));
              setIsProcessing(false);
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone
          },
          theme: { color: "#4F46E5" },
          modal: {
            ondismiss: function() { setIsProcessing(false); }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert("Payment Failed: " + response.error.description);
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        const res = await api.post("/orders", { ...payload, status: "pending" });
        handleSuccess(res.data.booking_reference, payload, res.data.delivery_otp);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "An unexpected error occurred";
      alert("Checkout failed: " + errorMessage);
      setIsProcessing(false);
    }
  };

  const handleSuccess = (bookingRef: string, payload: any, deliveryOtp?: string) => {
    const booking = {
      id: bookingRef,
      products: cart,
      start_date: payload.start_date,
      end_date: payload.end_date,
      total_price: total,
      status: (payload.status || "pending") as "pending" | "confirmed" | "in_progress" | "delivered" | "cancelled",
      shipping_address: address,
      contact_person: payload.contact_person,
      phone: payload.phone,
      special_requirements: payload.special_requirements,
      created_at: new Date().toISOString(),
      paid_amount: payNowTotal,
      balance_amount: payLaterAmount,
      deposit_option: depositOption,
      delivery_otp: deliveryOtp
    };

    setCurrentBooking(booking);
    clearCart();
    router.push(`/customer/booking-confirmation/${booking.id}`);
    setIsProcessing(false);
  };
  // const deliveryFee = 40;
  // const subtotal = getTotalPrice(); // already price_per_day × qty × days
  // const tax = subtotal * 0.1;
  // const total = subtotal + tax + deliveryFee;

  return (
    <div>
      <Navbar />

      <main style={{margin:"20px",marginTop:"100px"}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Bar */}
          <div className="mb-12 flex justify-center items-center gap-4">
            {[
              ...(bundleId ? [{ s: 0, label: "Bundle" }] : []),
              { s: 1, label: "Details" },
              { s: 3, label: "Confirm" },
              { s: 4, label: "Payment" }
            ].map((i) => (
              <div key={i.s} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step >= i.s ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                  {i.s === 0 ? "B" : i.s === 3 ? "2" : i.s === 4 ? "3" : i.s}
                </div>
                <span className={`hidden md:inline font-bold uppercase tracking-widest text-[10px] ${step >= i.s ? 'text-primary' : 'text-gray-400'}`}>
                  {i.label}
                </span>
                {((bundleId && i.s < 4) || (!bundleId && i.s < 4 && i.s > 0)) && <div className={`w-8 h-0.5 ${step > i.s ? 'bg-primary' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {step === 0 && selectedBundle && (
                <div className="space-y-8 animate-fade-in-down">
                   <Card style={{padding:"15px",margin:"15px"}} className="checkout-card p-8 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-primary/20">🎁</div>
                      <div>
                        <h2 style={{color:"white"}} className="text-3xl font-black">{selectedBundle.title}</h2>
                        <p className="text-primary font-bold">Special Package Pricing • ₹{selectedBundle.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Grouped Products in this Bundle</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedBundle.items.map((item: any, idx: number) => (
                           <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-primary/30 transition-all">
                              <span className="text-2xl">{item.icon}</span>
                              <div>
                                <p style={{color:"white"}} className="font-bold text-sm">{item.name}</p>
                                <p className="text-xs text-gray-500">Includes {item.qty} units</p>
                              </div>
                           </div>
                        ))}
                      </div>
                      <div style={{margin:"5px",padding:"10px"}} className="mt-12 p-6 bg-slate-900 rounded-3xl border border-white/5">
                        <h3 style={{color:"white"}} className="font-bold text-lg mb-4">Select Rental Dates</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label style={{color:"white"}} className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                            <input
                              style={{color:"white"}}
                              type="date"
                              value={bundleStartDate}
                              onChange={(e) => setBundleStartDate(e.target.value)}
                              className="w-full bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl p-4 transition-all"
                            />
                          </div>
                          <div>
                            <label style={{color:"white"}} className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                            <input
                              style={{color:"white"}}
                              type="date"
                              value={bundleEndDate}
                              onChange={(e) => setBundleEndDate(e.target.value)}
                              className="w-full bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl p-4 transition-all"
                            />
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mt-4">
                          This curated bundle has been pre-configured for your convenience. By proceeding, these items will be added to your booking process at the discounted bundle rate.
                        </p>
                     </div>
                    </div>
                   </Card>

                   <Button 
                    style={{padding:"10px",margin:"10px"}} 
                    size="xl" 
                    className="w-full" 
                    onClick={() => {
                      if (!bundleStartDate || !bundleEndDate) {
                        alert("Please select rental dates for the bundle");
                        return;
                      }
                      setStep(1);
                    }}
                  >
                    Confirm Bundle & Start Checkout
                   </Button>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-8 animate-fade-in-left">
                  {/* Contact Info */}
                  <Card style={{margin:"10px"}} className="checkout-card p-8">
                    <h2 style={{color:"white"}} className="text-2xl font-black mb-8 text-gradient">Contact Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label style={{color:"white"}} className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                        <input
                        style={{color:"white"}}
                        placeholder="FIRST NAME"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleFormChange("firstName", e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl p-4 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label style={{color:"white"}} className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                        <input
                        style={{color:"white"}}
                        placeholder="LAST NAME"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleFormChange("lastName", e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl p-4 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label style={{color:"white"}} className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input
                        style={{color:"white"}}
                        placeholder="EMAIL ADDRESS"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFormChange("email", e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl p-4 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label style={{color:"white"}} className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <input
                        style={{color:"white"}}
                        placeholder="+91 98765 43210"
                          type="tel"
                          maxLength={10}
                          value={formData.phone}
                          onChange={(e) => handleFormChange("phone", e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl p-4 transition-all"
                          required
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Delivery Info */}
                  <Card className="checkout-card p-8">
                    <h2 style={{color:"white"}} className="text-2xl font-black mb-8 text-gradient">Delivery Details</h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label style={{color:"white"}} className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Delivery Zone</label>
                        <select 
                        style={{color:"white",margin:"5px",padding:"5px"}}
                          value={deliveryZone}
                          onChange={(e) => setDeliveryZone(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl p-4 transition-all cursor-pointer"
                        >
                          {DELIVERY_ZONES.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.name} (₹{zone.price})</option>
                          ))}
                        </select>
                        <p style={{margin:"5px"}} className="text-xs text-primary font-bold mt-2 ml-1">
                          Estimate: {selectedZone.estimate} • {selectedZone.desc}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <label style={{color:"white"}} className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm Location on Map</label>
                        
                        <MapSection 
                          onAddressSelect={handleMapAddressSelect}
                          selectedZoneId={deliveryZone}
                          onZoneValidate={handleZoneValidate}
                        />

                        {locationError && (
                          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-500 text-xs font-bold">
                            ⚠️ {locationError}
                          </div>
                        )}

                        {!locationError && address.street && (
                          <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-2xl text-green-500 text-xs font-bold">
                            ✅ Location verified within {selectedZone.name}
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 mt-6">
                          <label style={{color:"white"}} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Flat / House No / Landmark</label>
                          <input
                          style={{color:"white"}}
                          placeholder="FLAT / HOUSE NO / LANDMARK"
                            type="text"
                            value={address.street}
                            onChange={(e) => handleAddressChange("street", e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-2xl p-4 transition-all"
                            required
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <input
                            style={{color:"white"}}
                              type="text"
                              placeholder="City"
                              value={address.city}
                              readOnly
                              className="bg-gray-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl p-4 transition-all opacity-70"
                            />
                            <input
                            style={{color:"white"}}
                              type="text"
                              placeholder="ZIP Code"
                              value={address.zipcode}
                              readOnly
                              className="bg-gray-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl p-4 transition-all opacity-70"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  
                  {/* ── Saved Addresses Selection ── */}
                  {savedAddresses.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ color: "#64748b", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 10px" }}>📍 Deliver to a saved address</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {savedAddresses.map((addr: any) => {
                          const selected = selectedAddrId === addr.address_id && !showAddrForm;
                          return (
                            <div key={addr.address_id} onClick={() => handlePickAddress(addr)}
                              style={{ padding: "14px 18px", background: selected ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.6)", border: `1.5px solid ${selected ? "rgba(99,102,241,0.4)" : "#1e293b"}`, borderRadius: 16, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 14, transition: "all 0.15s" }}
                              onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"; }}
                              onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "#1e293b"; }}>
                              {/* Radio */}
                              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? "#6366f1" : "#334155"}`, background: selected ? "#6366f1" : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                                  <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{addr.full_name}</span>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "1px 8px", borderRadius: 20, textTransform: "uppercase" }}>
                                    {addr.address_type === "Home" ? "🏠" : addr.address_type === "Work" ? "🏢" : "📌"} {addr.address_type}
                                  </span>
                                  {addr.is_default && <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "1px 8px", borderRadius: 20 }}>★ Default</span>}
                                </div>
                                <p style={{ color: "#94a3b8", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                                  {addr.street}{addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} – {addr.zipcode}
                                </p>
                                <p style={{ color: "#6366f1", fontSize: 11, margin: "3px 0 0", fontWeight: 700 }}>📱 +91 {addr.phone}</p>
                              </div>
                            </div>
                          );
                        })}

                        {/* Divider + add new */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
                          <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
                          <span style={{ color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>or</span>
                          <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
                        </div>

                        <button onClick={() => { setShowAddrForm(true); setSelectedAddrId(null); setAddress({ street:"", city:"", state:"", zipcode:"", country:"India" }); }}
                          style={{ padding: "12px 0", background: showAddrForm ? "rgba(99,102,241,0.1)" : "transparent", border: `1.5px dashed ${showAddrForm ? "#6366f1" : "#334155"}`, borderRadius: 14, color: showAddrForm ? "#6366f1" : "#64748b", fontWeight: 700, cursor: "pointer", fontSize: 13, width: "100%", transition: "all 0.15s" }}>
                          {showAddrForm ? "✏️ Entering a new address below ↓" : "+ Enter a different address"}
                        </button>
                      </div>
                    </div>
                  )}

                  <Button 
                    style={{padding:"5px",margin:"10px"}} 
                    size="xl" 
                    className="w-full" 
                    onClick={() => {
                      if (!isLocationValid) {
                        alert(locationError);
                        return;
                      }
                      if (!address.street) {
                        alert("Please select a valid address on the map first.");
                        return;
                      }
                      setStep(3);
                    }}
                  >
                    Next: Review Booking
                  </Button>

                </div>
              )}



              {step === 3 && (
                <div className="space-y-8 animate-fade-in-up">
                  <Card className="checkout-card p-8">
                    <h2 style={{color:"white"}} className="text-2xl font-black mb-8 text-gradient">Review Your Booking</h2>
                    
                    <div style={{padding:"10px"}} className="space-y-6">
                      <div style={{padding:"10px",margin:"5px"}} className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                        <h3 style={{color:"white"}} className="font-bold text-primary flex items-center gap-2 mb-2">
                          <span>📦</span> Delivery Estimate
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                          Your items are expected to arrive by <span className="font-black text-gray-900 dark:text-white">{selectedZone.estimate}</span>.
                        </p>
                      </div>

                      <div style={{margin:"10px",padding:"10px"}} className="p-6 bg-green-500/5 rounded-3xl border border-green-500/10">
                        <h3 style={{color:"white"}} className="font-bold text-green-600 flex items-center gap-2 mb-2">
                          <span>🛡️</span> Refundable Deposit
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                          A security deposit of <span className="font-black text-gray-900 dark:text-white">₹{securityDeposit}</span> is included. This will be fully refunded after order completion and inspection.
                        </p>
                      </div>

                      <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        <div className="py-4 flex justify-between">
                          <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Deliver To</span>
                          <span className="font-bold text-gray-900 dark:text-white text-right">{formData.firstName} {formData.lastName}<br/>{address.street}, {address.city}</span>
                        </div>
                        <div className="py-4 flex justify-between">
                          <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Phone</span>
                          <span className="font-bold text-gray-900 dark:text-white">{formData.phone}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Button size="xl" className="w-full" onClick={() => setStep(4)}>
                    Proceed to Payment
                  </Button>
                  <button onClick={() => setStep(1)} className="text-gray-400 font-bold flex items-center gap-2 hover:text-gray-600 transition-colors mx-auto">
                    ← Back to Details
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8 animate-fade-in-up">
                  {/* Payment Breakdown Card */}
                  <Card style={{margin:"10px", marginTop:"30px"}} className="checkout-card p-8">
                    <h2 style={{color:"white",margin:"5px"}} className="text-2xl font-black mb-8 text-gradient">Secure Payment</h2>
                    
                    <div className="space-y-8">
                      {/* Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div style={{padding:"10px",margin:"5px"}} className="p-6 bg-slate-800/50 rounded-3xl border border-white/5">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Immediate Payment</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Advance (30%)</span>
                              <span className="text-white font-bold">₹{advanceAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Logistics Fee</span>
                              <span className="text-white font-bold">₹{logisticsFee.toLocaleString()}</span>
                            </div>
                            {depositOption === "online" && (
                              <div className="flex justify-between text-sm text-green-400">
                                <span>Security Deposit</span>
                                <span className="font-bold">₹{securityDeposit.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="pt-4 border-t border-white/10 flex justify-between">
                              <span style={{padding:"5px",fontSize:"16px"}} className="text-white font-black uppercase tracking-widest text-[10px]">Total Now</span>
                              <span className="text-primary text-xl font-black">₹{payNowTotal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{padding:"15px"}} className="p-6 bg-slate-800/50 rounded-3xl border border-white/5 space-y-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Deposit Collection</p>
                          <div className="space-y-3">
                            <label style={{margin:"5px",padding:"5px"}} className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${depositOption === 'online' ? 'border-primary bg-primary/5' : 'border-transparent bg-white/5'}`}>
                              <input 
                                type="radio" 
                                name="deposit" 
                                className="mt-1"
                                checked={depositOption === 'online'}
                                onChange={() => setDepositOption('online')}
                              />
                              <div>
                                <p className="text-sm font-bold text-white">Online Now</p>
                                <p className="text-[10px] text-gray-400">Pay before dispatch</p>
                              </div>
                            </label>
                            <label  style={{margin:"5px",padding:"5px"}} className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${depositOption === 'link' ? 'border-primary bg-primary/5' : 'border-transparent bg-white/5'}`}>
                              <input 
                                type="radio" 
                                name="deposit" 
                                className="mt-1"
                                checked={depositOption === 'link'}
                                onChange={() => setDepositOption('link')}
                              />
                              <div>
                                <p className="text-sm font-bold text-white">Cashless Link</p>
                                <p className="text-[10px] text-gray-400">Payment link before handover</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div style={{margin:"10px"}} className="space-y-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Select Payment Method</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { id: 'upi', name: 'UPI', icon: '⚡' },
                            { id: 'razorpay', name: 'Razorpay', icon: '💳' },
                            { id: 'gateway', name: 'Payment Gateway', icon: '🛡️' }
                          ].map(pm => (
                            <button 
                            style={{color:"white",margin:"5px",padding:"5px"}}
                              key={pm.id}
                              onClick={() => setPaymentMethod(pm.id)}
                              className={`p-6 rounded-3xl flex flex-col items-center gap-3 border-2 transition-all ${paymentMethod === pm.id ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/10'}`}
                            >
                              <span className="text-2xl">{pm.icon}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest">{pm.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Button style={{margin:"10px",padding:"5px"}} size="xl" className="w-full" onClick={handleSubmit} loading={isProcessing}>
                    Pay ₹{payNowTotal.toLocaleString()} & Confirm Booking
                  </Button>
                  <button  style={{margin:"5px",padding:"5px"}}  onClick={() => setStep(3)} className="text-gray-400 font-bold flex items-center gap-2 hover:text-gray-600 transition-colors mx-auto">
                    ← Back to Summary
                  </button>
                </div>
              )}
            </div>

            {/* Price Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                <Card className="checkout-card p-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-12 -mt-12" />
                  <h3 style={{color:"white",margin:"5px"}} className="text-xl font-black mb-8">Summary</h3>
                  
                  <div className="space-y-4 mb-8">
                    {selectedBundle ? (
                      selectedBundle.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div style={{padding:"5px"}} className="flex items-center gap-3">
                            <span className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]">{item.qty}</span>
                            <span className="text-gray-500 font-medium line-clamp-1">{item.name} {item.icon}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <span className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]">{item.quantity}</span>
                            <span className="text-gray-500 font-medium line-clamp-1">{item.title}</span>
                          </div>
                          <span className="font-black text-gray-900 dark:text-white">₹{(item.price_per_day * item.quantity * (item.start_date && item.end_date ? Math.max(1, Math.ceil((new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1)).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-slate-800">
                    <div style={{padding:"5px"}} className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Rental Subtotal</span>
                      <span className="text-gray-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div style={{padding:"5px"}} className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Delivery ({selectedZone.name})</span>
                      <span className="text-gray-900 dark:text-white">₹{deliveryFee.toLocaleString()}</span>
                    </div>
                    <div style={{padding:"5px"}} className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Taxes (18% GST)</span>
                      <span className="text-gray-900 dark:text-white">₹{tax.toLocaleString()}</span>
                    </div>
                    <div style={{padding:"5px"}} className="flex justify-between text-xs font-bold uppercase tracking-widest text-green-500">
                      <span>Security Deposit (Refundable)</span>
                      <span>₹{securityDeposit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end pt-6 border-t-2 border-primary/20">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Total Pay</span>
                      <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
                
                <div style={{padding:"10px"}} className="p-6 bg-slate-900 rounded-3xl text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-xl">💬</div>
                    <div style={{margin:"5px"}} >
                      <h4 style={{color:"white"}} className="font-bold text-sm">Need Help?</h4>
                      <p style={{color:"white"}} className="text-[10px] text-slate-400">Our support is online 24/7</p>
                    </div>
                  </div>
                  <Button 
                    variant="secondary"
                    className="w-full"
                    onClick={() => setIsChatOpen(true)}
                  >
                    CHAT WITH US
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
     
  );
}
