import express from "express";
import AuthController from "../controllers/Auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout);
router.post("/logout-all", authenticateToken, AuthController.logoutAll);

router.get("/sessions", authenticateToken, AuthController.getActiveSessions);
router.delete(
  "/sessions/:sessionId",
  authenticateToken,
  AuthController.logoutFromSession
);

export default router;
