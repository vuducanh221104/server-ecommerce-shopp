import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true" || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  /**
   * Gửi email
   * @param {Object} mailOptions - Cấu hình email
   * @returns {Promise<Object>} - Kết quả gửi email
   */
  async sendEmail(mailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || "Shop Ecommerce"}" <${
          process.env.EMAIL_FROM || process.env.EMAIL_USER
        }>`,
        ...mailOptions,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gửi email xác nhận đăng ký
   * @param {string} to - Email người nhận
   * @param {string} name - Tên người nhận
   * @param {string} confirmationUrl - URL xác nhận
   * @returns {Promise<Object>} - Kết quả gửi email
   */
  async sendWelcomeEmail(to, name, confirmationUrl) {
    const mailOptions = {
      to,
      subject: "Chào mừng bạn đến với Shop Ecommerce",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Xin chào ${name}!</h2>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại Shop Ecommerce.</p>
          <p>Để xác nhận tài khoản của bạn, vui lòng nhấp vào nút bên dưới:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Xác nhận tài khoản</a>
          </div>
          <p>Nếu bạn không yêu cầu tạo tài khoản này, vui lòng bỏ qua email này.</p>
          <p>Trân trọng,<br/>Đội ngũ Shop Ecommerce</p>
        </div>
      `,
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Gửi email đặt lại mật khẩu
   * @param {string} to - Email người nhận
   * @param {string} name - Tên người nhận
   * @param {string} resetUrl - URL đặt lại mật khẩu
   * @returns {Promise<Object>} - Kết quả gửi email
   */
  async sendPasswordResetEmail(to, name, resetUrl) {
    const mailOptions = {
      to,
      subject: "Đặt lại mật khẩu tại Shop Ecommerce",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Xin chào ${name}!</h2>
          <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          <p>Để đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Đặt lại mật khẩu</a>
          </div>
          <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.</p>
          <p>Trân trọng,<br/>Đội ngũ Shop Ecommerce</p>
        </div>
      `,
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Gửi email xác nhận đơn hàng
   * @param {string} to - Email người nhận
   * @param {string} name - Tên người nhận
   * @param {Object} order - Thông tin đơn hàng
   * @returns {Promise<Object>} - Kết quả gửi email
   */
  async sendOrderConfirmationEmail(to, name, order) {
    let itemsHtml = "";
    let totalAmount = 0;

    order.items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;

      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
            <img src="${item.thumb}" alt="${
        item.name
      }" style="width: 60px; height: 60px; object-fit: cover;">
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${
            item.name
          }</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
            ${item.color ? `Màu: ${item.color}<br>` : ""}
            ${item.size ? `Kích thước: ${item.size}` : ""}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${
            item.quantity
          }</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.price.toLocaleString(
            "vi-VN"
          )}đ</td>
          <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${itemTotal.toLocaleString(
            "vi-VN"
          )}đ</td>
        </tr>
      `;
    });

    const shippingAddress = order.shipping_address;
    const addressHtml = `
      ${shippingAddress.full_name}<br>
      ${shippingAddress.phone_number}<br>
      ${shippingAddress.street}, ${shippingAddress.ward}, ${shippingAddress.district}<br>
      ${shippingAddress.city}, ${shippingAddress.country}
    `;

    const mailOptions = {
      to,
      subject: `Xác nhận đơn hàng #${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Xin chào ${name}!</h2>
          <p>Cảm ơn bạn đã đặt hàng tại Shop Ecommerce. Đơn hàng của bạn đã được xác nhận.</p>
          
          <h3 style="margin-top: 30px; color: #333;">Chi tiết đơn hàng #${
            order._id
          }</h3>
          <p><strong>Ngày đặt hàng:</strong> ${new Date(
            order.createdAt
          ).toLocaleDateString("vi-VN")}</p>
          <p><strong>Phương thức thanh toán:</strong> ${
            order.payment.method
          }</p>
          <p><strong>Trạng thái thanh toán:</strong> ${order.payment.status}</p>
          
          <h4 style="margin-top: 20px; color: #333;">Địa chỉ giao hàng:</h4>
          <p>${addressHtml}</p>
          
          <h4 style="margin-top: 20px; color: #333;">Sản phẩm đã đặt:</h4>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Hình ảnh</th>
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: left;">Thuộc tính</th>
                <th style="padding: 10px; text-align: left;">Số lượng</th>
                <th style="padding: 10px; text-align: left;">Đơn giá</th>
                <th style="padding: 10px; text-align: left;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="padding: 10px; text-align: right; font-weight: bold;">Tổng cộng:</td>
                <td style="padding: 10px; font-weight: bold;">${order.total_amount.toLocaleString(
                  "vi-VN"
                )}đ</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p>Nếu bạn có bất kỳ câu hỏi nào về đơn hàng của mình, vui lòng liên hệ với chúng tôi tại <a href="mailto:support@shopecommerce.com">support@shopecommerce.com</a></p>
            <p>Trân trọng,<br/>Đội ngũ Shop Ecommerce</p>
          </div>
        </div>
      `,
    };

    return this.sendEmail(mailOptions);
  }

  /**
   * Gửi email cập nhật trạng thái đơn hàng
   * @param {string} to - Email người nhận
   * @param {string} name - Tên người nhận
   * @param {Object} order - Thông tin đơn hàng
   * @param {string} prevStatus - Trạng thái trước đó
   * @returns {Promise<Object>} - Kết quả gửi email
   */
  async sendOrderStatusUpdateEmail(to, name, order, prevStatus) {
    const statusMapping = {
      PENDING: "Chờ xử lý",
      PROCESSING: "Đang xử lý",
      SHIPPED: "Đang giao hàng",
      DELIVERED: "Đã giao hàng",
      CANCELLED: "Đã hủy",
      RETURNED: "Đã trả hàng",
    };

    const mailOptions = {
      to,
      subject: `Cập nhật trạng thái đơn hàng #${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Xin chào ${name}!</h2>
          <p>Đơn hàng #${order._id} của bạn đã được cập nhật.</p>
          
          <div style="margin: 30px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <p><strong>Trạng thái trước đó:</strong> ${
              statusMapping[prevStatus] || prevStatus
            }</p>
            <p><strong>Trạng thái mới:</strong> ${
              statusMapping[order.status] || order.status
            }</p>
          </div>
          
          ${
            order.status === "SHIPPED" && order.tracking_code
              ? `
            <div style="margin: 20px 0;">
              <p><strong>Mã vận đơn:</strong> ${order.tracking_code}</p>
              <p><strong>Đơn vị vận chuyển:</strong> ${
                order.delivery_partner || "Chưa cập nhật"
              }</p>
              ${
                order.estimated_delivery_date
                  ? `<p><strong>Dự kiến giao hàng:</strong> ${new Date(
                      order.estimated_delivery_date
                    ).toLocaleDateString("vi-VN")}</p>`
                  : ""
              }
            </div>
          `
              : ""
          }
          
          <p>Bạn có thể kiểm tra chi tiết đơn hàng của mình bằng cách đăng nhập vào tài khoản hoặc nhấp vào nút bên dưới:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL_CLIENT}/orders/${
        order._id
      }" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Xem đơn hàng</a>
          </div>
          
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
          <p>Trân trọng,<br/>Đội ngũ Shop Ecommerce</p>
        </div>
      `,
    };

    return this.sendEmail(mailOptions);
  }
}

export default new EmailService();
