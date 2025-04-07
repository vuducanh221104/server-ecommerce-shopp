import express from "express";
import OrderController from "../controllers/Order.controller.js";
import { isAdmin, isAuth } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Routes cho người dùng đã đăng nhập
router.get("/my-orders", isAuth, apiLimiter, OrderController.getMyOrders);
router.post("/", isAuth, apiLimiter, OrderController.createOrder);
router.post("/:id/cancel", isAuth, apiLimiter, OrderController.cancelOrder);

// Routes cho admin
router.get("/", isAuth, isAdmin, apiLimiter, OrderController.getAllOrders);
router.get("/:id", isAuth, isAdmin, apiLimiter, OrderController.getOrderById);
router.get(
  "/user/:id",
  isAuth,
  isAdmin,
  apiLimiter,
  OrderController.getUserOrders
);
router.put("/:id", isAuth, isAdmin, apiLimiter, OrderController.updateOrder);
router.put(
  "/:id/status",
  isAuth,
  isAdmin,
  apiLimiter,
  OrderController.updateOrderStatus
);
router.put(
  "/:id/payment",
  isAuth,
  isAdmin,
  apiLimiter,
  OrderController.updatePaymentStatus
);
router.put(
  "/:id/tracking",
  isAuth,
  isAdmin,
  apiLimiter,
  OrderController.addTrackingInfo
);

export default router;
