import { User } from "../models/index.js";
import TokenService from "./token.service.js";
import UserService from "./user.service.js";
import { hashPassword, comparePassword } from "../utils/index.js";

class AuthService {
  async login(identifier, password, ipAddress, userAgent) {
    if (!identifier || !password) {
      throw new Error("Vui lòng cung cấp email/số điện thoại và mật khẩu");
    }

    // Kiểm tra xem identifier là email hay số điện thoại
    const isEmail = identifier.includes("@");

    // Log để debug
    console.log("Login attempt with:", { identifier, isEmail });

    // Tìm người dùng theo email hoặc số điện thoại
    let user;
    if (isEmail) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findOne({ phone_number: identifier });
    }

    // Log kết quả tìm kiếm
    console.log("User found:", user ? "Yes" : "No");

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
      user: UserService.formatUser(user),
    };
  }

  async register(userData) {
    const {
      username,
      email,
      password,
      fullName,
      phone_number,
      ipAddress,
      userAgent,
      name,
    } = userData;

    // Kiểm tra các trường bắt buộc
    // Nếu có name từ controller, sử dụng name là fullName nếu không có fullName
    const userFullName = fullName || name;

    if (!username || !email || !password || (!userFullName && !name)) {
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

    // Kiểm tra người dùng đã tồn tại với email hoặc tên đăng nhập
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new Error("Người dùng đã tồn tại");
    }

    // Kiểm tra số điện thoại đã tồn tại nếu được cung cấp
    if (phone_number) {
      const existingPhoneUser = await User.findOne({ phone_number });
      if (existingPhoneUser) {
        throw new Error("Số điện thoại đã được sử dụng");
      }
    }

    // Mã hóa mật khẩu
    const hashedPassword = await hashPassword(password);

    // Tạo người dùng mới
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName: userFullName || name,
      phone_number,
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
      user: UserService.formatUser(newUser),
    };
  }

  async refreshToken(token, ipAddress, userAgent) {
    if (!token) {
      throw new Error("Refresh token không được cung cấp");
    }

    const decoded = await TokenService.verifyRefreshToken(token);
    if (!decoded) {
      throw new Error("Refresh token không hợp lệ");
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const tokenDoc = user.refreshTokens.find(
      (t) => t.token === token && !t.isRevoked
    );

    if (!tokenDoc) {
      throw new Error("Refresh token không hợp lệ hoặc đã bị thu hồi");
    }

    if (new Date(tokenDoc.expiresAt) < new Date()) {
      throw new Error("Refresh token đã hết hạn");
    }

    const accessToken = TokenService.generateAccessToken(user);

    return {
      accessToken,
      user: UserService.formatUser(user),
    };
  }

  async logout(token) {
    if (!token) {
      return false;
    }

    const result = await User.updateOne(
      { "refreshTokens.token": token },
      { $set: { "refreshTokens.$.isRevoked": true } }
    );

    return result.modifiedCount > 0;
  }

  async logoutFromAllDevices(userId) {
    const result = await User.updateOne(
      { _id: userId },
      { $set: { "refreshTokens.$[].isRevoked": true } }
    );

    return result.modifiedCount > 0;
  }

  async getActiveSessions(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const activeSessions = user.refreshTokens
      .filter(
        (token) => !token.isRevoked && new Date(token.expiresAt) > new Date()
      )
      .map((token) => ({
        id: token._id,
        ipAddress: token.ipAddress,
        userAgent: token.userAgent,
        createdAt: token.createdAt,
      }));

    return activeSessions;
  }

  async logoutFromSession(userId, sessionId) {
    const result = await User.updateOne(
      { _id: userId, "refreshTokens._id": sessionId },
      { $set: { "refreshTokens.$.isRevoked": true } }
    );

    return result.modifiedCount > 0;
  }
}

export default new AuthService();
