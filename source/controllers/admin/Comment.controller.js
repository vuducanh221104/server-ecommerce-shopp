import { CatchError } from "../../config/catchError.js";
import { Product } from "../../models/Product.js";
import { User } from "../../models/User.js";
import mongoose from "mongoose";

class AdminCommentController {
  // Get all comments across all products with pagination, filtering, and sorting
  getAllComments = CatchError(async (req, res) => {
    const { 
      page = 1, 
      limit = 10,
      search = "",
      status,
      sortField = "createdAt",
      sortOrder = -1, // Default to newest first
      productId,
      userId
    } = req.query;

    try {
      // Build the aggregation pipeline
      const pipeline = [];
      
      // Unwind comments to get them as separate documents
      pipeline.push({ $unwind: { path: "$comments", preserveNullAndEmptyArrays: false } });
      
      // Match by filters if provided
      const matchStage = {};
      
      if (status && status !== 'all') {
        matchStage["comments.status"] = status.toUpperCase();
      }
      
      if (productId) {
        matchStage["_id"] = new mongoose.Types.ObjectId(productId);
      }
      
      if (userId) {
        matchStage["comments.user_id"] = new mongoose.Types.ObjectId(userId);
      }
      
      // Search in comment content or username
      if (search && search.trim() !== "") {
        matchStage["$or"] = [
          { "comments.content": { $regex: search, $options: "i" } },
          { "comments.user_name": { $regex: search, $options: "i" } }
        ];
      }
      
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }
      
      // Sort comments
      pipeline.push({
        $sort: {
          [`comments.${sortField}`]: parseInt(sortOrder)
        }
      });
      
      // Add product data to each comment
      pipeline.push({
        $addFields: {
          "comments.product": {
            _id: "$_id",
            name: "$name",
            image: { $arrayElemAt: ["$variants.images", 0] },
            slug: "$slug"
          }
        }
      });
      
      // Project to get just the comments
      pipeline.push({
        $project: {
          _id: 0,
          comment: "$comments"
        }
      });
      
      // Count total documents for pagination
      const countPipeline = [...pipeline];
      countPipeline.push({ $count: "total" });
      
      // Apply pagination
      pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
      pipeline.push({ $limit: parseInt(limit) });
      
      // Execute the aggregation
      const [comments, countResult] = await Promise.all([
        Product.aggregate(pipeline),
        Product.aggregate(countPipeline)
      ]);
      
      // Process comments to add user data
      const commentsWithUserData = await Promise.all(
        comments.map(async (item) => {
          // Get user data if available
          let userData = null;
          if (item.comment.user_id) {
            const user = await User.findById(item.comment.user_id).select("_id fullName email avatar");
            userData = user ? user : null;
          }
          
          return {
            ...item.comment,
            user: userData
          };
        })
      );
      
      // Calculate total for pagination
      const total = countResult.length > 0 ? countResult[0].total : 0;
      
      return res.status(200).json({
        status: "success",
        message: "Lấy danh sách bình luận thành công",
        comments: commentsWithUserData,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi lấy danh sách bình luận: " + error.message,
      });
    }
  });

  // Get a specific comment by ID
  getCommentById = CatchError(async (req, res) => {
    const { commentId } = req.params;

    try {
      // Find the product that contains this comment
      const product = await Product.findOne({ "comments._id": commentId });
      
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy bình luận",
        });
      }
      
      // Get the comment
      const comment = product.comments.find(
        (c) => c._id.toString() === commentId
      );
      
      if (!comment) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy bình luận",
        });
      }
      
      // Get user data if available
      let userData = null;
      if (comment.user_id) {
        const user = await User.findById(comment.user_id).select("_id fullName email avatar");
        userData = user ? user : null;
      }
      
      // Format response
      const commentData = {
        ...comment.toObject(),
        user: userData,
        product: {
          _id: product._id,
          name: product.name,
          image: product.variants[0]?.images[0] || null,
          slug: product.slug,
        },
      };
      
      return res.status(200).json({
        status: "success",
        message: "Lấy thông tin bình luận thành công",
        comment: commentData,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi lấy thông tin bình luận: " + error.message,
      });
    }
  });

  // Update a comment (content, rating, status)
  updateComment = CatchError(async (req, res) => {
    const { commentId } = req.params;
    const { content, rating, status } = req.body;
    const adminId = req.user?.id;
    
    try {
      // Validate input
      if (rating && (rating < 1 || rating > 5 || !Number.isInteger(Number(rating)))) {
        return res.status(400).json({
          status: "error",
          message: "Đánh giá sao phải là số nguyên từ 1 đến 5",
        });
      }
      
      if (status && !["APPROVED", "PENDING", "REJECTED"].includes(status.toUpperCase())) {
        return res.status(400).json({
          status: "error",
          message: "Trạng thái không hợp lệ",
        });
      }
      
      // Use direct MongoDB update operations to avoid validation issues
      const updateFields = {};
      
      if (content) {
        updateFields["comments.$.content"] = content;
      }
      
      if (rating) {
        updateFields["comments.$.rating"] = Number(rating);
      }
      
      if (status) {
        updateFields["comments.$.status"] = status.toUpperCase();
      }
      
      // Add admin modification info
      updateFields["comments.$.lastModifiedBy"] = {
        adminId: adminId || 'system',
        date: new Date(),
      };
      
      // Update the document directly using MongoDB operators
      const result = await Product.updateOne(
        { "comments._id": commentId },
        { $set: updateFields }
      );
      
      if (result.modifiedCount === 0) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy bình luận hoặc không có thay đổi",
        });
      }
      
      // Fetch the updated comment
      const product = await Product.findOne({ "comments._id": commentId });
      const updatedComment = product.comments.find(c => c._id.toString() === commentId);
      
      return res.status(200).json({
        status: "success",
        message: "Cập nhật bình luận thành công",
        comment: updatedComment,
      });
    } catch (error) {
      console.error("Error in updateComment:", error);
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi cập nhật bình luận: " + error.message,
      });
    }
  });

  // Delete a comment
  deleteComment = CatchError(async (req, res) => {
    const { commentId } = req.params;
    
    try {
      // Find the product containing the comment
      const product = await Product.findOne({ "comments._id": commentId });
      
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy bình luận",
        });
      }
      
      // Find the comment index
      const commentIndex = product.comments.findIndex(
        (c) => c._id.toString() === commentId
      );
      
      if (commentIndex === -1) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy bình luận",
        });
      }
      
      // Remove the comment
      product.comments.splice(commentIndex, 1);
      
      // Save changes
      await product.save();
      
      return res.status(200).json({
        status: "success",
        message: "Xóa bình luận thành công",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi xóa bình luận: " + error.message,
      });
    }
  });

  // Reply to a comment
  replyToComment = CatchError(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const adminId = req.user?.id || 'system';
    
    // Validate input
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        status: "error",
        message: "ID bình luận không hợp lệ",
      });
    }
    
    if (!content || content.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Nội dung phản hồi không được để trống",
      });
    }
    
    try {
      // Find the product containing the comment
      const product = await Product.findOne({ "comments._id": commentId });
      
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy bình luận",
        });
      }
      
      // Find the comment
      const commentIndex = product.comments.findIndex(
        (c) => c._id.toString() === commentId
      );
      
      if (commentIndex === -1) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy bình luận",
        });
      }
      
      // Create the reply object
      const reply = {
        content: content.trim(),
        createdAt: new Date(),
        adminId: adminId
      };
      
      // Update using MongoDB's direct update operator for better validation handling
      const result = await Product.updateOne(
        { "_id": product._id, "comments._id": commentId },
        { $push: { "comments.$.replyContentAdmin": reply } }
      );
      
      if (result.modifiedCount === 0) {
        return res.status(500).json({
          status: "error",
          message: "Không thể thêm phản hồi, vui lòng thử lại sau",
        });
      }
      
      return res.status(201).json({
        status: "success",
        message: "Phản hồi bình luận thành công",
        reply,
      });
    } catch (error) {
      console.error("Error in replyToComment:", error);
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi phản hồi bình luận: " + error.message,
      });
    }
  });

  // Delete a reply
  deleteReply = CatchError(async (req, res) => {
    const { commentId, replyId } = req.params;
    
    try {
      // Find the product containing the comment
      const product = await Product.findOne({ "comments._id": commentId });
      
      if (!product) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy bình luận",
        });
      }
      
      // Find the comment
      const commentIndex = product.comments.findIndex(
        (c) => c._id.toString() === commentId
      );
      
      if (commentIndex === -1) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy bình luận",
        });
      }
      
      // Since replyContentAdmin items don't have _id, we'll use the index from the request
      const replyIndex = parseInt(replyId);
      
      if (isNaN(replyIndex)) {
        return res.status(400).json({
          status: "error",
          message: "ID phản hồi không hợp lệ",
        });
      }
      
      // Use MongoDB's update operator to remove the specific reply by index
      const result = await Product.updateOne(
        { "_id": product._id, "comments._id": commentId },
        { $unset: { [`comments.$.replyContentAdmin.${replyIndex}`]: 1 } }
      );
      
      if (result.modifiedCount === 0) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy phản hồi hoặc không thể xóa",
        });
      }
      
      // Pull out null values (cleanup after unset)
      await Product.updateOne(
        { "_id": product._id, "comments._id": commentId },
        { $pull: { "comments.$.replyContentAdmin": null } }
      );
      
      return res.status(200).json({
        status: "success",
        message: "Xóa phản hồi thành công",
      });
    } catch (error) {
      console.error("Error in deleteReply:", error);
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi xóa phản hồi: " + error.message,
      });
    }
  });

  // Helper function to ensure all comments have replyContentAdmin as an array
  ensureReplyContentAdminIsArray = CatchError(async (req, res) => {
    try {
      // Find all products with comments
      const products = await Product.find({ "comments": { $exists: true, $ne: [] } });
      let updatedCount = 0;
      
      for (const product of products) {
        let hasChanges = false;
        
        for (let i = 0; i < product.comments.length; i++) {
          // Handle case where replyContentAdmin is undefined
          if (!product.comments[i].replyContentAdmin) {
            product.comments[i].replyContentAdmin = [];
            hasChanges = true;
            updatedCount++;
          } 
          // Handle case where replyContentAdmin is a string
          else if (typeof product.comments[i].replyContentAdmin === 'string') {
            // If it's a non-empty string, try to preserve it as a reply
            if (product.comments[i].replyContentAdmin.trim() !== '') {
              product.comments[i].replyContentAdmin = [{
                content: product.comments[i].replyContentAdmin,
                createdAt: new Date(),
                adminId: 'system-migration'
              }];
            } else {
              product.comments[i].replyContentAdmin = [];
            }
            hasChanges = true;
            updatedCount++;
          }
          // Handle case where replyContentAdmin is not an array
          else if (!Array.isArray(product.comments[i].replyContentAdmin)) {
            product.comments[i].replyContentAdmin = [];
            hasChanges = true;
            updatedCount++;
          }
          // Handle case where array items might not have the correct structure
          else if (Array.isArray(product.comments[i].replyContentAdmin)) {
            for (let j = 0; j < product.comments[i].replyContentAdmin.length; j++) {
              const reply = product.comments[i].replyContentAdmin[j];
              // If the reply is a string, convert it to proper structure
              if (typeof reply === 'string') {
                product.comments[i].replyContentAdmin[j] = {
                  content: reply,
                  createdAt: new Date(),
                  adminId: 'system-migration'
                };
                hasChanges = true;
                updatedCount++;
              }
              // If the reply is an object but missing required fields
              else if (reply && typeof reply === 'object') {
                if (!reply.content) {
                  product.comments[i].replyContentAdmin[j].content = 'Nội dung không có sẵn';
                  hasChanges = true;
                }
                if (!reply.createdAt) {
                  product.comments[i].replyContentAdmin[j].createdAt = new Date();
                  hasChanges = true;
                }
                if (!reply.adminId) {
                  product.comments[i].replyContentAdmin[j].adminId = 'system-migration';
                  hasChanges = true;
                }
              }
            }
          }
        }
        
        if (hasChanges) {
          await product.save({ validateBeforeSave: false });
        }
      }
      
      return res.status(200).json({
        status: "success",
        message: `Đã cập nhật ${updatedCount} bình luận`,
      });
    } catch (error) {
      console.error("Error in ensureReplyContentAdminIsArray:", error);
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi cập nhật cấu trúc dữ liệu bình luận: " + error.message,
      });
    }
  });
}

export default new AdminCommentController(); 