"use client";

import Navbar from "@/components/Navbar";
import CategoryCard from "@/components/CategoryCard";

export default function CategoriesPage() {
  const categories = [
    { name: "chairs", icon: "🪑" },
    { name: "tables", icon: "🪑" },
    { name: "cooling", icon: "❄️" },
    { name: "tents", icon: "⛺" },
    { name: "sound", icon: "🔊" },
    { name: "covers", icon: "✨" },
    { name: "stage", icon: "🎭" },
    { name: "lighting", icon: "💡" },
  ];

  return (
    <div>
      <Navbar />

      <main style={{margin:"20px",marginTop:"100px"}} >
        <h1 style={{color:"white", margin:"20px",textAlign:"center"}} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-5 text-gray-900 animate-fade-in-down">All Categories</h1>
        <p  style={{color:"white", margin:"20px",textAlign:"center"}} className="text-base md:text-lg text-gray-600 mb-8 md:mb-10 animate-fade-in-up">
          Browse our complete rental inventory by category
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {categories.map((cat, idx) => (
            <CategoryCard key={cat.name} name={cat.name} index={idx} />
          ))}
        </div>
      </main>
    </div>
  );
}