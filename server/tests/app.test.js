const request = require("supertest");

// 1. Define all Mocks first, before requiring anything else
const mockPrisma = {
  users: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  bookings: {
    aggregate: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    groupBy: jest.fn(),
  },
  products: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user_addresses: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  }
};

jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
  };
});

const mockRedisClient = {
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(true),
  ttl: jest.fn().mockResolvedValue(0),
  setEx: jest.fn().mockResolvedValue("OK"),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
};

jest.mock("redis", () => ({
  createClient: jest.fn().mockReturnValue(mockRedisClient)
}));

jest.mock("twilio", () => {
  const mockMessages = {
    create: jest.fn().mockResolvedValue({ sid: "mock_twilio_sms_sid", status: "sent" })
  };
  const mockClient = {
    messages: mockMessages
  };
  return jest.fn().mockReturnValue(mockClient);
});

jest.mock("nodemailer", () => {
  const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue(true)
  };
  return {
    createTransport: jest.fn().mockReturnValue(mockTransporter)
  };
});

jest.mock("razorpay", () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockImplementation(({ amount }) => Promise.resolve({ id: "order_mock_id", amount }))
    }
  }));
});

jest.mock("uuid", () => ({
  v4: () => "mocked-uuid-v4-value"
}));

// Import the app after setting up mocks
const { app } = require("../src/index");

