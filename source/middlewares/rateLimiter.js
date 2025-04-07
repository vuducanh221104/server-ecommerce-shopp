import rateLimit from "express-rate-limit";

/**
 * Tạo rate limiter cho API chung
 * Giới hạn 100 request trong 15 phút cho mỗi IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn mỗi IP đến 100 request mỗi cửa sổ thời gian
  standardHeaders: true, // Trả về thông tin rate limit trong header `RateLimit-*`
  legacyHeaders: false, // Tắt header `X-RateLimit-*`
  message: {
    status: "error",
    message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút",
  },
});

/**
 * Tạo rate limiter cho các route xác thực (đăng nhập, đăng ký)
 * Giới hạn 10 request trong 15 phút cho mỗi IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Giới hạn mỗi IP đến 10 request mỗi cửa sổ thời gian
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message:
      "Quá nhiều yêu cầu đăng nhập/đăng ký, vui lòng thử lại sau 15 phút",
  },
});

/**
 * Tạo rate limiter cho public API (như lấy danh sách sản phẩm, danh mục)
 * Giới hạn 200 request trong 15 phút cho mỗi IP
 */
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Giới hạn mỗi IP đến 200 request mỗi cửa sổ thời gian
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút",
  },
});

/**
 * Tạo rate limiter chặt chẽ cho các route nhạy cảm (thay đổi mật khẩu, gửi email reset)
 * Giới hạn 5 request trong 60 phút cho mỗi IP
 */
export const sensitiveApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 phút
  max: 5, // Giới hạn mỗi IP đến 5 request mỗi cửa sổ thời gian
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Quá nhiều yêu cầu cho chức năng này, vui lòng thử lại sau 1 giờ",
  },
});
