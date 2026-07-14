"use client";

import Card from "@/components/Card";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function AgentManagement() {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    api.get("/admin/agents").then(res => setAgents(res.data)).catch(err => console.error(err));
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [newAgent, setNewAgent] = useState({ name: "", email: "", password: "", phone: "", vehicle: "" });

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: newAgent.name,
        username: newAgent.email,
        password: newAgent.password,
        phone: newAgent.phone,
        vehicle: newAgent.vehicle
      };
      const res = await api.post("/admin/agents", payload);
      setAgents([...agents, res.data]);
      setSuccessData({ ...newAgent, password: newAgent.password }); // Retain password to show in modal
      setNewAgent({ name: "", email: "", password: "", phone: "", vehicle: "" });
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Failed to create agent account.";
      alert(msg);
    }
  };

  const handleRemoveAgent = async (id: string | number) => {
    if (confirm("Are you sure you want to remove this delivery agent?")) {
      try {
        await api.delete(`/admin/agents/${id}`);
        setAgents(agents.filter(a => a.id !== id));
      } catch (error) {
        console.error("Failed to remove agent:", error);
        alert("Failed to remove agent account from database.");
      }
    }
  };

  const closeModals = () => {
    setShowAddModal(false);
    setSuccessData(null);
  };

  return (
    <div style={{padding:"20px"}} className="animate-fade-in" >
        <Link href="/admin/dashboard" className="mb-6 inline-block">
          <Button style={{padding:"20px",margin:"10px"}} variant="secondary" size="sm" className="gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 animate-fade-in-down">
          <div>
            <h1 style={{color:"white"}} className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
              Agent <span className="text-gradient">Management</span>
            </h1>
            <p style={{ margin:"10px"}}className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              Create and manage your delivery fleet accounts.
            </p>
          </div>
          <Button 
            style={{padding:"10px",color:"white"}} 
            className="px-8 py-6 rounded-2xl font-black bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            onClick={() => setShowAddModal(true)}
          >
            + CREATE NEW AGENT
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {agents.map((agent, idx) => (
            <Card 
              key={agent.id} 
              style={{padding:"15px",margin:"10px"}} 
              className="group bg-white dark:bg-slate-900 rounded-[40px] border-2 border-transparent hover:border-primary/20 shadow-xl transition-all duration-500 animate-fade-in-up"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary/10 to-secondary/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                    👨‍✈️
                  </div>
                  <div className="text-center md:text-left space-y-1">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <h3 style={{color:"white",margin:"5px"}} className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{agent.name}</h3>
                      <Badge variant={agent.status === 'online' ? 'success' : 'info'} className="text-[10px] py-0.5">
                        {agent.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-slate-500 font-bold text-sm tracking-wide">{agent.email} · {agent.phone} · ID: {agent.id}</p>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{agent.vehicle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="text-center">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Deliveries</p>
                    <p style={{color:"white"}} className="text-2xl font-black text-slate-900 dark:text-white">{agent.deliveries}</p>
                  </div>
                  <Button 
                    style={{padding:"5px",margin:"5px",color:"white"}} 
                    variant="danger" 
                    className="rounded-2xl px-6 py-4  group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveAgent(agent.id)}
                  >
                    Remove Agent
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-6xl mb-6 opacity-20">🚛</div>
            <p className="text-slate-400 font-bold uppercase tracking-widest">No agents found in your fleet.</p>
          </div>
        )}

      {/* Add Agent Modal */}
      <Modal 
        isOpen={showAddModal || !!successData} 
        onClose={closeModals}
        title={successData ? "Account Created!" : "Create Agent Account"}
      >
        {successData ? (
          <div style={{padding:"5px"}} className="space-y-6 text-center animate-scale-in">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto">
              ✅
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Credentials Ready</h3>
              <p className="text-slate-500 text-sm">Please share these details with <b>{successData.name}</b></p>
            </div>
            <div style={{padding:"5px"}} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-left space-y-4 border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                <p className="font-bold text-lg text-primary">{successData.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Initial Password</p>
                <p className="font-bold text-lg text-slate-900 dark:text-white">{successData.password}</p>
              </div>
            </div>
            <Button style={{margin:"5px",padding:"5px"}} className="w-full py-4 text-white" onClick={closeModals}>DONE</Button>
          </div>
        ) : (
          <form onSubmit={handleAddAgent} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label style={{margin:"5px"}} className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                style={{padding:"5px"}}
                  required
                  type="text" 
                  className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary outline-none transition-all"
                  value={newAgent.name}
                  onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                  placeholder="e.g. Michael Johnson"
                />
              </div>
              <div>
                <label style={{margin:"5px"}} className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                style={{padding:"5px"}}
                  required
                  type="email" 
                  className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary outline-none transition-all"
                  value={newAgent.email}
                  onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                  placeholder="michael@rental.com"
                />
              </div>
              <div>
                <label style={{margin:"5px"}} className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <input 
                style={{padding:"5px"}}
                  required
                  type="password" 
                  className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary outline-none transition-all"
                  value={newAgent.password}
                  onChange={e => setNewAgent({...newAgent, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label style={{margin:"5px"}} className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input 
                style={{padding:"5px"}}
                  required
                  type="text" 
                  className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary outline-none transition-all"
                  value={newAgent.phone}
                  onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label style={{margin:"5px"}} className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Vehicle Details</label>
                <input 
                style={{padding:"5px"}}
                  required
                  type="text" 
                  className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-primary outline-none transition-all"
                  value={newAgent.vehicle}
                  onChange={e => setNewAgent({...newAgent, vehicle: e.target.value})}
                  placeholder="e.g. White Van · GJ 01 2024"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button 
              style={{color:"white",padding:"5px",margin:"5px"}}
                type="button" 
                variant="secondary" 
                className="flex-1 py-4"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button 
              style={{padding:"5px",margin:"5px"}}
                type="submit" 
                className="flex-1 py-4 text-white"
              >
                Create Account
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
