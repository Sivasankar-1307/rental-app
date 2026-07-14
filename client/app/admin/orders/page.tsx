"use client";

import Card from "@/components/Card";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

type Order = {
  id: string;
  customer: string;
  items: string[];
  total: string;
  status: string;
  date: string;
  start_date?: string;
  end_date?: string;
  deliveryAgent?: string;
  paid_amount?: number;
  balance_amount?: number;
  shipping_address?: any;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<any[]>([]);

  useEffect(() => {
    // Load active real orders
    api.get("/orders").then(res => {
      if (res.data.length > 0) setOrders(res.data);
    }).catch(err => console.error("Failed to fetch orders:", err));

    // Load active delivery agents
    api.get("/admin/agents").then(res => {
      if (res.data.length > 0) setDeliveryAgents(res.data);
    }).catch(err => console.error("Failed to fetch agents:", err));
  }, []);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleAssign = async (orderId: string, agentId: number, agentName: string) => {
    try {
      const res = await api.put(`/orders/${orderId}/assign`, {
        agent_id: agentId,
        agent_name: agentName
      });

      console.log(`NOTIFYING AGENT ${agentName}: New Job Assigned - Order #${orderId}`);

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: "in_delivery", deliveryAgent: agentName }
            : order
        )
      );
      setAssignModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      alert("Failed to assign agent.");
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "success";
      case "in_delivery": return "warning";
      case "pending": return "info";
      case "delivered": return "success";
      default: return "info";
    }
  };

  return (
    <div  style={{padding:"20px"}}>
        <Link href="/admin/dashboard" className="mb-6 inline-block text-white">
          <Button style={{ padding: "20px", margin: "10px" }} variant="secondary" size="sm" className="gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 animate-fade-in-down">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-gradient leading-tight">Manage Orders</h1>
            <p className="text-gray-500 font-medium">Process and assign incoming rental orders.</p>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <Card style={{ margin: "10px", padding: "15px" }} className="overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/5 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Total</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Agent</th>
                    <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/5 transition-colors group">
                      <td className="px-6 py-5 font-bold text-primary">#{order.id}</td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-gray-900 dark:text-gray-100">{order.customer}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{order.items.join(", ")}</div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-gray-600 dark:text-gray-400">{order.date}</td>
                      <td className="px-6 py-5 font-black text-gray-900 dark:text-gray-100">{order.total}</td>
                      <td className="px-6 py-5">
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        {order.deliveryAgent ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 dark:bg-green-500/20 rounded-full w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span style={{ padding: "5px" }} className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">{order.deliveryAgent}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic font-bold uppercase tracking-tighter">Pending Delivery Assignment</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2 justify-end opacity-100 transition-opacity">
                          <Button
                            style={{ color: "white", padding: "5px" }}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDetailsOrder(order);
                              setDetailsModalOpen(true);
                            }}
                            className="text-xs font-black uppercase tracking-widest px-4 border-2"
                          >
                            Details
                          </Button>
                          <Button
                            style={{ color: "white", padding: "5px" }}
                            size="sm"
                            variant={order.deliveryAgent ? "outline" : "primary"}
                            onClick={() => {
                              setSelectedOrder(order.id);
                              setAssignModalOpen(true);
                            }}
                            className="text-xs font-black uppercase tracking-widest px-4 shadow-lg shadow-primary/20"
                            disabled={!!order.deliveryAgent || order.status === "delivered"}
                          >
                            {order.deliveryAgent ? "Assigned" : "Assign"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-6 lg:hidden">
          {orders.map((order) => (
            <Card style={{ padding: "10px", margin: "10px" }} key={order.id} className="p-6 border-0 shadow-xl bg-white dark:bg-slate-900 hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-md">ID: #{order.id}</span>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                  <h3 style={{ color: "white" }} className="text-xl font-black text-gray-900 dark:text-gray-100">{order.customer}</h3>
                  <p className="text-xs text-gray-500 font-medium">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-primary">{order.total}</p>
                </div>
              </div>

              <div className="py-4 border-y border-gray-100 dark:border-white/5 mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Items</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">
                  {order.items.join(", ")}
                </p>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Agent</p>
                  {order.deliveryAgent ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-sm font-black text-gray-700 dark:text-gray-200">{order.deliveryAgent}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Unassigned</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  style={{ color: "white", padding: "5px" }}
                  variant="outline"
                  onClick={() => {
                    setDetailsOrder(order);
                    setDetailsModalOpen(true);
                  }}
                  className="w-full text-xs font-black uppercase py-4 border-2"
                >
                  Details
                </Button>
                <Button
                  style={{ color: "white", padding: "5px" }}
                  variant={order.deliveryAgent ? "outline" : "primary"}
                  onClick={() => {
                    setSelectedOrder(order.id);
                    setAssignModalOpen(true);
                  }}
                  className="w-full text-xs font-black uppercase py-4 shadow-lg shadow-primary/10"
                  disabled={!!order.deliveryAgent || order.status === "delivered"}
                >
                  {order.deliveryAgent ? "Assigned" : "Assign Agent"}
                </Button>
              </div>
            </Card>
          ))}
        </div>


        {/* Assignment Modal */}
        {assignModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <Card style={{ padding: "10px" }} className="w-full max-w-md p-6 md:p-8 animate-scale-in">
              <h2 style={{ color: "white" }} className="text-2xl font-black mb-2 text-gray-900 dark:text-gray-100">Assign Agent</h2>
              <p className="text-gray-500 mb-8 text-sm">Select an agent for order <span className="text-primary font-bold">#{selectedOrder}</span></p>

              <div className="space-y-3 mb-8">
                {deliveryAgents.map((agent) => (
                  <button
                    style={{ color: "white", padding: "5px", margin: "5px" }}
                    key={agent.id}
                    onClick={() => handleAssign(selectedOrder!, agent.id, agent.name)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-primary  transition-all group"
                  >
                    <div className="text-left">
                      <div style={{ color: "white" }} className="font-bold text-gray-900 group-hover:text-primary transition-colors">{agent.name}</div>
                      <div className="text-xs text-gray-500">{agent.id} · Today: 3 deliveries</div>
                    </div>
                    <span className="text-gray-300 group-hover:text-primary transition-colors">→</span>
                  </button>
                ))}
              </div>

              <Button
                style={{ color: "white", padding: "5px", margin: "5px" }}
                variant="outline"
                className="w-full"
                onClick={() => setAssignModalOpen(false)}
              >
                Cancel
              </Button>
            </Card>
          </div>
        )}
        {/* Order Details Modal */}
        {detailsModalOpen && detailsOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <Card style={{ padding: "20px", maxWidth: "600px" }} className="w-full bg-slate-900 border-white/10 text-white shadow-2xl animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gradient">Order Details</h2>
                <button onClick={() => setDetailsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 mt-2">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Booking Ref</p>
                  <p className="font-black text-primary text-lg">#{detailsOrder.id}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                  <Badge variant={getStatusVariant(detailsOrder.status)} className="mt-1">{detailsOrder.status.toUpperCase()}</Badge>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Start Date</p>
                  <p className="font-bold text-gray-200">{detailsOrder.start_date || detailsOrder.date || "N/A"}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">End Date</p>
                  <p className="font-bold text-gray-200">{detailsOrder.end_date || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div style={{ padding: "5px", margin: "5px" }} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h3 style={{ color: "white" }} className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Payment Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Amount</span>
                      <span className="font-bold">{detailsOrder.total}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Amount Paid</span>
                      <span className="font-bold">₹{detailsOrder.paid_amount?.toLocaleString() || "0"}</span>
                    </div>
                    <div className="flex justify-between text-sm text-orange-400">
                      <span>Balance Due</span>
                      <span className="font-bold">₹{detailsOrder.balance_amount?.toLocaleString() || "0"}</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "5px", margin: "5px" }} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h3 style={{ color: "white" }} className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Order Items</h3>
                  <ul className="space-y-1">
                    {detailsOrder.items.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                        <span className="text-primary">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ padding: "5px", margin: "5px", borderRadius: "10px" }} className="pt-4 border-t border-white/5">
                <p style={{ color: "white" }} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Delivery Address</p>
                <p style={{ color: "white" }} className="text-sm text-gray-400 italic">
                  {detailsOrder.shipping_address?.street}, {detailsOrder.shipping_address?.city}, {detailsOrder.shipping_address?.zipcode}
                </p>
              </div>

              <Button
                style={{ color: "white", padding: "10px", marginTop: "30px" }}
                variant="primary"
                className="w-full font-black tracking-widest"
                onClick={() => setDetailsModalOpen(false)}
              >
                GOT IT
              </Button>
            </Card>
          </div>
        )}
    </div>
  );
}
