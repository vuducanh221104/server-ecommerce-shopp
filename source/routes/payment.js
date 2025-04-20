import express from "express";
import PaymentController from "../controllers/Payment.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";
import bodyParser from "body-parser";
import { mockUser } from "../middlewares/mockUser.middleware.js";

const router = express.Router();

// Route để lấy danh sách phương thức thanh toán
router.get(
  "/methods",
  apiLimiter,
  mockUser,
  PaymentController.getAvailablePaymentMethods
);

// Route để khởi tạo giao dịch thanh toán
router.post(
  "/initialize",
  apiLimiter,
  mockUser,
  PaymentController.initializePayment
);

// Route để xác nhận thanh toán Stripe
router.post(
  "/stripe/confirm",
  apiLimiter,
  mockUser,
  PaymentController.confirmStripePayment
);

// Route để lấy thông tin thanh toán của đơn hàng
router.get(
  "/order/:id",
  apiLimiter,
  mockUser,
  PaymentController.getOrderPaymentInfo
);

// Route xử lý thanh toán COD
router.post(
  "/cod/process",
  apiLimiter,
  mockUser,
  PaymentController.processCODPayment
);

// Route kiểm tra trạng thái thanh toán
router.get(
  "/status/:orderId",
  apiLimiter,
  mockUser,
  PaymentController.checkPaymentStatus
);

// Routes callback VNPay - không cần xác thực người dùng
router.get("/vnpay/return", PaymentController.handleVNPayReturn);
router.get("/vnpay/ipn", PaymentController.handleVNPayIPN);

// Routes callback MoMo - không cần xác thực người dùng
router.get("/momo/return", PaymentController.handleMoMoReturn);
router.get("/momo/ipn", PaymentController.handleMoMoIPN);

// Route webhook Stripe - cần raw body để xác minh chữ ký
// Sử dụng middleware đặc biệt để lấy raw body
router.post(
  "/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  PaymentController.handleStripeWebhook
);

export default router;
