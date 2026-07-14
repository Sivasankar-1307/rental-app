"use client";

import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";
import { useState, useEffect, use } from "react";
import Card from "@/components/Card";
import { CATEGORY_DATA } from "@/lib/mockData";
import { api } from "@/lib/api";

export default function CategoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ category: string }>;
}) {
  const params = use(paramsPromise);
  const category = params.category;
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState("price-low");
  const [maxPrice, setMaxPrice] = useState(500);

  useEffect(() => {
    api.get("/products").then(res => {
      const allProducts = res.data;
      const filteredByCategory = allProducts.filter((p: any) => p.category.toLowerCase() === category.toLowerCase());
      
      // Merge Mock for visuals if needed or just use real
      setProducts(filteredByCategory);
      filterAndSort(filteredByCategory, sortBy, maxPrice);
    }).catch(err => {
      console.error("API Fetch failed, falling back to mock:", err);
      const mockProducts = CATEGORY_DATA[category.toLowerCase()] || [];
      setProducts(mockProducts);
      filterAndSort(mockProducts, sortBy, maxPrice);
    });
  }, [category]);

  const filterAndSort = (
    items: Product[],
    sort: string,
    price: number
  ) => {
    let filtered = items.filter((p) => p.price_per_day <= price);

    if (sort === "price-low") {
      filtered.sort((a, b) => a.price_per_day - b.price_per_day);
    } else if (sort === "price-high") {
      filtered.sort((a, b) => b.price_per_day - a.price_per_day);
    } else if (sort === "rating") {
      filtered.sort((a, b) => (b.ratings || 0) - (a.ratings || 0));
    }

    setFilteredProducts(filtered);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
    filterAndSort(products, value, maxPrice);
  };

  const handlePriceChange = (value: number) => {
    setMaxPrice(value);
    filterAndSort(products, sortBy, value);
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <main style={{margin:"20px",marginTop:"100px"}}>
        <header style={{marginLeft:"auto",marginRight:"auto"}} className="mb-16">
          <div className="flex items-center gap-4 mb-4">
             <div style={{textAlign:"center"}} className="h-[1px] w-12 bg-primary" />
             <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Collections</span>
          </div>
          <h1 style={{color:"white",margin:"10px"}} className="text-5xl md:text-7xl font-black tracking-tighter capitalize mb-4">
            {category}
          </h1>
          <p style={{margin:"10px"}} className="text-gray-500 font-medium">
            Discover {filteredProducts.length} premium essentials for your {category} setup.
          </p>
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-3">
            <Card style={{padding:"10px",margin:"10px"}}>
              <h3 style={{color:"white"}} className="text-xl font-black tracking-tight mb-8">Refine Search</h3>

              {/* Price Filter */}
              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <label style={{color:"white"}} className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Price Range
                  </label>
                  <span style={{color:"white"}} className="text-sm font-black text-primary">Up to ${maxPrice}</span>
                </div>
                <input
                style={{margin:"5px"}}
                  type="range"
                  min="10"
                  max="1000"
                  value={maxPrice}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Sort Options */}
              <div className="mb-8">
                <label style={{color:"white"}} className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Sort Order
                </label>
                <select
                  style={{color:"white",padding:"5px",margin:"5px"}}
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated First</option>
                </select>
              </div>
            </Card>
          </aside>

          {/* Products Grid */}
          <div style={{marginBottom:"50px"}} className="lg:col-span-9">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProducts.map((product, idx) => (
                  <ProductCard key={product.id} product={product} index={idx} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-24 flex flex-col items-center justify-center border-dashed border-2">
                <span className="text-6xl mb-6">🔍</span>
                <p className="text-xl font-bold text-gray-400">
                  No matches found for your criteria
                </p>
                <button 
                style={{color:"white",margin:"5px",border:"1px solid white",padding:"5px",borderRadius:"10px"}}
                  onClick={() => handlePriceChange(500)}
                  className="mt-6 text-primary font-bold hover:underline"
                >
                  Reset Filters
                </button>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
