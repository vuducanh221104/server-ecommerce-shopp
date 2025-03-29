import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const ConnectDB = async () => {
  if (!process.env.DB_URI) {
    console.error("DB_URI is not defined in .env file.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.DB_URI);
  } catch (e) {
    console.error("MongoDB connection error:", e.message);
    process.exit(1);
  }
};

export default ConnectDB;
