import { CatchError } from "../config/catchError.js";
import { AuthService } from "../services/index.js";

class AuthController {
  login = CatchError(async (req, res) => {
    const { email, password } = req.body;

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    const { accessToken, refreshToken, user } = await AuthService.login(
      email,
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
      maxAge: 15 * 60 * 1000,
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

    if (!req.body.email || !req.body.password || !req.body.name) {
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
      maxAge: 15 * 60 * 1000,
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

    if (!refreshToken) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
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
        maxAge: 15 * 60 * 1000,
        sameSite: "strict",
        path: "/",
      });

      return res.status(200).json({
        message: "Token đã được làm mới",
        accessToken,
        user,
      });
    } catch (error) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: error.message });
    }
  });

  logout = CatchError(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({ message: "Đăng xuất thành công" });
  });

  logoutAll = CatchError(async (req, res) => {
    const userId = req.user._id;

    await AuthService.logoutFromAllDevices(userId);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

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
}

export default new AuthController();
