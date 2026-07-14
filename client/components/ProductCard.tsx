"use client";
import Card from "./Card";
import { Product } from "@/types/product";
import Link from "next/link";
import { useState } from "react";

const CATEGORY_EMOJI: Record<string, string> = {
  chairs: "🪑",
  tables: "🪵",
  tents: "⛺",
  lighting: "💡",
  cooling: "❄️",
  sound: "🔊",
};

import { getRentalImage } from "@/lib/imageUtils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const emoji = CATEGORY_EMOJI[product.category?.toLowerCase()] ?? "🎪";
  const productImage = getRentalImage(product);
  
  return (
    <Link href={`/customer/product/${product.id}`} className="block h-full group">
      <Card className="h-full flex flex-col p-0 rounded-2xl md:rounded-3xl">
        <div className="relative aspect-square md:aspect-[4/3] overflow-hidden">
          {!imgError ? (
            <img 
              src={productImage} 
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-2">
              <span className="text-4xl md:text-6xl animate-float">{emoji}</span>
            </div>
          )}
          
          {/* Top Badge */}
          <div className="absolute top-2 left-2 md:top-4 md:left-4">
            <div className="glass-morphism px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary">
              {product.category}
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="p-3 md:p-6 flex flex-col flex-grow">
          <h3 style={{margin:"0 0 4px 0", color:"white"}} className="text-sm md:text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
            {product.title}
          </h3>
          <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 line-clamp-1 md:line-clamp-2 mb-3 md:mb-6 flex-grow">
            {product.description || "Premium quality equipment for your next big event."}
          </p>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
            <div>
              <span className="text-[8px] md:text-xs font-bold text-gray-400 uppercase tracking-tighter block">Per Day</span>
              <span style={{margin:"0", color:"white"}} className="text-lg md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                ₹{product.price_per_day}
              </span>
            </div>
            
            <div style={{color:"white", padding:"4px 8px", borderRadius:"8px"}} className={`w-full md:w-auto text-center md:px-4 md:py-2 md:rounded-xl text-[10px] md:text-xs font-black tracking-widest uppercase transition-all duration-300 ${
              product.available > 0 
                ? "bg-primary text-white md:bg-primary/10 md:text-primary md:group-hover:bg-primary md:group-hover:text-white shadow-lg shadow-primary/5" 
                : "bg-rose-100 text-rose-500"
            }`}>
              {product.available > 0 ? "Book" : "Out"}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
