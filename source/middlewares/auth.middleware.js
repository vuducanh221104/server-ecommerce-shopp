import { CatchError } from "../config/catchError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { verifyAccessToken, extractTokenFromHeader } from "../utils/index.js";

export const authenticateToken = CatchError(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader) || req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Yêu cầu xác thực" });
  }

  try {
    const decoded = verifyAccessToken(token);
    const userId = decoded.userId || decoded.id || decoded._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
});

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Yêu cầu xác thực" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập vào tài nguyên này",
      });
    }

    next();
  };
};

// Alias để tương thích với các file routes hiện tại
export const isAuth = authenticateToken;
export const isAdmin = authorizeRoles("admin");
