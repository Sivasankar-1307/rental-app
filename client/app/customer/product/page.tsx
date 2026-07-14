"use client";

import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";
import { useState, useEffect } from "react";

import { ALL_PRODUCTS } from "@/lib/mockData";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(ALL_PRODUCTS);
  }, []);

  return (
    <div>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-gray-900">All Products</h1>
        <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-10">
          Browse our complete rental catalog
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  );
}