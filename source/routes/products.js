import express from "express";
import { isAdmin, isAuth } from "../middlewares/auth.middleware.js";
import ProductController from "../controllers/Product.controller.js";
import { publicApiLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Routes công khai - áp dụng publicApiLimiter
router.get("/search", publicApiLimiter, ProductController.searchProducts);
router.get(
  "/featured",
  publicApiLimiter,
  ProductController.getFeaturedProducts
);
router.get("/new-arrivals", publicApiLimiter, ProductController.getNewArrivals);
router.get(
  "/category/:id",
  publicApiLimiter,
  ProductController.getProductsByCategory
);
router.get("/slug/:slug", publicApiLimiter, ProductController.getProductBySlug);
router.get("/", publicApiLimiter, ProductController.getAllProducts);
router.get("/:id", publicApiLimiter, ProductController.getProductById);

// Routes yêu cầu quyền admin
router.post("/", ProductController.createProduct);
router.put("/:id", ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);
router.post("/:id/variants", ProductController.addVariantToProduct);
router.patch("/:id/stock", ProductController.updateStock);

export default router;
