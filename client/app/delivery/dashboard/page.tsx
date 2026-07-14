"use client";

import Navbar from "@/components/Navbar";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function DeliveryDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [newMission, setNewMission] = useState<any>(null);

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [deliveryAgent, setDeliveryAgent] = useState({
    name: "Loading Agent...",
    id: "...",
    status: "Active",
    rating: 5.0,
    vehicle: "Loading Vehicle..."
  });

  const fetchOrders = () => {
    const agentIdStr = localStorage.getItem("agentId") || "0";
    const agentName = localStorage.getItem("agentName") || "Delivery Agent";
    
    setDeliveryAgent({
      name: agentName,
      id: `DA-00${agentIdStr}`,
      status: "Active",
      rating: 4.9, 
      vehicle: localStorage.getItem("agentVehicle") || "Standard Transport",
    });

    api.get("/orders").then(res => {
      if(res.data) {
        const myDeliveries = res.data
          .filter((order: any) => String(order.deliveryAgentId) === agentIdStr)
          .map((order: any) => {
             let fullAddr = "Address Verification Pending";
             if (order.shipping_address) {
                fullAddr = `${order.shipping_address.street || ''}, ${order.shipping_address.city || ''} ${order.shipping_address.zipcode || ''}`.trim().replace(/^,|,$/g, '');
             }
             return {
               id: order.id,
               customer: order.customer,
               address: fullAddr,
               items: order.items || ["Equipment Package"],
               time: order.start_date ? `${order.start_date} to ${order.end_date || 'Ends'}` : `Ordered: ${order.date || "ASAP"}`,
               status: order.status,
               balance: order.balance_amount || 0,
               phone: order.phone,
               shipping_address: order.shipping_address,
             };
          });
        
        // Find the first pending mission for the live alert
        const pending = myDeliveries.find((d: any) => d.status === "pending");
        if (pending) {
            setNewMission(pending);
        } else {
            setNewMission(null);
        }
        
        // Ensure queue only has accepted non-pending tasks
        setDeliveries(myDeliveries.filter((d: any) => d.status !== "pending"));
      }
    }).catch(err => console.error("Could not fetch logistics operations:", err));
  };

  useEffect(() => {
    const localRole = localStorage.getItem("role");
    if (localRole !== "DELIVERY") {
       window.location.href = "/delivery/login";
       return;
    }
    fetchOrders();
  }, []);

  const [handoverModal, setHandoverModal] = useState(false);
  const [pickupModal, setPickupModal] = useState(false);
  const [bookingIdInput, setBookingIdInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [pickupCondition, setPickupCondition] = useState("");
  const [balanceCollected, setBalanceCollected] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);

  const handlePhotoSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readers = files.map(file => new Promise<string>(resolve => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.readAsDataURL(file);
    }));

    Promise.all(readers).then(b64s => {
        setSelectedPhotos(b64s);
        setPhotoUploaded(true);
    });
  };



  const getStatusColor = (status: string): "success" | "secondary" | "warning" | "info" | "primary" | "danger" => {
    switch (status) {
      case "completed": return "success";
      case "in_delivery": return "secondary";
      case "picked_up": return "warning";
      case "in_progress": return "primary";
      case "pending": return "info";
      default: return "info";
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const captureGeo = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setGeoData({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString()
        });
      });
    }
  };

  const handleStartHandover = (delivery: any) => {
    setSelectedDelivery(delivery);
    setHandoverModal(true);
    setPinInput("");
    setPhotoUploaded(false);
    setSelectedPhotos([]);
    setBalanceCollected(false);
    captureGeo();
  };

  const handleStartPickup = (delivery: any) => {
    setSelectedDelivery(delivery);
    setPickupModal(true);
    setPhotoUploaded(false);
    setSelectedPhotos([]);
    setPickupCondition("");
    setBalanceCollected(false);
  };

  const confirmHandover = async () => {
    if (!pinInput) {
      alert("Please enter the customer PIN!");
      return;
    }
    if (!photoUploaded || selectedPhotos.length === 0) {
      alert("Please upload delivery photos!");
      return;
    }

    try {
      // 1. Upload proof photos first
      await api.post(`/admin/orders/${selectedDelivery.id}/proof`, {
        proof_type: "delivery",
        photos: selectedPhotos,
        notes: `Geo-location at delivery: ${geoData?.lat || 'N/A'}, ${geoData?.lng || 'N/A'}`
      });

      // 2. Verify OTP via backend
      await api.post(`/orders/${selectedDelivery.id}/verify-delivery-otp`, { 
        otp: pinInput
      });
      
      alert("Delivery verified and photos uploaded successfully!");
      setHandoverModal(false);
      setSelectedDelivery(null);
      fetchOrders();
    } catch (error: any) {
      alert("Verification failed: " + (error.response?.data?.detail || "Invalid PIN"));
    }
  };

  const confirmPickup = async () => {
    if (!photoUploaded || selectedPhotos.length === 0) {
      alert("Please upload pickup photos!");
      return;
    }
    if (!pickupCondition) {
      alert("Please mark condition!");
      return;
    }

    try {
      // 1. Upload proof photos
      await api.post(`/admin/orders/${selectedDelivery.id}/proof`, {
        proof_type: "pickup",
        photos: selectedPhotos,
        notes: `Condition on pickup: ${pickupCondition}`
      });

      // 2. Update status
      await api.put(`/orders/${selectedDelivery.id}/status`, { 
        status: "picked_up",
        balance_collected: balanceCollected,
        return_condition: pickupCondition
      });

      alert("Pickup documentation and photos updated!");
      setPickupModal(false);
      setSelectedDelivery(null);
      if (pickupCondition !== "Good") {
        alert("Refund workflow triggered for " + pickupCondition + " items.");
      }
      fetchOrders();
    } catch (err) {
      alert("Failed to complete pickup");
    }
  };

  const handleSearchBooking = () => {
    const d = deliveries.find(del => del.id.toUpperCase() === bookingIdInput.toUpperCase());
    if (d) {
      if (d.status === "in_progress") handleStartHandover(d);
      else if (d.status === "delivered") handleStartPickup(d);
      else alert(`Booking current status: ${d.status}`);
    } else {
      alert("Booking ID not found!");
    }
  };

  const handleAcceptMission = async () => {
    if (newMission) {
      await handleUpdateStatus(newMission.id, "in_progress");
      setNewMission(null);
    }
  };

  const handleContact = (delivery: any) => {
    setSelectedDelivery(delivery);
    setShowContactModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main style={{margin:"30px",marginTop:"120px"}}>
        {/* Agent Profile Header */}
        <div style={{margin:"10px"}} className="relative mb-12 animate-fade-in-down">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 blur-3xl opacity-50 -z-10" />
          <div className="glass-morphism rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-gradient-to-tr from-primary to-secondary p-1">
                <div className="w-full h-full rounded-[28px] bg-white dark:bg-slate-900 flex items-center justify-center text-4xl md:text-5xl shadow-inner">
                  👨‍✈️
                </div>
              </div>
              <div className={`absolute -bottom-2 -right-2 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'} border-4 border-white dark:border-slate-900 w-8 h-8 rounded-full`} />
            </div>
            
            <div style={{padding:"5px"}} className="text-center md:text-left space-y-2 flex-grow">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <h1 style={{color: "inherit"}} className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {deliveryAgent.name}
                </h1>
                <Badge variant={isOnline ? "success" : "danger"} className="px-4 py-1 font-bold">
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </Badge>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs md:text-sm">
                ID: {deliveryAgent.id} · {deliveryAgent.vehicle}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-2 text-amber-500">
                <span className="text-xl">⭐</span>
                <span className="font-black text-lg">{deliveryAgent.rating}</span>
                <span className="text-slate-400 font-medium text-sm">(124 Deliveries)</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                style={{padding:"5px"}} 
                variant="outline" 
                className="rounded-2xl px-6 py-6 border-2 font-bold transition-all"
                onClick={() => setShowSupportModal(true)}
              >
                Support
              </Button>
              <Button 
                style={{padding:"5px",marginRight:"10px"}} 
                variant={isOnline ? "primary" : "secondary"}
                className={`rounded-2xl px-6 py-6 font-bold shadow-xl transition-all ${isOnline ? 'shadow-primary/20' : ''}`}
                onClick={() => setIsOnline(!isOnline)}
              >
                {isOnline ? "Go Offline" : "Go Online"}
              </Button>
            </div>
          </div>
        </div>

        {/* Live Assignment Alert (Simulated) */}
        {newMission && isOnline && (
          <div style={{margin:"20px"}} className="mb-12 animate-fade-in-right">
            <div className="group relative overflow-hidden rounded-[32px] bg-slate-900 shadow-2xl transition-all duration-500 hover:shadow-orange-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl animate-bounce-slow shadow-lg shadow-orange-500/50">🚛</div>
                  <div style={{padding:"5px"}} className="text-center md:text-left">
                    <h2 style={{color:"white",margin:"5px"}} className="text-2xl font-black text-white uppercase tracking-tighter">Next Mission Assigned</h2>
                    <p className="text-white/60 font-bold uppercase tracking-widest text-xs mt-1">Order #{newMission.id} · {newMission.items?.length || 0} Items · Express Delivery</p>
                  </div>
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                  <Button 
                    style={{color:"black",padding:"5px",marginRight:"20px"}} 
                    className="flex-1 lg:flex-none py-6 px-10 bg-white text-slate-900 font-black rounded-2xl hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105 active:scale-95"
                    onClick={handleAcceptMission}
                  >
                    ACCEPT & NAVIGATE
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: "Daily Goal", value: "85%", icon: "🎯" },
            { label: "Total Distance", value: "42km", icon: "🛣️" },
            { label: "Fuel Level", value: "65%", icon: "⛽" },
            { label: "Earnings Today", value: "$124", icon: "💸" },
          ].map((stat, i) => (
            <Card key={i} className="p-6 border-0 shadow-lg bg-white dark:bg-slate-900 rounded-[32px] animate-fade-in-up" style={{animationDelay: `${i*0.1}s`,padding:"10px",marginBottom:"20px"}}>
               <div className="text-2xl mb-4">{stat.icon}</div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
               <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Deliveries Queue */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
            <h2 style={{color: "inherit",margin:"10px"}} className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Your Queue</h2>
            <div className="flex w-full md:w-auto gap-2">
              <input 
              style={{padding:"5px"}}
                type="text" 
                placeholder="Enter Booking ID..." 
                value={bookingIdInput}
                onChange={(e) => setBookingIdInput(e.target.value)}
                className="flex-grow md:w-64 p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-primary transition-all text-sm font-bold"
              />
              <Button onClick={handleSearchBooking} style={{padding:"5px"}} variant="primary" className="rounded-2xl px-6">Verify</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {deliveries.map((delivery, idx) => (
              <div
                key={delivery.id}
                className="group relative bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-10 border-2 border-transparent hover:border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: `${0.3 + idx * 0.1}s`, padding:"15px" }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                  <div className="space-y-4 flex-grow">
                    <div className="flex items-center gap-4">
                      <Badge variant={getStatusColor(delivery.status)} className="px-4 py-1 uppercase font-black text-[10px] tracking-widest">
                        {delivery.status.replace("_", " ")}
                      </Badge>
                      <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">#{delivery.id}</span>
                    </div>
                    <h3 style={{color: "inherit",margin:"5px"}} className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {delivery.customer}
                    </h3>
                    <div className="flex items-center gap-2 text-primary font-bold">
                       <span>📍</span>
                       <p className="text-lg">{delivery.address}</p>
                    </div>
                  </div>

                  <div style={{padding:"10px"}} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl min-w-[200px] text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Target Window</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{delivery.time}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-8">
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(delivery.items) && delivery.items.map((item: any, i: number) => (
                      <span style={{padding:"5px" ,margin:"5px"}} key={i} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold rounded-xl">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-4 w-full md:w-auto">
                    <Button 
                      style={{padding:"5px",color:"white"}} 
                      variant="outline" 
                      className="flex-1 md:flex-none py-4 px-8 border-2 font-black rounded-2xl transition-all"
                      onClick={() => handleContact(delivery)}
                    >
                      Contact
                    </Button>
                    <Button 
                      style={{padding:"5px",color:"white"}} 
                      className="flex-1 md:flex-none py-4 px-10 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                      disabled={delivery.status === "completed"}
                      onClick={() => {
                        if (delivery.status === "in_progress") handleStartHandover(delivery);
                        else if (delivery.status === "in_delivery") handleStartPickup(delivery);
                        else if (delivery.status === "picked_up") handleUpdateStatus(delivery.id, "completed");
                      }}
                    >
                      {delivery.status === "in_progress" ? "At Delivery Site" : 
                       delivery.status === "in_delivery" ? "At Pickup Site" : 
                       delivery.status === "picked_up" ? "Finalize Return" : "Completed"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      <Modal 
        isOpen={showSupportModal} 
        onClose={() => setShowSupportModal(false)}
        title="Agent Support"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">Need help with a delivery? Our dispatcher is available 24/7.</p>
          <div className="grid grid-cols-1 gap-3">
            <Button 
              style={{padding:"5px",margin:"5px"}} 
              className="w-full justify-start py-4"
              onClick={() => window.location.href = "tel:+917010286162"}
            >
              📞 Call Dispatcher
            </Button>
            <Button 
              variant="secondary" 
              style={{padding:"5px",margin:"5px",color:"white"}} 
              className="w-full justify-start py-4"
              onClick={() => window.open("https://wa.me/917010286162?text=I%20am%20a%20delivery%20agent%20and%20need%20help", "_blank")}
            >
              💬 Chat with Support
            </Button>
            <Button 
              variant="outline" 
              style={{padding:"5px",margin:"5px"}} 
              className="w-full justify-start py-4"
              onClick={() => {
                if(confirm("Are you sure you want to report an emergency? This will notify the emergency response team.")) {
                  window.location.href = "tel:100";
                }
              }}
            >
              🚨 Report Emergency
            </Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)}
        title="Contact Customer"
      >
        {selectedDelivery && (
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              👤
            </div>
            <h3 style={{margin:"5px"}} className="text-2xl font-black text-slate-900 dark:text-white uppercase">{selectedDelivery.customer}</h3>
            <p className="text-slate-500 font-bold">{selectedDelivery.address}</p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <Button 
                style={{padding:"5px",margin:"5px"}} 
                className="py-6"
                onClick={() => {
                  const phone = selectedDelivery.phone || '';
                  window.location.href = `tel:${phone}`;
                }}
              >
                📞 Call
              </Button>
              <Button 
                variant="secondary" 
                style={{padding:"5px",color:"white",margin:"5px"}} 
                className="py-6"
                onClick={() => {
                  const phone = selectedDelivery.phone || '';
                  const cleanPhone = phone.replace(/\D/g, '');
                  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  window.open(`https://wa.me/${waPhone}?text=Hello%20${selectedDelivery.customer},%20this%20is%20your%20delivery%20agent.`, "_blank");
                }}
              >
                💬 Message
              </Button>
              <Button 
                variant="outline"
                style={{padding:"5px",margin:"5px",gridColumn: "span 2"}} 
                className="py-6 border-primary text-primary hover:bg-primary/5"
                onClick={() => {
                  const addr = selectedDelivery.shipping_address;
                  if (addr && addr.lat && addr.lng) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr.lat},${addr.lng}`, "_blank");
                  } else {
                    const query = encodeURIComponent(selectedDelivery.address);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
                  }
                }}
              >
                🧭 Get Directions
              </Button>
            </div>

          </div>
        )}
      </Modal>

      {/* Handover Modal */}
      <Modal
        isOpen={handoverModal}
        onClose={() => setHandoverModal(false)}
        title="Delivery Handover"
      >
        <div className="space-y-6">
          <div style={{padding:"5px"}} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
            <p className="text-lg font-black">{selectedDelivery?.customer}</p>
          </div>

          <div className="space-y-4">
            <label style={{margin:"5px"}} className="block text-sm font-bold">Verification PIN</label>
            <input 
            style={{padding:"5px",color:"white"}}
              type="text" 
              placeholder="Enter 4-digit PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-2xl tracking-[1em] text-center p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label style={{margin:"5px"}} className="block text-sm font-bold">Delivery Documentation</label>
            <div className={`relative group transition-all duration-300 ${photoUploaded ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-slate-800 bg-white/5'} border-2 border-dashed rounded-3xl p-8 text-center`}>
              <input 
                type="file" 
                accept="image/*"
                onChange={handlePhotoSelection}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="space-y-2">
                <div className="text-3xl">{photoUploaded ? "✅" : "📷"}</div>
                <p style={{color: "white"}} className="text-sm font-bold uppercase tracking-widest italic">
                  {photoUploaded ? "Photo Selected" : "Tap to capture or upload"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">MAX FILE SIZE: 10MB</p>
              </div>
            </div>
          </div>

          {geoData && (
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center italic">
              📍 Geo-captured: {geoData.lat.toFixed(4)}, {geoData.lng.toFixed(4)}
            </div>
          )}

          <Button 
          style={{margin:"5px",padding:"5px"}}
            className="w-full py-6 font-black rounded-2xl shadow-xl transition-all"
            onClick={confirmHandover}
            disabled={!pinInput || !photoUploaded}
          >
            CONFIRM HANDOVER
          </Button>
        </div>
      </Modal>

      {/* Pickup Modal */}
      <Modal
        isOpen={pickupModal}
        onClose={() => setPickupModal(false)}
        title="Item Return Pickup"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold">Inspection Photos</label>
            <div className={`relative group transition-all duration-300 ${photoUploaded ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-200 dark:border-slate-800 bg-white/5'} border-2 border-dashed rounded-3xl p-8 text-center`}>
              <input 
                type="file" 
                accept="image/*"
                multiple
                onChange={handlePhotoSelection}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="space-y-2">
                <div className="text-3xl">{photoUploaded ? "✅" : "📷"}</div>
                <p style={{color: "white"}} className="text-sm font-bold uppercase tracking-widest italic">
                  {photoUploaded ? "Return Photos Selected" : "Tap to capture return photos"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">MULTIPLE FILES ALLOWED</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold">Mark Item Condition</label>
            <div className="grid grid-cols-1 gap-2">
              {['Good', 'Damaged', 'Missing Items'].map((cond) => (
                <button
                  key={cond}
                  onClick={() => setPickupCondition(cond)}
                  className={`p-4 rounded-xl border-2 text-left font-bold transition-all ${
                    pickupCondition === cond 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  {cond === 'Good' ? '✨ ' : cond === 'Damaged' ? '💥 ' : '❓ '} {cond}
                </button>
              ))}
            </div>
          </div>

          {selectedDelivery?.balance > 0 && (
            <div style={{padding:"10px"}} className="p-6 bg-amber-500/10 rounded-3xl border-2 border-amber-500/20 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Balance Amount</p>
                  <p className="text-2xl font-black text-amber-600">₹{selectedDelivery.balance.toLocaleString()}</p>
                </div>
                <div className="text-3xl">💸</div>
              </div>
              <label style={{padding:"5px"}} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-500/30 cursor-pointer transition-all">
                <input 
                style={{margin:"5px"}}
                  type="checkbox" 
                  checked={balanceCollected}
                  onChange={(e) => setBalanceCollected(e.target.checked)}
                  className="w-6 h-6 rounded-lg text-amber-500 focus:ring-amber-500 border-2"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">I have collected the balance amount</span>
              </label>
            </div>
          )}

          <Button 
            className="w-full py-6 font-black rounded-2xl shadow-xl transition-all"
            onClick={confirmPickup}
            disabled={!photoUploaded || !pickupCondition}
          >
            CONFIRM PICKUP
          </Button>
        </div>
      </Modal>
    </div>
  );
}
