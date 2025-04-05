import authRouter from "./auth.js";
import userRouter from "./users.js";
import productRouter from "./products.js";
import cartRouter from "./cart.js";
import categoryRouter from "./categories.js";

function routes(app) {
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/products", productRouter);
  app.use("/api/v1/cart", cartRouter);
  app.use("/api/v1/categories", categoryRouter);
}

export default routes;
