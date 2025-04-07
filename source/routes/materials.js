import express from "express";
import MaterialController from "../controllers/Material.controller.js";
import { isAdmin, isAuth } from "../middlewares/auth.middleware.js";
import { publicApiLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Routes công khai - áp dụng publicApiLimiter
router.get("/", publicApiLimiter, MaterialController.getAllMaterials);
router.get("/:id", publicApiLimiter, MaterialController.getMaterialById);
router.get(
  "/slug/:slug",
  publicApiLimiter,
  MaterialController.getMaterialBySlug
);
router.get(
  "/:id/children",
  publicApiLimiter,
  MaterialController.getChildMaterials
);

// Routes yêu cầu quyền admin
router.post("/", MaterialController.createMaterial);
router.put("/:id", MaterialController.updateMaterial);
router.delete("/:id", MaterialController.deleteMaterial);

export default router;
