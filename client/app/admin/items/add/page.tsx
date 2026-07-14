"use client";

import Card from "@/components/Card";
import Button from "@/components/Button";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AddItem() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "chairs",
    price_per_day: "",
    deposit: "",
    total_stock: "",
  });

  const IMAGE_MAPPING: Record<string, string> = {
    chairs: "https://5.imimg.com/data5/SELLER/Default/2024/11/467861647/HE/CT/RZ/73498673/plastic-armless-chair-500x500.jpg",
    tables: "https://www.ningbo.co.uk/wp-content/uploads/2024/12/iStock-1286138096.jpg",
    tents: "https://shadecraft.in/cdn/shop/files/WhatsAppImage2024-04-20at4.30.30PM_d8ac35d4-b0bc-4386-91f7-e1a8a25f286d_grande.jpg?v=1715946699",
    cooling: "https://tiimg.tistatic.com/fp/1/002/569/wedding-tent-446.jpg",
    lighting: "https://cartnow.in/cdn/shop/files/02_956ae887-cf24-40f4-ba28-729e82e8f779.jpg?crop=center&height=1106&v=1724748181&width=1383",
    sound: "https://www.dsppatech.com/storage/uploads/image/2023/04/28/PA%20Speaker.jpg",
    stage: "https://cdn0.hitched.co.uk/article/5493/3_2/1280/jpg/163945-burningfold.jpeg",
    covers: "https://m.media-amazon.com/images/I/81YnemBhxiL._AC_UF894,1000_QL80_.jpg",
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Automatic image assignment based on CATEGORY
      const detectedImage = IMAGE_MAPPING[form.category] || "https://images.unsplash.com/photo-1531050171651-648c7079446d?auto=format&fit=crop&q=80&w=1000";

      await api.post("/admin/products", {
        ...form,
        image: detectedImage,
        price_per_day: Number(form.price_per_day),
        available: Number(form.total_stock),
        deposit: Number(form.deposit || 0)
      });
      alert("Item Added Successfully");
      router.push("/admin/items");
    } catch (error) {
      alert("Error adding item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div  style={{padding:"20px"}}>


      <div>
        <Link href="/admin/items" className="mb-6 inline-block">
          <Button style={{ padding: "20px", margin: "10px" }} variant="secondary" size="sm" className="gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
          </Button>
        </Link>
        <h1 style={{ color: "white", margin: "5px" }} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 md:mb-10 text-gray-900">Add New Item</h1>

        <Card style={{ margin: "20px", padding: "15px" }}>
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ color: "white", margin: "5px", marginTop: "15px" }} className="block text-sm font-semibold mb-2 text-gray-900">
                  Item Name *
                </label>
                <input
                  style={{ color: "white", padding: "5px" }}
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter item name"
                  required
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-purple-600 text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label style={{ color: "white", margin: "5px", marginTop: "15px" }} className="block text-sm font-semibold mb-2 text-gray-900">
                  Category *
                </label>
                <select
                  style={{ color: "violet", padding: "5px" }}
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-purple-600 text-gray-900"
                >
                  <option value="chairs">Chairs</option>
                  <option value="tables">Tables</option>
                  <option value="tents">Tents</option>
                  <option value="lighting">Lighting</option>
                  <option value="sound">Sound</option>
                  <option value="cooling">Cooling</option>
                  <option value="covers">Covers</option>
                  <option value="stage">Stage</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ color: "white", margin: "5px", marginTop: "15px" }} className="block text-sm font-semibold mb-2 text-gray-900">
                Description
              </label>
              <textarea
                style={{ color: "white", padding: "5px" }}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter item description"
                rows={3}
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-purple-600 resize-none text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label style={{ color: "white", margin: "5px", marginTop: "15px" }} className="block text-sm font-semibold mb-2 text-gray-900">
                  Price Per Day ($) *
                </label>
                <input
                  style={{ color: "white", padding: "5px" }}
                  type="number"
                  name="price_per_day"
                  value={form.price_per_day}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-purple-600 text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label style={{ color: "white", margin: "5px", marginTop: "15px" }} className="block text-sm font-semibold mb-2 text-gray-900">
                  Deposit ($)
                </label>
                <input
                  style={{ color: "white", padding: "5px" }}
                  type="number"
                  name="deposit"
                  value={form.deposit}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-purple-600 text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label style={{ color: "white", margin: "5px", marginTop: "15px" }} className="block text-sm font-semibold mb-2 text-gray-900">
                  Total Stock *
                </label>
                <input
                  style={{ color: "white", padding: "5px" }}
                  type="number"
                  name="total_stock"
                  value={form.total_stock}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-purple-600 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                style={{ color: "white", margin: "10px", padding: "5px" }}
                size="lg"
                loading={isLoading}
                disabled={isLoading}
              >
                Add Item
              </Button>
              <Button
                style={{ color: "white", margin: "10px", padding: "5px" }}
                type="button"
                size="lg"
                variant="outline"
                onClick={() => router.push("/admin/items")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}