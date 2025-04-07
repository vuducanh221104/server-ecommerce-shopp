import { Category, Product } from "../models/index.js";
import slugify from "slugify";

class CategoryService {
  createSlug(name) {
    if (!name) return "";

    // Thiết lập các tùy chọn cho slugify
    const options = {
      replacement: "-", // thay thế khoảng trắng bằng dấu gạch ngang
      remove: undefined, // không xóa ký tự nào (mặc định)
      lower: true, // chuyển thành chữ thường
      strict: false, // không áp dụng chế độ strict để giữ các ký tự tiếng Việt
      locale: "vi", // sử dụng locale tiếng Việt
      trim: true, // cắt bỏ khoảng trắng ở đầu và cuối
    };

    return slugify(name, options);
  }

  async createCategory(categoryData) {
    const { name, description, parent } = categoryData;

    if (!name) {
      throw new Error("Tên danh mục là bắt buộc");
    }

    const slug = this.createSlug(name);

    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      throw new Error("Danh mục đã tồn tại");
    }

    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        throw new Error("Danh mục cha không tồn tại");
      }
    }

    const newCategory = await Category.create({
      name,
      slug,
      description,
      parent,
    });

    return newCategory;
  }

  async updateCategory(id, categoryData) {
    const { name, description, parent } = categoryData;

    const category = await Category.findById(id);
    if (!category) {
      throw new Error("Danh mục không tồn tại");
    }

    let slug = category.slug;
    if (name && name !== category.name) {
      slug = this.createSlug(name);

      const existingCategory = await Category.findOne({
        slug,
        _id: { $ne: id },
      });
      if (existingCategory) {
        throw new Error("Tên danh mục đã tồn tại");
      }
    }

    if (parent) {
      if (parent.toString() === id.toString()) {
        throw new Error("Danh mục không thể là danh mục cha của chính nó");
      }

      const isChild = await this.isChildCategory(parent, id);
      if (isChild) {
        throw new Error(
          "Danh mục cha không thể là một danh mục con của danh mục này"
        );
      }

      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        throw new Error("Danh mục cha không tồn tại");
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: name || category.name,
        slug,
        description:
          description !== undefined ? description : category.description,
        parent: parent !== undefined ? parent : category.parent,
      },
      { new: true }
    );

    return updatedCategory;
  }

  async deleteCategory(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw new Error("Danh mục không tồn tại");
    }

    const hasChildCategories = await Category.exists({ parent: id });
    if (hasChildCategories) {
      throw new Error(
        "Không thể xóa danh mục này vì có danh mục con phụ thuộc vào nó"
      );
    }

    await Category.deleteOne({ _id: id });
    return { success: true };
  }

  async getCategoryById(id) {
    const category = await Category.findById(id).populate(
      "parent",
      "name slug _id"
    );
    if (!category) {
      throw new Error("Danh mục không tồn tại");
    }

    return category;
  }

  async getAllCategories() {
    const categories = await Category.find().populate(
      "parent",
      "name slug _id"
    );
    return categories;
  }

  async getCategoriesByParent(parentId = null) {
    const query = parentId
      ? { parent: parentId }
      : { parent: { $exists: false } };
    const categories = await Category.find(query).populate(
      "parent",
      "name slug _id"
    );
    return categories;
  }

  async getCategoryTree() {
    const allCategories = await Category.find().lean();

    const categoryMap = {};
    allCategories.forEach((category) => {
      categoryMap[category._id.toString()] = {
        ...category,
        children: [],
      };
    });

    const rootCategories = [];
    allCategories.forEach((category) => {
      if (category.parent) {
        const parentId = category.parent.toString();
        if (categoryMap[parentId]) {
          categoryMap[parentId].children.push(
            categoryMap[category._id.toString()]
          );
        }
      } else {
        rootCategories.push(categoryMap[category._id.toString()]);
      }
    });

    return rootCategories;
  }

  async isChildCategory(parentId, childId) {
    const visited = new Set();
    const queue = [childId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId.toString())) continue;
      visited.add(currentId.toString());

      const children = await Category.find({ parent: currentId }, "_id");
      for (const child of children) {
        const childIdStr = child._id.toString();
        if (childIdStr === parentId.toString()) return true;
        queue.push(childIdStr);
      }
    }

    return false;
  }

  async getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug }).populate(
      "parent",
      "name slug _id"
    );
    if (!category) {
      throw new Error("Danh mục không tồn tại");
    }

    return category;
  }

  async getChildCategories(parentId) {
    return Category.find({ parent: parentId });
  }

  async searchCategories(query) {
    if (!query) {
      return [];
    }

    return Category.find({
      name: { $regex: query, $options: "i" },
    }).populate("parent", "name slug _id");
  }

  async getCategoryWithProducts(categoryId) {
    const category = await Category.findById(categoryId).populate(
      "parent",
      "name slug _id"
    );
    if (!category) {
      throw new Error("Danh mục không tồn tại");
    }

    const products = await Product.find({ category_id: categoryId })
      .limit(10)
      .sort({ createdAt: -1 });

    return {
      category,
      products,
    };
  }

  formatCategory(category) {
    if (!category) return null;

    return {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parent: category.parent
        ? {
            id: category.parent._id.toString(),
            name: category.parent.name,
            slug: category.parent.slug,
          }
        : null,
      created_at: category.createdAt ? category.createdAt.toISOString() : "",
      updated_at: category.updatedAt ? category.updatedAt.toISOString() : "",
    };
  }
}

export default new CategoryService();
