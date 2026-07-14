"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";
import { api } from "@/lib/api";
import Card from "@/components/Card";
import Link from "next/link";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredResults, setFilteredResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/admin/products")
      .then((res) => {
        const mappedItems: Product[] = res.data.map((p: any) => ({
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
        
        if (query) {
          const lowerQuery = query.toLowerCase();
          const results = mappedItems.filter(p => 
            p.title.toLowerCase().includes(lowerQuery) || 
            p.category.toLowerCase().includes(lowerQuery)
          );
          setFilteredResults(results);
        } else {
          setFilteredResults([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Search fetch failed", err);
        setLoading(false);
      });
  }, [query]);

  return (
    <main style={{ margin: "20px", marginTop: "100px" }} className="min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-[1px] w-12 bg-primary" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Search Results</span>
          </div>
          <h1 style={{color: "white"}} className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Results for "{query}"
          </h1>
          <p style={{margin:"10px",marginBottom: "30px"}}  className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            {filteredResults.length} items found matching your search
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-black tracking-widest uppercase text-xs">Searching Inventory...</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredResults.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/30 rounded-[2.5rem] border border-white/5 p-20 text-center flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="text-7xl mb-8">🔍</div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">No Matches Found</h2>
            <p className="text-slate-400 font-medium mb-10 max-w-md">
              We couldn't find any products or categories matching "{query}". Try checking your spelling or use more general terms.
            </p>
            <Link 
              href="/customer/category" 
              className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black tracking-widest uppercase text-xs border border-white/10 transition-all"
            >
              Browse All Categories
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <div className="bg-slate-950 min-h-screen text-white">
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
