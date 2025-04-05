import express from "express";
import ProductController from "../controllers/Product.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", ProductController.getAllProducts);
router.get("/search", ProductController.searchProducts);
router.get("/featured", ProductController.getFeaturedProducts);
router.get("/new-arrivals", ProductController.getNewArrivals);
router.get("/category/:categoryId", ProductController.getProductsByCategory);
router.get("/:id", ProductController.getProductById);


router.post("/", ProductController.createProduct);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles(2),
  ProductController.updateProduct
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(2),
  ProductController.deleteProduct
);

router.post(
  "/:id/variants",
  authenticateToken,
  authorizeRoles(2),
  ProductController.addVariantToProduct
);

router.patch(
  "/:id/stock",
  authenticateToken,
  authorizeRoles(2),
  ProductController.updateStock
);

export default router;
