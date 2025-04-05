export const CatchError = (fn, defaultMessage = "Đã xảy ra lỗi") => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(`[ERROR]: ${error.message}`);
      console.error(error.stack);

      // Xử lý lỗi MongoDB - Duplicate key
      if (error.code === 11000) {
        return res.status(409).json({
          status: "fail",
          message: "Dữ liệu bị trùng lặp, vui lòng kiểm tra lại",
        });
      }

      // Xử lý lỗi MongoDB - Validation Error
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          status: "fail",
          message: messages.join(". "),
        });
      }

      // Xử lý lỗi MongoDB - CastError (ID không hợp lệ)
      if (error.name === "CastError") {
        return res.status(400).json({
          status: "fail",
          message: `ID không hợp lệ: ${error.value}`,
        });
      }

      // Using  message from error or default message
      const errorMessage = error.message || defaultMessage;

      // Error popular - return 500 Internal Server Error
      return res.status(500).json({
        status: "error",
        message: errorMessage,
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  };
};
