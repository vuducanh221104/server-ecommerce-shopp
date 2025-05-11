import express from "express";
import OrderController from "../controllers/Order.controller.js";
import { isAdmin, isAuth } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";
import { mockUser } from "../middlewares/mockUser.middleware.js";

const router = express.Router();

// Routes cho người dùng
router.get("/my-orders", apiLimiter, mockUser, OrderController.getMyOrders);
router.post(
  "/from-cart",
  apiLimiter,
  mockUser,
  OrderController.createOrderFromCart
);

// Routes cụ thể với param user_id
router.get("/user/:id", apiLimiter, mockUser, OrderController.getUserOrders);

// Routes với param id
router.get("/:id", apiLimiter, mockUser, OrderController.getOrderById);
router.post("/:id/cancel", apiLimiter, mockUser, OrderController.cancelOrder);
router.put("/:id", apiLimiter, mockUser, OrderController.updateOrder);
router.delete("/:id", apiLimiter, mockUser, OrderController.deleteOrder);
router.put(
  "/:id/status",
  apiLimiter,
  mockUser,
  OrderController.updateOrderStatus
);
router.put(
  "/:id/payment",
  apiLimiter,
  mockUser,
  OrderController.updatePaymentStatus
);
router.put(
  "/:id/tracking",
  apiLimiter,
  mockUser,
  OrderController.addTrackingInfo
);

// Routes còn lại
router.get("/", apiLimiter, mockUser, OrderController.getAllOrders);
router.post("/", apiLimiter, mockUser, OrderController.createOrder);

export default router;
