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

    console.log("Đã tìm thấy danh mục Áo Nam:", {
      id: parentCategory._id,
      name: parentCategory.name,
      slug: parentCategory.slug,
    });

    // Tìm danh mục Áo Thể Thao moi
    const targetCategory = await Category.findOne({ slug: "ao-the-thao-moi" });
    if (!targetCategory) {
      console.error("Không tìm thấy danh mục Áo Thể Thao moi");
      return;
    }

    console.log("Đã tìm thấy danh mục Áo Thể Thao moi:", {
      id: targetCategory._id,
      name: targetCategory.name,
      slug: targetCategory.slug,
      currentParent: targetCategory.parent,
    });

    // Cập nhật parent của danh mục Áo Thể Thao moi
    targetCategory.parent = parentCategory._id;
    await targetCategory.save();

    console.log(
      "Đã cập nhật thành công! Danh mục Áo Thể Thao moi giờ đã có parent là Áo Nam"
    );

    // Kiểm tra lại sau khi cập nhật
    const updatedCategory = await Category.findOne({
      slug: "ao-the-thao-moi",
    }).populate("parent", "name slug _id");

    console.log("Danh mục sau khi cập nhật:", {
      id: updatedCategory._id,
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      parent: updatedCategory.parent
        ? {
            id: updatedCategory.parent._id,
            name: updatedCategory.parent.name,
            slug: updatedCategory.parent.slug,
          }
        : null,
    });

    mongoose.disconnect();
  } catch (error) {
    console.error("Lỗi khi cập nhật danh mục:", error);
    mongoose.disconnect();
  }
};

// Chạy script
updateCategoryParent();
