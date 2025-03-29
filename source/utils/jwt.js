import jwt from "jsonwebtoken";

export const generateAccessToken = (payload, expiresIn = "15m") => {
  return jwt.sign(payload, process.env.JWT_ACCESS_KEY, { expiresIn });
};

export const generateRefreshToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, process.env.JWT_REFRESH_KEY, { expiresIn });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_KEY);
  } catch (error) {
    throw new Error("Token truy cập không hợp lệ hoặc đã hết hạn");
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_KEY);
  } catch (error) {
    throw new Error("Token làm mới không hợp lệ hoặc đã hết hạn");
  }
};

export const extractTokenFromHeader = (authorization) => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.split(" ")[1];
};
