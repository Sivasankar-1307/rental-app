const { Router } = require("express");
const { prisma } = require("../index");

const router = Router();

router.get("/", async (req, res) => {
  try {
    const products = await prisma.products.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.put("/:product_id", async (req, res) => {
  try {
    const productId = Number(req.params.product_id);
    const { price_per_day } = req.body;
    let product = await prisma.products.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ detail: "Product not found" });

    product = await prisma.products.update({
      where: { id: productId },
      data: { price_per_day }
    });
    res.json({ message: `Product ${productId} updated`, new_price: product.price_per_day });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

router.get("/:product_id", async (req, res) => {
  try {
    const productId = Number(req.params.product_id);
    const product = await prisma.products.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ detail: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

module.exports = router;
