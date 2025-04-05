import { User } from "../models/index.js";
import { hashPassword, comparePassword } from "../utils/index.js";
import { Product } from "../models/index.js";
import mongoose from "mongoose";

class UserService {
  async getProfile(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new Error("User not found");
    }

    const userWithFullCart = await this.populateCart(user);
    return this.formatUser(userWithFullCart);
  }

  async populateCart(user) {
    if (!user.cart || user.cart.length === 0) {
      return user;
    }

    const productIds = user.cart.map((item) => item.product_id);

    const products = await Product.find({
      _id: { $in: productIds },
    })
      .populate({
        path: "category_id",
        select: "name slug",
        populate: {
          path: "parent",
          select: "name slug",
        },
      })
      .populate("material_id", "name slug")
      .lean();

    const userCopy = user.toObject ? user.toObject() : { ...user };

    userCopy.cart = userCopy.cart.map((cartItem) => {
      const productId = cartItem.product_id.toString();
      const fullProduct = products.find((p) => p._id.toString() === productId);

      if (fullProduct) {
        return {
          ...cartItem,
          fullProductDetails: fullProduct,
        };
      }
      return cartItem;
    });

    return userCopy;
  }

  async updateProfile(userId, userData) {
    const {
      fullName,
      gender,
      phone_number,
      address,
      dateOfBirth,
      password,
      newPassword,
    } = userData;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (newPassword) {
      if (!password) {
        throw new Error("Current password is required");
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      user.password = await hashPassword(newPassword);
    }

    if (fullName) user.fullName = fullName;
    if (gender) user.gender = gender;
    if (phone_number) user.phone_number = phone_number;
    if (address) user.address = address;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    await user.save();

    const userWithFullCart = await this.populateCart(user);
    return this.formatUser(userWithFullCart);
  }

  async deleteProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.status = 0;
    await user.save();

    return { success: true };
  }

  async getAllUsers() {
    const users = await User.find().select("-password");
    const usersWithFullCart = await Promise.all(
      users.map((user) => this.populateCart(user))
    );
    return usersWithFullCart.map((user) => this.formatUser(user));
  }

  async getUserById(id) {
    const user = await User.findById(id).select("-password");
    if (!user) {
      throw new Error("User not found");
    }

    const userWithFullCart = await this.populateCart(user);
    return this.formatUser(userWithFullCart);
  }

  async updateUserById(id, userData) {
    const { fullName, role, status } = userData;

    const user = await User.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    if (fullName) user.fullName = fullName;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;

    await user.save();

    const userWithFullCart = await this.populateCart(user);
    return this.formatUser(userWithFullCart);
  }

  formatUser(user) {
    if (!user) return null;

    const formattedCart =
      user.cart?.map((item) => {
        const fullProduct = item.fullProductDetails || {};

        return {
          product: {
            id: item.product_id?.toString() || "",
            name: item.name || fullProduct.name || "",
            price: {
              price: item.price || fullProduct.price?.original || 1790000,
              originalPrice: fullProduct.price?.original || 199000,
              discountQuantity: fullProduct.price?.discountQuantity || 10,
              currency: "VND",
            },
            category: {
              parent: {
                name: fullProduct.category_id?.parent?.name || "Áo Nam",
                slug: fullProduct.category_id?.parent?.slug || "ao-nam",
              },
              name: fullProduct.category_id?.name || "Áo Polo",
              slug: fullProduct.category_id?.slug || "ao-polo",
            },
            material: {
              name: fullProduct.material_id?.name || "Cotton",
              slug: fullProduct.material_id?.slug || "cotton",
            },
            tagIsNew: fullProduct.tagIsNew || true,
            variants: fullProduct.variants || [
              {
                name: "Tím",
                sizes: [
                  { size: "M", stock: 10 },
                  { size: "L", stock: 30 },
                  { size: "XL", stock: 100 },
                ],
              },
            ],
            colorThumbnail:
              fullProduct.thumb ||
              "https://media3.coolmate.me/cdn-cgi/image/width=100,height=100,quality=80,format=auto/uploads/December2024/ao-dat-tay-the-thao-1699-trang_(12).jpg",
            images: fullProduct.images || [
              "https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/March2025/ao-thun-nu-chay-bo-core-tee-slimfit-11872-tim_85.jpg",
              "https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/March2025/ao-thun-nu-chay-bo-core-tee-slimfit-12012-tim_7.jpg",
              "https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/March2025/ao-thun-nu-chay-bo-core-tee-slimfit-12012-tim_7.jpg",
            ],
            slug: item.slug || fullProduct.slug || "ao-polo-nam-pique-cotton",
            created_at: fullProduct.createdAt
              ? fullProduct.createdAt.toISOString()
              : "2024-08-04T04:27:43.076Z",
            updated_at: fullProduct.updatedAt
              ? fullProduct.updatedAt.toISOString()
              : "2024-11-29T15:50:18.958Z",
          },
          quantity: item.quantity || 2,
        };
      }) || [];

    const formattedAddress = user.address
      ? {
          street: user.address.street || "25 Xuân Thủy",
          ward: user.address.ward || "Thảo Điền",
          district: user.address.district || "Quận 2",
          city: user.address.city || "Hồ Chí Minh",
          country: user.address.country || "Việt Nam",
        }
      : {
          street: "25 Xuân Thủy",
          ward: "Thảo Điền",
          district: "Quận 2",
          city: "Hồ Chí Minh",
          country: "Việt Nam",
        };

    return {
      _id: user._id.toString(),
      user_name: user.username || "ducanh2211",
      email: user.email || "vng1396@gmail.com",
      password: user.password ? "HACVASFABSFN1213*...*!@ADSFHSAG" : "",
      full_name: user.fullName || "Vũ Đức Anh",
      type: user.type || "WEBSITE",
      phone_number: user.phone_number || "0377775528",
      address: formattedAddress,
      date_of_birth: user.dateOfBirth || "",
      gender: user.gender || "",
      avatar: user.avatar || "",
      role: user.role || 0,
      status: user.status || 1,
      cart: formattedCart,
      created_at: user.createdAt ? user.createdAt.toISOString() : "",
      updated_at: user.updatedAt ? user.updatedAt.toISOString() : "",
    };
  }
}

export default new UserService();
