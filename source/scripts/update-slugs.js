import mongoose from "mongoose";
import dotenv from "dotenv";
import slugify from "slugify";
import { Category, Product } from "../models/index.js";

dotenv.config();

// Thiết lập kết nối MongoDB
mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log("Đã kết nối đến MongoDB"))
  .catch((err) => {
    console.error("Lỗi kết nối MongoDB:", err);
    process.exit(1);
  });

// Hàm tạo slug đúng
const createCorrectSlug = (name) => {
  if (!name) return "";

  const options = {
    replacement: "-",
    remove: undefined,
    lower: true,
    strict: false,
    locale: "vi",
    trim: true,
  };

  return slugify(name, options);
};

// Cập nhật slug cho danh mục
const updateCategorySlug = async () => {
  try {
    const categories = await Category.find();
    console.log(`Tìm thấy ${categories.length} danh mục cần cập nhật`);

    let updateCount = 0;
    for (const category of categories) {
      const newSlug = createCorrectSlug(category.name);

      if (newSlug !== category.slug) {
        console.log(
          `Cập nhật danh mục: "${category.name}" từ "${category.slug}" thành "${newSlug}"`
        );

        await Category.findByIdAndUpdate(category._id, { slug: newSlug });
        updateCount++;
      }
    }

    console.log(`Đã cập nhật ${updateCount} danh mục`);
  } catch (error) {
    console.error("Lỗi khi cập nhật slug danh mục:", error);
  }
};

// Cập nhật slug cho sản phẩm
const updateProductSlug = async () => {
  try {
    const products = await Product.find();
    console.log(`Tìm thấy ${products.length} sản phẩm cần cập nhật`);

    let updateCount = 0;
    for (const product of products) {
      const newSlug = createCorrectSlug(product.name);

      if (newSlug !== product.slug) {
        console.log(
          `Cập nhật sản phẩm: "${product.name}" từ "${product.slug}" thành "${newSlug}"`
        );

        await Product.findByIdAndUpdate(product._id, { slug: newSlug });
        updateCount++;
      }
    }

    console.log(`Đã cập nhật ${updateCount} sản phẩm`);
  } catch (error) {
    console.error("Lỗi khi cập nhật slug sản phẩm:", error);
  }
};

// Chạy tác vụ cập nhật
const runUpdate = async () => {
  try {
    console.log("Bắt đầu cập nhật slug...");

    await updateCategorySlug();
    await updateProductSlug();

    console.log("Hoàn thành cập nhật slug");
    mongoose.disconnect();
  } catch (error) {
    console.error("Lỗi trong quá trình cập nhật:", error);
    mongoose.disconnect();
  }
};

// Chạy script
runUpdate();
