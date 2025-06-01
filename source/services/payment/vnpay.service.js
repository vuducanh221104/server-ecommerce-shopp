import crypto from "crypto";
import moment from "moment";
import querystring from "querystring";
import dotenv from "dotenv";
dotenv.config();

class VNPayService {
  constructor() {
    this.tmnCode = process.env.VNPAY_TMN_CODE;
    this.secretKey = process.env.VNPAY_HASH_SECRET;
    this.vnpUrl = process.env.VNPAY_URL;
    this.returnUrl = process.env.VNPAY_RETURN_URL;

   

    // Kiểm tra cấu hình
    if (!this.tmnCode || !this.secretKey || !this.vnpUrl || !this.returnUrl) {
      console.error("VNPay configuration is incomplete!");
    }
  }

  /**
   * Tạo URL thanh toán VNPay
   * @param {Object} paymentData - Thông tin thanh toán
   * @param {string} paymentData.orderId - Mã đơn hàng
   * @param {number} paymentData.amount - Số tiền thanh toán (VND)
   * @param {string} paymentData.orderDescription - Mô tả đơn hàng
   * @param {string} paymentData.orderType - Loại hàng hóa (defaultNC: Nhiều loại)
   * @param {string} paymentData.language - Ngôn ngữ (vn/en)
   * @param {string} paymentData.clientIp - IP của khách hàng
   * @returns {string} - URL thanh toán VNPay
   */ createPaymentUrl(paymentData) {
    const {
      orderId,
      amount,
      orderDescription = "Thanh toan don hang",
      orderType = "billpayment",
      language = "vn",
      clientIp,
    } = paymentData;

    const tmnCode = this.tmnCode;
    const secretKey = this.secretKey;
    const returnUrl = this.returnUrl;
    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const currCode = "VND";

    // Build params
    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: language,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderDescription,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: createDate,
    };

    // Tạo URLSearchParams để build query
    const redirectUrl = new URL("http://dummy"); // base URL không quan trọng, chỉ dùng searchParams

    Object.entries(vnp_Params)
      .sort(([key1], [key2]) => key1.toString().localeCompare(key2.toString()))
      .forEach(([key, value]) => {
        // Skip empty value
        if (!value || value === "" || value === undefined || value === null) {
          return;
        }
        redirectUrl.searchParams.append(key, value.toString());
      });

    // Tạo chữ ký
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac
      .update(Buffer.from(redirectUrl.search.slice(1).toString(), "utf-8"))
      .digest("hex");

    redirectUrl.searchParams.append("vnp_SecureHash", signed);

    // Trả về URL thanh toán
    const paymentUrl = `${this.vnpUrl}?${redirectUrl.searchParams.toString()}`;
    return paymentUrl;
  }
  /**
   * Xác thực callback từ VNPay
   * @param {Object} vnpParams - Tham số trả về từ VNPay
   * @returns {Object} - Kết quả xác thực
   */
  verifyReturnUrl(vnpParams) {
    try {
      // Lấy secure hash từ params
      const secureHash = vnpParams.vnp_SecureHash;

      if (!secureHash) {
        throw new Error("Không tìm thấy chữ ký bảo mật");
      }

      // Tạo bản sao params để không ảnh hưởng đến object gốc
      const paramsForVerify = { ...vnpParams };

      // Xóa các trường không cần thiết cho việc tạo chữ ký
      delete paramsForVerify.vnp_SecureHash;
      delete paramsForVerify.vnp_SecureHashType;

      // Sắp xếp theo thứ tự alphabet
      const sortedParams = this.sortObject(paramsForVerify);

      // Tạo chuỗi query - đảm bảo không encode để khớp với VNPay
      const signData = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      // Tạo chữ ký
      const hmac = crypto.createHmac("sha512", this.secretKey);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      // So sánh chữ ký
      const isValid = secureHash === signed;

      // Kết quả thanh toán
      const responseCode = vnpParams.vnp_ResponseCode;
      const isSuccess = responseCode === "00";

      return {
        isValid,
        isSuccess,
        amount: parseInt(vnpParams.vnp_Amount) / 100, // Chia cho 100 để lấy số tiền thực
        orderId: vnpParams.vnp_TxnRef,
        transactionId: vnpParams.vnp_TransactionNo,
        bankCode: vnpParams.vnp_BankCode,
        bankTranNo: vnpParams.vnp_BankTranNo,
        cardType: vnpParams.vnp_CardType,
        payDate: vnpParams.vnp_PayDate,
        responseCode,
        message: this.getResponseMessage(responseCode),
      };
    } catch (error) {
      console.error("Error verifying VNPay return URL:", error);
      return {
        isValid: false,
        isSuccess: false,
        message: "Lỗi xác thực dữ liệu thanh toán",
      };
    }
  }

  /**
   * Sắp xếp object theo key alphabet
   * @param {Object} obj - Object cần sắp xếp
   * @returns {Object} - Object đã sắp xếp
   */
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      sorted[key] = obj[key];
    }

    return sorted;
  }

  /**
   * Lấy thông báo từ mã phản hồi
   * @param {string} responseCode - Mã phản hồi từ VNPay
   * @returns {string} - Thông báo tương ứng
   */
  getResponseMessage(responseCode) {
    const messages = {
      "00": "Giao dịch thành công",
      "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
      "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
      10: "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
      11: "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
      12: "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
      13: "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.",
      24: "Giao dịch không thành công do: Khách hàng hủy giao dịch",
      51: "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
      65: "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
      75: "Ngân hàng thanh toán đang bảo trì.",
      79: "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch",
      99: "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
    };

    return messages[responseCode] || "Lỗi không xác định";
  }
}

export default new VNPayService();
