"use client";

import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Link from "next/link";
import { use } from "react";
import { useCart } from "@/context/CartContext";
import { CartItem } from "@/types/product";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function BookingConfirmationPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const id = params.id;
  const { currentBooking } = useCart();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentBooking) {
      setBooking(currentBooking);
      setLoading(false);
    } else {
      // Fetch from API if context is empty (e.g. refresh)
      api.get(`/orders/${id}`)
        .then(res => {
          const b = res.data;
          setBooking({
            id: b.booking_reference,
            status: b.status,
            created_at: b.created_at,
            products: b.products_details || [],
            start_date: b.start_date,
            end_date: b.end_date,
            total_price: b.total_price,
            contact_person: b.contact_person,
            phone: b.phone,
            shipping_address: b.shipping_address,
            paid_amount: b.paid_amount,
            balance_amount: b.balance_amount,
            deposit_option: b.deposit_option,
            delivery_otp: b.delivery_otp // Real OTP from backend
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id, currentBooking]);

  // Helper to calculate days between two date strings (inclusive)
  const getDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days < 1 ? 1 : days;
  };

  // Per-item total: price_per_day × quantity × days
  const getItemTotal = (item: CartItem): number => {
    const days = item.start_date && item.end_date
      ? getDays(item.start_date, item.end_date)
      : 1;
    return item.price_per_day * item.quantity * days;
  };

  // Helper to format date to DD/MM/YY
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center">
        <h1 className="text-4xl font-black mb-4">Booking Not Found</h1>
        <p className="text-gray-400 mb-8">We couldn't find a booking with ID: {id}</p>
        <Link href="/customer/category">
          <Button size="lg">Return to Catalog</Button>
        </Link>
      </div>
    );
  }

  const subtotal = booking.products.reduce(
    (sum: number, item: any) => sum + getItemTotal(item as CartItem),
    0
  );
  
  // Use fixed fee if mock, or calculate based on checkout logic
  const deliveryFee = subtotal > 0 ? (subtotal > 10000 ? 1000 : 500) : 0;
  const tax = subtotal * 0.18; // 18% GST
  const securityDeposit = booking.total_price > (subtotal + tax + deliveryFee) 
    ? (booking.total_price - (subtotal + tax + deliveryFee)) 
    : Math.max(1000, Math.round(subtotal * 0.2));
  
  const paidAmount = (booking as any).paid_amount || (subtotal + tax + deliveryFee + securityDeposit);
  const balanceAmount = (booking as any).balance_amount || 0;
  const depositOption = (booking as any).deposit_option || 'online';

  return (
    <div>
      <Navbar />

      <main style={{margin:"10px", padding:"10px"}}>
        {/* Success Message */}
        <div style={{margin:"10px",marginTop:"100px", padding:"10px", color:"white"}} className="text-center mb-12 md:mb-14 animate-fade-in-down">
          <div style={{color:"white"}} className="text-7xl md:text-8xl lg:text-9xl mb-6 md:mb-8 animate-bounce-slow">✓</div>
          <h1 style={{color:"white"}} className="text-3xl md:text-4xl lg:text-5xl font-bold text-green-600 mb-4 md:mb-5">
            Booking Confirmed!
          </h1>
          <p style={{color:"white"}} className="text-lg md:text-xl text-gray-900 font-medium">
            Thank you for your order. Your event rental is confirmed.<br/>
            <span className="text-sm text-gray-500 mt-2 block">A confirmation has been sent to your <strong>WhatsApp, Email, and SMS</strong>.</span>
          </p>
        </div>

        {/* Booking Details */}
        <Card style={{margin:"10px", padding:"15px"}} className="mb-6 md:mb-8 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 pb-6 md:pb-8 border-b-2">
            <div className="hover:scale-105 transition-transform duration-300">
              <p className="text-gray-700 text-xs md:text-sm font-semibold uppercase tracking-wide mb-2">Booking ID</p>
              <p style={{color:"white",margin:"5px"}} className="text-xl md:text-2xl font-bold text-gray-900 break-all">{booking.id}</p>
            </div>
            <div className="hover:scale-105 transition-transform duration-300">
              <p className="text-gray-700 text-xs md:text-sm font-semibold uppercase tracking-wide mb-2">Status</p>
              <Badge variant="success">Confirmed</Badge>
            </div>
            <div className="hover:scale-105 transition-transform duration-300">
              <p className="text-gray-700 text-xs md:text-sm font-semibold uppercase tracking-wide mb-2">Booked On</p>
              <p style={{color:"white",margin:"5px"}} className="font-semibold text-gray-900 text-lg">
                {formatDate(booking.created_at)}
              </p>
            </div>
            {(booking as any).delivery_otp && (
              <div style={{margin:"10px"}} className="col-span-1 sm:col-span-2 md:col-span-3 mt-4 p-6 bg-primary/10 rounded-3xl border-2 border-primary/20 animate-pulse-slow">
                <div style={{padding:"10px"}} className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 style={{color:"white"}} className="text-primary font-black text-xl mb-2 flex items-center gap-2">
                      <span>🚚</span> Delivery Verification OTP
                    </h3>
                    <p className="text-gray-400 text-sm">Please share this code with the delivery person only when you receive your items.</p>
                  </div>
                  <div className="bg-primary text-white text-5xl font-black px-10 py-4 rounded-2xl tracking-[0.2em] shadow-xl shadow-primary/30">
                    {(booking as any).delivery_otp}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rental Period + Delivery Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 py-6 md:py-8 border-b-2">
            <div className="animate-fade-in-left">
              <h3 style={{color:"white",margin:"5px"}} className="font-bold text-xl md:text-2xl mb-6 text-gray-900 uppercase tracking-wide">
                Rental Dates
              </h3>
              <div className="space-y-4 md:space-y-5">
                <div className=" p-2 rounded-lg transition-colors duration-300">
                  <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide mb-2">Start Date</p>
                  <p style={{color:"white",margin:"5px"}} className="text-lg md:text-xl font-semibold text-gray-900">
                    {formatDate(booking.start_date)}
                  </p>
                </div>
                <div className=" p-2 rounded-lg transition-colors duration-300">
                  <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide mb-2">End Date</p>
                  <p style={{color:"white",margin:"5px"}} className="text-lg md:text-xl font-semibold text-gray-900">
                    {formatDate(booking.end_date)}
                  </p>
                </div>
                {booking.start_date && booking.end_date && (
                  <div className="p-2 rounded-lg transition-colors duration-300">
                    <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide mb-2">Duration</p>
                    <p style={{color:"white",margin:"5px"}} className="text-lg md:text-xl font-semibold text-gray-900">
                      {getDays(booking.start_date, booking.end_date)} days
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="animate-fade-in-right">
              <h3 style={{color:"white",margin:"5px"}} className="font-bold text-xl md:text-2xl mb-6 text-gray-900 uppercase tracking-wide">
                Delivery Address
              </h3>
              <div className="space-y-2 p-3 rounded-lg transition-colors duration-300">
                {booking.contact_person && (
                  <p style={{color:"white",margin:"5px"}} className="font-semibold text-lg text-gray-900">{booking.contact_person}</p>
                )}
                {booking.phone && (
                  <p style={{color:"white",margin:"5px"}} className="text-purple-600 font-semibold text-lg">{booking.phone}</p>
                )}
                {booking.shipping_address?.street && (
                  <p style={{color:"white",margin:"5px"}} className="text-gray-900">{booking.shipping_address.street}</p>
                )}
                {booking.shipping_address?.city && (
                  <p style={{color:"white",margin:"5px"}} className="text-gray-900">
                    {booking.shipping_address.city}, {booking.shipping_address.state}{" "}
                    {booking.shipping_address.zipcode}
                  </p>
                )}
                {booking.shipping_address?.country && (
                  <p style={{color:"white"}} className="text-gray-900">{booking.shipping_address.country}</p>
                )}
              </div>
            </div>
          </div>

          {/* Rented Items */}
          {booking.products.length > 0 && (
            <div className="py-6 md:py-8 border-b-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <h3 style={{color:"white",margin:"5px"}} className="font-bold text-xl md:text-2xl mb-6 text-gray-900 uppercase tracking-wide">
                Rented Items
              </h3>
              <div className="space-y-3 md:space-y-4">
                {booking.products.map((product: any, idx: number) => {
                  const item = product as CartItem;
                  const itemDays = item.start_date && item.end_date
                    ? getDays(item.start_date, item.end_date)
                    : (booking.start_date && booking.end_date ? getDays(booking.start_date, booking.end_date) : 1);
                  const itemTotal = item.price_per_day * item.quantity * itemDays;

                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-lg animate-fade-in-up hover:bg-purple-50 transition-colors duration-300"
                      style={{ animationDelay: `₹{idx * 0.1}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {(item as any).image ? (
                            <img src={(item as any).image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🎪</div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{item.title}</p>
                          <p className="text-gray-500 text-sm mt-1">
                            ₹{item.price_per_day}/day × {item.quantity} unit{item.quantity !== 1 ? "s" : ""} × {itemDays} day{itemDays !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-900 text-xl">
                        ₹{itemTotal.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing Summary */}
          <div className="py-6 md:py-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex justify-between mb-3 text-gray-900 text-base md:text-lg hover:text-purple-600 transition-colors duration-300">
              <span style={{color:"white",padding:"5px"}} className="font-medium">Subtotal</span>
              <span style={{color:"white",padding:"5px"}} className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-3 text-gray-900 text-base md:text-lg hover:text-purple-600 transition-colors duration-300">
              <span style={{color:"white",padding:"5px"}} className="font-medium">Delivery Fee</span>
              <span style={{color:"white",padding:"5px"}} className="font-semibold">₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-3 text-gray-900 text-base md:text-lg hover:text-purple-600 transition-colors duration-300">
              <span style={{color:"white",padding:"5px"}} className="font-medium">Taxes (18% GST)</span>
              <span style={{color:"white",padding:"5px"}} className="font-semibold">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-5 text-green-600 text-base md:text-lg hover:text-green-700 transition-colors duration-300">
              <span style={{padding:"5px"}} className="font-medium">Security Deposit ({depositOption === 'online' ? 'Paid' : 'To be paid'})</span>
              <span style={{padding:"5px"}} className="font-semibold">₹{securityDeposit.toFixed(2)}</span>
            </div>
            
            <div className="space-y-4 pt-6 border-t-2">
              <div className="flex justify-between text-xl md:text-2xl font-bold text-primary">
                <span>Amount Paid Now</span>
                <span>₹{paidAmount.toFixed(2)}</span>
              </div>
              {balanceAmount > 0 && (
                <div className="flex justify-between text-lg font-bold text-gray-400">
                  <span>Balance to be Paid</span>
                  <span>₹{balanceAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8 md:mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s",margin:"10px",padding:"10px" }}>
          <h3 style={{color:"white",margin:"5px"}} className="font-bold text-xl md:text-2xl mb-7 md:mb-8 text-gray-900 uppercase tracking-wide">Next Steps</h3>
          <div className="space-y-5 md:space-y-6">
            {[
              { step: 1, title: "Confirmation", desc: "You'll receive a confirmation SMS shortly with all details" },
              { step: 2, title: "Delivery Arrangement", desc: "Our team will call you to confirm delivery time and location" },
              { step: 3, title: "Setup & Event", desc: "Enjoy your event with our quality rental items" },
              { step: 4, title: "Pickup", desc: "We'll collect the items as per the agreed schedule" },
            ].map(({ step, title, desc }, idx) => (
              <div key={step} className="flex gap-4 animate-fade-in-left hover:scale-105 transition-transform duration-300" style={{ animationDelay: `₹{0.3 + idx * 0.1}s` }}>
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  {step}
                </div>
                <div>
                  <p style={{color:"white"}} className="font-semibold text-gray-900 text-lg">{title}</p>
                  <p className="text-gray-700 text-base mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up" style={{ margin:"10px",padding:"10px",animationDelay: "0.7s" }}>
          <Link href={`/customer/order-tracking/${booking.id}`} className="flex-1">
            <Button size="lg" className="w-full hover:scale-105">
              Track Order
            </Button>
          </Link>
          <Link href="/customer/category" className="flex-1">
            <Button size="lg" variant="secondary" className="w-full hover:scale-105">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
