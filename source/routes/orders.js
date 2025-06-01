import express from "express";
import OrderController from "../controllers/Order.controller.js";
import { isAdmin, isAuth } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Add a new route to check if user can review a product
router.get("/can-review/:productId", isAuth, OrderController.canReviewProduct);


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
router.get("/my-orders", apiLimiter, isAuth, OrderController.getMyOrders);
router.post(
  "/from-cart",
  apiLimiter,
  isAuth,
  OrderController.createOrderFromCart
);

// Routes cụ thể với param user_id
router.get("/user/:id", apiLimiter, isAuth, async (req, res, next) => {
  // Log thông tin để debug
  console.log(`[DEBUG] Getting orders for user: ${req.params.id}`);
  console.log(`[DEBUG] Query params:`, req.query);
  
  // Tiếp tục xử lý
  return OrderController.getUserOrders(req, res, next);
});

// Routes với param id
router.get("/:id", apiLimiter, isAuth, OrderController.getOrderById);
router.post("/:id/cancel", apiLimiter, isAuth, OrderController.cancelOrder);
router.put("/:id", apiLimiter, isAuth, OrderController.updateOrder);
router.delete("/:id", apiLimiter, isAuth, OrderController.deleteOrder);
router.put(
  "/:id/status",
  apiLimiter,
  isAuth,
  OrderController.updateOrderStatus
);
router.put(
  "/:id/payment",
  apiLimiter,
  isAuth,
  OrderController.updatePaymentStatus
);
router.put(
  "/:id/tracking",
  apiLimiter,
  isAuth,
  OrderController.addTrackingInfo
);

// Routes còn lại
router.get("/", isAuth, OrderController.getAllOrders);
router.post("/", isAuth, OrderController.createOrder);


export default router;
