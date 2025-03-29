// const categoryRoutes = require('./category');
// const productRoutes = require('./products');
// const materialRoutes = require('./material');
// const homeRoutes = require('./home');
// const newsRoutes = require('./news');
// const authRoutes = require('./auth');
// const uploadRoutes = require('../Upload/uploadCloudinary');
import authRouter from "./auth.js";
import userRouter from "./users.js";

function routes(app) {
  //   app.use("/api/v1/product", productRoutes);
  //   app.use("/api/v1/material", materialRoutes);
  //   app.use("/api/v1/category", categoryRoutes);
  //   app.use("/api/v1/home", homeRoutes);
  //   app.use("/api/v1/news", newsRoutes);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  //   app.use("/api/v1/uploada", uploadRoutes);
}

export default routes;
