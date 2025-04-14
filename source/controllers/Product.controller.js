import { CatchError } from "../config/catchError.js";
import { ProductService } from "../services/index.js";

class ProductController {
  getAllProducts = CatchError(async (req, res) => {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      order: req.query.order,
      category: req.query.category,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      search: req.query.search,
    };

    const result = await ProductService.getProducts(filters);

    return res.status(200).json({
      message: "Lấy danh sách sản phẩm thành công",
      products: result.products,
      pagination: result.pagination,
    });
  });

  getProductById = CatchError(async (req, res) => {
    const { id } = req.params;

    const product = await ProductService.getProductById(id);
    if (!product) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm",
      });
    }

    return res.status(200).json({
      message: "Lấy thông tin sản phẩm thành công",
      product,
    });
  });

  createProduct = CatchError(async (req, res) => {
    const productData = req.body;
    const {
      name,
      description,
      category_id,
      material_id,
      price,
      total_quantity,
      variants,
      tagIsNew,
      thumbnail,
      slug,
    } = productData;

    // Chỉ kiểm tra các trường thực sự bắt buộc theo model
    if (
      !name ||
      !description ||
      !category_id ||
      !material_id ||
      !price ||
      !total_quantity
    ) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu thông tin sản phẩm bắt buộc",
        missingFields: {
          name: !name,
          description: !description,
          category_id: !category_id,
          material_id: !material_id,
          price: !price,
          total_quantity: !total_quantity,
        },
      });
    }

    // Validate số lượng và giá
    if (total_quantity < 0) {
      return res.status(400).json({
        status: "error",
        message: "Số lượng sản phẩm không hợp lệ",
      });
    }

    if (
      price.original < 0 ||
      (price.discountQuantity && price.discountQuantity < 0)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Giá sản phẩm không hợp lệ",
      });
    }

    // Validate variants nếu có
    if (variants && !Array.isArray(variants)) {
      return res.status(400).json({
        status: "error",
        message: "Variants phải là một mảng",
      });
    }

    // Validate tagIsNew nếu có
    if (tagIsNew !== undefined && typeof tagIsNew !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "tagIsNew phải là một giá trị boolean",
      });
    }

    // Validate thumbnail nếu có
    if (thumbnail && typeof thumbnail !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Thumbnail phải là một chuỗi URL",
      });
    }

    // Validate slug nếu có
    if (slug && typeof slug !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Slug phải là một chuỗi",
      });
    }

    // Tạo sản phẩm mới với ProductService
    const newProduct = await ProductService.createProduct(
      productData,
      req.user?._id
    );

    return res.status(201).json({
      status: "success",
      message: "Tạo sản phẩm thành công",
      data: {
        product: newProduct,
      },
    });
  });

  updateProduct = CatchError(async (req, res) => {
    const { id } = req.params;

    const updatedProduct = await ProductService.updateProduct(
      id,
      req.body,
      req.user._id
    );

    return res.status(200).json({
      message: "Cập nhật sản phẩm thành công",
      product: updatedProduct,
    });
  });

  deleteProduct = CatchError(async (req, res) => {
    const { id } = req.params;

    await ProductService.deleteProduct(id);

    return res.status(200).json({
      message: "Xóa sản phẩm thành công",
    });
  });

  getProductsByCategory = CatchError(async (req, res) => {
    const { id: categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        status: "error",
        message: "Tham số phân trang không hợp lệ",
      });
    }

    const options = { page, limit };
    const result = await ProductService.getProductsByCategory(
      categoryId,
      options
    );

    if (!result.category) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy danh mục",
        data: {
          products: [],
          pagination: result.pagination,
        },
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lấy danh sách sản phẩm theo danh mục thành công",
      data: {
        products: result.products,
        category: result.category,
        pagination: result.pagination,
      },
    });
  });

  searchProducts = CatchError(async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        message: "Từ khóa tìm kiếm là bắt buộc",
      });
    }

    const options = {
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await ProductService.searchProducts(q, options);

    return res.status(200).json({
      message: "Tìm kiếm sản phẩm thành công",
      products: result.products,
      search: result.search,
      pagination: result.pagination,
    });
  });

  getFeaturedProducts = CatchError(async (req, res) => {
    const filters = {
      limit: req.query.limit,
      isFeatured: true,
    };

    const result = await ProductService.getProducts(filters);

    return res.status(200).json({
      message: "Lấy danh sách sản phẩm nổi bật thành công",
      products: result.products,
    });
  });

  getNewArrivals = CatchError(async (req, res) => {
    const filters = {
      limit: req.query.limit,
      sort: "createdAt",
      order: "desc",
    };

    const result = await ProductService.getProducts(filters);

    return res.status(200).json({
      message: "Lấy danh sách sản phẩm mới thành công",
      products: result.products,
    });
  });

  getRelatedProducts = CatchError(async (req, res) => {
    const { id } = req.params;
    const limit = req.query.limit || 4;

    const relatedProducts = await ProductService.getRelatedProducts(id, limit);

    return res.status(200).json({
      message: "Lấy danh sách sản phẩm liên quan thành công",
      products: relatedProducts,
    });
  });

  addVariantToProduct = CatchError(async (req, res) => {
    const { id } = req.params;
    const { variantId } = req.body;

    if (!variantId) {
      return res.status(400).json({
        message: "ID của biến thể là bắt buộc",
      });
    }

    const updatedProduct = await ProductService.addVariantToProduct(
      id,
      variantId
    );

    return res.status(200).json({
      message: "Thêm biến thể sản phẩm thành công",
      product: updatedProduct,
    });
  });

  updateStock = CatchError(async (req, res) => {
    const { id } = req.params;
    const { quantity, variantId, sizeId, allVariants } = req.body;

    if (quantity === undefined || isNaN(parseInt(quantity))) {
      return res.status(400).json({
        status: "fail",
        message: "Số lượng cần cập nhật là bắt buộc và phải là số",
        code: 400,
      });
    }

    const stockData = {
      quantity: parseInt(quantity),
    };

    if (variantId) {
      stockData.variantId = variantId;

      if (sizeId) {
        stockData.sizeId = sizeId;
      }
    } else if (allVariants) {
      stockData.allVariants = true;
    } else {
      return res.status(400).json({
        status: "fail",
        message:
          "Cần cung cấp variantId hoặc đánh dấu cập nhật tất cả các biến thể",
        code: 400,
      });
    }

    const updatedProduct = await ProductService.updateStock(id, stockData);

    return res.status(200).json({
      status: "success",
      message: "Cập nhật số lượng tồn kho thành công",
      code: 200,
      data: updatedProduct,
    });
  });

  getProductBySlug = CatchError(async (req, res) => {
    const { slug } = req.params;
    const product = await ProductService.getProductBySlug(slug);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy sản phẩm",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lấy thông tin sản phẩm thành công",
      data: {
        product,
      },
    });
  });

  getProductsByCategorySlug = CatchError(async (req, res) => {
    const { slug } = req.params;
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      color: req.query.color,
      size: req.query.size,
      sort: req.query.sort,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
    };

    const result = await ProductService.getProductsByCategorySlug(
      slug,
      options
    );

    if (!result.category) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục",
        products: [],
        pagination: result.pagination,
      });
    }

    // Định dạng thông tin danh mục giống như trong mảng categories của sản phẩm
    const formattedCategory = {
      id: result.category._id,
      name: result.category.name,
      slug: result.category.slug,
      parent: result.category.parent
        ? {
            id: result.category.parent._id,
            name: result.category.parent.name,
            slug: result.category.parent.slug,
          }
        : null,
    };

    return res.status(200).json({
      message: "Lấy danh sách sản phẩm theo danh mục thành công",
      products: result.products,
      category: formattedCategory,
      pagination: result.pagination,
      filters: result.filters,
    });
  });

  getAllProductsWithoutCategory = CatchError(async (req, res) => {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      color: req.query.color,
      size: req.query.size,
      sort: req.query.sort,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
    };

    const filters = {
      ...options,
      order: req.query.order,
    };

    const result = await ProductService.getProducts(filters);

    return res.status(200).json({
      message: "Lấy tất cả sản phẩm thành công",
      products: result.products,
      pagination: result.pagination,
      filters: options,
    });
  });
}

export default new ProductController();
