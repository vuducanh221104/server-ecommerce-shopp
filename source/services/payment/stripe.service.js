import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  }

  /**
   * Tạo session thanh toán Stripe
   * @param {Object} paymentData - Thông tin thanh toán
   * @param {string} paymentData.orderId - Mã đơn hàng
   * @param {number} paymentData.amount - Số tiền thanh toán (VND)
   * @param {string} paymentData.customerEmail - Email khách hàng
   * @param {Array} paymentData.lineItems - Danh sách sản phẩm
   * @returns {Object} - Thông tin session thanh toán
   */
  async createCheckoutSession(paymentData) {
    const {
      orderId,
      amount,
      customerEmail,
      lineItems = [],
      successUrl,
      cancelUrl,
    } = paymentData;

    // Tạo các line items cho Stripe
    const stripeLineItems = lineItems.map((item) => ({
      price_data: {
        currency: "usd", // USD
        product_data: {
          name: item.name,
          images: item.thumb ? [item.thumb] : [],
          description:
            `${item.color ? `Màu: ${item.color}` : ""} ${
              item.size ? `Kích thước: ${item.size}` : ""
            }`.trim() || undefined,
        },
        unit_amount: this.convertVNDtoUSD(item.price) * 100, // Đơn vị cent
      },
      quantity: item.quantity,
    }));

    // Tạo session thanh toán
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      mode: "payment",
      success_url:
        successUrl ||
        `${process.env.BASE_URL_CLIENT}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.BASE_URL_CLIENT}/payment/cancel`,
      client_reference_id: orderId,
      customer_email: customerEmail,
      metadata: {
        order_id: orderId,
        amount_vnd: amount,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
      publishableKey: this.publishableKey,
    };
  }

  /**
   * Lấy thông tin session thanh toán
   * @param {string} sessionId - ID session thanh toán
   * @returns {Object} - Thông tin session thanh toán
   */
  async getCheckoutSession(sessionId) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "line_items"],
    });

    return session;
  }

  /**
   * Xử lý webhook từ Stripe
   * @param {string} payload - Dữ liệu webhook
   * @param {string} signature - Chữ ký webhook
   * @returns {Object} - Thông tin sự kiện
   */
  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case "checkout.session.completed":
          return this.handleCheckoutSessionCompleted(event.data.object);
        case "payment_intent.succeeded":
          return this.handlePaymentIntentSucceeded(event.data.object);
        case "payment_intent.payment_failed":
          return this.handlePaymentIntentFailed(event.data.object);
        default:
          return { type: event.type, data: event.data.object };
      }
    } catch (error) {
      console.error("Webhook error:", error.message);
      throw new Error(`Webhook Error: ${error.message}`);
    }
  }

  /**
   * Xử lý sự kiện checkout.session.completed
   * @param {Object} session - Thông tin session
   * @returns {Object} - Thông tin thanh toán
   */
  handleCheckoutSessionCompleted(session) {
    const { client_reference_id, metadata, customer_details, amount_total } =
      session;

    return {
      type: "checkout.session.completed",
      orderId: client_reference_id || metadata?.order_id,
      customerEmail: customer_details?.email,
      amountUSD: amount_total / 100, // Chuyển từ cent sang USD
      amountVND: metadata?.amount_vnd,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      isSuccess: session.payment_status === "paid",
    };
  }

  /**
   * Xử lý sự kiện payment_intent.succeeded
   * @param {Object} paymentIntent - Thông tin payment intent
   * @returns {Object} - Thông tin thanh toán
   */
  handlePaymentIntentSucceeded(paymentIntent) {
    return {
      type: "payment_intent.succeeded",
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Chuyển từ cent sang USD
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method,
      isSuccess: true,
    };
  }

  /**
   * Xử lý sự kiện payment_intent.payment_failed
   * @param {Object} paymentIntent - Thông tin payment intent
   * @returns {Object} - Thông tin thanh toán
   */
  handlePaymentIntentFailed(paymentIntent) {
    return {
      type: "payment_intent.payment_failed",
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Chuyển từ cent sang USD
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method,
      errorMessage: paymentIntent.last_payment_error?.message,
      isSuccess: false,
    };
  }

  /**
   * Chuyển đổi từ VND sang USD
   * @param {number} amount - Số tiền VND
   * @returns {number} - Số tiền USD
   */
  convertVNDtoUSD(amount) {
    // Tỷ giá USD/VND ~ 24,000 VND = 1 USD
    // Bạn có thể cập nhật cố định hoặc gọi API tỷ giá nếu cần
    const exchangeRate = 24000;
    return Math.round((amount / exchangeRate) * 100) / 100; // Làm tròn 2 chữ số thập phân
  }
}

export default new StripeService();
