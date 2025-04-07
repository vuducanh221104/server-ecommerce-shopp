import express from "express";
import AuthController from "../controllers/Auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/login", authLimiter, AuthController.login);
router.post("/register", authLimiter, AuthController.register);
router.post("/refresh-token", authLimiter, AuthController.refreshToken);

router.post("/logout", AuthController.logout);
router.post("/logout-all", authenticateToken, AuthController.logoutAll);

router.get("/sessions", authenticateToken, AuthController.getActiveSessions);
router.delete(
  "/sessions/:sessionId",
  authenticateToken,
  AuthController.logoutFromSession
);

export default router;
