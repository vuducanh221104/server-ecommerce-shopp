import express from "express";
import OrderController from "../controllers/Order.controller.js";
import { isAdmin, isAuth } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";
import { mockUser } from "../middlewares/mockUser.middleware.js";

const router = express.Router();

// Debug route để kiểm tra đơn hàng
router.get("/debug/count", async (req, res) => {
  try {
    const { Order } = await import('../models/Order.js');
    const count = await Order.countDocuments({});
    res.status(200).json({
      status: "success",
      message: `Có ${count} đơn hàng trong database`,
      count
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi đếm đơn hàng",
      error: error.message
    });
  }
});

// Debug route để liệt kê tất cả đơn hàng
router.get("/debug/list", async (req, res) => {
  try {
    const { Order } = await import('../models/Order.js');
    const orders = await Order.find({})
      .select('user_id customer_email status createdAt')
      .limit(10)
      .lean();
    
    res.status(200).json({
      status: "success",
      message: `Lấy ${orders.length} đơn hàng đầu tiên`,
      orders
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lỗi khi lấy danh sách đơn hàng",
      error: error.message
    });
  }
});

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
