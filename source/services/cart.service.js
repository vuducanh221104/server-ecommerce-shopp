import { User, Product } from "../models/index.js";

class CartService {
  async getCartItems(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    return user.cart || [];
  }

  async addToCart(userId, cartData) {
    const { product_id, quantity = 1, color, size } = cartData;

    const product = await Product.findById(product_id);
    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }

    if (product.total_quantity < quantity) {
      throw new Error("Số lượng sản phẩm không đủ");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const existingCartItemIndex = user.cart.findIndex(
      (item) =>
        item.product_id.toString() === product_id.toString() &&
        item.color === color &&
        item.size === size
    );

    if (existingCartItemIndex !== -1) {
      const existingItem = user.cart[existingCartItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (product.total_quantity < newQuantity) {
        throw new Error("Số lượng sản phẩm không đủ");
      }

      user.cart[existingCartItemIndex].quantity = newQuantity;
      await user.save();

      return user.cart[existingCartItemIndex];
    }

    const newCartItem = {
      product_id,
      name: product.name,
      thumb: product.thumb,
      slug: product.slug,
      price: product.price?.original || product.price || 0,
      quantity,
      color,
      size,
    };

    user.cart.push(newCartItem);
    await user.save();

    return newCartItem;
  }

  async updateCartItem(userId, cartItemId, quantity) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const cartItemIndex = user.cart.findIndex(
      (item) => item._id.toString() === cartItemId
    );

    if (cartItemIndex === -1) {
      throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
    }

    const cartItem = user.cart[cartItemIndex];

    const product = await Product.findById(cartItem.product_id);
    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }

    if (product.total_quantity < quantity) {
      throw new Error("Số lượng sản phẩm không đủ");
    }

    user.cart[cartItemIndex].quantity = quantity;
    await user.save();

    return user.cart[cartItemIndex];
  }

  async removeFromCart(userId, cartItemId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const cartItemIndex = user.cart.findIndex(
      (item) => item._id.toString() === cartItemId
    );

    if (cartItemIndex === -1) {
      throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
    }

    user.cart.splice(cartItemIndex, 1);
    await user.save();

    return true;
  }

  async clearCart(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    user.cart = [];
    await user.save();

    return true;
  }
}

export default new CartService();
