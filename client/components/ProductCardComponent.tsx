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

interface ProductCardProps {
  product: Product;
}

export default function ProductCardComponent({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const emoji = CATEGORY_EMOJI[product.category?.toLowerCase()] ?? "🎪";
  return (
    <Link href={`/customer/product/${product.id}`}>
      <Card hover className="cursor-pointer h-full">
        <div className="aspect-video relative overflow-hidden rounded-lg mb-4 flex items-center justify-center bg-gray-100">
          {product.image && !imgError ? (
            <img 
              src={product.image} 
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex flex-col items-center justify-center gap-2">
              <span className="text-4xl">{emoji}</span>
              <span className="text-xs text-purple-400 font-medium capitalize">{product.category}</span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold mb-2 text-gray-800">{product.title}</h3>
        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">
            ₹{product.price_per_day}
            <span className="text-sm text-gray-600">/day</span>
          </span>
          {product.available > 0 ? (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {product.available} left
            </span>
          ) : (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Out of stock
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
