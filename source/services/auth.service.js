import User from "../models/User.js";
import { RefreshToken } from "../models/index.js";
import TokenService from "./token.service.js";
import { hashPassword, comparePassword } from "../utils/index.js";

class AuthService {
  /**
   * Đăng nhập người dùng
   * @param {string} email - Email người dùng
   * @param {string} password - Mật khẩu người dùng
   * @param {string} ipAddress - Địa chỉ IP của client
   * @param {string} userAgent - User agent của client
   * @returns {Object} Thông tin đăng nhập bao gồm token và user
   */
  async login(email, password, ipAddress, userAgent) {
    if (!email || !password) {
      throw new Error("Email và mật khẩu là bắt buộc");
    }

    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Thông tin đăng nhập không hợp lệ");
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Thông tin đăng nhập không hợp lệ");
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === 0) {
      throw new Error("Tài khoản đã bị vô hiệu hóa");
    }

    // Tạo access token
    const accessToken = TokenService.generateAccessToken(user);

    // Tạo và lưu refresh token
    const refreshToken = await TokenService.generateRefreshToken(
      user._id,
      ipAddress,
      userAgent
    );

    // Trả về thông tin đăng nhập
    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  /**
   * Đăng ký người dùng mới
   * @param {Object} userData - Thông tin người dùng đăng ký
   * @param {string} ipAddress - Địa chỉ IP của client
   * @param {string} userAgent - User agent của client
   * @returns {Object} Thông tin đăng ký bao gồm token và user
   */
  async register(userData, ipAddress, userAgent) {
    const { username, email, password, fullName } = userData;

    // Kiểm tra các trường bắt buộc
    if (!username || !email || !password || !fullName) {
      throw new Error("Tất cả các trường đều là bắt buộc");
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Email không hợp lệ");
    }

    // Kiểm tra độ mạnh của mật khẩu
    if (password.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
    }

    // Kiểm tra người dùng đã tồn tại
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new Error("Người dùng đã tồn tại");
    }

    // Mã hóa mật khẩu
    const hashedPassword = await hashPassword(password);

    // Tạo người dùng mới
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: 0, // Default role (user)
      type: "WEBSITE",
      status: 1, // Active
    });

    // Tạo access token
    const accessToken = TokenService.generateAccessToken(newUser);

    // Tạo và lưu refresh token
    const refreshToken = await TokenService.generateRefreshToken(
      newUser._id,
      ipAddress,
      userAgent
    );

    // Trả về thông tin đăng ký
    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    };
  }

  /**
   * Làm mới access token bằng refresh token
   * @param {string} refreshToken - JWT refresh token
   * @param {string} ipAddress - Địa chỉ IP của client
   * @param {string} userAgent - User agent của client
   * @returns {Object} Thông tin mới bao gồm access token và user
   */
  async refreshToken(refreshToken, ipAddress, userAgent) {
    if (!refreshToken) {
      throw new Error("Refresh token không được cung cấp");
    }

    // Kiểm tra token có hợp lệ không trước khi thử làm mới
    const isValid = await TokenService.isRefreshTokenValid(refreshToken);
    if (!isValid) {
      throw new Error("Refresh token không hợp lệ hoặc đã hết hạn");
    }

    return TokenService.refreshAccessToken(refreshToken, ipAddress, userAgent);
  }

  /**
   * Đăng xuất
   * @param {string} refreshToken - JWT refresh token
   * @returns {Object} Kết quả đăng xuất
   */
  async logout(refreshToken) {
    if (refreshToken) {
      // Thu hồi token trong database
      await TokenService.revokeToken(refreshToken);
    }
    return { success: true };
  }

  /**
   * Đăng xuất khỏi tất cả thiết bị
   * @param {string} userId - ID người dùng
   * @returns {Object} Kết quả đăng xuất
   */
  async logoutFromAllDevices(userId) {
    // Thu hồi tất cả token của user
    await TokenService.revokeAllUserTokens(userId);
    return { success: true };
  }

  /**
   * Lấy danh sách phiên đăng nhập đang hoạt động
   * @param {string} userId - ID người dùng
   * @returns {Array} Danh sách phiên đăng nhập
   */
  async getActiveSessions(userId) {
    const tokens = await TokenService.getUserActiveTokens(userId);
    return tokens.map((token) => ({
      id: token._id,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent,
      createdAt: token.createdAt,
      lastUsedAt: token.updatedAt,
    }));
  }

  /**
   * Đăng xuất khỏi một phiên cụ thể
   * @param {string} userId - ID người dùng
   * @param {string} tokenId - ID của token phiên
   * @returns {boolean} Kết quả đăng xuất
   */
  async logoutFromSession(userId, tokenId) {
    const token = await RefreshToken.findOne({
      _id: tokenId,
      user: userId,
    });

    if (!token) {
      return false;
    }

    token.isRevoked = true;
    await token.save();
    return true;
  }
}

export default new AuthService();
