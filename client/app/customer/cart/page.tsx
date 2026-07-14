"use client";

import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRentalImage } from "@/lib/imageUtils";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getTotalPrice, toggleAddon } = useCart();
  const router = useRouter();

  const getItemDays = (item: { start_date?: string; end_date?: string }) => {
    if (!item.start_date || !item.end_date) return 1;
    const start = new Date(item.start_date);
    const end = new Date(item.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days < 1 ? 1 : days;
  };

  const getItemTotal = (item: any) => {
    const days = getItemDays(item);
    const productTotal = item.price_per_day * item.quantity * days;
    const addonsTotal = (item.selectedAddons || []).reduce(
      (acc: number, addon: any) => acc + addon.price * item.quantity * days,
      0
    );
    return productTotal + addonsTotal;
  };
  const deliveryFee = 500;
  const subtotal = Number(getTotalPrice());
  const taxRate = 0.18; // 18% GST
  const tax = subtotal * taxRate;
  const total = subtotal + tax + deliveryFee;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <main style={{marginTop:"100px"}} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <header className="mb-12">
          <h1 style={{color:"white"}} className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-center lg:text-left text-white">
            Your <span className="text-gradient">Cart</span>
          </h1>
          <p className="text-gray-500 font-medium text-center lg:text-left">Review your event essentials before we finalize the booking.</p>
        </header>

        {cart.length === 0 ? (
          <Card className="text-center py-24 flex flex-col items-center border-dashed border-2 border-slate-800 bg-slate-900/50">
            <span className="text-8xl mb-8 opacity-20">🛒</span>
            <p className="text-2xl font-black tracking-tight mb-8 text-gray-400">Your cart feels a bit light...</p>
            <Link href="/customer/home">
              <Button size="lg" className="px-12 py-5 rounded-2xl shadow-xl shadow-primary/20">
                Explore Items
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-6">
              {cart.map((item) => (
                <Card style={{margin:"10px"}} key={item.id} className="p-0 border-none bg-white dark:bg-slate-900 group overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-48 aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      <img 
                        src={getRentalImage(item)} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                    </div>
                    
                    <div style={{padding:"10px"}} className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 style={{color:"white"}} className="text-2xl font-black tracking-tight text-white">{item.title}</h3>
                          <button
                          style={{padding:"10px",color:"white"}}
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-500 hover:text-rose-500 transition-colors p-2 bg-slate-800 rounded-xl"
                          >
                            <span className="text-lg leading-none">✕</span>
                          </button>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">
                          {item.start_date || "TBD"} — {item.end_date || "TBD"} ({getItemDays(item)} days)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-end justify-between gap-6 mt-auto">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95 font-black text-white"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-black text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95 font-black text-white"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Item Subtotal</span>
                          <span className="text-2xl font-black tracking-tighter text-white">₹{getItemTotal(item).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Add-ons Section */}
                      {item.addons && item.addons.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-800">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Enhance your rental</p>
                          <div className="flex flex-wrap gap-2">
                            {item.addons.map((addon: any) => {
                              const isSelected = (item.selectedAddons || []).some((a: any) => a.id === addon.id);
                              return (
                                <button
                                  key={addon.id}
                                  onClick={() => toggleAddon(item.id, addon)}
                                  className={`text-[10px] px-4 py-2 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 font-bold ${
                                    isSelected 
                                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                      : "bg-transparent border-slate-800 text-slate-400 hover:border-slate-700"
                                  }`}
                                >
                                  <span>{isSelected ? "✓" : "+"}</span>
                                  <span>{addon.name}</span>
                                  <span className="opacity-60">₹{addon.price}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary Card */}
            <div className="lg:col-span-4 lg:sticky lg:top-36 h-fit">
              <Card style={{padding:"10px"}} className="p-8 border-none bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
                
                <h2 style={{color:"white"}} className="text-2xl font-black tracking-tight mb-8 relative z-10">Payment Summary</h2>
                
                <div className="space-y-4 mb-8 relative z-10">
                  <div className="flex justify-between text-slate-400 font-bold text-sm">
                    <span>Order Subtotal</span>
                    <span className="text-white">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-bold text-sm">
                    <span>GST (18%)</span>
                    <span className="text-white">₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-bold text-sm">
                    <span>Delivery & Setup</span>
                    <span className="text-white">₹{deliveryFee.toLocaleString()}</span>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-800 mt-6">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Total Amount</span>
                        <span className="text-xs text-slate-500 font-bold">Inc. all taxes</span>
                      </div>
                      <div className="text-4xl font-black tracking-tighter text-white">₹{total.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <Button
                  style={{color:"white",padding:"10px",margin:"10px"}}
                    size="xl"
                    className="w-full py-5 rounded-2xl shadow-2xl shadow-primary/30"
                    onClick={() => router.push("/customer/checkout")}
                  >
                    SECURE CHECKOUT
                  </Button>
                  
                  <Link href="/customer/home" className="block text-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all hover:tracking-[0.2em]">
                    ← Continue Shopping
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="mt-8 pt-8 border-t border-slate-800/50 flex justify-center gap-6 opacity-30 grayscale">
                  <span className="text-[10px] font-black uppercase tracking-widest">Secure Pay</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Insured</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">24/7 Support</span>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
