import express from "express";
import CartController from "../controllers/Cart.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Tất cả các routes liên quan đến giỏ hàng đều yêu cầu xác thực
router.use(authenticateToken);

// Lấy tất cả sản phẩm trong giỏ hàng
router.get("/", CartController.getCart);

// Thêm sản phẩm vào giỏ hàng
router.post("/", CartController.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.patch("/:id", CartController.updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete("/:id", CartController.removeFromCart);

// Xóa tất cả sản phẩm trong giỏ hàng
router.delete("/", CartController.clearCart);

export default router;
