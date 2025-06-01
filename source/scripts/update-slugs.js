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

    let updateCount = 0;
    for (const category of categories) {
      const newSlug = createCorrectSlug(category.name);

      if (newSlug !== category.slug) {
       

        await Category.findByIdAndUpdate(category._id, { slug: newSlug });
        updateCount++;
      }
    }

  } catch (error) {
    console.error("Lỗi khi cập nhật slug danh mục:", error);
  }
};

// Cập nhật slug cho sản phẩm
const updateProductSlug = async () => {
  try {
    const products = await Product.find();

    let updateCount = 0;
    for (const product of products) {
      const newSlug = createCorrectSlug(product.name);

      if (newSlug !== product.slug) {
  

        await Product.findByIdAndUpdate(product._id, { slug: newSlug });
        updateCount++;
      }
    }

  } catch (error) {
    console.error("Lỗi khi cập nhật slug sản phẩm:", error);
  }
};

// Chạy tác vụ cập nhật
const runUpdate = async () => {
  try {

    await updateCategorySlug();
    await updateProductSlug();

    mongoose.disconnect();
  } catch (error) {
    console.error("Lỗi trong quá trình cập nhật:", error);
    mongoose.disconnect();
  }
};

// Chạy script
runUpdate();
