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
    console.log(
      "Request body in createProduct:",
      JSON.stringify(productData, null, 2)
    );

    // Lấy các trường từ request body
    const {
      name,
      slug,
      description,
      category_id,
      material_id,
      price,
      total_quantity,
    } = productData;

    // Chỉ kiểm tra các trường thực sự cần thiết
    if (
      !name ||
      !slug ||
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
          slug: !slug,
          description: !description,
          category_id: !category_id,
          material_id: !material_id,
          price: !price,
          total_quantity: !total_quantity,
        },
      });
    }

    // Tạo sản phẩm mới với ProductService
    const newProduct = await ProductService.createProduct(productData);

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

    // Hardcode mẫu dữ liệu cho mục đích test
    if (slug === "test-product") {
      return res.status(200).json({
        message: "Lấy thông tin sản phẩm thành công",
        product: {
          id: "1",
          name: "Áo Polo Nam Pique Cotton",
          description: {
            header: {
              material: "100% Cotton",
              style: "Regular fit, người mẫu cao 186 - 77kg, mặc size 2XL",
              responsible: "Đi chơi, đi chơi học, đi làm ngay",
              features:
                "Kiểu dệt Pique giúp áo thoáng khí, chất hòan thiện giúp ít vò lộn",
              image:
                "https://mcdn.coolmate.me/image/March2023/ao-polo-nam-pique-cotton-thumb-1.png",
            },
            body: '**Áo polo nam Pique Cotton** với chất vải cotton 100% cao cấp, mềm mại và thoáng khí tối ưu, đảm bảo mang lại trải nghiệm mặc thoải mái nhất cho chàng suốt cả ngày dài.\n\nĐây có thể là chiếc áo chủ đạo trong tủ đồ của mình. Hãy cùng Coolmate tìm đáp án cho câu hỏi: "Vì sao nên mua ngay chiếc áo này?"\n\n![](https://mcdn.coolmate.me/image/August2023/mceclip6_66.jpg)\n\n**Đặc điểm nổi bật Áo polo nam Pique Cotton**\n\nÁo polo nam chất liệu pique cotton 100% cao cấp, mềm mại và thoáng khí tối ưu, đảm bảo mang lại trải nghiệm mặc thoải mái nhất cho chàng suốt cả ngày dài.',
          },
          price: {
            price: 179000,
            originalPrice: 199000,
            discountQuantity: 10,
            currency: "VND",
          },
          comment: [
            {
              name: "Đức Anh",
              username: "ducanh2211",
              email: "vng1596@gmail.com",
              rating: 5,
              content: "Tốt 0k",
              replyContentAdmin: "Cảm ơn anh ạ.",
              created_at: "2024-08-04T04:27:43.876Z",
              updated_at: "2024-11-27T15:50:18.958Z",
            },
            {
              name: "Trà",
              username: "tratg",
              email: "tra@gmail.com",
              rating: 4,
              content: "Xấu",
              replyContentAdmin: "Xin lỗi và trải nghiệm chưa tròn ý.",
              created_at: "2024-08-04T04:27:43.876Z",
              updated_at: "2024-11-27T15:50:18.958Z",
            },
          ],
          category: {
            parent: {
              name: "Áo Nam",
              slug: "ao-nam",
            },
            name: "Áo Polo",
            slug: "ao-polo",
          },
          material: {
            name: "Cotton",
            slug: "cotton",
          },
          tagIsNew: true,
          variants: [
            {
              name: "Tím",
              colorThumbnail:
                "https://media3.coolmate.me/cdn-cgi/image/width=160,height=160,quality=80,format=auto/uploads/December2024/ao-dai-tay-the-thao-1699-trang_(12).jpg",
              images: [
                "https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/March2023/ao-thun-nu-chay-bo-core-tee-slimfit-11872-tim_85.jpg",
                "https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/March2023/ao-thun-nu-chay-bo-core-tee-slimfit-12012-tim_7.jpg",
                "https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/March2023/ao-thun-nu-chay-bo-core-tee-slimfit-12012-tim_7.jpg",
              ],
            },
            {
              name: "Trắng",
              colorThumbnail:
                "https://media3.coolmate.me/cdn-cgi/image/width=160,height=160,quality=80,format=auto/uploads/December2024/ao-dai-tay-the-thao-1699-trang_(12).jpg",
              images: [
                "https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/March2023/ao-thun-nu-chay-bo-core-tee-slimfit-11872-white.jpg",
                "https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/March2023/ao-thun-nu-chay-bo-core-tee-slimfit-12012-white.jpg",
                "https://media3.coolmate.me/cdn-cgi/image/width=672,height=990,quality=85/uploads/March2023/ao-thun-nu-chay-bo-core-tee-slimfit-12012-white.jpg",
              ],
            },
          ],
          slug: "ao-polo-nam-pique-cotton",
          created_at: "2024-08-04T04:27:43.876Z",
          updated_at: "2024-11-27T15:50:18.958Z",
        },
      });
    }

    const product = await ProductService.getProductBySlug(slug);
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

  getProductsByCategorySlug = CatchError(async (req, res) => {
    const { slug } = req.params;
    const options = {
      page: req.query.page,
      limit: req.query.limit,
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
    });
  });
}

export default new ProductController();
