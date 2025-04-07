import { Order } from "../models/Order.js";

class OrderService {
  // Lấy tất cả đơn hàng
  getAllOrders = async (query = {}, options = {}) => {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    return {
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  // Lấy đơn hàng theo ID
  getOrderById = async (id) => {
    const order = await Order.findById(id).lean();
    return order;
  };

  // Lấy đơn hàng của người dùng
  getUserOrders = async (userId, options = {}) => {
    const query = { user_id: userId };
    return this.getAllOrders(query, options);
  };

  // Tạo đơn hàng mới
  createOrder = async (orderData) => {
    // Tính toán tổng tiền nếu không được cung cấp
    if (
      !orderData.total_amount &&
      orderData.items &&
      orderData.items.length > 0
    ) {
      orderData.total_amount = orderData.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    }

    const newOrder = await Order.create(orderData);
    return newOrder;
  };

  // Cập nhật đơn hàng
  updateOrder = async (id, updateData) => {
    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedOrder) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    return updatedOrder;
  };

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus = async (id, status) => {
    const allowedStatuses = [
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error("Trạng thái đơn hàng không hợp lệ");
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    return updatedOrder;
  };

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus = async (id, paymentStatus) => {
    const allowedStatuses = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"];

    if (!allowedStatuses.includes(paymentStatus)) {
      throw new Error("Trạng thái thanh toán không hợp lệ");
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { "payment.status": paymentStatus },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    return updatedOrder;
  };

  // Thêm thông tin vận chuyển
  addTrackingInfo = async (
    id,
    { delivery_partner, tracking_code, estimated_delivery_date }
  ) => {
    const updateData = {};

    if (delivery_partner) updateData.delivery_partner = delivery_partner;
    if (tracking_code) updateData.tracking_code = tracking_code;
    if (estimated_delivery_date)
      updateData.estimated_delivery_date = estimated_delivery_date;

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedOrder) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    return updatedOrder;
  };

  // Hủy đơn hàng
  cancelOrder = async (id, reason) => {
    const order = await Order.findById(id);

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (["SHIPPED", "DELIVERED"].includes(order.status)) {
      throw new Error("Không thể hủy đơn hàng đã giao hoặc đang giao");
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: "CANCELLED",
        notes: reason
          ? `${order.notes ? order.notes + " | " : ""}Lý do hủy: ${reason}`
          : order.notes,
      },
      { new: true }
    );

    return updatedOrder;
  };

  // Format dữ liệu đơn hàng trả về
  formatOrder = (order) => {
    if (!order) return null;

    return {
      id: order._id,
      user_id: order.user_id,
      customer_email: order.customer_email,
      items: order.items,
      shipping_address: order.shipping_address,
      payment: order.payment,
      total_amount: order.total_amount,
      status: order.status,
      notes: order.notes,
      admin_notes: order.admin_notes,
      delivery_partner: order.delivery_partner,
      tracking_code: order.tracking_code,
      estimated_delivery_date: order.estimated_delivery_date,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  };
}

export default new OrderService();
