import OrderService from "../services/order.service.js";
import { CatchError } from "../config/catchError.js";

class OrderController {
  getAllOrders = CatchError(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const { orders, pagination } = await OrderService.getAllOrders(query, {
      page,
      limit,
    });

    const formattedOrders = orders.map((order) =>
      OrderService.formatOrder(order)
    );

    return res.status(200).json({
      status: "success",
      message: "Lấy danh sách đơn hàng thành công",
      data: {
        orders: formattedOrders,
        pagination,
      },
    });
  });

  getOrderById = CatchError(async (req, res) => {
    const { id } = req.params;
    const order = await OrderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy đơn hàng",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lấy thông tin đơn hàng thành công",
      data: {
        order: OrderService.formatOrder(order),
      },
    });
  });

  getUserOrders = CatchError(async (req, res) => {
    const { id: userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const { orders, pagination } = await OrderService.getUserOrders(userId, {
      page,
      limit,
    });

    const formattedOrders = orders.map((order) =>
      OrderService.formatOrder(order)
    );

    return res.status(200).json({
      status: "success",
      message: "Lấy danh sách đơn hàng của người dùng thành công",
      data: {
        orders: formattedOrders,
        pagination,
      },
    });
  });

  getMyOrders = CatchError(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const { orders, pagination } = await OrderService.getUserOrders(userId, {
      page,
      limit,
    });

    const formattedOrders = orders.map((order) =>
      OrderService.formatOrder(order)
    );

    return res.status(200).json({
      status: "success",
      message: "Lấy danh sách đơn hàng của bạn thành công",
      data: {
        orders: formattedOrders,
        pagination,
      },
    });
  });

  createOrder = CatchError(async (req, res) => {
    const orderData = req.body;

    // Gán user_id nếu đã đăng nhập
    if (req.user) {
      orderData.user_id = req.user.id;
    }

    // Kiểm tra dữ liệu đầu vào
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Đơn hàng phải có ít nhất một sản phẩm",
      });
    }

    if (!orderData.customer_email) {
      return res.status(400).json({
        status: "error",
        message: "Email khách hàng là bắt buộc",
      });
    }

    if (!orderData.shipping_address) {
      return res.status(400).json({
        status: "error",
        message: "Địa chỉ giao hàng là bắt buộc",
      });
    }

    if (!orderData.payment) {
      return res.status(400).json({
        status: "error",
        message: "Thông tin thanh toán là bắt buộc",
      });
    }

    try {
      const newOrder = await OrderService.createOrder(orderData);

      return res.status(201).json({
        status: "success",
        message: "Tạo đơn hàng thành công",
        data: {
          order: OrderService.formatOrder(newOrder),
        },
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });

  updateOrder = CatchError(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const updatedOrder = await OrderService.updateOrder(id, updateData);

      return res.status(200).json({
        status: "success",
        message: "Cập nhật đơn hàng thành công",
        data: {
          order: OrderService.formatOrder(updatedOrder),
        },
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });

  updateOrderStatus = CatchError(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: "error",
        message: "Trạng thái đơn hàng là bắt buộc",
      });
    }

    try {
      const updatedOrder = await OrderService.updateOrderStatus(id, status);

      return res.status(200).json({
        status: "success",
        message: "Cập nhật trạng thái đơn hàng thành công",
        data: {
          order: OrderService.formatOrder(updatedOrder),
        },
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });

  updatePaymentStatus = CatchError(async (req, res) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        status: "error",
        message: "Trạng thái thanh toán là bắt buộc",
      });
    }

    try {
      const updatedOrder = await OrderService.updatePaymentStatus(
        id,
        paymentStatus
      );

      return res.status(200).json({
        status: "success",
        message: "Cập nhật trạng thái thanh toán thành công",
        data: {
          order: OrderService.formatOrder(updatedOrder),
        },
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });

  addTrackingInfo = CatchError(async (req, res) => {
    const { id } = req.params;
    const trackingInfo = req.body;

    try {
      const updatedOrder = await OrderService.addTrackingInfo(id, trackingInfo);

      return res.status(200).json({
        status: "success",
        message: "Cập nhật thông tin vận chuyển thành công",
        data: {
          order: OrderService.formatOrder(updatedOrder),
        },
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });

  cancelOrder = CatchError(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
      const updatedOrder = await OrderService.cancelOrder(id, reason);

      return res.status(200).json({
        status: "success",
        message: "Hủy đơn hàng thành công",
        data: {
          order: OrderService.formatOrder(updatedOrder),
        },
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });
}

export default new OrderController();
