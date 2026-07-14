"use client";

import Card from "@/components/Card";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Modal from "@/components/Modal";

export default function ItemsPage() {
  const [items, setItems] = useState([
    {
      id: 1,
      title: "Party Tent 20x20",
      category: "tents",
      price: 200,
      stock: 5,
      rating: 4.8,
      rentals: 45,
    },
    {
      id: 2,
      title: "Folding Chairs",
      category: "chairs",
      price: 50,
      stock: 120,
      rating: 4.6,
      rentals: 320,
    },
    {
      id: 3,
      title: "LED Lighting System",
      category: "lighting",
      price: 150,
      stock: 8,
      rating: 4.9,
      rentals: 78,
    },
    {
      id: 4,
      title: "Sound System Package",
      category: "sound",
      price: 180,
      stock: 6,
      rating: 4.7,
      rentals: 92,
    },
  ]);

  const fetchProducts = () => {
    api.get("/admin/products").then((res) => {
      const mappedItems = res.data.map((p: any) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price_per_day,
        stock: p.available,
        rating: p.ratings || 0,
        rentals: p.reviews || 0
      }));
      if (mappedItems.length > 0) setItems(mappedItems);
    }).catch(err => console.error("Failed to load products:", err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ title: "", price: 0, stock: 0 });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setEditFormData({ title: item.title, price: item.price, stock: item.stock });
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    try {
      await api.put(`/admin/products/${editingItem.id}`, {
        title: editFormData.title,
        price_per_day: editFormData.price,
        available: editFormData.stock
      });
      setItems(prev => prev.map(item =>
        item.id === editingItem.id ? { ...item, ...editFormData } : item
      ));
      setIsEditModalOpen(false);
      alert("Item updated successfully.");
    } catch (error) {
      alert("Failed to update item.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;

    try {
      await api.delete(`/admin/products/${id}`);
      setItems(prev => prev.filter(item => item.id !== id));
      alert("Item deleted successfully.");
    } catch (error) {
      alert("Failed to delete item.");
    }
  };

  return (
    <div  style={{padding:"20px"}}>
        <Link href="/admin/dashboard" className="mb-6 inline-block">
          <Button style={{ padding: "20px", margin: "10px" }} variant="secondary" size="sm" className="gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
          </Button>
        </Link>
        <div className="flex justify-between items-center mb-8 md:mb-12">
          <h1 style={{ color: "white", margin: "5px" }} className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">Manage Items</h1>
          <Link href="/admin/items/add">
            <Button style={{ padding: "10px" }}>+ Add New Item</Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <Card style={{ margin: "20px", padding: "15px" }}>
            <table className="w-full">
              <thead style={{ padding: "5px", borderRadius: "10px" }} className="bg-gray-50 border-b-2">
                <tr>
                  <th style={{ padding: "5px" }} className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                    Item Name
                  </th>
                  <th style={{ padding: "5px" }} className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                    Price/Day
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                    Total Rentals
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b ">
                    <td style={{ color: "white" }} className="px-4 py-3 text-sm font-bold text-gray-900">
                      {item.title}
                    </td>
                    <td style={{ textTransform: "uppercase" }} className="px-4 py-3 text-sm">

                      {item.category}

                    </td>
                    <td style={{ color: "white" }} className="px-4 py-3 text-sm font-bold text-gray-900">
                      ${item.price}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge
                        variant={item.stock > 5 ? "success" : "warning"}
                      >
                        {item.stock} units
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-yellow-400 font-semibold">★</span>
                      <span style={{ color: "white" }} className="text-gray-900 font-semibold ml-1">{item.rating}</span>
                    </td>
                    <td style={{ color: "white" }} className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {item.rentals}
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <Button
                        style={{ padding: "3px", margin: "5px", color: "white" }}
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        style={{ padding: "3px", margin: "5px" }}
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Item Details"
      >
        <div className="space-y-6 p-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Product Title</label>
            <input
              style={{ padding: "5px", margin: "5px", color: "white" }}
              type="text"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-xl p-4 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Price Per Day ($)</label>
              <input
                style={{ padding: "5px", margin: "5px", color: "white" }}
                type="number"
                value={editFormData.price}
                onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-xl p-4 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Available Stock</label>
              <input
                style={{ padding: "5px", margin: "5px", color: "white" }}
                type="number"
                value={editFormData.stock}
                onChange={(e) => setEditFormData({ ...editFormData, stock: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary rounded-xl p-4 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button style={{ padding: "5px", margin: "5px" }} variant="outline" className="flex-1 font-bold" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button style={{ padding: "5px", margin: "5px" }} className="flex-1 font-bold shadow-lg shadow-primary/30" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}