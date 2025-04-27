import crypto from "crypto";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

class MomoService {
  constructor() {
    this.config = {
      partnerCode: process.env.MOMO_PARTNER_CODE || "MOMOBKUN20180529",
      accessKey: process.env.MOMO_ACCESS_KEY || "klm05TvNBzhg7h7j",
      secretKey:
        process.env.MOMO_SECRET_KEY || "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa",
      endPoint:
        process.env.MOMO_ENDPOINT ||
        "https://test-payment.momo.vn/v2/gateway/api/create",
      ipnUrl:
        process.env.MOMO_IPN_URL ||
        "http://localhost:4000/api/v1/payment/momo/ipn",
    };
  }

  /**
   * Tạo URL thanh toán MoMo
   * @param {Object} data Dữ liệu thanh toán
   * @returns {String} URL thanh toán
   */
  async createPaymentUrl(data) {
    try {
      const { orderId, amount, orderDescription, redirectUrl } = data;

      const requestId = uuidv4();
      const orderInfo = orderDescription || `Thanh toán đơn hàng #${orderId}`;

      // Chuẩn bị dữ liệu theo format của MoMo
      const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=&ipnUrl=${this.config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

      // Tạo signature
      const signature = crypto
        .createHmac("sha256", this.config.secretKey)
        .update(rawSignature)
        .digest("hex");

      // Tạo payload gửi đến MoMo
      const requestBody = {
        partnerCode: this.config.partnerCode,
        accessKey: this.config.accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: this.config.ipnUrl,
        extraData: "",
        requestType: "captureWallet",
        signature: signature,
        lang: "vi",
      };

      // Gửi request đến MoMo
      const response = await axios.post(this.config.endPoint, requestBody);

      // Kiểm tra kết quả
      if (response.data.resultCode === 0) {
        return response.data.payUrl;
      } else {
        throw new Error(`MoMo Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error creating MoMo payment URL:", error);
      throw error;
    }
  }

  /**
   * Xác minh dữ liệu từ MoMo
   * @param {Object} params Tham số từ MoMo
   * @returns {Object} Kết quả xác minh
   */
  verifyReturnUrl(params) {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature,
      } = params;

      // Tạo chuỗi dữ liệu để xác minh
      const rawSignature = `accessKey=${
        this.config.accessKey
      }&amount=${amount}&extraData=${
        extraData || ""
      }&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      // Tạo signature để so sánh
      const checkSignature = crypto
        .createHmac("sha256", this.config.secretKey)
        .update(rawSignature)
        .digest("hex");

      // So sánh signature
      const isValidSignature = checkSignature === signature;
      const isSuccess = resultCode === "0";

      return {
        isValid: isValidSignature,
        isSuccess,
        message: message,
        orderId,
        transactionId: transId,
        amount: parseInt(amount),
      };
    } catch (error) {
      console.error("Error verifying MoMo return URL:", error);
      return {
        isValid: false,
        isSuccess: false,
        message: error.message,
        orderId: "",
        transactionId: "",
        amount: 0,
      };
    }
  }
}

export default new MomoService();
