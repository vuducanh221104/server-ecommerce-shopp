import authRouter from "./auth.js";
import userRouter from "./users.js";
import productRouter from "./products.js";
import cartRouter from "./cart.js";
import categoryRouter from "./categories.js";
import materialRouter from "./materials.js";
import orderRouter from "./orders.js";
import paymentRouter from "./payment.js";
import uploadRoutes from "../upload/uploadCloudinary.js";
import statsRouter from "./stats.js";

function routes(app) {
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/products", productRouter);
  app.use("/api/v1/cart", cartRouter);
  app.use("/api/v1/categories", categoryRouter);
  app.use("/api/v1/materials", materialRouter);
  app.use("/api/v1/orders", orderRouter);
  app.use("/api/v1/payment", paymentRouter);
  app.use("/api/v1/upload", uploadRoutes);
  app.use("/api/v1/stats", statsRouter);
}

export default routes;
