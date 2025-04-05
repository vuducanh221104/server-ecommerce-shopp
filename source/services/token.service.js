import { User } from "../models/index.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/index.js";
import UserService from "./user.service.js";

class TokenService {
  async generateRefreshToken(userId, ipAddress, userAgent) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("Không tìm thấy người dùng");
      }

      // Limit to 5 active tokens, remove oldest if needed
      const activeTokens = user.refreshTokens.filter(
        (token) => !token.isRevoked
      );
      if (activeTokens.length >= 5) {
        // Sort by createdAt to find the oldest
        activeTokens.sort((a, b) => a.createdAt - b.createdAt);
        const oldestToken = activeTokens[0];

        // Mark oldest token as revoked
        await User.updateOne(
          { _id: userId, "refreshTokens._id": oldestToken._id },
          { $set: { "refreshTokens.$.isRevoked": true } }
        );
      }

      const refreshTokenPayload = { id: userId };
      const refreshToken = generateRefreshToken(refreshTokenPayload);

      const decodedToken = verifyRefreshToken(refreshToken);
      const expiresAt = new Date(decodedToken.exp * 1000);

      // Add new token to user's refreshTokens array
      await User.updateOne(
        { _id: userId },
        {
          $push: {
            refreshTokens: {
              token: refreshToken,
              expiresAt,
              ipAddress,
              userAgent,
              createdAt: new Date(),
            },
          },
        }
      );

      return refreshToken;
    } catch (error) {
      console.error("Lỗi khi tạo refresh token:", error);
      throw new Error("Không thể tạo refresh token");
    }
  }

  generateAccessToken(user) {
    const payload = { id: user._id, role: user.role };
    return generateAccessToken(payload);
  }

  async refreshAccessToken(refreshToken, ipAddress, userAgent) {
    if (!refreshToken) {
      throw new Error("Refresh token là bắt buộc");
    }

    // Find user with this refresh token
    const user = await User.findOne({
      "refreshTokens.token": refreshToken,
    });

    if (!user) {
      throw new Error("Refresh token không hợp lệ");
    }

    // Find the specific token in the user's tokens array
    const tokenDoc = user.refreshTokens.find((t) => t.token === refreshToken);

    if (!tokenDoc) {
      throw new Error("Refresh token không hợp lệ");
    }

    if (tokenDoc.isRevoked) {
      await this.revokeAllUserTokens(user._id);
      throw new Error("Refresh token đã bị thu hồi");
    }

    if (new Date() > tokenDoc.expiresAt) {
      throw new Error("Refresh token đã hết hạn");
    }

    if (tokenDoc.ipAddress && tokenDoc.ipAddress !== ipAddress) {
      console.warn(
        `Phát hiện IP thay đổi cho user ${user._id}: ${tokenDoc.ipAddress} -> ${ipAddress}`
      );
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);

      const accessToken = this.generateAccessToken(user);

      // Update token info
      await User.updateOne(
        { _id: user._id, "refreshTokens._id": tokenDoc._id },
        {
          $set: {
            "refreshTokens.$.ipAddress": ipAddress,
            "refreshTokens.$.userAgent": userAgent,
          },
        }
      );

      return {
        accessToken,
        user: UserService.formatUser(user),
      };
    } catch (error) {
      console.error("Lỗi khi làm mới token:", error);
      throw new Error("Refresh token không hợp lệ hoặc đã hết hạn");
    }
  }

  async revokeToken(token) {
    if (!token) return false;

    const result = await User.updateOne(
      { "refreshTokens.token": token },
      { $set: { "refreshTokens.$.isRevoked": true } }
    );

    return result.modifiedCount > 0;
  }

  async revokeAllUserTokens(userId) {
    await User.updateOne(
      { _id: userId },
      { $set: { "refreshTokens.$[].isRevoked": true } }
    );
  }

  async removeExpiredTokens() {
    const now = new Date();
    // Pull expired tokens from all users
    const result = await User.updateMany(
      {},
      { $pull: { refreshTokens: { expiresAt: { $lt: now } } } }
    );

    return result.modifiedCount;
  }

  async getUserActiveTokens(userId) {
    const user = await User.findById(userId);
    if (!user) return [];

    const now = new Date();
    return user.refreshTokens.filter(
      (token) => !token.isRevoked && token.expiresAt > now
    );
  }

  async isRefreshTokenValid(token) {
    if (!token) return false;

    try {
      const user = await User.findOne({
        refreshTokens: {
          $elemMatch: {
            token,
            isRevoked: false,
            expiresAt: { $gt: new Date() },
          },
        },
      });

      return !!user;
    } catch (error) {
      return false;
    }
  }
}

export default new TokenService();
