"use client";

import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ALL_PRODUCTS } from "@/lib/mockData";
import { api } from "@/lib/api";
import { getRentalImage } from "@/lib/imageUtils";

export default function ProductPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (val: string) => {
    const today = getTodayDateString();
    if (val && val < today) {
      setStartDate(today);
      if (endDate && endDate < today) {
        setEndDate(today);
      }
    } else {
      setStartDate(val);
      if (endDate && val && endDate < val) {
        setEndDate(val);
      }
    }
  };

  const handleEndDateChange = (val: string) => {
    const today = getTodayDateString();
    const minDate = startDate || today;
    if (val && val < minDate) {
      setEndDate(minDate);
    } else {
      setEndDate(val);
    }
  };
  const [isAdded, setIsAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const fetchProduct = async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    try {
      const res = await api.get(`/products/${id}`);
      const data = res.data;
      const currentProduct = {
        ...data,
        specs: data.specs || [
          "Professional grade quality",
          "Event-ready maintenance",
          "Delivery and setup available",
          "Bulk order discounts",
          "Weather-resistant design",
          "Premium materials and finish"
        ]
      };
      setProduct(currentProduct);
      
      // Fetch related products only on first load
      if (isFirstLoad) {
        api.get("/products").then(allRes => {
          const all = allRes.data;
          const related = all
            .filter((p: any) => p.category === currentProduct.category && p.id !== currentProduct.id)
            .slice(0, 4);
          setRelatedProducts(related);
        });
      }
    } catch (err) {
      console.error("Failed to fetch product from API:", err);
      // Fallback for mock data if API fails and we haven't loaded any product yet
      if (!product && isFirstLoad) {
        const mockProduct = ALL_PRODUCTS.find(p => p.id === Number(id));
        if (mockProduct) {
          setProduct({
            ...mockProduct,
            specs: [
              "Professional grade quality",
              "Event-ready maintenance",
              "Delivery and setup available",
              "Bulk order discounts",
              "Weather-resistant design",
              "Premium materials and finish"
            ]
          });
        }
      }
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct(true);
    
    // Implement real-time updates from database using polling
    const pollInterval = setInterval(() => {
      fetchProduct(false);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">Loading premium gear...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-3xl font-black text-white mb-4">Gear Not Found</h2>
        <Button onClick={() => router.push("/customer/category/tables")}>Back to Category</Button>
      </div>
    </div>
  );

  const handleAddToCart = () => {
    if (!product) return;
    if (!startDate || !endDate) {
      alert("Please select dates");
      return;
    }

    const today = getTodayDateString();
    if (startDate < today) {
      alert("Start date cannot be in the past");
      return;
    }
    if (endDate < startDate) {
      alert("End date cannot be before start date");
      return;
    }

    addToCart(product, quantity, startDate, endDate);
    setIsAdded(true);
    setShowModal(true);

    // Reset "Added" state after 3 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 3000);
  };

  const handleBookNow = () => {
    if (!product) return;
    if (!startDate || !endDate) {
      alert("Please select dates");
      return;
    }

    const today = getTodayDateString();
    if (startDate < today) {
      alert("Start date cannot be in the past");
      return;
    }
    if (endDate < startDate) {
      alert("End date cannot be before start date");
      return;
    }

    addToCart(product, quantity, startDate, endDate);
    router.push("/customer/checkout");
  };

  const handleQuantityChange = (change: number) => {
    const newQty = quantity + change;
    if (newQty > 0 && newQty <= product.available) {
      setQuantity(newQty);
    }
  };

  return (
    <div>
      <Navbar />

      <main style={{padding:"10px",margin:"20px",marginTop:"100px"}}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Product Image */}
          <div className="relative overflow-hidden rounded-lg md:rounded-2xl aspect-square bg-gray-100 flex items-center justify-center animate-scale-in">
            <img 
              src={getRentalImage(product)} 
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-6 animate-fade-in-down" style={{animationDelay: "0.1s"}}>
              <h1 style={{color:"white",margin:"5px"}}className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
                {product.title}
              </h1>
              <p style={{color:"white",margin:"5px"}} className="text-lg md:text-xl text-gray-900 mb-5">{product.description}</p>

              <div className="flex gap-4 items-center mb-6">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-lg animate-bounce-slow">★</span>
                  <span style={{color:"white",margin:"5px"}} className="font-bold text-gray-900">{product.ratings}</span>
                  <span style={{color:"white",margin:"5px"}} className="text-gray-700 text-sm">
                    ({product.reviews} reviews)
                  </span>
                </div>
                {product.available > 0 ? (
                  <Badge variant="success">In Stock</Badge>
                ) : (
                  <Badge variant="danger">Out of Stock</Badge>
                )}
              </div>
            </div>

            {/* Pricing */}
            <Card className="mb-6 animate-fade-in-up" style={{animationDelay: "0.2s",padding:"15px",margin:"10px"}}>
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    ₹{product.price_per_day}
                    <span style={{color:"white"}} className="text-lg text-gray-700 font-normal"> /day</span>
                  </div>
                  <p style={{color:"white",margin:"5px"}}className="text-gray-700">
                    {product.available} items available for rent
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-400">⏱</span>
                    <span style={{color: "white"}}>Min. Rental: <strong>{product.min_rental_days || 1} Days</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-400">🛡️</span>
                    <span style={{color: "white"}}>Security Deposit: <strong>₹{product.deposit_amount || 0}</strong></span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Date Selection */}
            <Card className="mb-6 animate-fade-in-up" style={{animationDelay: "0.3s",padding:"15px",margin:"10px"}}>
              <h3 style={{color:"white",margin:"5px"}} className="font-bold text-lg mb-4">Select Rental Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={{color:"white",margin:"5px"}} className="block text-sm font-semibold mb-2">
                    Start Date
                  </label>
                  <input
                    style={{color:"white",margin:"5px"}}
                    type="date"
                    value={startDate}
                    min={getTodayDateString()}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all duration-300 text-slate-900"
                  />
                </div>
                <div>
                  <label style={{color:"white",margin:"5px"}} className="block text-sm font-semibold mb-2">
                    End Date
                  </label>
                  <input
                    style={{color:"white",margin:"5px"}}
                    type="date"
                    value={endDate}
                    min={startDate || getTodayDateString()}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300 transition-all duration-300 text-slate-900"
                  />
                </div>
              </div>
            </Card>

            {/* Quantity Selection */}
            <Card className="mb-6 animate-fade-in-up" style={{animationDelay: "0.4s",padding:"15px",margin:"10px"}}>
              <h3 style={{color:"white"}} className="font-bold text-lg mb-4">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                style={{color:"white",padding:"5px"}}
                  onClick={() => handleQuantityChange(-1)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  −
                </button>
                <span style={{color:"white"}} className="text-2xl font-bold w-12 text-center">
                  {quantity}
                </span>
                <button
                style={{color:"white",padding:"5px"}}
                  onClick={() => handleQuantityChange(1)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  +
                </button>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4 mt-8 px-2 md:px-0">
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                style={{padding:"15px"}}
                onClick={handleAddToCart}
                disabled={!startDate || !endDate}
              >
                {isAdded ? "✓ Added to Cart" : "Add to Cart"}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                style={{padding:"15px"}}
                onClick={handleBookNow}
                disabled={!startDate || !endDate}
              >
                Book Now
              </Button>
            </div>

            {/* Success Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Success">
              <div className="text-center py-4">
                <div className="mb-4 text-green-500 text-5xl flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Added to Cart!</h3>
                <p className="text-gray-600 mb-6">{product.title} has been added successfully.</p>
                <div className="flex flex-col gap-3">
                  <Button className="w-full" onClick={() => router.push("/customer/cart")}>Go to Cart</Button>
                  <Button variant="outline" className="w-full" onClick={() => setShowModal(false)}>Continue Shopping</Button>
                </div>
              </div>
            </Modal>
          </div>
        </div>

        {/* Specifications */}
        <Card className="mb-8 animate-fade-in-up" style={{animationDelay: "0.3s",padding:"15px",margin:"10px"}}>
          <h2 style={{color:"white",margin:"5px"}} className="text-2xl font-bold mb-6 text-gray-900">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.specs?.map((spec, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-gray-50/5 rounded-lg animate-fade-in-left hover:bg-purple-50/10 transition-colors duration-300" style={{animationDelay: `${idx * 0.1}s`}}>
                <span style={{margin:"5px"}} className="text-purple-600 text-xl">✓</span>
                <span style={{margin:"5px", color:"#ccc"}} className="text-gray-300">{spec}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Reviews Section */}
        <Card className="animate-fade-in-up" style={{animationDelay: "0.4s",padding:"15px",margin:"10px",marginBottom:"50px"}}>
          <h2 style={{color:"white",margin:"5px"}} className="text-2xl font-bold mb-6 text-gray-900">
            Customer Reviews
          </h2>
          <div className="space-y-4">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="pb-4 border-b border-white/10 last:border-b-0 animate-fade-in-up p-3 rounded-lg transition-colors duration-300" style={{animationDelay: `${idx * 0.1}s`}}>
                <div style={{padding:"10px"}} className="flex justify-between items-start mb-2">
                  <h4 style={{color:"white",margin:"5px"}} className="font-bold text-gray-200">Customer {idx}</h4>
                  <span className="text-yellow-400 animate-bounce-slow">★★★★★</span>
                </div>
                <p style={{color:"#888"}} className="text-gray-400">
                  Excellent quality product. Perfect for our event. Quick
                  delivery and professional team.
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 mb-20">
            <h2 style={{color:"white"}} className="text-2xl font-bold mb-8 text-gray-900 px-4">Related Gear</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
              {relatedProducts.map((relatedP) => (
                <div 
                  key={relatedP.id} 
                  onClick={() => {
                    router.push(`/customer/product/${relatedP.id}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group cursor-pointer bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-500"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img 
                      src={getRentalImage(relatedP)} 
                      alt={relatedP.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant="success">₹{relatedP.price_per_day}/day</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 style={{color:"white"}} className="font-bold group-hover:text-purple-400 transition-colors uppercase text-sm tracking-wider">
                      {relatedP.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
