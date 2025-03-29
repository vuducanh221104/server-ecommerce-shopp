import User from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/index.js";

class UserService {
  async getProfile(userId) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new Error("User not found");
    }

    return user;
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

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      gender: user.gender,
      phone_number: user.phone_number,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      avatar: user.avatar,
    };
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
    return users;
  }

  async getUserById(id) {
    const user = await User.findById(id).select("-password");
    if (!user) {
      throw new Error("User not found");
    }

    return user;
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

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    };
  }
}

export default new UserService();
