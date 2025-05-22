import CategoryService from "../services/category.service.js";
import { CatchError } from "../config/catchError.js";

class CategoryController {

  getAllCategories = CatchError(async (req, res) => {
    const categories = await CategoryService.getAllCategories();

    const formattedCategories = categories.map((category) =>
      CategoryService.formatCategory(category)
    );

    return res.status(200).json({
      status: "success",
      message: "Lấy danh sách danh mục thành công",
      data: {
        categories: formattedCategories,
      },
    });
  });


  getCategoryById = CatchError(async (req, res) => {
    const { id } = req.params;
    const category = await CategoryService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy danh mục",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lấy thông tin danh mục thành công",
      data: {
        category: CategoryService.formatCategory(category),
      },
    });
  });


  getCategoryBySlug = CatchError(async (req, res) => {
    const { slug } = req.params;
    const category = await CategoryService.getCategoryBySlug(slug);

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy danh mục",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lấy thông tin danh mục thành công",
      data: {
        category: CategoryService.formatCategory(category),
      },
    }); 
  });

  getCategoryHomeBySlug = CatchError(async (req, res) => {
    const { slug } = req.params;
    const category = await CategoryService.getCategoryBySlug(slug);

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy danh mục",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lấy thông tin danh mục thành công",
      data: {
        category: CategoryService.formatCategory(category),
      },
    }); 
  });



  createCategory = CatchError(async (req, res) => {
    const categoryData = req.body;
    console.log("Request body:", categoryData); // Debug để kiểm tra body

    // Kiểm tra dữ liệu đầu vào
    if (!categoryData.name || !categoryData.slug) {
      return res.status(400).json({
        status: "error",
        message: "Tên và slug của danh mục là bắt buộc",
      });
    }

    try {
      const newCategory = await CategoryService.createCategory(categoryData);

      if (newCategory.parent) {
        const categoryWithParent = await CategoryService.getCategoryById(
          newCategory._id
        );
        return res.status(201).json({
          status: "success",
          message: "Tạo danh mục thành công",
          data: {
            category: CategoryService.formatCategory(categoryWithParent),
          },
        });
      }

      return res.status(201).json({
        status: "success",
        message: "Tạo danh mục thành công",
        data: {
          category: CategoryService.formatCategory(newCategory),
        },
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });


  updateCategory = CatchError(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedCategory = await CategoryService.updateCategory(
      id,
      updateData
    );

    return res.status(200).json({
      status: "success",
      message: "Cập nhật danh mục thành công",
      data: {
        category: CategoryService.formatCategory(updatedCategory),
      },
    });
  });


  deleteCategory = CatchError(async (req, res) => {
    const { id } = req.params;

    await CategoryService.deleteCategory(id);

    return res.status(200).json({
      status: "success",
      message: "Xóa danh mục thành công",
    });
  });


  getChildCategories = CatchError(async (req, res) => {
    const { id } = req.params;

    const childCategories = await CategoryService.getChildCategories(id);

    const formattedCategories = childCategories.map((category) =>
      CategoryService.formatCategory(category)
    );

    return res.status(200).json({
      status: "success",
      message: "Lấy danh sách danh mục con thành công",
      data: {
        categories: formattedCategories,
      },
    });
  });
}

export default new CategoryController();
