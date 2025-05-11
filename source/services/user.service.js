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
      phoneNumber,
      address,
      dateOfBirth,
      password,
      newPassword,
      // For backward compatibility
      full_name,
      phone_number,
      date_of_birth,
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

    // Use camelCase fields with fallback to snake_case for backward compatibility
    if (fullName || full_name) user.fullName = fullName || full_name;
    if (gender) user.gender = gender;
    if (phoneNumber || phone_number)
      user.phoneNumber = phoneNumber || phone_number;
    if (address) user.address = address;
    if (dateOfBirth || date_of_birth)
      user.dateOfBirth = dateOfBirth || date_of_birth;

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

  async createUser(userData) {
    try {
      const {
        username,
        email,
        password,
        fullName,
        gender = "",
        phoneNumber = "",
        dateOfBirth = "",
        role = 0,
        status = 1,
        type = "WEBSITE",
        addresses = [],
      } = userData;

      // Check if username or email already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        if (existingUser.username === username) {
          throw new Error("Username already exists");
        }
        if (existingUser.email === email) {
          throw new Error("Email already exists");
        }
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create new user
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        fullName: fullName || username,
        gender,
        phoneNumber,
        dateOfBirth,
        role,
        status,
        type,
        addresses,
      });

      return this.formatUser(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async deleteUserById(id) {
    try {
      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return null;
      }

      // Delete the user
      await User.findByIdAndDelete(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
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
      username: user.username || "",
      email: user.email || "",
      password: user.password || "",
      fullName: user.fullName || "",
      type: user.type || "WEBSITE",
      phoneNumber: user.phoneNumber || "",
      // For backward compatibility
      phone_number: user.phoneNumber || "",
      full_name: user.fullName || "",
      address: {
        street: user.address?.street || "",
        ward: user.address?.ward || "",
        district: user.address?.district || "",
        city: user.address?.city || "",
        country: user.address?.country || "",
      },
      dateOfBirth: user.dateOfBirth || "",
      // For backward compatibility
      date_of_birth: user.dateOfBirth || "",
      gender: user.gender || "",
      avatar: user.avatar || "",
      role: user.role || 0,
      status: user.status || 1,
      cart: formattedCart,
    };
  }

  // Get all addresses for a user
  async getUserAddresses(userId) {
    const user = await User.findById(userId).select("addresses");
    if (!user) {
      throw new Error("User not found");
    }
    return user.addresses || [];
  }

  // Add a new address for a user
  async addUserAddress(userId, addressData) {
    const {
      street,
      city,
      district,
      ward,
      country = "Vietnam",
      isDefault = false,
    } = addressData;

    if (!street || !city || !district) {
      throw new Error("Street, city, and district are required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // If the new address is set as default, unset any existing default
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // If this is the first address, make it default
    const makeDefault = isDefault || user.addresses.length === 0;

    // Create the new address
    const newAddress = {
      street,
      city,
      district,
      ward,
      country,
      isDefault: makeDefault,
    };

    user.addresses.push(newAddress);
    await user.save();

    return user.addresses[user.addresses.length - 1];
  }

  // Update an existing address
  async updateUserAddress(userId, addressId, addressData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      throw new Error("Address not found");
    }

    const {
      street,
      city,
      district,
      ward,
      country = "Vietnam",
      isDefault = false,
    } = addressData;

    // If this address is being set as default, unset any existing default
    if (isDefault && !user.addresses[addressIndex].isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    // Update the address
    user.addresses[addressIndex].street =
      street || user.addresses[addressIndex].street;
    user.addresses[addressIndex].city =
      city || user.addresses[addressIndex].city;
    user.addresses[addressIndex].district =
      district || user.addresses[addressIndex].district;
    user.addresses[addressIndex].ward =
      ward || user.addresses[addressIndex].ward;
    user.addresses[addressIndex].country = country;
    user.addresses[addressIndex].isDefault = isDefault;

    await user.save();
    return user.addresses[addressIndex];
  }

  // Delete an address
  async deleteUserAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      throw new Error("Address not found");
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If the deleted address was the default and there are other addresses,
    // make the first one the default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return { success: true };
  }

  // Set an address as default
  async setDefaultAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      throw new Error("Address not found");
    }

    // Set all addresses to non-default
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });

    // Set the selected address as default
    user.addresses[addressIndex].isDefault = true;

    await user.save();
    return user.addresses[addressIndex];
  }

  // Change user password
  async changePassword(userId, currentPassword, newPassword) {
    // Validate password requirements
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Mật khẩu mới phải có ít nhất 8 ký tự");
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Không tìm thấy người dùng");
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error("Mật khẩu hiện tại không chính xác");
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the password
    user.password = hashedPassword;

    await user.save();

    return { success: true };
  }
}

export default new UserService();
