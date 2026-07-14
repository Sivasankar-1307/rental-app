"use client";

import Navbar from "@/components/Navbar";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Link from "next/link";
import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

declare global {
  interface Window {
    jspdf: any;
  }
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("role");
      if (role === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else if (role === "DELIVERY") {
        window.location.href = "/delivery/dashboard";
      }
    }
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      const response = await api.get(`/orders?user_id=${userId}`);
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    
    setIsCancelling(true);
    try {
      await api.put(`/orders/${orderToCancel}/status`, { status: "cancelled" });
      setOrders(prev => prev.map(order => 
        order.id === orderToCancel ? { ...order, status: "cancelled", refund_status: "pending" } : order
      ));
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("Failed to cancel order. Please try again.");
    } finally {
      setIsCancelling(false);
      setIsCancelModalOpen(false);
      setOrderToCancel(null);
    }
  };

  const canCancel = (status: string, dateStr: string) => {
    // Rule 1: Only processing orders can be cancelled
    if (status !== "processing") return false;
    
    // Rule 2: Must be at least 24 hours before delivery
    // For this mock, we'll just check if it's processing
    // Real implementation would parse dateStr and compare with current date
    return true;
  };

  const generateInvoice = (order: any) => {
    const doc = new jsPDF() as any;
    const pageW = 210;
    const margin = 14;

    // Reset fonts and colors
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);

    // Header Right
    doc.setFontSize(10);
    doc.text("Tax Invoice/Bill of Supply/Cash Memo", pageW - margin, 15, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("(Original for Recipient)", pageW - margin, 19, { align: "right" });

    // Header Left - Logo/Brand
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RENTAFEST", margin, 18);
    
    doc.setLineWidth(0.2);
    doc.line(margin, 24, pageW - margin, 24);

    // Addresses Section
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Sold By:", margin, 30);
    doc.setFont("helvetica", "normal");
    doc.text("Rentafest Premium Rentals\n123 Party Street, Event Hub\nMetropolis - 110001\nIndia", margin, 35);

    // Billing / Shipping
    const shipX = 105;
    doc.setFont("helvetica", "bold");
    doc.text("Billing Address:", shipX, 30);
    doc.setFont("helvetica", "normal");
    doc.text(order.customer || "Valued Customer", shipX, 35);
    
    let addressLines: string[] = [];
    if (order.shipping_address) {
      const a = order.shipping_address;
      if (a.street) addressLines.push(a.street);
      addressLines.push(`${a.city || ""}, ${a.state || ""} - ${a.zipcode || ""}`);
    }
    
    let currentY = 39;
    addressLines.forEach((line: string) => {
      doc.text(line, shipX, currentY);
      currentY += 4;
    });
    doc.text(`Phone: ${order.phone || "N/A"}`, shipX, currentY);

    // Order Info
    doc.line(margin, 52, pageW - margin, 52);
    
    doc.setFont("helvetica", "bold");
    doc.text("Order Number:", margin, 58);
    doc.setFont("helvetica", "normal");
    doc.text(String(order.id), margin + 28, 58);

    doc.setFont("helvetica", "bold");
    doc.text("Order Date:", margin, 63);
    doc.setFont("helvetica", "normal");
    doc.text(order.date || "N/A", margin + 28, 63);

    doc.setFont("helvetica", "bold");
    doc.text("Invoice Date:", shipX, 58);
    doc.setFont("helvetica", "normal");
    const today = new Date().toLocaleDateString("en-IN");
    doc.text(today, shipX + 25, 58);

    doc.setFont("helvetica", "bold");
    doc.text("Payment Method:", shipX, 63);
    doc.setFont("helvetica", "normal");
    doc.text((order.payment_method || "N/A").toUpperCase(), shipX + 28, 63);

    // Calculate Days
    let noOfDays = 1;
    if (order.start_date && order.end_date) {
      // Dates from backend are in YYYY-MM-DD format
      const start = new Date(order.start_date);
      const end = new Date(order.end_date);
      const timeDiff = end.getTime() - start.getTime();
      if (!isNaN(timeDiff)) {
        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        noOfDays = days < 1 ? 1 : days;
      }
    }

    // Items Table
    const tableBody: any[] = [];
    let computedSubtotal = 0;

    if (order.products_details && Array.isArray(order.products_details)) {
      order.products_details.forEach((item: any, i: number) => {
        const price = parseFloat(item.price_per_day || item.price || 0);
        const qty = parseInt(item.quantity || 1);
        const itemTotal = price * noOfDays * qty;
        computedSubtotal += itemTotal;
        
        tableBody.push([
          i + 1,
          `${item.title || "Product"} (${noOfDays} days)`,
          qty.toString(),
          `Rs. ${price.toFixed(2)}`,
          `Rs. ${itemTotal.toFixed(2)}`
        ]);
      });
    } else {
      (order.items || []).forEach((item: string, i: number) => {
        tableBody.push([i + 1, item, "1", "—", "—"]);
      });
    }

    // We won't pre-calculate orderTotalNum here anymore since we need detailed breakdown
    
    autoTable(doc, {
      startY: 70,
      head: [["Sl. No", "Description", "Qty", "Unit Price", "Total Amount"]],
      body: tableBody,
      theme: "plain",
      styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0] },
      headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', lineWidth: 0.1, lineColor: [150, 150, 150] },
      bodyStyles: { lineWidth: 0.1, lineColor: [150, 150, 150] },
      columnStyles: { 
        0: { cellWidth: 12, halign: 'center' }, 
        1: { cellWidth: 'auto' }, 
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;

    // Calculations
    const savedTotal = parseFloat((order.total || "0").replace(/[^0-9.]/g, "") || "0");
    const lateFee = order.late_fee || 0;
    const damageFee = order.damage_fee || 0;
    const paidAmt = order.paid_amount || 0;
    const balAmt = order.balance_amount || 0;
    const securityDeposit = order.total_deposit || 0;

    let subtotalToPrint = computedSubtotal > 0 ? computedSubtotal : savedTotal;
    let taxAmount = 0;
    let deliveryFee = 0;
    let baseOrderTotal = subtotalToPrint;

    if (computedSubtotal > 0) {
      taxAmount = computedSubtotal * 0.18;
      if (savedTotal > 0) {
          deliveryFee = savedTotal - computedSubtotal - taxAmount - securityDeposit;
          if (deliveryFee < 0) deliveryFee = 0; // ensure no negative fee
      } else {
          deliveryFee = 500;
      }
      baseOrderTotal = savedTotal > 0 ? savedTotal : (computedSubtotal + taxAmount + deliveryFee + securityDeposit);
    }

    const grandTotal = baseOrderTotal + lateFee + damageFee;

    // Totals Section
    const totalsX = 130;
    const valX = pageW - margin;

    const printTotalLine = (label: string, val: string, y: number, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.text(label, totalsX, y);
        doc.text(val, valX, y, { align: "right" });
    };

    let curY = finalY;
    printTotalLine("Items Subtotal:", `Rs. ${subtotalToPrint.toFixed(2)}`, curY);
    curY += 5;
    
    if (taxAmount > 0) {
        printTotalLine("Tax (18% GST):", `Rs. ${taxAmount.toFixed(2)}`, curY);
        curY += 5;
    }
    if (deliveryFee > 0) {
        printTotalLine("Delivery & Logistics:", `Rs. ${deliveryFee.toFixed(2)}`, curY);
        curY += 5;
    }
    if (securityDeposit > 0) {
        printTotalLine("Security Deposit:", `Rs. ${securityDeposit.toFixed(2)}`, curY);
        curY += 5;
    }

    if (lateFee > 0) {
        printTotalLine("Late Return Fee:", `Rs. ${lateFee.toFixed(2)}`, curY);
        curY += 5;
    }
    if (damageFee > 0) {
        printTotalLine("Damage Fee:", `Rs. ${damageFee.toFixed(2)}`, curY);
        curY += 5;
    }

    doc.setLineWidth(0.2);
    doc.line(totalsX, curY + 1, valX, curY + 1);
    curY += 6;

    printTotalLine("Grand Total:", `Rs. ${grandTotal.toFixed(2)}`, curY, true);
    curY += 5;
    printTotalLine("Advance Paid:", `Rs. ${paidAmt.toFixed(2)}`, curY);
    curY += 5;
    printTotalLine("Balance Due:", `Rs. ${balAmt.toFixed(2)}`, curY, true);

    // Cancelled Watermark/Text
    if (order.status === "cancelled") {
      doc.setFontSize(12);
      doc.setTextColor(200, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("*** CANCELLED ORDER ***", margin, finalY + 10);
      doc.setTextColor(0, 0, 0); // reset
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      
      curY += 5;
      const refundStatus = order.refund_status || "none";
      const refundAmt = order.refund_amount || 0;
      doc.text(`Refund Status: ${refundStatus.toUpperCase()}`, totalsX, curY);
      if (refundAmt > 0) {
          curY += 4;
          doc.text(`Refund Amount: Rs. ${refundAmt.toFixed(2)}`, totalsX, curY);
      }
    }

    // Footer
    curY += 25;
    doc.setFont("helvetica", "bold");
    doc.text("For Rentafest Premium Rentals:", pageW - margin, curY, { align: "right" });
    
    curY += 15;
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signatory", pageW - margin, curY, { align: "right" });

    // Bottom line
    doc.setLineWidth(0.2);
    doc.line(margin, 280, pageW - margin, 280);
    doc.setFontSize(7);
    doc.text("This is a computer generated invoice and does not require a physical signature.", pageW / 2, 285, { align: "center" });

    doc.save(`Invoice_${order.id}.pdf`);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "info";
      case "confirmed":
        return "success";
      case "processing":
        return "info";
      case "in_progress":
      case "in_delivery":
      case "picked_up":
        return "warning";
      case "delivered":
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "info";
    }
  };

  const getStatusText = (status: string) => {
    if (status === "in_progress") return "In Progress";
    if (status === "in_delivery") return "In Delivery";
    if (status === "picked_up") return "Picked Up";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const displayOrders = orders.filter(order => {
    if (activeTab === "active") {
      return ["pending", "confirmed", "processing", "in_progress", "in_delivery", "assigned", "picked_up"].includes(order.status);
    } else {
      return ["delivered", "completed", "cancelled"].includes(order.status);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main style={{margin:"20px",marginTop:"100px"}}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in-down">
          <div>
            <h1 style={{margin:"5px"}}className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-gradient mb-4">
              Your Orders
            </h1>
            <p style={{margin:"5px"}} className="text-gray-500 dark:text-gray-400 text-lg max-w-xl">
              Track your current rentals and review your history with Rentafest.
            </p>
          </div>

          <div style={{margin:"15px"}} className="flex p-1.5 bg-gray-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto">
            <button
            style={{padding:"5px"}}
              onClick={() => setActiveTab("active")}
              className={`flex-1 md:px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeTab === "active"
                  ? "bg-white dark:bg-slate-700 text-primary shadow-lg scale-105"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Active Orders
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`flex-1 md:px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeTab === "past"
                  ? "bg-white dark:bg-slate-700 text-primary shadow-lg scale-105"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Past Orders
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing with database...</p>
          </div>
        ) : displayOrders.length > 0 ? (
          <div className="grid gap-6">
            {displayOrders.map((order, idx) => (
              <Card
                key={order.id}
                className="group overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s`,padding:"10px" }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-bold text-gray-400 tracking-widest uppercase">
                            OrderID
                          </span>
                          <h3 style={{color:"white"}} className="text-xl font-bold text-gray-900 dark:text-white">
                            #{order.id}
                          </h3>
                          <Badge variant={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                          {/* Refund badge for cancelled orders */}
                          {order.status === "cancelled" && order.refund_status && order.refund_status !== "none" && (
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 20,
                              color: order.refund_status === "processed" ? "#10b981" : order.refund_status === "approved" ? "#6366f1" : order.refund_status === "rejected" ? "#ef4444" : "#f59e0b",
                              background: order.refund_status === "processed" ? "rgba(16,185,129,0.12)" : order.refund_status === "approved" ? "rgba(99,102,241,0.12)" : order.refund_status === "rejected" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                              textTransform: "uppercase", letterSpacing: "0.08em"
                            }}>
                              💰 Refund: {order.refund_status}
                              {order.refund_amount > 0 ? ` · ₹${order.refund_amount.toLocaleString()}` : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          Placed on {order.date}
                        </p>
                      </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <span className="text-sm font-bold text-gray-400 tracking-widest uppercase text-left md:text-right">
                        Total Amount
                      </span>
                      <p className="text-2xl font-black text-primary">
                        {order.total}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1">
                      <h4 style={{color:"white",margin:"10px"}} className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Items
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item: string, i: number) => (
                          <span
                          style={{padding:"5px"}}
                            key={i}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg border border-gray-100 dark:border-slate-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {activeTab === "active" && canCancel(order.status, order.date) && (
                        <Button 
                          variant="danger" 
                          className="px-6 py-3"
                          onClick={() => {
                            setOrderToCancel(order.id);
                            setIsCancelModalOpen(true);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      
                      {order.status !== "cancelled" && (
                        <Link href={`/customer/order-tracking/${order.id}`}>
                          <Button style={{color:"white"}} className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-1 active:scale-95 transition-all">
                            {activeTab === "active" ? "Track Order" : "View Details"}
                          </Button>
                        </Link>
                      )}
                      
                      {activeTab === "past" && (
                        <Button 
                          style={{color:"white",padding:"5px"}} 
                          variant="outline" 
                          className="px-6 py-3 font-bold"
                          onClick={() => generateInvoice(order)}
                        >
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass-morphism rounded-3xl animate-fade-in">
            <span className="text-6xl mb-6 block">📦</span>
            <h2 className="text-2xl font-bold mb-2">No orders found</h2>
            <p className="text-gray-500 mb-8">You haven't placed any orders yet.</p>
            <Link href="/customer/category">
              <Button className="px-8 py-3">Explore Products</Button>
            </Link>
          </div>
        )}
      </main>

      <Modal 
        isOpen={isCancelModalOpen} 
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Order"
      >
        <div className="space-y-6">
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20">
            <p className="text-rose-600 dark:text-rose-400 font-medium">
              Are you sure you want to cancel order <span className="font-bold">#{orderToCancel}</span>?
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white">Cancellation Rules:</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">●</span>
                Orders can only be cancelled while in "Processing" status.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">●</span>
                Cancellation must be made at least 24 hours before the scheduled delivery.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">●</span>
                A full refund will be initiated to your original payment method.
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsCancelModalOpen(false)}
            >
              Go Back
            </Button>
            <Button 
              variant="danger" 
              className="flex-1"
              onClick={handleCancelOrder}
              loading={isCancelling}
            >
              Yes, Cancel Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
