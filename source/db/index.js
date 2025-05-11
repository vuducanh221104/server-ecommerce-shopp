import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const startServer = async (app) => {
  if (!process.env.DB_URI) {
    console.error("DB_URI is not defined in .env file.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (e) {
    console.error("MongoDB connection error:", e.message);
    process.exit(1);
  }
};

export default startServer;
