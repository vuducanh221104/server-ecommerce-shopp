import VNPayService from "./vnpay.service.js";
import StripeService from "./stripe.service.js";
import { Order } from "../../models/Order.js";
import EmailService from "../email.service.js";
import { User } from "../../models/User.js";

class PaymentService {
  constructor() {
    this.paymentGateways = {
      VNPAY: VNPayService,
      STRIPE: StripeService,
    };
  }

  /**
   * Khởi tạo thanh toán dựa trên phương thức
   * @param {string} method - Phương thức thanh toán (VNPAY, STRIPE)
   * @param {Object} paymentData - Thông tin thanh toán
   * @returns {Object} - Thông tin thanh toán
   */
  async initializePayment(method, paymentData) {
    try {
      const { orderId } = paymentData;

      // Tìm đơn hàng
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      // Kiểm tra trạng thái đơn hàng
      if (order.status !== "PENDING") {
        throw new Error("Đơn hàng không ở trạng thái chờ thanh toán");
      }

      // Kiểm tra trạng thái thanh toán
      if (order.payment.status !== "PENDING") {
        throw new Error("Đơn hàng đã được thanh toán hoặc đang xử lý");
      }

      let result;

      switch (method) {
        case "VNPAY":
          // Chuẩn bị dữ liệu cho VNPay
          const vnpayData = {
            orderId: orderId.toString(),
            amount: order.total_amount,
            orderDescription: `Thanh toán đơn hàng #${orderId}`,
            clientIp: paymentData.clientIp,
          };

          result = {
            method: "VNPAY",
            redirectUrl: this.paymentGateways.VNPAY.createPaymentUrl(vnpayData),
          };
          break;

        case "STRIPE":
          // Chuẩn bị dữ liệu cho Stripe
          const stripeData = {
            orderId: orderId.toString(),
            amount: order.total_amount,
            customerEmail: order.customer_email,
            lineItems: order.items,
            successUrl: paymentData.successUrl,
            cancelUrl: paymentData.cancelUrl,
          };

          const stripeSession =
            await this.paymentGateways.STRIPE.createCheckoutSession(stripeData);

          result = {
            method: "STRIPE",
            sessionId: stripeSession.sessionId,
            redirectUrl: stripeSession.url,
            publishableKey: stripeSession.publishableKey,
          };
          break;

        default:
          throw new Error("Phương thức thanh toán không được hỗ trợ");
      }

      // Cập nhật thông tin thanh toán đơn hàng
      await Order.findByIdAndUpdate(orderId, {
        "payment.method": method,
        "payment.transaction_id": result.sessionId || null,
      });

      return result;
    } catch (error) {
      console.error("Error initializing payment:", error);
      throw error;
    }
  }

  /**
   * Xác nhận thanh toán VNPay
   * @param {Object} params - Tham số từ VNPay
   * @returns {Object} - Kết quả xác nhận thanh toán
   */
  async confirmVNPayPayment(params) {
    try {
      const verifyResult = this.paymentGateways.VNPAY.verifyReturnUrl(params);

      if (!verifyResult.isValid) {
        throw new Error("Dữ liệu thanh toán không hợp lệ");
      }

      const orderId = verifyResult.orderId;
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      // Cập nhật trạng thái thanh toán
      const updateData = {
        "payment.status": verifyResult.isSuccess ? "COMPLETED" : "FAILED",
        "payment.transaction_id": verifyResult.transactionId,
        "payment.payment_date": new Date(),
      };

      if (verifyResult.isSuccess) {
        updateData.status = "PROCESSING";
      }

      const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
        new: true,
      });

      // Gửi email xác nhận
      if (verifyResult.isSuccess) {
        await this.sendPaymentConfirmationEmail(updatedOrder);
      }

      return {
        success: verifyResult.isSuccess,
        message: verifyResult.message,
        order: updatedOrder,
      };
    } catch (error) {
      console.error("Error confirming VNPay payment:", error);
      throw error;
    }
  }

  /**
   * Xác nhận thanh toán Stripe
   * @param {string} sessionId - Session ID từ Stripe
   * @returns {Object} - Kết quả xác nhận thanh toán
   */
  async confirmStripePayment(sessionId) {
    try {
      const session = await this.paymentGateways.STRIPE.getCheckoutSession(
        sessionId
      );

      // Kiểm tra trạng thái thanh toán
      if (session.payment_status !== "paid") {
        return {
          success: false,
          message: "Thanh toán chưa hoàn tất",
          order: null,
        };
      }

      const orderId = session.client_reference_id || session.metadata?.order_id;

      if (!orderId) {
        throw new Error("Không tìm thấy thông tin đơn hàng");
      }

      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      // Cập nhật trạng thái thanh toán
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          "payment.status": "COMPLETED",
          "payment.transaction_id": session.payment_intent,
          "payment.payment_date": new Date(),
          status: "PROCESSING",
        },
        { new: true }
      );

      // Gửi email xác nhận
      await this.sendPaymentConfirmationEmail(updatedOrder);

      return {
        success: true,
        message: "Thanh toán thành công",
        order: updatedOrder,
      };
    } catch (error) {
      console.error("Error confirming Stripe payment:", error);
      throw error;
    }
  }

  /**
   * Xử lý webhook Stripe
   * @param {string} payload - Dữ liệu webhook
   * @param {string} signature - Chữ ký webhook
   * @returns {Object} - Kết quả xử lý webhook
   */
  async handleStripeWebhook(payload, signature) {
    try {
      const eventData = await this.paymentGateways.STRIPE.handleWebhook(
        payload,
        signature
      );

      if (
        eventData.type === "checkout.session.completed" &&
        eventData.isSuccess
      ) {
        const orderId = eventData.orderId;

        if (orderId) {
          await Order.findByIdAndUpdate(orderId, {
            "payment.status": "COMPLETED",
            "payment.transaction_id": eventData.sessionId,
            "payment.payment_date": new Date(),
            status: "PROCESSING",
          });

          const order = await Order.findById(orderId);

          // Gửi email xác nhận
          if (order) {
            await this.sendPaymentConfirmationEmail(order);
          }
        }
      }

      return eventData;
    } catch (error) {
      console.error("Error handling Stripe webhook:", error);
      throw error;
    }
  }

  /**
   * Gửi email xác nhận thanh toán
   * @param {Object} order - Đơn hàng đã thanh toán
   */
  async sendPaymentConfirmationEmail(order) {
    try {
      let user = null;

      if (order.user_id) {
        user = await User.findById(order.user_id);
      }

      const customerName = user
        ? user.full_name
        : order.shipping_address.full_name;

      await EmailService.sendOrderConfirmationEmail(
        order.customer_email,
        customerName,
        order
      );
    } catch (error) {
      console.error("Error sending payment confirmation email:", error);
    }
  }
}

export default new PaymentService();
