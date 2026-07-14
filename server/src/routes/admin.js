const { Router } = require("express");
const { prisma } = require("../index");
const fs = require("fs");
const path = require("path");

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const revenueRes = await prisma.bookings.aggregate({ _sum: { total_price: true } });
    const totalRev = revenueRes._sum.total_price || 0;

    const activeCount = await prisma.bookings.count({
      where: { status: { in: ["confirmed", "in_progress", "in_delivery", "delivered"] } }
    });

    const pendingOrders = await prisma.bookings.count({ where: { status: "pending" } });
    const pendingRefunds = await prisma.bookings.count({ where: { refund_status: "pending" } });
    const pendingCount = pendingOrders + pendingRefunds;

    const unassignedCount = await prisma.bookings.count({
      where: { status: "confirmed", delivery_agent_id: null }
    });

    const recentBookings = await prisma.bookings.findMany({
      orderBy: { created_at: "desc" },
      take: 5
    });

    const recentMapped = recentBookings.map((b) => ({
      id: b.booking_reference,
      customer: b.contact_person,
      total: `₹${b.total_price}`,
      status: b.status,
      time: b.start_date ? b.start_date.toISOString().split("T")[0] : (b.created_at ? b.created_at.toISOString().split("T")[1].substring(0, 5) : "Now"),
      end_time: b.end_date ? b.end_date.toISOString().split("T")[0] : null
    }));

    res.json({
      revenue: `₹${Math.floor(totalRev).toLocaleString()}`,
      active_orders: activeCount,
      unassigned_orders: unassignedCount,
      pending_tasks: pendingCount,
      recent: recentMapped
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/products", async (req, res) => {
  try {
    const products = await prisma.products.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post("/products", async (req, res) => {
  try {
    const data = req.body;
    const newProduct = await prisma.products.create({
      data: {
        title: data.title,
        category: data.category,
        price_per_day: data.price_per_day,
        description: data.description,
        image: data.image,
        available: data.available || 0
      }
    });
    res.json({ message: "Product created", product: newProduct });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/config", (req, res) => {
  res.json({ delivery_fee: 50, min_order: 500 });
});

router.get("/inventory", async (req, res) => {
  try {
    const products = await prisma.products.findMany();
    const activeBookings = await prisma.bookings.findMany({
      where: { status: { notIn: ["completed", "cancelled"] } }
    });

    const reservedMap = {};
    const holdsMap = {};

    for (const b of activeBookings) {
      if (b.products_details && Array.isArray(b.products_details)) {
        const isPhysicallyOut = b.status === "in_delivery" || b.status === "picked_up";
        for (const pItem of b.products_details) {
          const pId = pItem.id;
          const qty = pItem.quantity || 0;
          if (pId) {
            if (isPhysicallyOut) {
              reservedMap[pId] = (reservedMap[pId] || 0) + qty;
            } else {
              holdsMap[pId] = (holdsMap[pId] || 0) + qty;
            }
          }
        }
      }
    }

    const inventory = products.map((p) => {
      const total = (p.total_stock && p.total_stock > 0) ? p.total_stock : (p.available || 0);
      const damaged = p.damaged_stock || 0;
      const reserved = reservedMap[p.id] || 0;
      const holds = holdsMap[p.id] || 0;
      const actualAvailable = total - damaged - reserved - holds;

      return {
        id: p.id,
        title: p.title,
        sku: p.sku || `SKU-${String(p.id).padStart(4, "0")}`,
        total,
        available: Math.max(0, actualAvailable),
        damaged,
        reserved,
        holds,
        category: p.category
      };
    });

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post("/pricing", async (req, res) => {
  try {
    const { product_id, new_price } = req.body;
    let product = await prisma.products.findUnique({ where: { id: product_id } });
    if (!product) return res.status(404).json({ detail: "Product not found" });

    product = await prisma.products.update({
      where: { id: product_id },
      data: { price_per_day: new_price }
    });
    res.json({ message: "Pricing updated successfully", new_price: product.price_per_day });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/agents", async (req, res) => {
  try {
    const agents = await prisma.users.findMany({ where: { role: "DELIVERY" } });
    const deliveries = await prisma.bookings.groupBy({
      by: ["delivery_agent_id"],
      where: { status: "completed", delivery_agent_id: { not: null } },
      _count: { id: true }
    });

    const countsMap = {};
    for (const d of deliveries) {
      if (d.delivery_agent_id) {
        countsMap[d.delivery_agent_id] = d._count.id;
      }
    }

    const result = agents.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.username,
      phone: a.phone,
      vehicle: a.vehicle,
      status: !a.is_active ? "offline" : "online",
      deliveries: countsMap[a.id] || 0
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post("/agents", async (req, res) => {
  try {
    const data = req.body;
    const existingEmail = await prisma.users.findUnique({ where: { username: data.username } });
    if (existingEmail) return res.status(400).json({ detail: "An account with this email/username already exists." });

    if (data.phone) {
      const existingPhone = await prisma.users.findUnique({ where: { phone: data.phone } });
      if (existingPhone) return res.status(400).json({ detail: "This phone number is already registered with another account." });
    }

    const newAgent = await prisma.users.create({
      data: {
        name: data.name,
        username: data.username,
        password: data.password,
        phone: data.phone,
        vehicle: data.vehicle,
        role: "DELIVERY",
        is_active: true
      }
    });

    res.json({
      id: newAgent.id,
      name: newAgent.name,
      email: newAgent.username,
      phone: newAgent.phone,
      vehicle: newAgent.vehicle,
      status: "online",
      deliveries: 0
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.delete("/products/:product_id", async (req, res) => {
  try {
    const id = Number(req.params.product_id);
    await prisma.products.delete({ where: { id } });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.put("/products/:product_id", async (req, res) => {
  try {
    const id = Number(req.params.product_id);
    const data = req.body;
    const product = await prisma.products.update({
      where: { id },
      data
    });
    res.json({ message: "Product updated", product });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.delete("/agents/:agent_id", async (req, res) => {
  try {
    const id = Number(req.params.agent_id);
    await prisma.users.delete({ where: { id } });
    res.json({ message: "Agent deleted successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/inventory/:product_id/details", async (req, res) => {
  try {
    const id = Number(req.params.product_id);
    const product = await prisma.products.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ detail: "Product not found" });

    const bookings = await prisma.bookings.findMany({
      where: { status: { notIn: ["completed", "cancelled"] } }
    });

    const relatedBookings = [];
    for (const b of bookings) {
      if (b.products_details && Array.isArray(b.products_details)) {
        for (const item of b.products_details) {
          if (item.id === id) {
            relatedBookings.push({
              booking_ref: b.booking_reference,
              customer: b.contact_person,
              quantity: item.quantity || 0,
              status: b.status,
              start_date: b.start_date ? b.start_date.toISOString().split("T")[0] : "N/A",
              end_date: b.end_date ? b.end_date.toISOString().split("T")[0] : "N/A"
            });
          }
        }
      }
    }

    res.json({ product_name: product.title, sku: product.sku, bookings: relatedBookings });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Customers
router.get("/customers", async (req, res) => {
  try {
    const customers = await prisma.users.findMany({ where: { role: "customer" } });
    const stats = await prisma.bookings.groupBy({
      by: ["user_id"],
      _count: { id: true },
      _sum: { total_price: true }
    });

    const statsMap = {};
    for (const s of stats) {
      if (s.user_id) {
        statsMap[s.user_id] = { count: s._count.id, spent: s._sum.total_price || 0 };
      }
    }

    const result = customers.map((u) => ({
      id: u.id,
      name: u.name || "—",
      phone: u.phone || "—",
      username: u.username || "—",
      is_active: u.is_active,
      created_at: u.created_at ? u.created_at.toISOString() : null,
      order_count: statsMap[u.id]?.count || 0,
      total_spent: statsMap[u.id]?.spent || 0
    }));

    result.sort((a, b) => b.total_spent - a.total_spent);
    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/customers/:user_id", async (req, res) => {
  try {
    const id = Number(req.params.user_id);
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ detail: "Customer not found" });

    const orders = await prisma.bookings.findMany({
      where: { user_id: id },
      orderBy: { created_at: "desc" }
    });

    const serializedOrders = orders.map((o) => ({
      booking_reference: o.booking_reference,
      status: o.status,
      total_price: o.total_price,
      paid_amount: o.paid_amount,
      balance_amount: o.balance_amount,
      refund_status: o.refund_status,
      refund_amount: o.refund_amount,
      created_at: o.created_at ? o.created_at.toISOString() : null
    }));

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      username: user.username,
      is_active: user.is_active,
      profile_image: user.profile_image,
      created_at: user.created_at ? user.created_at.toISOString() : null,
      orders: serializedOrders
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.put("/customers/:user_id", async (req, res) => {
  try {
    const id = Number(req.params.user_id);
    const data = req.body;
    const user = await prisma.users.update({
      where: { id },
      data
    });
    res.json({ message: "Customer updated", id: user.id, is_active: user.is_active });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Proof Upload (admin or orders)
router.post("/orders/:booking_reference/proof", async (req, res) => {
  try {
    const ref = req.params.booking_reference.trim().toUpperCase();
    const { proof_type, photos, captions, notes } = req.body;
    
    let booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });

    if (!["delivery", "pickup"].includes(proof_type)) {
      return res.status(400).json({ detail: "proof_type must be 'delivery' or 'pickup'" });
    }

    const nowStr = new Date().toISOString();
    const photosPayload = [];
    const proofsDir = path.join(__dirname, "../../uploads/proofs");
    if (!fs.existsSync(proofsDir)) {
      fs.mkdirSync(proofsDir, { recursive: true });
    }

    for (let i = 0; i < photos.length; i++) {
      let b64Data = photos[i];
      if (b64Data.includes(",")) {
        b64Data = b64Data.split(",")[1];
      }
      const buffer = Buffer.from(b64Data, "base64");
      const filename = `${ref}_${proof_type}_${Math.random().toString(36).substring(7)}.jpg`;
      fs.writeFileSync(path.join(proofsDir, filename), buffer);

      const fileUrl = `/static/proofs/${filename}`;
      photosPayload.push({
        url: fileUrl,
        caption: (captions && captions[i]) || "",
        uploaded_at: nowStr
      });
    }

    const updateData = {};
    if (proof_type === "delivery") {
      const existing = booking.delivery_proof || [];
      updateData.delivery_proof = [...existing, ...photosPayload];
      if (!booking.delivered_at) updateData.delivered_at = new Date();
      if (!["delivered", "completed", "picked_up"].includes(booking.status || "")) {
        updateData.status = "delivered";
      }
    } else {
      const existing = booking.pickup_proof || [];
      updateData.pickup_proof = [...existing, ...photosPayload];
      if (!booking.picked_up_at) updateData.picked_up_at = new Date();
    }

    if (notes) {
      updateData.special_requirements = (booking.special_requirements || "") + `\n[${proof_type.toUpperCase()} NOTE] ${notes}`;
    }

    await prisma.bookings.update({
      where: { id: booking.id },
      data: updateData
    });

    res.json({
      message: `${proof_type} proof uploaded (${photosPayload.length} photo(s)).`,
      proof_type,
      count: photosPayload.length
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/orders/:booking_reference/proof", async (req, res) => {
  try {
    const ref = req.params.booking_reference.trim().toUpperCase();
    const booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });

    const processProofs = (proofs) => {
      if (!proofs) return [];
      return Array.isArray(proofs) ? proofs : [];
    };

    res.json({
      booking_reference: booking.booking_reference,
      delivery_proof: processProofs(booking.delivery_proof),
      pickup_proof: processProofs(booking.pickup_proof),
      delivered_at: booking.delivered_at,
      picked_up_at: booking.picked_up_at
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.delete("/orders/:booking_reference/proof/:proof_type/:photo_index", async (req, res) => {
  try {
    const ref = req.params.booking_reference;
    const { proof_type, photo_index } = req.params;
    const index = Number(photo_index);

    const booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });

    if (proof_type === "delivery") {
      const photos = booking.delivery_proof || [];
      if (index < 0 || index >= photos.length) return res.status(404).json({ detail: "Photo index out of range" });
      photos.splice(index, 1);
      await prisma.bookings.update({ where: { id: booking.id }, data: { delivery_proof: photos } });
    } else if (proof_type === "pickup") {
      const photos = booking.pickup_proof || [];
      if (index < 0 || index >= photos.length) return res.status(404).json({ detail: "Photo index out of range" });
      photos.splice(index, 1);
      await prisma.bookings.update({ where: { id: booking.id }, data: { pickup_proof: photos } });
    } else {
      return res.status(400).json({ detail: "proof_type must be 'delivery' or 'pickup'" });
    }
    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Refunds
router.get("/refunds", async (req, res) => {
  try {
    const bookings = await prisma.bookings.findMany({
      where: { refund_status: { not: "none" } },
      orderBy: { created_at: "desc" }
    });

    const cancelled = await prisma.bookings.findMany({
      where: { status: "cancelled", refund_status: "none" }
    });

    const allBookings = [...bookings, ...cancelled];
    const seen = new Set();
    const result = [];

    for (const b of allBookings) {
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      result.push({
        booking_reference: b.booking_reference,
        customer: b.contact_person,
        phone: b.phone,
        status: b.status,
        total_price: b.total_price,
        paid_amount: b.paid_amount || 0,
        balance_amount: b.balance_amount || 0,
        refund_status: b.refund_status || "none",
        refund_amount: b.refund_amount || 0,
        refund_notes: b.refund_notes,
        deposit_option: b.deposit_option,
        late_fee: b.late_fee || 0,
        damage_fee: b.damage_fee || 0,
        created_at: b.created_at ? b.created_at.toISOString() : null
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post("/orders/:booking_reference/refund/initiate", async (req, res) => {
  try {
    const { refund_amount, refund_notes } = req.body;
    const ref = req.params.booking_reference;
    let booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });

    booking = await prisma.bookings.update({
      where: { id: booking.id },
      data: {
        refund_status: "pending",
        refund_amount,
        refund_notes
      }
    });

    res.json({ message: "Refund initiated", refund_status: "pending", refund_amount });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.patch("/orders/:booking_reference/refund/approve", async (req, res) => {
  try {
    const ref = req.params.booking_reference;
    let booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });
    if (!["pending", "none"].includes(booking.refund_status || "")) {
      return res.status(400).json({ detail: "No pending refund to approve" });
    }

    booking = await prisma.bookings.update({
      where: { id: booking.id },
      data: { refund_status: "approved" }
    });

    res.json({ message: "Refund approved", refund_status: "approved" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.patch("/orders/:booking_reference/refund/reject", async (req, res) => {
  try {
    const ref = req.params.booking_reference;
    const { refund_notes } = req.body;
    let booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });

    booking = await prisma.bookings.update({
      where: { id: booking.id },
      data: { refund_status: "rejected", refund_notes: refund_notes || booking.refund_notes }
    });

    res.json({ message: "Refund rejected", refund_status: "rejected" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.patch("/orders/:booking_reference/refund/process", async (req, res) => {
  try {
    const ref = req.params.booking_reference;
    let booking = await prisma.bookings.findUnique({ where: { booking_reference: ref } });
    if (!booking) return res.status(404).json({ detail: "Order not found" });
    if (booking.refund_status !== "approved") {
      return res.status(400).json({ detail: "Refund must be approved before processing" });
    }

    booking = await prisma.bookings.update({
      where: { id: booking.id },
      data: {
        refund_status: "processed",
        balance_amount: Math.max(0, (booking.balance_amount || 0) - (booking.refund_amount || 0))
      }
    });

    res.json({ message: "Refund processed successfully", refund_status: "processed" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
