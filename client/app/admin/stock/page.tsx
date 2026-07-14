"use client";

import Card from "@/components/Card";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Modal from "@/components/Modal";

interface InventoryItem {
  id: number;
  title: string;
  sku: string;
  total: number;
  available: number;
  damaged: number;
  reserved: number;
  holds: number;
  category: string;
}

export default function StockPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnQty, setReturnQty] = useState(0);
  const [damagedQty, setDamagedQty] = useState(0);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get("/admin/inventory");
        setItems(res.data);
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
    const interval = setInterval(fetchInventory, 5000); // 5s refresh
    return () => clearInterval(interval);
  }, []);

  const handleReturnToStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsReturnModalOpen(true);
    setReturnQty(0);
    setDamagedQty(0);
  };

  const processReturn = () => {
    if (!selectedItem) return;

    setItems(prev => prev.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          reserved: Math.max(0, item.reserved - returnQty),
          damaged: item.damaged + damagedQty
        };
      }
      return item;
    }));

    setIsReturnModalOpen(false);
    setSelectedItem(null);
  };

  const handleShowDetails = async (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/inventory/${item.id}/details`);
      setDetailsData(res.data);
    } catch (err) {
      console.error("Failed to fetch details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div style={{padding:"20px"}}>
      <div>
        <Link href="/admin/dashboard" className="mb-6 inline-block">
          <Button style={{ padding: "20px", margin: "10px" }} variant="secondary" size="sm" className="gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-fade-in-down">
          <div>
            <h1 style={{ margin: "10px" }} className="text-4xl md:text-5xl font-black text-gradient mb-4">Inventory Control</h1>
            <p style={{ margin: "10px" }} className="text-slate-500 font-medium max-w-xl">
              Track stock levels by SKU, manage damaged buckets, and handle return-to-stock workflows.
            </p>
          </div>
          <div className="flex gap-4">
            <div style={{ padding: "10px" }} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center min-w-[120px]">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
              <p className="text-2xl font-black text-primary">{items.reduce((sum, i) => sum + i.total, 0)}</p>
            </div>
            <div style={{ padding: "10px" }} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center min-w-[120px]">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Damaged</p>
              <p className="text-2xl font-black text-rose-500">{items.reduce((sum, i) => sum + i.damaged, 0)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {items.map((item, idx) => (
            <Card
              key={item.id}
              className="group overflow-hidden border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.05}s`, padding: "10px" }}
            >
              <div className="p-6 md:p-8 flex flex-col lg:flex-row items-center gap-8">
                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
                      SKU: {item.sku}
                    </span>
                  </div>
                  <h3 style={{ color: "white" }} className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>

                {/* Buckets */}
                <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                  <div className="text-center min-w-[80px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-lg font-black text-slate-700 dark:text-slate-300">{item.total}</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Damaged</p>
                    <p className={`text-lg font-black ${item.damaged > 0 ? "text-rose-500" : "text-slate-400"}`}>
                      {item.damaged}
                    </p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">In Use</p>
                    <p className="text-lg font-black text-amber-500">{item.reserved}</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Holds</p>
                    <p className="text-lg font-black text-indigo-500">{item.holds}</p>
                  </div>
                  <div className="text-center min-w-[80px] px-6 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Available</p>
                    <p className="text-xl font-black text-emerald-600">{item.available}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    style={{ color: "white", padding: "5px" }}
                    variant="outline"
                    size="sm"
                    className="font-bold border-2"
                    onClick={() => handleReturnToStock(item)}
                  >
                    Return Items
                  </Button>
                  <Button
                    style={{ color: "white", padding: "5px" }}
                    size="sm"
                    className="font-bold"
                    onClick={() => handleShowDetails(item)}
                  >
                    Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Return to Stock Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Return to Stock Workflow"
      >
        <div className="space-y-6 p-2">
          <div style={{ padding: "10px" }} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Selected Item</p>
            <h4 style={{ color: "white" }} className="text-lg font-black text-slate-900 dark:text-white">{selectedItem?.title}</h4>
            <p className="text-sm text-slate-500">Currently {selectedItem?.reserved} units out on rental</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Returned Qty</label>
              <input
                style={{ padding: "5px", margin: "5px", color: "white" }}
                type="number"
                value={returnQty}
                onChange={(e) => setReturnQty(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-xl p-4 transition-all"
                max={selectedItem?.reserved || 0}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Damaged Qty</label>
              <input
                style={{ padding: "5px", margin: "5px" }}
                type="number"
                value={damagedQty}
                onChange={(e) => setDamagedQty(Number(e.target.value))}
                className="w-full bg-rose-50 dark:bg-rose-900/10 border-2 border-transparent focus:border-rose-500 rounded-xl p-4 transition-all text-rose-600"
              />
            </div>
          </div>

          <div style={{ padding: "10px", margin: "5px" }} className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/50">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium italic">
              * Units remaining in original rental (Reserved): {(selectedItem?.reserved || 0) - returnQty}
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium italic">
              * Units becoming Available: {returnQty - damagedQty}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button style={{ padding: "5px", margin: "5px" }} variant="outline" className="flex-1 font-bold" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button style={{ padding: "5px", margin: "5px" }} className="flex-1 font-bold shadow-lg shadow-primary/30" onClick={processReturn}>
              Confirm Return
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Stock Allocation Details"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {loadingDetails ? (
            <div className="py-12 text-center animate-pulse">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Scanning Booking Records...</p>
            </div>
          ) : detailsData && detailsData.bookings.length > 0 ? (
            <div style={{padding:"10px"}} className="space-y-4">
               {detailsData.bookings.map((booking: any, i: number) => (
                 <div key={i} style={{padding:"10px", margin:"5px"}} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{booking.status.replace("_", " ")}</p>
                        <h4 style={{color:"white"}} className="text-lg font-black">{booking.customer}</h4>
                      </div>
                      <Link href={`/admin/orders`} className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors">
                        REF: {booking.booking_ref}
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 py-3 border-t border-slate-50 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantity</p>
                        <p className="text-xl font-black">{booking.quantity} Units</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Return Due</p>
                        <p className="text-sm font-black text-amber-500">{booking.end_date}</p>
                      </div>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-slate-500 font-bold">No active allocations found for this item.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}