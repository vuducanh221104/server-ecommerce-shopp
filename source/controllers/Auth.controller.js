import { CatchError } from "../config/catchError.js";
import { AuthService } from "../services/index.js";
import { User } from "../models/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class AuthController {
  login = CatchError(async (req, res) => {
    const { email, phone_number, password } = req.body;
    const loginIdentifier = email || phone_number;

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        message: "Vui lòng cung cấp email/số điện thoại và mật khẩu",
      });
    }

    const { accessToken, refreshToken, user } = await AuthService.login(
      loginIdentifier,
      password,
      ipAddress,
      userAgent
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      path: "/",
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 10,
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      message: "Đăng nhập thành công",
      user,
      accessToken,
    });
  });

  register = CatchError(async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    if (!req.body.email || !req.body.password || !req.body.username) {
      return res
        .status(400)
        .json({ message: "Tất cả các trường đều là bắt buộc" });
    }

    if (req.body.password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    const { accessToken, refreshToken, user } = await AuthService.register(
      req.body,
      ipAddress,
      userAgent
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      path: "/",
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 10,
      sameSite: "strict",
      path: "/",
    });

    return res.status(201).json({
      message: "Đăng ký người dùng thành công",
      user,
      accessToken,
    });
  });

  refreshToken = CatchError(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    console.log(refreshToken);
    if (!refreshToken) {
      // Clear cookies with the same options they were set with
      res.clearCookie("accessToken", {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
      });
      
      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
      });
      
      return res
        .status(401)
        .json({ message: "Refresh token không được cung cấp" });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    try {
      const { accessToken, user } = await AuthService.refreshToken(
        refreshToken,
        ipAddress,
        userAgent
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 10,
        sameSite: "strict",
        path: "/",
      });

      return res.status(200).json({
        message: "Token đã được làm mới",
        accessToken,
        user,
      });
    } catch (error) {
      console.error("Refresh token error:", error.message);
      
      // Clear cookies with the same options they were set with
      res.clearCookie("accessToken", {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
      });
      
      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
      });
      
      return res.status(401).json({ message: error.message });
    }
  });

  logout = CatchError(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    // Clear cookies with the same options they were set with
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
    
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({ message: "Đăng xuất thành công" });
  });

  logoutAll = CatchError(async (req, res) => {
    const userId = req.user._id;

    await AuthService.logoutFromAllDevices(userId);

    // Clear cookies with the same options they were set with
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
    
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });

    return res
      .status(200)
      .json({ message: "Đã đăng xuất khỏi tất cả các thiết bị" });
  });

  getActiveSessions = CatchError(async (req, res) => {
    const userId = req.user._id;

    const sessions = await AuthService.getActiveSessions(userId);

    return res.status(200).json({
      message: "Danh sách phiên đăng nhập",
      sessions,
    });
  });

  logoutFromSession = CatchError(async (req, res) => {
    const userId = req.user._id;
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "ID phiên không được cung cấp" });
    }

    const success = await AuthService.logoutFromSession(userId, sessionId);

    if (!success) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy phiên đăng nhập" });
    }

    return res.status(200).json({ message: "Đã đăng xuất khỏi phiên" });
  });

  //Admin // [POST] ~ LOGIN ADMIN
  loginAdmin = CatchError(async (req, res) => {
    const {
      usernameOrEmail,
      password: passwordHashed,
      // tokenCaptcha,
    } = req.body;

    // // Verify captcha
    // const verifyResponse = await verifyCaptcha(tokenCaptcha);
    // if (!verifyResponse.valid) {
    //   return res.status(verifyResponse.status).json({
    //     status: verifyResponse.status,
    //     message: verifyResponse.message,
    //   });
    // }

    // Tìm user
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    // Kiểm tra user tồn tại
    if (!user) {
      return res
        .status(404)
        .json({ message: "Invalid credentials or insufficient permissions" });
    }

    // Kiểm tra password
    const validPassword = await bcrypt.compare(passwordHashed, user.password);
    if (!validPassword) {
      return res
        .status(404)
        .json({ message: "Invalid credentials or insufficient permissions" });
    }

    // Kiểm tra role
    if (!user.role || user.role <= 0) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    // Tạo tokens
    const accessToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: "10s" }
    );
    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("refreshTokenAdmin", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    // Trả về thông tin user (loại bỏ password và token)
    const { password, ...other } = user._doc;
    return res.status(200).json({ ...other, accessToken });
  });

  // [POST] ~ REQUEST REFRESH TOKEN ADMIN
  requestRefreshTokenAdmin = CatchError(async (req, res) => {
    const { refreshTokenAdmin } = req.cookies;
    if (!refreshTokenAdmin)
      return res.status(403).json({ message: "Refresh token is missing" });

    const decoded = jwt.verify(refreshTokenAdmin, process.env.JWT_REFRESH_KEY);

    // Tìm user và kiểm tra role
    const user = await User.findById(decoded._id);
    if (!user || !user.role || user.role <= 0) {
      return res.status(403).json({
        message: "Invalid refresh token or insufficient permissions",
      });
    }

    const newAccessToken = jwt.sign(
      { _id: decoded._id },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: "10s" }
    );

    const newRefreshToken = jwt.sign(
      { _id: decoded._id },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("refreshTokenAdmin", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    return res.status(200).json({ accessToken: newAccessToken });
  });

  // [POST] ~ LOGOUT ADMIN
  logoutAdmin = CatchError(async (req, res) => {
    res.clearCookie("refreshTokenAdmin");
    return res.status(200).json({ message: "Logged out successfully" });
  });

  // [POST] ~ ADD USER BY ADMIN
  addUserByAdmin = CatchError(async (req, res) => {
    const { email, user_name, password, role } = req.body;

    // Validate input
    if (!email || !user_name || !password) {
      return res.status(400).json({
        message: "Email, username, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { user_name }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email or username already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      email,
      user_name,
      password: hashedPassword,
      role: role || 0, // Default to regular user if role not specified
      status: 1, // Active by default
    });

    await newUser.save();

    // Remove password from response
    const { password: _, ...userData } = newUser._doc;

    return res.status(201).json({
      message: "User created successfully",
      user: userData,
    });
  });
}

export default new AuthController();
