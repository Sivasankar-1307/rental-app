const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const twilio = require("twilio");
const { prisma } = require("../index");
const { redisClient } = require("../redis");

const router = Router();

const sendSmsViaTwilio = async (toPhone, otpCode) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log(`--- [DEV MODE] SMS GATEWAY ---`);
    console.log(`  To     : ${toPhone}`);
    console.log(`  OTP    : ${otpCode}`);
    console.log(`  Msg    : Your RentaFest login OTP is ${otpCode}. Valid for 5 minutes. Do not share.`);
    console.log(`---------------------------------`);
    return true;
  }

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    let normalised = toPhone.trim();
    if (!normalised.startsWith("+")) {
      normalised = "+91" + normalised;
    }
    const message = await client.messages.create({
      body: `Your RentaFest login OTP is ${otpCode}. Valid for 5 minutes. Do not share this code.`,
      from: TWILIO_PHONE_NUMBER,
      to: normalised,
    });
    console.log(`[SUCCESS] Twilio SMS sent. SID: ${message.sid}  Status: ${message.status}`);
    return true;
  } catch (error) {
    console.log(`[ERROR] Twilio SMS failed:`, error.message);
    console.log(`--- [FALLBACK] SMS GATEWAY ---`);
    console.log(`  To     : ${toPhone}`);
    console.log(`  OTP    : ${otpCode}`);
    console.log(`------------------------------`);
    return true; // Fallback
  }
};

router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    let user = await prisma.users.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.users.create({ data: { phone } });
    }

    const ttl = await redisClient.ttl(`otp:${phone}`);
    if (ttl > 240) {
      return res.status(429).json({ detail: `Please wait ${ttl - 240} seconds before requesting a new OTP.` });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.setEx(`otp:${phone}`, 300, otpCode);

    const sent = await sendSmsViaTwilio(phone, otpCode);
    if (!sent) {
      return res.status(500).json({ detail: "Failed to send OTP. Please try again." });
    }

    res.json({ message: `OTP sent to ${phone}. Valid for 5 minutes.` });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await prisma.users.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ detail: "User not found" });

    const storedOtp = await redisClient.get(`otp:${phone}`);
    if (!storedOtp) return res.status(401).json({ detail: "OTP expired. Please request a new one." });
    if (storedOtp !== otp) return res.status(401).json({ detail: "Invalid OTP. Please try again." });

    await redisClient.del(`otp:${phone}`);
    res.json({ token: uuidv4(), message: "Login successful!", id: user.id, role: user.role });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.users.findUnique({ where: { username } });
    if (!user || user.password !== password) {
      return res.status(401).json({ detail: "Invalid credentials" });
    }
    res.json({
      token: uuidv4(),
      role: user.role,
      id: user.id,
      name: user.name || user.username,
      vehicle: user.vehicle || "Unassigned Vehicle"
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/me", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ detail: "User not found" });

    const totalOrders = await prisma.bookings.count({ where: { user_id: userId } });
    const recentOrders = await prisma.bookings.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 3
    });

    const serializedOrders = recentOrders.map((o) => ({
      id: o.id,
      booking_reference: o.booking_reference,
      status: o.status,
      total_price: o.total_price,
      paid_amount: o.paid_amount,
      balance_amount: o.balance_amount,
      phone: o.phone,
      created_at: o.created_at ? o.created_at.toISOString() : null
    }));

    const addresses = await prisma.user_addresses.findMany({
      where: { user_id: userId },
      orderBy: [
        { is_default: "desc" },
        { created_at: "asc" }
      ]
    });

    const serializedAddresses = addresses.map((a) => ({
      id: a.id,
      address_id: a.address_id,
      full_name: a.full_name,
      phone: a.phone,
      street: a.street,
      landmark: a.landmark,
      city: a.city,
      state: a.state,
      zipcode: a.zipcode,
      country: a.country,
      lat: a.lat,
      lng: a.lng,
      address_type: a.address_type,
      is_default: a.is_default,
      created_at: a.created_at ? a.created_at.toISOString() : null
    }));

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      role: user.role,
      profile_image: user.profile_image,
      saved_address: user.saved_address,
      addresses: serializedAddresses,
      created_at: user.created_at ? user.created_at.toISOString() : null,
      stats: {
        total_orders: totalOrders,
        membership_year: user.created_at ? user.created_at.getFullYear() : 2024,
        recent_orders: serializedOrders
      }
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    const { name, profile_image, phone } = req.body;
    let user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ detail: "User not found" });

    if (phone && phone !== user.phone) {
      const phoneCheck = await prisma.users.findUnique({ where: { phone } });
      if (phoneCheck) {
        return res.status(400).json({ detail: "This phone number is already registered with another account." });
      }
    }

    user = await prisma.users.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : user.name,
        profile_image: profile_image !== undefined ? profile_image : user.profile_image,
        phone: phone !== undefined ? phone : user.phone,
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

