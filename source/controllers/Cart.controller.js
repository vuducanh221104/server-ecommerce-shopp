import { CatchError } from "../config/catchError.js";
import { CartService } from "../services/index.js";

const CartController = {
  getCart: CatchError(async (req, res) => {
    const userId = req.user._id;

    const cartItems = await CartService.getCartItems(userId);

    return res.status(200).json({
      message: "Lấy giỏ hàng thành công",
      cart: cartItems,
    });
  }),

  addToCart: CatchError(async (req, res) => {
    const userId = req.user._id;
    const { product_id, quantity, color, size } = req.body;

    if (!product_id) {
      return res.status(400).json({
        message: "ID sản phẩm là bắt buộc",
      });
    }

    const cartItem = await CartService.addToCart(userId, {
      product_id,
      quantity: quantity || 1,
      color,
      size,
    });

    return res.status(200).json({
      message: "Thêm sản phẩm vào giỏ hàng thành công",
      cartItem,
    });
  }),

  updateCartItem: CatchError(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        message: "Số lượng là bắt buộc",
      });
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        message: "Số lượng phải là số nguyên dương",
      });
    }

    const updatedItem = await CartService.updateCartItem(
      userId,
      id,
      parsedQuantity
    );

    return res.status(200).json({
      message: "Cập nhật giỏ hàng thành công",
      cartItem: updatedItem,
    });
  }),

  removeFromCart: CatchError(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;

    await CartService.removeFromCart(userId, id);

    return res.status(200).json({
      message: "Xóa sản phẩm khỏi giỏ hàng thành công",
    });
  }),

  clearCart: CatchError(async (req, res) => {
    const userId = req.user._id;

    await CartService.clearCart(userId);

    return res.status(200).json({
      message: "Xóa toàn bộ giỏ hàng thành công",
    });
  }),
};

export default CartController;
