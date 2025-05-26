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

    // Add empty subcategories array for consistency
    const newCategoryObj = newCategory.toObject
      ? newCategory.toObject()
      : { ...newCategory };
    newCategoryObj.subcategories = [];

    return newCategoryObj;
  }

  async updateCategory(id, categoryData) {
    const { name, description, parent, slug: newSlug } = categoryData;

    const category = await Category.findById(id);
    if (!category) {
      throw new Error("Danh mục không tồn tại");
    }

    let slug = category.slug;

    // Check if name is changing and update slug accordingly
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
    // Check if slug is explicitly provided and different from current slug
    else if (newSlug && newSlug !== category.slug) {
      slug = newSlug;

      // Check if this slug already exists for another category
      const existingCategory = await Category.findOne({
        slug,
        _id: { $ne: id },
      });
      if (existingCategory) {
        throw new Error("Slug danh mục đã tồn tại");
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
    ).populate("parent", "name slug _id");

    // Get subcategories for the updated category
    const subcategories = await Category.find({ parent: id });

    // Convert to plain object and add subcategories
    const updatedCategoryObj = updatedCategory.toObject
      ? updatedCategory.toObject()
      : { ...updatedCategory };
    updatedCategoryObj.subcategories = subcategories;

    return updatedCategoryObj;
  }

  async deleteCategory(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw new Error("Danh mục không tồn tại");
    }

    // Find all subcategories
    const subcategories = await Category.find({ parent: id });

    // Delete all subcategories first
    if (subcategories.length > 0) {
      await Category.deleteMany({ parent: id });
    }

    // Then delete the parent category
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

    // Get subcategories (categories with this category as parent)
    const subcategories = await Category.find({ parent: id });

    // Convert to plain object and add subcategories
    const categoryObj = category.toObject
      ? category.toObject()
      : { ...category };
    categoryObj.subcategories = subcategories;

    return categoryObj;
  }

  async getAllCategories() {
    // First, fetch all categories with their parent information
    const allCategories = await Category.find().populate(
      "parent",
      "name slug _id"
    );

    // Create a map to store parent categories and their children
    const parentCategories = [];
    const childrenMap = {};

    // First pass: separate root categories and create child maps
    allCategories.forEach((category) => {
      // Store the category by ID for lookup
      const categoryId = category._id.toString();

      // Initialize children array if not exists
      if (!childrenMap[categoryId]) {
        childrenMap[categoryId] = [];
      }

      if (category.parent) {
        // This is a child category
        const parentId = category.parent._id.toString();

        // Initialize parent's children array if not exists
        if (!childrenMap[parentId]) {
          childrenMap[parentId] = [];
        }

        // Add this category to its parent's children
        childrenMap[parentId].push(category);
      } else {
        // This is a root/parent category with no parent of its own
        parentCategories.push(category);
      }
    });

    // Second pass: enhance parent categories with their subcategories
    const enhancedCategories = parentCategories.map((parentCategory) => {
      const parentId = parentCategory._id.toString();
      const subcategories = childrenMap[parentId] || [];

      // Create a new object with subcategories added
      const enhancedCategory = parentCategory.toObject
        ? parentCategory.toObject()
        : { ...parentCategory };

      enhancedCategory.subcategories = subcategories;

      return enhancedCategory;
    });

    return enhancedCategories;
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

    // Get subcategories (categories with this category as parent)
    const subcategories = await Category.find({ parent: category._id });

    // Convert to plain object and add subcategories
    const categoryObj = category.toObject
      ? category.toObject()
      : { ...category };
    categoryObj.subcategories = subcategories;

    return categoryObj;
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

    // Format the basic category information
    const formattedCategory = {
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parent: category.parent
        ? {
            _id: category.parent._id.toString(),
            name: category.parent.name,
            slug: category.parent.slug,
          }
        : null,
      subcategories: Array.isArray(category.subcategories)
        ? category.subcategories.map((subcategory) => ({
            _id: subcategory._id.toString(),
            name: subcategory.name,
            slug: subcategory.slug,
          }))
        : [],
      createdAt: category.createdAt ? category.createdAt.toISOString() : "",
      updatedAt: category.updatedAt ? category.updatedAt.toISOString() : "",
    };

    return formattedCategory;
  }
}

export default new CategoryService();
