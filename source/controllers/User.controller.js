import { CatchError } from "../config/catchError.js";
import { UserService } from "../services/index.js";

class UserController {
  getProfile = CatchError(async (req, res) => {
    const userId = req.user._id;
    const user = await UserService.getProfile(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User profile retrieved successfully",
      user,
    });
  });

  updateProfile = CatchError(async (req, res) => {
    const userId = req.user._id;

    // Log the incoming request data for debugging
    console.log("Update profile request:", req.body);

    if (req.body.password && !req.body.currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }

    try {
      const updatedUser = await UserService.updateProfile(userId, req.body);

      return res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(400).json({
        message: error.message || "Failed to update profile",
      });
    }
  });

  deleteProfile = CatchError(async (req, res) => {
    const userId = req.user._id;

    const result = await UserService.deleteProfile(userId);

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile deactivated successfully",
    });
  });

  getAllUsers = CatchError(async (req, res) => {
    const users = await UserService.getAllUsers();

    return res.status(200).json({
      message: "Users retrieved successfully",
      users,
    });
  });

  getUserById = CatchError(async (req, res) => {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User retrieved successfully",
      user,
    });
  });

  createUser = CatchError(async (req, res) => {
    try {
      const userData = req.body;

      if (!userData.email || !userData.username || !userData.password) {
        return res.status(400).json({
          message: "Email, username and password are required",
        });
      }

      const newUser = await UserService.createUser(userData);

      return res.status(201).json({
        message: "User created successfully",
        user: newUser,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(400).json({
        message: error.message || "Failed to create user",
      });
    }
  });

  updateUserById = CatchError(async (req, res) => {
    const { id } = req.params;
    const updatedUser = await UserService.updateUserById(id, req.body);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  });

  deleteUserById = CatchError(async (req, res) => {
    const { id } = req.params;
    const result = await UserService.deleteUserById(id);

    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });
  });

  // Get all user addresses
  getUserAddresses = CatchError(async (req, res) => {
    const userId = req.user._id;
    const addresses = await UserService.getUserAddresses(userId);

    return res.status(200).json({
      message: "Addresses retrieved successfully",
      addresses,
    });
  });

  // Add a new address
  addUserAddress = CatchError(async (req, res) => {
    const userId = req.user._id;
    const newAddress = await UserService.addUserAddress(userId, req.body);

    return res.status(201).json({
      message: "Address added successfully",
      address: newAddress,
    });
  });

  // Update an address
  updateUserAddress = CatchError(async (req, res) => {
    const userId = req.user._id;
    const { addressId } = req.params;

    const updatedAddress = await UserService.updateUserAddress(
      userId,
      addressId,
      req.body
    );

    return res.status(200).json({
      message: "Address updated successfully",
      address: updatedAddress,
    });
  });

  // Delete an address
  deleteUserAddress = CatchError(async (req, res) => {
    const userId = req.user._id;
    const { addressId } = req.params;

    await UserService.deleteUserAddress(userId, addressId);

    return res.status(200).json({
      message: "Address deleted successfully",
    });
  });

  // Set an address as default
  setDefaultAddress = CatchError(async (req, res) => {
    const userId = req.user._id;
    const { addressId } = req.params;

    const updatedAddress = await UserService.setDefaultAddress(
      userId,
      addressId
    );

    return res.status(200).json({
      message: "Default address set successfully",
      address: updatedAddress,
    });
  });

  // Change user password
  changePassword = CatchError(async (req, res) => {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Cần cung cấp cả mật khẩu hiện tại và mật khẩu mới",
      });
    }

    try {
      await UserService.changePassword(userId, currentPassword, newPassword);

      return res.status(200).json({
        message: "Thay đổi mật khẩu thành công",
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Không thể thay đổi mật khẩu",
      });
    }
  });
}

export default new UserController();
