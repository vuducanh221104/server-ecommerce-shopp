import { CatchError } from "../config/catchError.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";

class CommentController {
  // Add a comment to a product
  addComment = CatchError(async (req, res) => {
    const { productId } = req.params;
    const { content, rating } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!content || !rating) {
      return res.status(400).json({
        status: "error",
        message: "Nội dung và đánh giá sao là bắt buộc",
      });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
      return res.status(400).json({
        status: "error",
        message: "Đánh giá sao phải là số nguyên từ 1 đến 5",
      });
    }

    try {
      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy sản phẩm",
        });
      }

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy người dùng",
        });
      }

      // Check if the user has purchased this product with a DELIVERED or COMPLETED status
      const orders = await Order.find({
        user_id: userId,
        status: { $in: ["DELIVERED", "COMPLETED"] },
        "items.product_id": productId,
      });

      if (orders.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "Bạn chỉ có thể đánh giá sản phẩm khi đã mua và nhận hàng thành công",
        });
      }

      // Create new comment
      const newComment = {
        user_id: userId,
        user_name: user.fullName || user.username,
        content,
        rating: Number(rating),
        status: "APPROVED", // Auto-approve comments for now
        verified_purchase: true,
      };

      // Add comment to product
      product.comments.push(newComment);
      await product.save();

      return res.status(201).json({
        status: "success",
        message: "Đánh giá sản phẩm thành công",
        data: {
          comment: newComment,
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi thêm đánh giá: " + error.message,
      });
    }
  });

  // Get all comments for a product
  getProductComments = CatchError(async (req, res) => {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy sản phẩm",
        });
      }

      // Get comments with pagination
      const skip = (page - 1) * limit;
      const comments = product.comments
        .filter(comment => comment.status === "APPROVED")
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(skip, skip + Number(limit));

      const total = product.comments.filter(comment => comment.status === "APPROVED").length;

      return res.status(200).json({
        status: "success",
        message: "Lấy danh sách đánh giá thành công",
        data: {
          comments,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi lấy danh sách đánh giá: " + error.message,
      });
    }
  });

  // Get comment statistics for a product (average rating, count by stars)
  getCommentStats = CatchError(async (req, res) => {
    const { productId } = req.params;

    try {
      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy sản phẩm",
        });
      }

      // Filter approved comments
      const approvedComments = product.comments.filter(
        comment => comment.status === "APPROVED"
      );

      // Calculate statistics
      const totalComments = approvedComments.length;
      const totalRating = approvedComments.reduce(
        (sum, comment) => sum + comment.rating, 
        0
      );
      const averageRating = totalComments > 0 
        ? Math.round((totalRating / totalComments) * 10) / 10 
        : 0;

      // Count comments by rating
      const ratingCounts = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      approvedComments.forEach(comment => {
        ratingCounts[comment.rating]++;
      });

      return res.status(200).json({
        status: "success",
        message: "Lấy thống kê đánh giá thành công",
        data: {
          totalComments,
          averageRating,
          ratingCounts,
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi lấy thống kê đánh giá: " + error.message,
      });
    }
  });

  // Delete a comment (for admin or comment owner)
  deleteComment = CatchError(async (req, res) => {
    const { productId, commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy sản phẩm",
        });
      }

      // Find the comment
      const commentIndex = product.comments.findIndex(
        comment => comment._id.toString() === commentId
      );

      if (commentIndex === -1) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy đánh giá",
        });
      }

      // Check if user is admin or comment owner
      const comment = product.comments[commentIndex];
      if (userRole !== 2 && comment.user_id.toString() !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Bạn không có quyền xóa đánh giá này",
        });
      }

      // Remove the comment
      product.comments.splice(commentIndex, 1);
      await product.save();

      return res.status(200).json({
        status: "success",
        message: "Xóa đánh giá thành công",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi xóa đánh giá: " + error.message,
      });
    }
  });

  // Admin: Update comment status (approve, reject, flag)
  updateCommentStatus = CatchError(async (req, res) => {
    const { productId, commentId } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    // Only admins can update comment status
    if (userRole !== 2) {
      return res.status(403).json({
        status: "error",
        message: "Bạn không có quyền cập nhật trạng thái đánh giá",
      });
    }

    // Validate status
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "FLAGGED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Trạng thái không hợp lệ",
      });
    }

    try {
      // Find the product and update the comment status
      const product = await Product.findOneAndUpdate(
        { 
          _id: productId,
          "comments._id": commentId 
        },
        { 
          $set: { "comments.$.status": status } 
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy sản phẩm hoặc đánh giá",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Cập nhật trạng thái đánh giá thành công",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi cập nhật trạng thái đánh giá: " + error.message,
      });
    }
  });
}

export default new CommentController(); 