describe("RentaFest Backend API Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Root Route", () => {
    it("should return welcome message", async () => {
      const res = await request(app).get("/");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Welcome to Rental App API (Node.js)");
    });
  });

  describe("Authentication Routes (/auth)", () => {
    it("should send OTP and create user if not exists", async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.users.create.mockResolvedValue({ id: 1, phone: "1234567890" });
      mockRedisClient.ttl.mockResolvedValue(0);

      const res = await request(app)
        .post("/auth/send-otp")
        .send({ phone: "1234567890" });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message");
      expect(mockPrisma.users.create).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });

    it("should verify OTP and return access token", async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ id: 1, phone: "1234567890", role: "CUSTOMER" });
      mockRedisClient.get.mockResolvedValue("123456");

      const res = await request(app)
        .post("/auth/verify-otp")
        .send({ phone: "1234567890", otp: "123456" });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("role", "CUSTOMER");
      expect(mockRedisClient.del).toHaveBeenCalled();
    });

    it("should return 401 on invalid OTP during verification", async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ id: 1, phone: "1234567890" });
      mockRedisClient.get.mockResolvedValue("123456");

      const res = await request(app)
        .post("/auth/verify-otp")
        .send({ phone: "1234567890", otp: "000000" });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("detail", "Invalid OTP. Please try again.");
    });

    it("should log in admin or delivery agents with credentials", async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        id: 2,
        username: "admin@test.com",
        password: "admin123",
        role: "ADMIN",
        name: "Admin User"
      });

      const res = await request(app)
        .post("/auth/login")
        .send({ username: "admin@test.com", password: "admin123" });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("role", "ADMIN");
    });

    it("should fetch user profile and stats under /me", async () => {
      const mockUser = {
        id: 1,
        username: "user123",
        name: "Test User",
        phone: "1234567890",
        role: "CUSTOMER",
        created_at: new Date("2024-01-01T00:00:00.000Z"),
      };
      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      mockPrisma.bookings.count.mockResolvedValue(5);
      mockPrisma.bookings.findMany.mockResolvedValue([]);
      mockPrisma.user_addresses.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get("/auth/me")
        .query({ user_id: 1 });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("id", 1);
      expect(res.body.stats).toHaveProperty("total_orders", 5);
      expect(res.body.stats).toHaveProperty("membership_year", 2024);
    });

    it("should update user profile details", async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ id: 1, name: "Old Name" });
      mockPrisma.users.update.mockResolvedValue({ id: 1, name: "New Name" });

      const res = await request(app)
        .put("/auth/profile")
        .query({ user_id: 1 })
        .send({ name: "New Name" });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("name", "New Name");
    });

    it("should get user saved addresses", async () => {
      mockPrisma.user_addresses.findMany.mockResolvedValue([
        { id: 1, full_name: "John Doe", city: "Chennai", is_default: true }
      ]);

      const res = await request(app)
        .get("/auth/addresses")
        .query({ user_id: 1 });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty("city", "Chennai");
    });

    it("should add a new address and manage defaults", async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.user_addresses.count.mockResolvedValue(0);
      mockPrisma.user_addresses.create.mockResolvedValue({
        id: 10,
        full_name: "Jane Doe",
        city: "Bangalore",
        is_default: true
      });

      const res = await request(app)
        .post("/auth/addresses")
        .query({ user_id: 1 })
        .send({ full_name: "Jane Doe", city: "Bangalore", street: "123 Main St", zipcode: "560001", state: "Karnataka" });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("city", "Bangalore");
      expect(res.body).toHaveProperty("is_default", true);
    });
  });

  describe("Products Routes (/products)", () => {
    it("should list all products", async () => {
      mockPrisma.products.findMany.mockResolvedValue([
        { id: 1, title: "Party Tent", price_per_day: 150 },
        { id: 2, title: "Sound System", price_per_day: 300 }
      ]);

      const res = await request(app).get("/products");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty("title", "Party Tent");
    });

    it("should retrieve a single product", async () => {
      mockPrisma.products.findUnique.mockResolvedValue({ id: 1, title: "Party Tent", price_per_day: 150 });

      const res = await request(app).get("/products/1");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("title", "Party Tent");
    });

    it("should return 404 for non-existent product ID", async () => {
      mockPrisma.products.findUnique.mockResolvedValue(null);

      const res = await request(app).get("/products/999");
      expect(res.statusCode).toEqual(404);
    });

    it("should update product pricing", async () => {
      mockPrisma.products.findUnique.mockResolvedValue({ id: 1, price_per_day: 150 });
      mockPrisma.products.update.mockResolvedValue({ id: 1, price_per_day: 180 });

      const res = await request(app)
        .put("/products/1")
        .send({ price_per_day: 180 });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("new_price", 180);
    });
  });

  describe("Orders/Bookings Routes (/orders)", () => {
    const sampleOrderData = {
      user_id: 1,
      products: [{ id: 1, title: "Party Tent", quantity: 2 }],
      total_price: 300.0,
      contact_person: "Alex",
      phone: "9876543210",
      email: "alex@test.com",
      payment_method: "COD",
      deposit_option: "refundable",
      paid_amount: 50.0,
      balance_amount: 250.0,
      start_date: "2026-06-01",
      end_date: "2026-06-03",
      shipping_address: { street: "456 Oak Rd", city: "Chennai" }
    };

    it("should create a booking and hold inventory stock", async () => {
      mockPrisma.bookings.create.mockResolvedValue({
        id: 50,
        booking_reference: "BOOK-ABCD1234",
        total_price: 300.0,
        phone: "9876543210",
        email: "alex@test.com"
      });
      mockPrisma.products.findUnique.mockResolvedValue({ id: 1, available: 10, stock_holds: 2 });
      mockPrisma.products.update.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post("/orders")
        .send(sampleOrderData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Order placed successfully");
      expect(res.body).toHaveProperty("booking_reference");
      expect(mockPrisma.bookings.create).toHaveBeenCalled();
      expect(mockPrisma.products.update).toHaveBeenCalled();
    });

    it("should generate a Razorpay order", async () => {
      const res = await request(app)
        .post("/orders/razorpay-order")
        .send({ amount: 300 });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("order_id", "order_mock_id");
      expect(res.body).toHaveProperty("amount", 30000);
    });

    it("should assign a delivery agent to order", async () => {
      mockPrisma.bookings.findUnique.mockResolvedValue({ id: 50, booking_reference: "BOOK-12345" });
      mockPrisma.bookings.update.mockResolvedValue({
        id: 50,
        delivery_agent_id: 5,
        delivery_agent_name: "Courier Sam",
        status: "pending"
      });

      const res = await request(app)
        .put("/orders/BOOK-12345/assign")
        .send({ agent_id: 5, agent_name: "Courier Sam" });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Agent assigned");
      expect(res.body).toHaveProperty("agent_name", "Courier Sam");
    });

    it("should verify delivery OTP and transition order status to in_delivery", async () => {
      mockPrisma.bookings.findUnique.mockResolvedValue({
        id: 50,
        booking_reference: "BOOK-12345",
        delivery_otp: "5588",
        products_details: [{ id: 1, quantity: 2 }]
      });
      mockPrisma.bookings.update.mockResolvedValue({
        id: 50,
        status: "in_delivery"
      });
      mockPrisma.products.findUnique.mockResolvedValue({ id: 1, stock_holds: 2, reserved_stock: 0 });
      mockPrisma.products.update.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post("/orders/BOOK-12345/verify-delivery-otp")
        .send({ otp: "5588", balance_collected: true });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "OTP Verified! Order marked as In Delivery.");
      expect(res.body).toHaveProperty("status", "in_delivery");
    });

    it("should update booking status and apply damage or late return fees", async () => {
      const mockBooking = {
        id: 50,
        booking_reference: "BOOK-12345",
        status: "delivered",
        products_details: [{ id: 1, quantity: 2 }],
        end_date: new Date("2026-05-18T00:00:00.000Z"), // older than today
        total_deposit: 1000.0,
        balance_amount: 0.0
      };
      mockPrisma.bookings.findUnique.mockResolvedValue(mockBooking);
      mockPrisma.bookings.update.mockResolvedValue({
        id: 50,
        status: "picked_up",
        late_fee: 500.0,
        damage_fee: 2000.0,
        balance_amount: 1500.0
      });
      mockPrisma.products.findUnique.mockResolvedValue({ id: 1, reserved_stock: 2, available: 5 });
      mockPrisma.products.update.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .put("/orders/BOOK-12345/status")
        .send({ status: "picked_up", return_condition: "Damaged" });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("new_status", "picked_up");
      expect(res.body).toHaveProperty("damage_fee", 2000.0);
    });

    it("should accept customer feedback and recalculate agent rating", async () => {
      mockPrisma.bookings.findUnique.mockResolvedValue({ id: 50, booking_reference: "BOOK-12345", delivery_agent_id: 5 });
      mockPrisma.bookings.update.mockResolvedValue({ id: 50, delivery_agent_id: 5 });
      mockPrisma.users.findUnique.mockResolvedValue({ id: 5, ratings: 4.0, reviews_count: 3 });
      mockPrisma.users.update.mockResolvedValue({ id: 5, ratings: 4.25, reviews_count: 4 });

      const res = await request(app)
        .post("/orders/BOOK-12345/feedback")
        .send({ rating: 5, comment: "Excellent service!" });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Feedback submitted successfully");
      expect(res.body).toHaveProperty("new_agent_rating", 4.25);
    });
  });

  describe("Admin Functionality Routes (/admin)", () => {
    it("should retrieve dashboard statistics", async () => {
      mockPrisma.bookings.aggregate.mockResolvedValue({ _sum: { total_price: 15000.0 } });
      mockPrisma.bookings.count.mockResolvedValue(4);
      mockPrisma.bookings.findMany.mockResolvedValue([]);

      const res = await request(app).get("/admin/stats");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("revenue", "₹15,000");
      expect(res.body).toHaveProperty("active_orders", 4);
    });

    it("should calculate real-time inventory levels", async () => {
      mockPrisma.products.findMany.mockResolvedValue([
        { id: 1, title: "Tables", total_stock: 50, damaged_stock: 2, sku: "SKU-0001", category: "Furniture" }
      ]);
      mockPrisma.bookings.findMany.mockResolvedValue([
        {
          id: 50,
          status: "in_delivery",
          products_details: [{ id: 1, quantity: 5 }]
        },
        {
          id: 51,
          status: "confirmed",
          products_details: [{ id: 1, quantity: 10 }]
        }
      ]);

      const res = await request(app).get("/admin/inventory");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
      // Total 50 - 2 (damaged) - 5 (reserved/in_delivery) - 10 (holds/confirmed) = 33 available
      expect(res.body[0]).toHaveProperty("available", 33);
      expect(res.body[0]).toHaveProperty("holds", 10);
      expect(res.body[0]).toHaveProperty("reserved", 5);
    });

    it("should CRUD delivery agents", async () => {
      // 1. Get agents
      mockPrisma.users.findMany.mockResolvedValue([
        { id: 5, name: "Courier Sam", username: "sam@test.com", phone: "987", vehicle: "Bike", is_active: true }
      ]);
      mockPrisma.bookings.groupBy.mockResolvedValue([]);

      let res = await request(app).get("/admin/agents");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty("name", "Courier Sam");

      // 2. Create agent
      mockPrisma.users.findUnique.mockResolvedValue(null);
      mockPrisma.users.create.mockResolvedValue({
        id: 6,
        name: "Courier Joe",
        username: "joe@test.com",
        phone: "654",
        vehicle: "Van",
        is_active: true
      });

      res = await request(app)
        .post("/admin/agents")
        .send({ name: "Courier Joe", username: "joe@test.com", password: "123", phone: "654", vehicle: "Van" });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("name", "Courier Joe");

      // 3. Delete agent
      mockPrisma.users.delete.mockResolvedValue({ id: 6 });
      res = await request(app).delete("/admin/agents/6");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Agent deleted successfully");
    });

    it("should list all customers", async () => {
      mockPrisma.users.findMany.mockResolvedValue([
        { id: 1, name: "Alex", phone: "987", username: "alex@test.com", is_active: true, created_at: new Date() }
      ]);
      mockPrisma.bookings.groupBy.mockResolvedValue([
        { user_id: 1, _count: { id: 3 }, _sum: { total_price: 900.0 } }
      ]);

      const res = await request(app).get("/admin/customers");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty("order_count", 3);
      expect(res.body[0]).toHaveProperty("total_spent", 900.0);
    });

    it("should list, initiate, approve, reject and process refunds", async () => {
      mockPrisma.bookings.findUnique.mockResolvedValue({ id: 50, booking_reference: "BOOK-12345", refund_status: "pending", paid_amount: 500, balance_amount: 500 });
      mockPrisma.bookings.update.mockResolvedValue({ id: 50, refund_status: "approved" });

      // Initiate refund
      let res = await request(app)
        .post("/admin/orders/BOOK-12345/refund/initiate")
        .send({ refund_amount: 200, refund_notes: "Item damaged before delivery" });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Refund initiated");

      // Approve refund
      res = await request(app).patch("/admin/orders/BOOK-12345/refund/approve");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Refund approved");

      // Process refund
      mockPrisma.bookings.findUnique.mockResolvedValue({ id: 50, booking_reference: "BOOK-12345", refund_status: "approved", refund_amount: 200, balance_amount: 500 });
      mockPrisma.bookings.update.mockResolvedValue({ id: 50, refund_status: "processed" });

      res = await request(app).patch("/admin/orders/BOOK-12345/refund/process");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Refund processed successfully");
    });
  });
});
