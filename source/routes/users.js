import express from "express";
import UserController from "../controllers/User.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/profile", authenticateToken, UserController.getProfile);
router.put("/profile", authenticateToken, UserController.updateProfile);
router.delete("/profile", authenticateToken, UserController.deleteProfile);

router.get("/", authenticateToken, authorizeRoles(2), UserController.getAllUsers);
router.get("/:id", authenticateToken, authorizeRoles(2), UserController.getUserById);
router.put("/:id", authenticateToken, authorizeRoles(2), UserController.updateUserById);

export default router; 