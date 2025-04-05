import { CatchError } from "../config/catchError.js";
import { ProductService } from "../services/index.js";

const ProductController = {
  getAllProducts: CatchError(async (req, res) => {
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
  }),

  getProductById: CatchError(async (req, res) => {
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
  }),

  createProduct: CatchError(async (req, res) => {
    const productData = req.body;
    console.log(
      "Request body in createProduct:",
      JSON.stringify(productData, null, 2)
    );

    const {
      name,
      slug,
      description,
      category_id,
      product_type_id,
      material_id,
      price,
      thumb,
      total_quantity,
    } = productData;

    if (
      !name ||
      !slug ||
      !description ||
      !category_id ||
      !product_type_id ||
      !material_id ||
      !price ||
      !thumb ||
      !total_quantity
    ) {
      return res.status(400).json({
        status: "error",
        message: "Thiếu thông tin sản phẩm bắt buộc",
        missingFields: {
          name: !name,
          slug: !slug,
          description: !description,
          category_id: !category_id,
          product_type_id: !product_type_id,
          material_id: !material_id,
          price: !price,
          thumb: !thumb,
          total_quantity: !total_quantity,
        },
      });
    }

    const newProduct = await ProductService.createProduct(productData);

    return res.status(201).json({
      status: "success",
      message: "Tạo sản phẩm thành công",
      data: {
        product: newProduct,
      },
    });
  }),

  updateProduct: CatchError(async (req, res) => {
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
  }),

  deleteProduct: CatchError(async (req, res) => {
    const { id } = req.params;

    await ProductService.deleteProduct(id);

    return res.status(200).json({
      message: "Xóa sản phẩm thành công",
    });
  }),

  getProductsByCategory: CatchError(async (req, res) => {
    const { categoryId } = req.params;
    const options = {
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await ProductService.getProductsByCategory(
      categoryId,
      options
    );

    if (!result.category) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục",
        products: [],
        pagination: result.pagination,
      });
    }

    return res.status(200).json({
      message: "Lấy danh sách sản phẩm theo danh mục thành công",
      products: result.products,
      category: result.category.name,
      pagination: result.pagination,
    });
  }),

  searchProducts: CatchError(async (req, res) => {
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
  }),

  getFeaturedProducts: CatchError(async (req, res) => {
    const filters = {
      limit: req.query.limit,
      isFeatured: true,
    };

    const result = await ProductService.getProducts(filters);

    return res.status(200).json({
      message: "Lấy danh sách sản phẩm nổi bật thành công",
      products: result.products,
    });
  }),

  getNewArrivals: CatchError(async (req, res) => {
    const filters = {
      limit: req.query.limit,
      sort: "createdAt",
      order: "desc",
    };

    const result = await ProductService.getProducts(filters);

    return res.status(200).json({
      message: "Lấy danh sách sản phẩm mới nhất thành công",
      products: result.products,
    });
  }),

  addVariantToProduct: CatchError(async (req, res) => {
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
  }),


  updateStock: CatchError(async (req, res) => {
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
  }),
};

export default ProductController;
