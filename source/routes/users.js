import express from "express";
import UserController from "../controllers/User.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// User profile routes
router.get("/profile", authenticateToken, UserController.getProfile);
router.put("/profile", authenticateToken, UserController.updateProfile);
router.delete("/profile", authenticateToken, UserController.deleteProfile);

// Change password route
router.put(
  "/profile/change-password",
  authenticateToken,
  UserController.changePassword
);

// User address routes
router.get(
  "/addresses",
  authenticateToken,
  UserController.getUserAddresses
);
router.post(
  "/addresses",
  authenticateToken,
  UserController.addUserAddress
);
router.put(
  "/addresses/:addressId",
  authenticateToken,
  UserController.updateUserAddress
);
router.delete(
  "/addresses/:addressId",
  authenticateToken,
  UserController.deleteUserAddress
);
router.put(
  "/addresses/:addressId/default",
  authenticateToken,
  UserController.setDefaultAddress
);

// Admin routes
router.get(
  "/",
  // authenticateToken,
  // authorizeRoles(2),
  UserController.getAllUsers
);
router.get(
  "/:id",
  // authenticateToken,
  // authorizeRoles(2),
  UserController.getUserById
);
router.post(
  "/",
  // authenticateToken,
  // authorizeRoles(2),
  UserController.createUser
);
router.put(
  "/:id",
  // authenticateToken,
  // authorizeRoles(2),
  UserController.updateUserById
);
router.delete(
  "/:id",
  // authenticateToken,
  // authorizeRoles(2),
  UserController.deleteUserById
);

export default router;
