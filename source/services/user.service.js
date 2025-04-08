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
        return {
          product: {
            id: item.product_id?.toString() || "",
            name: item.name || "",
            price: {
              price: item.price || 0,
              originalPrice: item.price || 0,
              discountQuantity: item.discountQuantity || 0,
              currency: "VND",
            },
            category: item.category_id
              ? {
                  parent: {
                    name: item.category_id.parent?.name || "",
                    slug: item.category_id.parent?.slug || "",
                  },
                  name: item.category_id.name || "",
                  slug: item.category_id.slug || "",
                }
              : null,
            material: item.material_id
              ? {
                  name: item.material_id.name || "",
                  slug: item.material_id.slug || "",
                }
              : null,
            tagIsNew: item.tagIsNew || false,
            variants: item.variants || [],
            colorThumbnail: item.colorThumbnail || "",
            images: item.images || [],
            slug: item.slug || "",
            created_at: item.createdAt?.toISOString() || "",
            updated_at: item.updatedAt?.toISOString() || "",
          },
          quantity: item.quantity || 0,
        };
      }) || [];

    return {
      _id: user._id.toString(),
      user_name: user.user_name || "",
      email: user.email || "",
      password: user.password || "",
      full_name: user.full_name || "",
      type: user.type || "WEBSITE",
      phone_number: user.phone_number || "",
      address: {
        street: user.address?.street || "",
        ward: user.address?.ward || "",
        district: user.address?.district || "",
        city: user.address?.city || "",
        country: user.address?.country || "",
      },
      date_of_birth: user.date_of_birth || "",
      gender: user.gender || "",
      avatar: user.avatar || "",
      role: user.role || 0,
      status: user.status || 1,
      cart: formattedCart,
    };
  }
}

export default new UserService();
