import express from "express";
import CommentController from "../controllers/Comment.controller.js";
import AdminCommentController from "../controllers/admin/Comment.controller.js";
import { isAuth, isAdmin } from "../middlewares/auth.middleware.js";
import { rateLimiter, commentSubmitLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

// Rate limiter for public APIs
const publicApiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// ================ PUBLIC ROUTES ================

// Get all comments for a product (public)
router.get(
  "/product/:productId",
  publicApiLimiter,
  CommentController.getProductComments
);

// Get comment statistics for a product (public)
router.get(
  "/product/:productId/stats",
  publicApiLimiter,
  CommentController.getCommentStats
);

// Add a comment to a product (authenticated users only)
router.post(
  "/product/:productId",
  isAuth,
  commentSubmitLimiter,
  CommentController.addComment
);

// Delete a comment (for comment owner or admin)
router.delete(
  "/product/:productId/comment/:commentId",
  isAuth,
  CommentController.deleteComment
);

// Admin: Update comment status
router.patch(
  "/product/:productId/comment/:commentId/status",
  isAuth,
  CommentController.updateCommentStatus
);

// ================ ADMIN ROUTES ================

// Admin: Get all comments across all products (with filtering, sorting, pagination)
router.get(
  "/admin",
  // isAuth,
  // isAdmin,
  AdminCommentController.getAllComments
);

// Admin: Get comment by ID
router.get(
  "/admin/:commentId",
  // isAuth,
  // isAdmin,
  AdminCommentController.getCommentById
);

// Admin: Update a comment (content, rating, status)
router.patch(
  "/admin/:commentId",
  // isAuth,
  // isAdmin,
  AdminCommentController.updateComment
);

// Admin: Delete a comment
router.delete(
  "/admin/:commentId",
  // isAuth,
  // isAdmin,
  AdminCommentController.deleteComment
);

// Admin: Reply to a comment
router.post(
  "/admin/:commentId/reply",
  // isAuth,
  // isAdmin,
  AdminCommentController.replyToComment
);

// Admin: Delete a reply
router.delete(
  "/admin/:commentId/reply/:replyId",
  // isAuth,
  // isAdmin,
  AdminCommentController.deleteReply
);

// Admin: Run migration to fix replyContentAdmin structure
router.post(
  "/admin/fix-reply-structure",
  // isAuth,
  // isAdmin,
  AdminCommentController.ensureReplyContentAdminIsArray
);

export default router; 