// Multi-Address CRUD
router.get("/addresses", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    const addresses = await prisma.user_addresses.findMany({
      where: { user_id: userId },
      orderBy: [
        { is_default: "desc" },
        { created_at: "asc" }
      ]
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

const clearDefaultAddress = async (userId) => {
  await prisma.user_addresses.updateMany({
    where: { user_id: userId, is_default: true },
    data: { is_default: false }
  });
};

router.post("/addresses", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    const data = req.body;
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ detail: "User not found" });

    if (data.is_default) {
      await clearDefaultAddress(userId);
    }

    const count = await prisma.user_addresses.count({ where: { user_id: userId } });
    const isFirst = count === 0;

    const newAddr = await prisma.user_addresses.create({
      data: {
        address_id: uuidv4(),
        user_id: userId,
        full_name: data.full_name,
        phone: data.phone,
        street: data.street,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        zipcode: data.zipcode,
        country: data.country || "India",
        lat: data.lat,
        lng: data.lng,
        address_type: data.address_type || "Home",
        is_default: data.is_default || isFirst
      }
    });
    res.json(newAddr);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.put("/addresses/:address_id", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    const addressId = req.params.address_id;
    const data = req.body;
    let addr = await prisma.user_addresses.findFirst({ where: { address_id: addressId, user_id: userId } });
    if (!addr) return res.status(404).json({ detail: "Address not found" });

    if (data.is_default && !addr.is_default) {
      await clearDefaultAddress(userId);
    }

    addr = await prisma.user_addresses.update({
      where: { id: addr.id },
      data: {
        full_name: data.full_name,
        phone: data.phone,
        street: data.street,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        zipcode: data.zipcode,
        country: data.country,
        lat: data.lat,
        lng: data.lng,
        address_type: data.address_type,
        is_default: data.is_default
      }
    });
    res.json(addr);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.delete("/addresses/:address_id", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    const addressId = req.params.address_id;
    const addr = await prisma.user_addresses.findFirst({ where: { address_id: addressId, user_id: userId } });
    if (!addr) return res.status(404).json({ detail: "Address not found" });

    const wasDefault = addr.is_default;
    await prisma.user_addresses.delete({ where: { id: addr.id } });

    if (wasDefault) {
      const nextAddr = await prisma.user_addresses.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: "asc" }
      });
      if (nextAddr) {
        await prisma.user_addresses.update({ where: { id: nextAddr.id }, data: { is_default: true } });
      }
    }
    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.patch("/addresses/:address_id/set-default", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    const addressId = req.params.address_id;
    await clearDefaultAddress(userId);
    const addr = await prisma.user_addresses.findFirst({ where: { address_id: addressId, user_id: userId } });
    if (!addr) return res.status(404).json({ detail: "Address not found" });

    const updated = await prisma.user_addresses.update({
      where: { id: addr.id },
      data: { is_default: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.put("/address", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    const data = req.body;
    let user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ detail: "User not found" });

    user = await prisma.users.update({
      where: { id: userId },
      data: { saved_address: data }
    });
    res.json({ message: "Address saved", saved_address: user.saved_address });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/address", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    const addr = await prisma.user_addresses.findFirst({
      where: { user_id: userId, is_default: true }
    });
    if (addr) return res.json({ saved_address: addr });

    const user = await prisma.users.findUnique({ where: { id: userId } });
    res.json({ saved_address: user?.saved_address || null });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
