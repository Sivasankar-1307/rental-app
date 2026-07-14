const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { PrismaClient } = require("@prisma/client");
const { WebSocketServer } = require("ws");

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/admin" });

const prisma = new PrismaClient();

app.use(cors({
  origin: "*",
  methods: ["*"],
  allowedHeaders: ["*"]
}));
app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "../uploads")));

// WebSocket logic
const connectedClients = new Set();
wss.on("connection", (ws) => {
  connectedClients.add(ws);
  ws.on("close", () => connectedClients.delete(ws));
});

const broadcastMessage = (message) => {
  for (const client of connectedClients) {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(message));
    }
  }
};

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Rental App API (Node.js)" });
});

// Export prisma, broadcastMessage, app and server BEFORE importing routers that depend on them
module.exports = { prisma, broadcastMessage, app, server };

const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");

app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);

const PORT = process.env.PORT || 8000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

