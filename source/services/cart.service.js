import { User, Product } from "../models/index.js";

class CartService {
  async getCartItems(userId) {
    const user = await User.findById(userId).populate({
      path: "cart.product_id",
      select: "name thumb slug price variants total_quantity",
    });

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Transform cart items to include product details
    const cartItems = user.cart
      .map((item) => {
        const product = item.product_id;
        if (!product) {
          return null; // Skip if product doesn't exist anymore
        }

        // Find the variant that matches the color
        const variant = product.variants?.find(
          (v) => v.name === item.colorOrder
        );

        // Find size stock in the variant
        const sizeInfo = variant?.sizes?.find((s) => s.size === item.sizeOrder);

        return {
          _id: item._id,
          product_id: product._id,
          name: product.name,
          thumb: variant?.images?.[0] || product.thumb,
          slug: product.slug,
          price: product.price,
          quantity: item.quantity,
          colorOrder: item.colorOrder,
          sizeOrder: item.sizeOrder,
          stock: sizeInfo?.stock || 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      })
      .filter((item) => item !== null); // Remove null items (products that don't exist)

    return cartItems;
  }

  async addToCart(userId, cartData) {
    const { product_id, quantity = 1, colorOrder, sizeOrder } = cartData;

    const product = await Product.findById(product_id);
    if (!product) {
      throw new Error("Sản phẩm không tồn tại");
    }

    // Find the variant with the requested color
    const variant = product.variants?.find((v) => v.name === colorOrder);
    if (!variant) {
      throw new Error("Màu sắc không có sẵn");
    }

    // Find the size in the variant
    const sizeInfo = variant.sizes?.find((s) => s.size === sizeOrder);
    if (!sizeInfo) {
      throw new Error("Kích thước không có sẵn");
    }

    if (sizeInfo.stock < quantity) {
      throw new Error("Số lượng sản phẩm không đủ");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const existingCartItemIndex = user.cart.findIndex(
      (item) =>
        item.product_id.toString() === product_id.toString() &&
        item.colorOrder === colorOrder &&
        item.sizeOrder === sizeOrder
    );

    if (existingCartItemIndex !== -1) {
      const existingItem = user.cart[existingCartItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (sizeInfo.stock < newQuantity) {
        throw new Error("Số lượng sản phẩm không đủ");
      }

      user.cart[existingCartItemIndex].quantity = newQuantity;
      await user.save();

      return {
        ...user.cart[existingCartItemIndex].toObject(),
        name: product.name,
        thumb: variant.images?.[0] || product.thumb,
        slug: product.slug,
        price: product.price,
        stock: sizeInfo.stock,
      };
    }

    const newCartItem = {
      product_id,
      quantity,
      colorOrder,
      sizeOrder,
    };

    user.cart.push(newCartItem);
    await user.save();

    // Return the cart item with product details
    return {
      ...newCartItem,
      name: product.name,
      thumb: variant.images?.[0] || product.thumb,
      slug: product.slug,
      price: product.price,
      stock: sizeInfo.stock,
    };
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

    // Find the variant with the requested color
    const variant = product.variants?.find(
      (v) => v.name === cartItem.colorOrder
    );
    if (!variant) {
      throw new Error("Màu sắc không có sẵn");
    }

    // Find the size in the variant
    const sizeInfo = variant.sizes?.find((s) => s.size === cartItem.sizeOrder);
    if (!sizeInfo) {
      throw new Error("Kích thước không có sẵn");
    }

    if (sizeInfo.stock < quantity) {
      throw new Error("Số lượng sản phẩm không đủ");
    }

    user.cart[cartItemIndex].quantity = quantity;
    await user.save();

    // Return updated cart item with product details
    return {
      ...user.cart[cartItemIndex].toObject(),
      name: product.name,
      thumb: variant.images?.[0] || product.thumb,
      slug: product.slug,
      price: product.price,
      stock: sizeInfo.stock,
    };
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
