"use client";

import Card from "@/components/Card";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ALL_PRODUCTS } from "@/lib/mockData";
import { Product } from "@/types/product";
import { getRentalImage } from "@/lib/imageUtils";

export default function PricingPage() {
  const [products, setProducts] = useState<Product[]>(ALL_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingPrices, setEditingPrices] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const [deliveryFee, setDeliveryFee] = useState("50");
  const [minOrder, setMinOrder] = useState("500");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Try to fetch from real API, fallback to mock data if it fails
      const [prodRes, configRes] = await Promise.all([
        api.get("/admin/products").catch(() => ({ data: ALL_PRODUCTS })),
        api.get("/admin/config").catch(() => ({ data: { delivery_fee: 50, min_order: 500 } }))
      ]);

      if (prodRes.data && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }

      if (configRes.data) {
        setDeliveryFee(configRes.data.delivery_fee.toString());
        setMinOrder(configRes.data.min_order.toString());
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (id: number) => {
    const newPrice = editingPrices[id];
    if (newPrice === undefined) return;

    try {
      setSavingId(id);
      // In a real app, this would be a PUT/PATCH request to the backend
      // Using generic /products path as seen in common patterns
      await api.put(`/products/${id}`, { price_per_day: newPrice });

      // Update local state to reflect the change
      setProducts(prev => prev.map(p => p.id === id ? { ...p, price_per_day: newPrice } : p));

      // Clear editing state for this ID
      const newEditing = { ...editingPrices };
      delete newEditing[id];
      setEditingPrices(newEditing);

      // Visual feedback via alert (could be a toast)
      // alert(`Success: Price updated to ₹${newPrice}`);
    } catch (err) {
      console.error("Update failed:", err);
      // alert("Error: Failed to update price. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const saveGlobalSettings = async () => {
    try {
      setIsSavingSettings(true);
      await api.post("/admin/pricing", {
        delivery_fee: Number(deliveryFee),
        min_order: Number(minOrder),
      });
      alert("Success: Global settings updated!");
    } catch (err) {
      alert("Error: Failed to save global settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div  style={{padding:"20px"}}>
      <div  >
        <Link href="/admin/dashboard" className="mb-6 inline-block">
          <Button style={{ padding: "20px", margin: "10px" }} variant="secondary" size="sm" className="gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
          </Button>
        </Link>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 animate-fade-in-down">
          <div>
            <h1 style={{ color: "white", margin: "10px" }} className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
              Pricing <span className="text-gradient">Engine</span>
            </h1>
            <p style={{ margin: "10px" }} className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-2xl">
              Optimize your revenue with real-time price adjustments and logistics cost management.
            </p>
          </div>

          <div className="relative group w-full md:w-96">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
              <input
                style={{ padding: "10px" }}
                type="text"
                placeholder="Search products or categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-6 py-4 bg-white dark:bg-slate-900 border-0 rounded-2xl shadow-sm focus:ring-2 focus:ring-purple-500 transition-all text-slate-900 dark:text-white font-medium"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl grayscale group-hover:grayscale-0 transition-all">🔍</span>
            </div>
          </div>
        </div>

        {/* Categories Quick Filter? (Could add here) */}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, idx) => (
            <Card
              key={product.id}
              className="group animate-fade-in-up flex flex-col border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={getRentalImage(product)}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                  <p className="text-white text-xs font-bold uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-transform">
                    Ready for optimization
                  </p>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="primary" className="backdrop-blur-xl bg-white/20 text-black border border-white/30 px-4 py-1.5 uppercase tracking-widest italic">
                    {product.category}
                  </Badge>
                </div>
              </div>

              <div style={{ padding: "15px" }} className="p-8 flex-1 flex flex-col">
                <h3 style={{ color: "white", margin: "5px" }} className="text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>

                <div className="space-y-6 mt-auto">
                  <div style={{ padding: "5px", margin: "5px" }} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Price</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">₹{product.price_per_day}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                      ✓
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label style={{ marginTop: "10px", margin: "5px", color: "white" }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjustment Factor</label>
                      {editingPrices[product.id] && (
                        <span className={`text-[10px] font-black uppercase ${editingPrices[product.id] > product.price_per_day ? "text-rose-500" : "text-emerald-500"}`}>
                          {editingPrices[product.id] > product.price_per_day ? "+" : "-"}
                          {Math.abs(((editingPrices[product.id] - product.price_per_day) / product.price_per_day) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input
                          style={{ color: "white", padding: "5px", paddingLeft: "30px" }}
                          type="number"
                          placeholder="00.00"
                          value={editingPrices[product.id] ?? ""}
                          onChange={(e) => setEditingPrices({ ...editingPrices, [product.id]: Number(e.target.value) })}
                          className="w-full pl-8 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 rounded-2xl outline-none transition-all text-slate-900 dark:text-white font-black text-lg"
                        />
                      </div>
                      <Button
                        style={{ color: "white", padding: "5px" }}
                        onClick={() => updatePrice(product.id)}
                        loading={savingId === product.id}
                        disabled={editingPrices[product.id] === undefined || editingPrices[product.id] === product.price_per_day}
                        className={`px-8 rounded-2xl group`}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in">
            <span className="text-6xl mb-6 block">🔎</span>
            <h3 style={{ color: "white" }} className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">No products found</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Try adjusting your search query or check the category.</p>
            <Button style={{ color: "white", padding: "5px", margin: "10px" }} variant="outline" className="mt-8 mx-auto" onClick={() => setSearch("")}>Reset Search</Button>
          </div>
        )}

        {/* Global Settings Section */}
        <div className="mt-32 mb-20 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-[24px] shadow-2xl shadow-purple-500/30 flex items-center justify-center text-white text-3xl">⚙️</div>
            <div>
              <h2 style={{ color: "white", margin: "20px" }} className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">System Configuration</h2>
              <p style={{ color: "white", margin: "10px" }} className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Global logistics & threshold parameters</p>
            </div>
          </div>

          <Card style={{ margin: "15px", padding: "10px" }} className="p-12 bg-slate-950 text-white rounded-[48px] overflow-hidden relative border-0 shadow-3xl">
            {/* Abstract Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary opacity-10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary opacity-10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-end">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label style={{ color: "white", margin: "5px" }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Delivery Fee</label>
                  <span style={{ padding: "5px", margin: "5px" }} className="text-[10px] font-black text-white px-2 py-0.5 bg-white/10 rounded-full italic">FLAT RATE</span>
                </div>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-white/30 group-focus-within:text-primary transition-colors">₹</span>
                  <input
                    style={{ color: "white", padding: "5px", paddingLeft: "40px" }}
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-full pl-12 pr-6 py-6 bg-white/5 border-2 border-white/10 focus:border-primary rounded-[28px] outline-none transition-all text-white font-black text-3xl"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label style={{ color: "white", margin: "5px" }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Order Threshold</label>
                  <span style={{ padding: "5px", margin: "5px" }} className="text-[10px] font-black text-white px-2 py-0.5 bg-white/10 rounded-full italic">FREE SHIP CAP</span>
                </div>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-white/30 group-focus-within:text-primary transition-colors">₹</span>
                  <input
                    style={{ color: "white", padding: "5px", paddingLeft: "40px" }}
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full pl-12 pr-6 py-6 bg-white/5 border-2 border-white/10 focus:border-primary rounded-[28px] outline-none transition-all text-white font-black text-3xl"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="xl"
                onClick={saveGlobalSettings}
                loading={isSavingSettings}
                className="h-[84px] rounded-[28px] bg-white text-slate-900 hover:bg-white transition-all font-black text-lg group w-full"
              >
                {isSavingSettings ? "Syncing..." : "DEPLOY PARAMETERS"}
                <span className="ml-2 group-hover:translate-x-2 transition-transform inline-block">🚀</span>
              </Button>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Sync Status: Operational</p>
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Last updated: Just now</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}