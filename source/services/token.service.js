import { RefreshToken, User } from "../models/index.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/index.js";

class TokenService {
  async generateRefreshToken(userId, ipAddress, userAgent) {
    try {
      const tokenCount = await RefreshToken.countDocuments({
        user: userId,
        isRevoked: false,
      });

      if (tokenCount >= 5) {
        const oldestToken = await RefreshToken.findOne({
          user: userId,
          isRevoked: false,
        }).sort({ createdAt: 1 });

        if (oldestToken) {
          oldestToken.isRevoked = true;
          await oldestToken.save();
        }
      }

      const refreshTokenPayload = { id: userId };
      const refreshToken = generateRefreshToken(refreshTokenPayload);

      const decodedToken = verifyRefreshToken(refreshToken);
      const expiresAt = new Date(decodedToken.exp * 1000);

      await RefreshToken.create({
        token: refreshToken,
        user: userId,
        expiresAt,
        ipAddress,
        userAgent,
      });

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

    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenDoc) {
      throw new Error("Refresh token không hợp lệ");
    }

    if (tokenDoc.isRevoked) {
      await this.revokeAllUserTokens(tokenDoc.user);
      throw new Error("Refresh token đã bị thu hồi");
    }

    if (new Date() > tokenDoc.expiresAt) {
      throw new Error("Refresh token đã hết hạn");
    }

    if (tokenDoc.ipAddress && tokenDoc.ipAddress !== ipAddress) {
      console.warn(
        `Phát hiện IP thay đổi cho user ${tokenDoc.user}: ${tokenDoc.ipAddress} -> ${ipAddress}`
      );
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        throw new Error("Không tìm thấy người dùng");
      }

      const accessToken = this.generateAccessToken(user);

      tokenDoc.ipAddress = ipAddress;
      tokenDoc.userAgent = userAgent;
      await tokenDoc.save();

      return {
        accessToken,
        user,
      };
    } catch (error) {
      console.error("Lỗi khi làm mới token:", error);
      throw new Error("Refresh token không hợp lệ hoặc đã hết hạn");
    }
  }

  async revokeToken(token) {
    if (!token) return false;

    const tokenDoc = await RefreshToken.findOne({ token });
    if (!tokenDoc) return false;

    tokenDoc.isRevoked = true;
    await tokenDoc.save();
    return true;
  }

  async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany({ user: userId }, { isRevoked: true });
  }

  async removeExpiredTokens() {
    const now = new Date();
    const result = await RefreshToken.deleteMany({ expiresAt: { $lt: now } });
    return result.deletedCount;
  }

  async getUserActiveTokens(userId) {
    return RefreshToken.find({
      user: userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
  }

  async isRefreshTokenValid(token) {
    if (!token) return false;

    try {
      const tokenDoc = await RefreshToken.findOne({
        token,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      });

      return !!tokenDoc;
    } catch (error) {
      return false;
    }
  }
}

export default new TokenService();
