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

    if (req.body.password && !req.body.currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }

    const updatedUser = await UserService.updateProfile(userId, req.body);

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
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
}

export default new UserController();
