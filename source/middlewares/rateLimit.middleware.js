import rateLimit from "express-rate-limit";

/**
 * Generic rate limiter factory function
 * @param {Object} options - Rate limit options
 * @returns {Function} - Rate limiter middleware
 */
export const rateLimiter = (options) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: "error",
      message: "Quá nhiều yêu cầu, vui lòng thử lại sau",
    }
  };

  return rateLimit({
    ...defaultOptions,
    ...options,
  });
};

/**
 * Comment submission rate limiter
 * Limits to 5 comment submissions per 15 minutes
 */
export const commentSubmitLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 comment submissions per windowMs
  message: {
    status: "error",
    message: "Quá nhiều đánh giá, vui lòng thử lại sau 15 phút",
  }
}); 