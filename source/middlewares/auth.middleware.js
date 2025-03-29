import { CatchError } from "../config/catchError.js";
import User from "../models/User.js";
import { verifyAccessToken, extractTokenFromHeader } from "../utils/index.js";

export const authenticateToken = CatchError(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader) || req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Yêu cầu xác thực" });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select("-password");

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
