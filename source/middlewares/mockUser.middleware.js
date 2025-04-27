/**
 * Middleware để mô phỏng người dùng đăng nhập cho mục đích test
 * Sử dụng middleware này khi đã loại bỏ middleware xác thực
 */
export const mockUser = (req, res, next) => {
  // Thêm người dùng mẫu vào request nếu chưa có
  if (!req.user) {
    req.user = {
      id: "641223d2691610b1c0639f23", // ID người dùng mẫu
      email: "test@example.com",
      role: "admin", // Cấp quyền admin để test
      full_name: "Test User",
    };
  }
  next();
};
