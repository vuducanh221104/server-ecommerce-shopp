import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";

class OrderService {
  // Helper function to find the variant thumb based on color
  findVariantThumb = (product, colorName) => {
    if (!product || !product.variants || !Array.isArray(product.variants)) {
      return product?.thumb || "";
    }

    // Find the variant with the matching color name
    const variant = product.variants.find((v) => v.name === colorName);

    // If found, return the first image from the variant's images array
    if (variant && variant.images && variant.images.length > 0) {
      return variant.images[0];
    }

    // Fallback to product thumbnail
    return product.thumb || "";
  };

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
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    // Fetch orders
    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    // Enhance orders with product information
    const enhancedOrders = await Promise.all(
      orders.map(async (order) => {
        // Process each order item to include product details
        const enhancedItems = await Promise.all(
          order.items.map(async (item) => {
            try {
              // Fetch product details
              const product = await Product.findById(item.product_id).lean();

              if (product) {
                // Find the appropriate thumbnail based on color
                const thumb = this.findVariantThumb(product, item.colorOrder);

                // Return enhanced item with product details
                return {
                  ...item,
                  productName: product.name,
                  productSlug: product.slug,
                  thumb: thumb,
                };
              }

              return item;
            } catch (error) {
              console.error(
                `Error fetching product details for ${item.product_id}:`,
                error
              );
              return item;
            }
          })
        );

        return {
          ...order,
          items: enhancedItems,
        };
      })
    );

    return {
      orders: enhancedOrders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
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

    // Nếu đơn hàng có user_id, thêm order vào danh sách orders của user
    if (orderData.user_id) {
      await User.findByIdAndUpdate(
        orderData.user_id,
        { $push: { orders: newOrder._id } },
        { new: true }
      );
    }

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
    const allowedStatuses = [
      "PENDING",
      "PAID",
      "COMPLETED",
      "FAILED",
      "REFUNDED",
    ];

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
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: "CANCELLED",
        "cancellation.reason": reason,
        "cancellation.date": new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    return updatedOrder;
  };

  // Xóa đơn hàng
  deleteOrder = async (id) => {
    const order = await Order.findById(id);

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    // If the order has a user_id, remove the order reference from user's orders array
    if (order.user_id) {
      await User.findByIdAndUpdate(
        order.user_id,
        { $pull: { orders: id } },
        { new: true }
      );
    }

    // Delete the order
    await Order.findByIdAndDelete(id);

    return true;
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
