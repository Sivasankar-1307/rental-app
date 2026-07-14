"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import Card from "@/components/Card";
import { Product } from "@/types/product";
import { api } from "@/lib/api";
import Chatbot from "@/components/Chatbot";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "ADMIN") {
      window.location.href = "/admin/dashboard";
      return;
    }
    if (role === "DELIVERY") {
      window.location.href = "/delivery/dashboard";
      return;
    }

    api.get("/admin/products").then((res) => {
      const mappedItems = res.data.map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price_per_day: p.price_per_day,
        available: p.available,
        ratings: p.ratings || 4.5,
        reviews: p.reviews || 120,
        image: p.image,
        description: p.description
      }));
      setProducts(mappedItems);
      setTrendingProducts(mappedItems.slice(0, 10));
    }).catch(err => console.error(err));

    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(slideInterval);
  }, []);

  const categories = [
    { name: "Chairs", icon: "🪑", path: "/customer/category/chairs" },
    { name: "Tables", icon: "🪵", path: "/customer/category/tables" },
    { name: "Tents", icon: "⛺", path: "/customer/category/tents" },
    { name: "Sound", icon: "🔊", path: "/customer/category/sound" },
    { name: "Lighting", icon: "💡", path: "/customer/category/lighting" },
    { name: "Cooling", icon: "❄️", path: "/customer/category/cooling" },
    { name: "Stage", icon: "🏛️", path: "/customer/category/stage" },
    { name: "Bundles", icon: "🎁", path: "/customer/checkout?bundle=all" },
  ];

  const banners = [
    {
      id: 1,
      title: "Premium Event Rentals",
      subtitle: "Elevate your celebration with our elite gear.",
      bgColor: "bg-gradient-to-r from-blue-900/40 to-indigo-900/40",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Wedding Season Special",
      subtitle: "Get up to 20% off on bulk furniture orders.",
      bgColor: "bg-gradient-to-r from-rose-900/40 to-pink-900/40",
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Pro Audio & Lighting",
      subtitle: "Concert quality equipment for your next party.",
      bgColor: "bg-gradient-to-r from-purple-900/40 to-violet-900/40",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop"
    }
  ];

  return (
    <div className="bg-slate-950 min-h-screen text-white">
      <Navbar />

      <main style={{margin:"20px", marginTop:"100px"}}>
        {/* Flipkart-Style Category Bar (Dark Theme) */}
        <div style={{padding:"10px",margin:"10px",borderRadius:"15px"}} className="bg-slate-900/50 backdrop-blur-md border-b border-white/5 mb-4 md:mb-6 px-2 md:px-0">
          <div className="max-w-[1440px] mx-auto px-4 md:px-12 flex items-center justify-between overflow-x-auto no-scrollbar py-4 gap-8 md:gap-0">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.path}
                className="flex flex-col items-center gap-2 group min-w-fit px-4"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-300">
                  {cat.icon}
                </div>
                <span className="text-[10px] md:text-sm font-bold text-slate-400 group-hover:text-primary transition-colors whitespace-nowrap">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Hero Carousel */}
        <div className="max-w-[1440px] mx-auto px-2 md:px-6 mb-8 md:mb-10">
          <div className="relative h-[180px] md:h-[450px] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-1000 flex items-center ${
                  index === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                } ${banner.bgColor}`}
              >
                <div className="absolute inset-0">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover mix-blend-overlay opacity-60"
                  />
                </div>
                <div style={{padding:"10px"}} className="relative z-20 px-8 md:px-24 max-w-3xl">
                  <h2 style={{color:"white"}} className="text-4xl md:text-7xl font-black text-white mb-4 leading-tight tracking-tighter drop-shadow-2xl">
                    {banner.title}
                  </h2>
                  <p className="text-slate-200 text-lg md:text-2xl font-medium drop-shadow-md mb-8 max-w-xl">
                    {banner.subtitle}
                  </p>
                  <Link
                  style={{padding:"10px",borderRadius:"20px",margin:"20px",border:"1px solid white"}}
                    href="/customer/category"
                    className="inline-block px-10 py-4 bg-primary text-white rounded-2xl font-black tracking-widest uppercase text-sm hover:shadow-2xl hover:shadow-primary/40 transition-all hover:-translate-y-1 active:scale-95"
                  >
                    Explore Now
                  </Link>
                </div>
              </div>
            ))}
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === activeSlide ? "bg-primary w-12" : "bg-white/20 w-4 hover:bg-white/40"
                  }`}
                  style={{color:"white"}}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Featured Sections */}
        <div style={{margin:"20px"}} className="max-w-[1440px] mx-auto px-4 md:px-6 space-y-10">
          
          {/* Trending Row */}
          <section className="bg-slate-900/30 rounded-3xl md:rounded-[2.5rem] border border-white/5 overflow-hidden backdrop-blur-sm mx-2 md:mx-0">
            <div style={{padding:"15px"}} className="p-4 md:p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h2 style={{color:"white"}} className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter">Premium Essentials</h2>
                <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Top booked gear</p>
              </div>
              <Link style={{padding:"5px"}} href="/customer/category" className="px-4 py-2 md:px-8 md:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg md:rounded-xl font-black text-[10px] md:text-xs tracking-widest transition-all">
                VIEW ALL
              </Link>
            </div>
            <div style={{margin:"10px"}} className="p-4 md:p-10 overflow-x-auto no-scrollbar flex gap-4 md:gap-8 pb-6 md:pb-12">
              {trendingProducts.map((product) => (
                <div key={product.id} className="min-w-[160px] md:min-w-[320px]">
                  <ProductCard product={product} />
                </div>
              ))}
              {trendingProducts.length === 0 && (
                 <div className="w-full text-center py-20 text-slate-500 font-black tracking-widest animate-pulse">SYNCING INVENTORY...</div>
              )}
            </div>
          </section>

          {/* Banner Strip */}
          <div style={{margin:"10px"}} className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="h-56 md:h-72 rounded-[2rem] bg-indigo-600 overflow-hidden relative group cursor-pointer shadow-2xl border border-white/10">
                <img src="https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
                <div style={{padding:"10px"}} className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-transparent to-transparent">
                  <h3 style={{color:"white"}} className="text-3xl font-black text-white tracking-tighter mb-2">Corporate</h3>
                  <p className="text-white/60 text-xs font-black uppercase tracking-widest">Elite setups for major events</p>
                </div>
             </div>
             <div className="h-56 md:h-72 rounded-[2rem] bg-rose-600 overflow-hidden relative group cursor-pointer shadow-2xl border border-white/10">
                <img src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
                <div style={{padding:"10px"}} className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-transparent to-transparent">
                  <h3 style={{color:"white"}} className="text-3xl font-black text-white tracking-tighter mb-2">Concert Sound</h3>
                  <p className="text-white/60 text-xs font-black uppercase tracking-widest">Stage & Audio packages</p>
                </div>
             </div>
             <div className="h-56 md:h-72 rounded-[2rem] bg-emerald-600 overflow-hidden relative group cursor-pointer shadow-2xl border border-white/10">
                <img src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
                <div style={{padding:"10px"}} className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-transparent to-transparent">
                  <h3 style={{color:"white"}} className="text-3xl font-black text-white tracking-tighter mb-2">Weddings</h3>
                  <p style={{color:"white"}} className="text-white/60 text-xs font-black uppercase tracking-widest">Designer tents & seating</p>
                </div>
             </div>
          </div>

         

          {/* All Products Section (Flipkart Style Grid) */}
          <section style={{margin:"10px",marginTop:"20px",padding:"15px"}} className="bg-slate-900/30 rounded-3xl md:rounded-[2.5rem] border border-white/5 p-4 md:p-12 backdrop-blur-sm mx-2 md:mx-0">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4 px-2">
                <div>
                  <h2 style={{color:"white"}} className="text-xl md:text-4xl font-black text-white uppercase tracking-tighter">Marketplace</h2>
                  <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Elite gear inventory</p>
                </div>
                <div className="flex gap-4">
                   <div style={{padding:"5px"}} className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-slate-300">
                     Showing {products.length} Items
                   </div>
                </div>
             </div>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
                {products.map((product, idx) => (
                  <ProductCard key={product.id} product={product} />
                ))}
             </div>
             {products.length === 0 && (
                <div className="text-center py-20">
                   <div className="text-6xl mb-4 animate-bounce">📦</div>
                   <p className="text-slate-500 font-black tracking-widest uppercase">Stocking up our warehouse...</p>
                </div>
             )}
          </section>

          {/* Trust Banner */}
          <div style={{padding:"10px"}} className="bg-slate-900/50 p-6 md:p-12 rounded-3xl md:rounded-[3rem] border border-white/5 backdrop-blur-md mx-2 md:mx-0">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
                <div className="flex flex-col items-center text-center gap-2 md:gap-4 group">
                  <div className="text-3xl md:text-5xl group-hover:scale-110 transition-transform">🛡️</div>
                  <div>
                    <h4 style={{color:"white"}} className="font-black text-white text-[10px] md:text-sm uppercase tracking-tight">Protected</h4>
                    <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Secure Billing</p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-2 md:gap-4 group">
                  <div className="text-3xl md:text-5xl group-hover:scale-110 transition-transform">🚚</div>
                  <div>
                    <h4 style={{color:"white"}} className="font-black text-white text-[10px] md:text-sm uppercase tracking-tight">Express</h4>
                    <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Swift Logistics</p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-2 md:gap-4 group">
                  <div className="text-3xl md:text-5xl group-hover:scale-110 transition-transform">⭐</div>
                  <div>
                    <h4 style={{color:"white"}} className="font-black text-white text-[10px] md:text-sm uppercase tracking-tight">Premium</h4>
                    <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Best in Class</p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-2 md:gap-4 group">
                  <div className="text-3xl md:text-5xl group-hover:scale-110 transition-transform">💬</div>
                  <div>
                    <h4 style={{color:"white"}} className="font-black text-white text-[10px] md:text-sm uppercase tracking-tight">Support</h4>
                    <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">24/7 Response</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Dark Footer */}
      <footer style={{padding:"10px"}} className="bg-slate-950 pt-12 md:pt-24 pb-8 md:pb-12 border-t border-white/5 px-4">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-16 mb-12 md:mb-20">
          <div className="col-span-1 space-y-6 md:space-y-8">
             <Link href="/" className="text-3xl md:text-4xl font-black tracking-tighter text-white block">RENTAFEST</Link>
             <p className="text-slate-500 text-sm leading-relaxed font-medium">
               The standard in modern event equipment rentals. Making your moments memorable with elite gear and seamless logistics.
             </p>
             <div style={{padding:"10px"}} className="flex gap-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer">f</div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer">t</div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer">i</div>
             </div>
          </div>
          
          <div className="space-y-8">
            <h4 style={{color:"white"}} className="text-slate-600 font-black uppercase text-xs tracking-[0.3em]">Directory</h4>
            <ul className="space-y-4">
              <li><Link href="/customer/category" className="text-slate-400 text-sm font-bold hover:text-white transition-colors">Marketplace</Link></li>
              {/* <li><Link href="/customer/checkout?bundle=all" className="text-slate-400 text-sm font-bold hover:text-white transition-colors">Event Bundles</Link></li> */}
              <li><Link href="/customer/category/furniture" className="text-slate-400 text-sm font-bold hover:text-white transition-colors">Furniture</Link></li>
              <li><Link href="/customer/category/sound" className="text-slate-400 text-sm font-bold hover:text-white transition-colors">AV Systems</Link></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 style={{color:"white"}} className="text-slate-600 font-black uppercase text-xs tracking-[0.3em]">Account</h4>
            <ul className="space-y-4">
              <li><Link href="/customer/profile" className="text-slate-400 text-sm font-bold hover:text-white transition-colors">Profile Info</Link></li>
              <li><Link href="/customer/orders" className="text-slate-400 text-sm font-bold hover:text-white transition-colors">Order History</Link></li>
              <li><Link href="/customer/cart" className="text-slate-400 text-sm font-bold hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link href="#" className="text-slate-400 text-sm font-bold hover:text-white transition-colors">Support Desk</Link></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 style={{color:"white"}} className="text-slate-600 font-black uppercase text-xs tracking-[0.3em]">Direct</h4>
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                 <span className="text-primary text-xl">📍</span>
                 <p className="text-slate-400 text-sm font-bold">123 Event St, Rental City</p>
               </div>
               <div className="flex items-center gap-4">
                 <span className="text-primary text-xl">📞</span>
                 <p className="text-slate-400 text-sm font-bold">+91 70102 86162</p>
               </div>
               <div className="flex items-center gap-4">
                 <span className="text-primary text-xl">📧</span>
                 <p className="text-slate-400 text-sm font-bold">support@rentafest.com</p>
               </div>
            </div>
          </div>
        </div>
        <div style={{padding:"10px"}} className="max-w-[1440px] mx-auto px-6 pt-12 border-t border-white/5 text-center">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
            © 2024 RENTAFEST PRIVATE LIMITED • ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>

      <Chatbot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        withToggle={true}
        onOpen={() => setIsChatOpen(true)}
      />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
