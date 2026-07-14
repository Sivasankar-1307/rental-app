const { Router } = require("express");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
const { prisma, broadcastMessage } = require("../index");

const twilio = require("twilio");
const nodemailer = require("nodemailer");

const communication_service = {
  send_booking_confirmation: async (phone, email, booking_ref, total_price, delivery_otp) => {
    console.log(`[COMMUNICATION] Sending Booking ${booking_ref} confirmations...`);
    
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_WHATSAPP_NUMBER, SMTP_USER, SMTP_PASS } = process.env;
    
    const messageBody = `Your RentaFest booking is confirmed! \nRef: ${booking_ref}\nTotal: ₹${total_price}\nDelivery OTP: ${delivery_otp}\nKeep this OTP safe to receive your items.`;
    
    let normalised = phone ? phone.trim() : "";
    if (normalised && !normalised.startsWith("+")) {
      normalised = "+91" + normalised;
    }

    // 1. Twilio SMS & WhatsApp
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && normalised) {
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      
      // SMS
      if (TWILIO_PHONE_NUMBER) {
        try {
          const sms = await client.messages.create({
            body: messageBody,
            from: TWILIO_PHONE_NUMBER,
            to: normalised,
          });
          console.log(`[SUCCESS] Booking SMS sent. SID: ${sms.sid}`);
        } catch (error) {
          console.log(`[ERROR] Booking SMS failed:`, error.message);
        }
      }

      // WhatsApp
      if (TWILIO_WHATSAPP_NUMBER) {
        try {
          const whatsapp = await client.messages.create({
            body: messageBody,
            from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${normalised}`,
          });
          console.log(`[SUCCESS] Booking WhatsApp sent. SID: ${whatsapp.sid}`);
        } catch (error) {
          console.log(`[ERROR] Booking WhatsApp failed:`, error.message);
        }
      } else {
        console.log(`[INFO] WhatsApp skipped: TWILIO_WHATSAPP_NUMBER not in .env`);
      }
    }

    // 2. Email (Nodemailer)
    if (email && SMTP_USER && SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail', // Adjust if using another provider (e.g. Hostinger, AWS SES)
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"RentaFest" <${SMTP_USER}>`,
          to: email,
          subject: `Booking Confirmed: ${booking_ref}`,
          text: messageBody,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #4F46E5;">Booking Confirmed!</h2>
              <p>Thank you for choosing RentaFest. Your order has been successfully placed.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Booking Reference:</strong> ${booking_ref}</p>
                <p><strong>Total Amount:</strong> ₹${total_price}</p>
                <p style="font-size: 18px; color: #b91c1c;"><strong>Delivery OTP: ${delivery_otp}</strong></p>
              </div>
              <p>Please provide the Delivery OTP to our agent when they arrive.</p>
              <br/>
              <p>Best regards,<br/>The RentaFest Team</p>
            </div>
          `
        });
        console.log(`[SUCCESS] Booking Email sent to ${email}`);
      } catch (error) {
        console.log(`[ERROR] Booking Email failed:`, error.message);
      }
    } else {
      console.log(`[INFO] Email skipped: SMTP_USER/SMTP_PASS not in .env, or email missing.`);
    }
  }
};

const router = Router();
const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || ""
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const ref = `BOOK-${uuidv4().substring(0, 8).toUpperCase()}`;
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    let startDate = data.start_date ? new Date(data.start_date) : null;
    let endDate = data.end_date ? new Date(data.end_date) : null;

    const booking = await prisma.bookings.create({
      data: {
        booking_reference: ref,
        products_details: data.products,
        total_price: data.total_price,
        shipping_address: data.shipping_address,
        contact_person: data.contact_person,
        phone: data.phone,
        email: data.email,
        special_requirements: data.special_requirements,
        status: data.status || "pending",
        start_date: startDate,
        end_date: endDate,
        user_id: data.user_id,
        payment_method: data.payment_method,
        deposit_option: data.deposit_option,
        paid_amount: data.paid_amount,
        balance_amount: data.balance_amount,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_signature: data.razorpay_signature,
        delivery_otp: deliveryOtp,
        total_deposit: data.total_deposit || 0.0
      }
    });

    for (const item of data.products) {
      const pId = item.id;
      const qty = item.quantity || 0;
      if (pId && qty > 0) {
        const prod = await prisma.products.findUnique({ where: { id: pId } });
        if (prod) {
          await prisma.products.update({
            where: { id: pId },
            data: {
              stock_holds: (prod.stock_holds || 0) + qty,
              available: Math.max(0, (prod.available || 0) - qty)
            }
          });
        }
      }
    }

    try {
      broadcastMessage({
        type: "NEW_ORDER",
        order_id: ref,
        customer: data.contact_person,
        total: data.total_price
      });
    } catch (e) {
      console.log(`WebSocket broadcast failed: ${e}`);
    }

    await communication_service.send_booking_confirmation(
      booking.phone, booking.email, booking.booking_reference, booking.total_price, deliveryOtp
    );

    res.json({
      message: "Order placed successfully",
      booking_reference: ref,
      booking: ref,
      delivery_otp: deliveryOtp
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post("/razorpay-order", async (req, res) => {
  try {
    const { amount } = req.body;
    const amountPaise = Math.round(amount * 100);
    const order = await razorpayClient.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: true
    });
    res.json({
      order_id: order.id,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(400).json({ detail: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const userId = req.query.user_id ? Number(req.query.user_id) : undefined;
    const query = {};
    if (userId) query.user_id = userId;

    const bookings = await prisma.bookings.findMany({
      where: query,
      orderBy: { created_at: "desc" }
    });

    const mapped = bookings.map((b) => {
      const itemList = [];
      if (b.products_details && Array.isArray(b.products_details)) {
        for (const p of b.products_details) {
          itemList.push(`${p.title || "Product"} (x${p.quantity || 1})`);
        }
      }

      const offsetDate = (d) => d ? new Date(d.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split("T")[0] : "N/A";

      return {
        id: b.booking_reference,
        customer: b.contact_person || "Customer",
        items: itemList.length > 0 ? itemList : ["Rental Items"],
        products_details: b.products_details,
        total: `₹${b.total_price}`,
        status: b.status,
        date: offsetDate(b.created_at),
        start_date: b.start_date ? offsetDate(b.start_date) : null,
        end_date: b.end_date ? offsetDate(b.end_date) : null,
        deliveryAgent: b.delivery_agent_name,
        deliveryAgentId: b.delivery_agent_id,
        shipping_address: b.shipping_address,
        paid_amount: b.paid_amount,
        balance_amount: b.balance_amount,
        late_fee: b.late_fee,
        damage_fee: b.damage_fee,
        total_deposit: b.total_deposit,
        refund_status: b.refund_status || "none",
        refund_amount: b.refund_amount || 0,
        refund_notes: b.refund_notes,
        phone: b.phone
      };
    });

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/:booking_reference", async (req, res) => {
  try {
    const ref = req.params.booking_reference;
    const booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.put("/:booking_reference/assign", async (req, res) => {
  try {
    const ref = req.params.booking_reference;
    const { agent_id, agent_name } = req.body;
    let booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });

    booking = await prisma.bookings.update({
      where: { id: booking.id },
      data: {
        delivery_agent_id: agent_id,
        delivery_agent_name: agent_name,
        status: "pending"
      }
    });

    try {
      broadcastMessage({
        type: "ORDER_STATUS_UPDATE",
        order_id: ref,
        status: booking.status,
        agent_assigned: true
      });
    } catch (e) {
      console.log(`WebSocket broadcast failed: ${e}`);
    }

    res.json({ message: "Agent assigned", status: booking.status, agent_name: booking.delivery_agent_name });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/:booking_reference/tracking", async (req, res) => {
  try {
    const ref = req.params.booking_reference;
    const booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });

    let agent = null;
    if (booking.delivery_agent_id) {
      agent = await prisma.users.findUnique({ where: { id: booking.delivery_agent_id } });
    }

    const isCompleted = (stageStatus) => {
      const statusRank = {
        "pending": 0, "confirmed": 1, "in_progress": 2, "in_delivery": 3, "delivered": 4, "completed": 5, "cancelled": -1
      };
      const currentRank = statusRank[booking.status || ""] || 0;
      const targetRank = statusRank[stageStatus] || 0;
      if (currentRank === -1) return false;
      return currentRank >= targetRank;
    };

    const getTimestamp = (stageStatus) => {
      if (stageStatus === "pending") return booking.created_at;
      if (stageStatus === "delivered") return booking.delivered_at || null;
      if (stageStatus === "completed") return booking.picked_up_at || null;
      
      if (isCompleted(stageStatus)) {
        const base = new Date(booking.created_at);
        if (stageStatus === "confirmed") base.setMinutes(base.getMinutes() + 15);
        if (stageStatus === "in_progress") base.setHours(base.getHours() + 2);
        if (stageStatus === "in_delivery") base.setHours(base.getHours() + 4);
        return base;
      }
      return null;
    };

    const statusTimeline = [
      { status: "pending", label: "Order Placed", timestamp: getTimestamp("pending"), completed: true },
      { status: "confirmed", label: "Order Confirmed", timestamp: getTimestamp("confirmed"), completed: isCompleted("confirmed") },
      { status: "in_progress", label: "Processing Items", timestamp: getTimestamp("in_progress"), completed: isCompleted("in_progress") },
      { status: "in_delivery", label: "Out for Delivery", timestamp: getTimestamp("in_delivery"), completed: isCompleted("in_delivery") },
      { status: "delivered", label: "Delivered", timestamp: getTimestamp("delivered"), completed: isCompleted("delivered") },
      { status: "completed", label: "Event Finished", timestamp: getTimestamp("completed"), completed: isCompleted("completed") }
    ];

    let agentLat = 13.0827;
    let agentLng = 80.2707;
    if (booking.shipping_address && booking.shipping_address.lat && booking.shipping_address.lng) {
      const destLat = booking.shipping_address.lat;
      const destLng = booking.shipping_address.lng;
      if (booking.status === "in_delivery") {
        // Simulates dynamic agent movement towards the customer address
        const now = Date.now();
        const cycle = (now % 600000) / 600000; // 0 to 1 cycle every 10 mins
        agentLat = 13.0827 + (destLat - 13.0827) * cycle;
        agentLng = 80.2707 + (destLng - 80.2707) * cycle;
      } else {
        // Center of the city
        agentLat = 13.0827;
        agentLng = 80.2707;
      }
    }

    res.json({
      id: booking.booking_reference,
      booking_reference: booking.booking_reference,
      delivery_otp: booking.delivery_otp,
      current_status: booking.status,
      contact_person: booking.contact_person,
      shipping_address: booking.shipping_address,
      total_price: booking.total_price,
      paid_amount: booking.paid_amount,
      balance_amount: booking.balance_amount,
      payment_method: booking.payment_method,
      deposit_option: booking.deposit_option,
      timeline: statusTimeline,
      items: booking.products_details,
      driver: {
        name: agent?.name || booking.delivery_agent_name || "Assigning Agent...",
        phone: agent?.phone || (booking.delivery_agent_name ? "N/A" : null),
        vehicle: agent?.vehicle || (booking.delivery_agent_name ? "N/A" : null),
        image: agent?.profile_image || null,
        rating: agent?.ratings || 5.0,
        reviews_count: agent?.reviews_count || 0
      },
      start_date: booking.start_date,
      end_date: booking.end_date,
      live_tracking: {
        agent_assigned: !!booking.delivery_agent_id,
        lat: agentLat,
        lng: agentLng,
        estimated_arrival: booking.status === "in_delivery" ? "25 mins" : (booking.status === "in_progress" ? "45 mins" : null)
      }
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.put("/:booking_reference/status", async (req, res) => {
  try {
    const ref = req.params.booking_reference;
    const { status, balance_collected, return_condition } = req.body;
    let booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });

    const allowedStatuses = ["pending", "confirmed", "in_progress", "in_delivery", "picked_up", "completed", "cancelled", "delivered"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ detail: "Invalid status transition" });
    }

    const oldStatus = booking.status;
    const updateData = { status };

    if (status === "cancelled") {
      if ((booking.paid_amount || 0) > 0) {
        updateData.refund_status = "pending";
        updateData.refund_amount = booking.paid_amount;
        updateData.refund_notes = "Automatically initiated due to order cancellation.";
      }
      if (booking.products_details && Array.isArray(booking.products_details)) {
        for (const item of booking.products_details) {
          const pId = item.id;
          const qty = item.quantity || 0;
          if (pId && qty > 0) {
            const prod = await prisma.products.findUnique({ where: { id: pId } });
            if (prod) {
              const pUpdate = { available: (prod.available || 0) + qty };
              if (["pending", "confirmed", "in_progress"].includes(oldStatus || "")) {
                pUpdate.stock_holds = Math.max(0, (prod.stock_holds || 0) - qty);
              } else if (["in_delivery"].includes(oldStatus || "")) {
                pUpdate.reserved_stock = Math.max(0, (prod.reserved_stock || 0) - qty);
              }
              await prisma.products.update({ where: { id: pId }, data: pUpdate });
            }
          }
        }
      }
    }

    if (balance_collected) {
      updateData.paid_amount = (booking.paid_amount || 0) + (booking.balance_amount || 0);
      updateData.balance_amount = 0;
    }

    if (status === "delivered" && !booking.delivered_at) updateData.delivered_at = new Date();
    if (status === "picked_up" && !booking.picked_up_at) updateData.picked_up_at = new Date();

    if (status === "picked_up" && booking.products_details && Array.isArray(booking.products_details)) {
      for (const item of booking.products_details) {
        const pId = item.id;
        const qty = item.quantity || 0;
        if (pId && qty > 0) {
          const prod = await prisma.products.findUnique({ where: { id: pId } });
          if (prod) {
            const pUpdate = { reserved_stock: Math.max(0, (prod.reserved_stock || 0) - qty) };
            if (return_condition === "Good" || !return_condition) {
              pUpdate.available = (prod.available || 0) + qty;
            } else if (return_condition === "Damaged") {
              pUpdate.damaged_stock = (prod.damaged_stock || 0) + qty;
            }
            await prisma.products.update({ where: { id: pId }, data: pUpdate });
          }
        }
      }

      const now = new Date();
      let lateFee = 0;
      let balanceAmt = updateData.balance_amount !== undefined ? updateData.balance_amount : (booking.balance_amount || 0);
      if (booking.end_date) {
        if (now > booking.end_date) {
          const daysLate = Math.floor((now.getTime() - booking.end_date.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLate > 0) {
            lateFee = daysLate * 500.0;
            updateData.late_fee = lateFee;
            balanceAmt += lateFee;
          }
        }
      }

      if (return_condition === "Good") {
        if ((booking.total_deposit || 0) > 0) {
          updateData.refund_status = "pending";
          updateData.refund_amount = booking.total_deposit;
          updateData.refund_notes = "Automatically initiated: Items returned in GOOD condition.";
        }
      } else if (return_condition === "Damaged" || return_condition === "Missing Items") {
        const damageVal = return_condition === "Damaged" ? 2000.0 : 5000.0;
        updateData.damage_fee = damageVal;
        const deposit = booking.total_deposit || 0;
        if (deposit > 0) {
          const refundVal = Math.max(0, deposit - damageVal);
          updateData.refund_status = "pending";
          updateData.refund_amount = refundVal;
          updateData.refund_notes = `Automatically initiated: Deduction of ₹${damageVal} for ${return_condition}.`;
          if (damageVal > deposit) {
            balanceAmt += (damageVal - deposit);
          }
        }
      }
      updateData.balance_amount = balanceAmt;
    }

    booking = await prisma.bookings.update({ where: { id: booking.id }, data: updateData });

    try {
      broadcastMessage({
        type: "ORDER_STATUS_UPDATE",
        order_id: ref,
        status: booking.status
      });
    } catch (e) {
      console.log(`WebSocket broadcast failed: ${e}`);
    }

    res.json({
      message: "Order status updated successfully",
      new_status: booking.status,
      late_fee: booking.late_fee,
      damage_fee: booking.damage_fee,
      new_balance: booking.balance_amount
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post("/:booking_reference/verify-delivery-otp", async (req, res) => {
  try {
    const ref = req.params.booking_reference;
    const { otp, balance_collected } = req.body;
    let booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });

    if (booking.delivery_otp !== otp) {
      return res.status(400).json({ detail: "Invalid Delivery OTP. Please ask the customer for the correct code." });
    }

    const updateData = { status: "in_delivery" };
    if (balance_collected) {
      updateData.paid_amount = (booking.paid_amount || 0) + (booking.balance_amount || 0);
      updateData.balance_amount = 0;
    }

    booking = await prisma.bookings.update({ where: { id: booking.id }, data: updateData });

    if (booking.products_details && Array.isArray(booking.products_details)) {
      for (const item of booking.products_details) {
        const pId = item.id;
        const qty = item.quantity || 0;
        if (pId && qty > 0) {
          const prod = await prisma.products.findUnique({ where: { id: pId } });
          if (prod) {
            await prisma.products.update({
              where: { id: pId },
              data: {
                stock_holds: Math.max(0, (prod.stock_holds || 0) - qty),
                reserved_stock: (prod.reserved_stock || 0) + qty
              }
            });
          }
        }
      }
    }

    try {
      broadcastMessage({
        type: "ORDER_STATUS_UPDATE",
        order_id: ref,
        status: "in_delivery"
      });
    } catch (e) {
      console.log(`WebSocket broadcast failed: ${e}`);
    }

    res.json({ message: "OTP Verified! Order marked as In Delivery.", status: "in_delivery" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post("/:booking_reference/feedback", async (req, res) => {
  try {
    const ref = req.params.booking_reference;
    const { rating, comment, tags } = req.body;
    let booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });

    booking = await prisma.bookings.update({
      where: { id: booking.id },
      data: {
        customer_feedback: {
          rating, comment, tags, submitted_at: new Date().toISOString()
        }
      }
    });

    let newRating = null;
    if (booking.delivery_agent_id) {
      const agent = await prisma.users.findUnique({ where: { id: booking.delivery_agent_id } });
      if (agent) {
        const currentRating = agent.ratings || 5.0;
        const count = agent.reviews_count || 0;
        const newCount = count + 1;
        const nr = ((currentRating * count) + rating) / newCount;
        
        const updatedAgent = await prisma.users.update({
          where: { id: agent.id },
          data: { ratings: Math.round(nr * 100) / 100, reviews_count: newCount }
        });
        newRating = updatedAgent.ratings;
      }
    }

    res.json({ message: "Feedback submitted successfully", new_agent_rating: newRating });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
