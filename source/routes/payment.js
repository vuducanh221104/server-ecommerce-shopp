import express from "express";
import PaymentController from "../controllers/Payment.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";
import bodyParser from "body-parser";

const router = express.Router();

// Route để khởi tạo giao dịch thanh toán
router.post(
  "/initialize",
  isAuth,
  apiLimiter,
  PaymentController.initializePayment
);

// Route để xác nhận thanh toán Stripe
router.post(
  "/stripe/confirm",
  isAuth,
  apiLimiter,
  PaymentController.confirmStripePayment
);

// Route để lấy thông tin thanh toán của đơn hàng
router.get(
  "/order/:id",
  isAuth,
  apiLimiter,
  PaymentController.getOrderPaymentInfo
);

// Routes callback VNPay - không cần xác thực người dùng
router.get("/vnpay/return", PaymentController.handleVNPayReturn);
router.get("/vnpay/ipn", PaymentController.handleVNPayIPN);

// Route webhook Stripe - cần raw body để xác minh chữ ký
// Sử dụng middleware đặc biệt để lấy raw body
router.post(
  "/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  PaymentController.handleStripeWebhook
);

export default router;
