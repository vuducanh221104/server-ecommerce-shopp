import express from "express";
import CategoryController from "../controllers/Category.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Routes công khai (không yêu cầu đăng nhập)
router.get("/", CategoryController.getAllCategories);
router.get("/id/:id", CategoryController.getCategoryById);
router.get("/slug/:slug", CategoryController.getCategoryBySlug);
router.get("/:id/children", CategoryController.getChildCategories);

// Tạm thời bỏ middlewares xác thực cho mục đích kiểm tra
router.post("/", CategoryController.createCategory);
router.put("/:id", CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

export default router;
