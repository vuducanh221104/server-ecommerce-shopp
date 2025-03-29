import { CatchError } from "../config/catchError.js";
import { UserService } from "../services/index.js";

const UserController = {
  getProfile: CatchError(async (req, res) => {
    const userId = req.user._id;

    try {
      const user = await UserService.getProfile(userId);

      return res.status(200).json({
        message: "User profile retrieved successfully",
        user,
      });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      throw error;
    }
  }),

  updateProfile: CatchError(async (req, res) => {
    const userId = req.user._id;

    try {
      const updatedUser = await UserService.updateProfile(userId, req.body);

      return res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      } else if (error.message === "Current password is required") {
        return res.status(400).json({ message: error.message });
      } else if (error.message === "Current password is incorrect") {
        return res.status(401).json({ message: error.message });
      }
      throw error;
    }
  }),

  deleteProfile: CatchError(async (req, res) => {
    const userId = req.user._id;

    try {
      await UserService.deleteProfile(userId);

      return res.status(200).json({
        message: "Profile deactivated successfully",
      });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      throw error;
    }
  }),

  getAllUsers: CatchError(async (req, res) => {
    const users = await UserService.getAllUsers();

    return res.status(200).json({
      message: "Users retrieved successfully",
      users,
    });
  }),

  getUserById: CatchError(async (req, res) => {
    const { id } = req.params;

    try {
      const user = await UserService.getUserById(id);

      return res.status(200).json({
        message: "User retrieved successfully",
        user,
      });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      throw error;
    }
  }),

  updateUserById: CatchError(async (req, res) => {
    const { id } = req.params;

    try {
      const updatedUser = await UserService.updateUserById(id, req.body);

      return res.status(200).json({
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      throw error;
    }
  }),
};

export default UserController;
