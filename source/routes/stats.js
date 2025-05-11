import express from "express";
import StatsController from "../controllers/Stats.controller.js";

const router = express.Router();

// Dashboard statistics
router.get("/dashboard", StatsController.getDashboardStats);

export default router;
