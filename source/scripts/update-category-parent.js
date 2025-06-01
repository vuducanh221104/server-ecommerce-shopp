import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category } from "../models/index.js";

dotenv.config();

// Thiết lập kết nối MongoDB
mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log("Đã kết nối đến MongoDB"))
  .catch((err) => {
    console.error("Lỗi kết nối MongoDB:", err);
    process.exit(1);
  });

const updateCategoryParent = async () => {
  try {
    // Tìm danh mục Áo Nam
    const parentCategory = await Category.findOne({ slug: "ao-nam" });
    if (!parentCategory) {
      console.error("Không tìm thấy danh mục Áo Nam");
      return;
    }


    // Tìm danh mục Áo Thể Thao moi
    const targetCategory = await Category.findOne({ slug: "ao-the-thao-moi" });
    if (!targetCategory) {
      console.error("Không tìm thấy danh mục Áo Thể Thao moi");
      return;
    }


    // Cập nhật parent của danh mục Áo Thể Thao moi
    targetCategory.parent = parentCategory._id;
    await targetCategory.save();


    // Kiểm tra lại sau khi cập nhật
    const updatedCategory = await Category.findOne({
      slug: "ao-the-thao-moi",
    }).populate("parent", "name slug _id");



    mongoose.disconnect();
  } catch (error) {
    console.error("Lỗi khi cập nhật danh mục:", error);
    mongoose.disconnect();
  }
};

// Chạy script
updateCategoryParent();
