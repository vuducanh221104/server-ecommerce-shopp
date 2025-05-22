import OrderService from "../services/order.service.js";
import { CatchError } from "../config/catchError.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

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

    // Manually populate product details for each order
    const populatedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderData = OrderService.formatOrder(order);

        // Populate product details for each item
        orderData.items = await Promise.all(
          orderData.items.map(async (item) => {
            const product = await Product.findById(item.product_id).select(
              "name variants"
            );
            // Get image from variants[0].images[0]
            const variantImage = product?.variants?.[0]?.images?.[0] || "";
            const variantColorThumb =
              product?.variants?.[0]?.colorThumbnail || "";

            return {
              ...item,
              productName: product?.name || "Unknown Product",
              productImage: variantImage || variantColorThumb || "", // Use variant image or colorThumbnail as fallback
            };
          })
        );

        return orderData;
      })
    );

    return res.status(200).json({
      status: "success",
      message: "Lấy danh sách đơn hàng thành công",
      data: {
        orders: populatedOrders,
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

    console.log("getUserOrders controller called with userId:", userId);
    
    try {
      // Thử tìm kiếm đơn hàng với cả hai cách: dùng ObjectId và dùng string
      const { orders, pagination } = await OrderService.getUserOrders(userId, {
        page,
        limit,
      });

      const formattedOrders = orders.map((order) =>
        OrderService.formatOrder(order)
      );

      // Log kết quả
      console.log(`Found ${formattedOrders.length} orders for user ${userId}`);

      return res.status(200).json({
        status: "success",
        message: "Lấy danh sách đơn hàng của người dùng thành công",
        data: {
          orders: formattedOrders,
          pagination,
        },
      });
    } catch (error) {
      console.error("Error in getUserOrders controller:", error);
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi lấy danh sách đơn hàng: " + error.message,
      });
    }
  });

  getMyOrders = CatchError(async (req, res) => {
    // Đặt một ID mặc định cho test khi không có req.user
    const userId = req.user ? req.user.id : "641223d2691610b1c0639f23"; // ID mặc định để test
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

    // Đảm bảo người dùng đã đăng nhập
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Bạn cần đăng nhập để tạo đơn hàng",
      });
    }

    // Gán user_id từ thông tin đăng nhập
    orderData.user_id = req.user.id;

    // Kiểm tra dữ liệu đầu vào
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Đơn hàng phải có ít nhất một sản phẩm",
      });
    }

    // Validate item structure
    for (const item of orderData.items) {
      if (!item.product_id || !item.priceOrder || !item.quantity) {
        return res.status(400).json({
          status: "error",
          message: "Mỗi sản phẩm phải có product_id, priceOrder, và quantity",
        });
      }
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

  deleteOrder = CatchError(async (req, res) => {
    const { id } = req.params;

    try {
      // Check if order exists
      const order = await OrderService.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy đơn hàng",
        });
      }

      // Delete the order
      await OrderService.deleteOrder(id);

      return res.status(200).json({
        status: "success",
        message: "Xóa đơn hàng thành công",
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });

  // Thêm phương thức tạo đơn hàng từ giỏ hàng
  createOrderFromCart = CatchError(async (req, res) => {
    // Đảm bảo người dùng đã đăng nhập
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Bạn cần đăng nhập để tạo đơn hàng từ giỏ hàng",
      });
    }

    // Lấy thông tin người dùng
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Giỏ hàng của bạn đang trống",
      });
    }

    const { shipping_address, payment_method } = req.body;

    if (!shipping_address) {
      return res.status(400).json({
        status: "error",
        message: "Địa chỉ giao hàng là bắt buộc",
      });
    }

    try {
      // Tạo đơn hàng từ giỏ hàng
      const orderData = {
        user_id: user._id,
        customer_email: user.email,
        shipping_address,
        items: user.cart.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          thumb: item.thumb,
          slug: item.slug,
        })),
        payment: {
          method: payment_method || "COD",
          status: "PENDING",
        },
        total_amount: user.cart.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
      };

      const newOrder = await OrderService.createOrder(orderData);

      // Xóa giỏ hàng sau khi tạo đơn hàng thành công
      await User.findByIdAndUpdate(user._id, { cart: [] });

      return res.status(201).json({
        status: "success",
        message: "Tạo đơn hàng từ giỏ hàng thành công",
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
}

export default new OrderController();
