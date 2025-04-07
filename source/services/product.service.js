import { Product, Category, Material } from "../models/index.js";
import slugify from "slugify";

class ProductService {
  async getProducts(filters = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      category,
      minPrice,
      maxPrice,
      search,
      isFeatured,
    } = filters;

    // Xây dựng query
    const query = {};

    // Lọc theo danh mục
    if (category) {
      query.category_id = category;
    }

    // Lọc theo giá - cần join với model Price
    if (minPrice || maxPrice) {
      // Lọc giá sẽ cần thực hiện aggregate với join Price
      // Đối với ví dụ đơn giản, tạm thời bỏ qua việc lọc theo giá
    }

    // Tìm kiếm theo tên sản phẩm
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Lọc sản phẩm nổi bật (nếu có trường này)
    if (isFeatured !== undefined) {
      // Nếu model của bạn có trường isFeatured
      query.isFeatured = isFeatured;
    }

    // Tính toán số lượng sản phẩm bỏ qua
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Thực hiện truy vấn với populate danh mục
    const products = await Product.find(query)
      .populate({
        path: "category_id",
        select: "name slug _id parent",
        populate: {
          path: "parent",
          select: "name slug _id",
        },
      })
      .populate("material_id", "name slug _id")
      .populate({
        path: "price",
        select: "original discount discountQuantity currency",
      })
      .populate({
        path: "variants",
        select: "name color colorThumbnail images",
      })
      .sort({ [sort]: order === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Đếm tổng số sản phẩm
    const total = await Product.countDocuments(query);

    // Chuyển đổi định dạng sản phẩm
    const formattedProducts = products.map((product) =>
      this.formatProduct(product)
    );

    return {
      products: formattedProducts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getProductById(id) {
    const product = await Product.findById(id)
      .populate({
        path: "category_id",
        select: "name slug _id",
        populate: {
          path: "parent",
          select: "name slug _id",
        },
      })
      .populate("material_id", "name slug _id")
      .populate({
        path: "variants",
        select: "name color colorThumbnail images sizes",
      })
      .populate({
        path: "comments",
        select:
          "user_id user_name content rating replyContentAdmin createdAt updatedAt",
        populate: {
          path: "user_id",
          select: "_id username email",
        },
      });

    if (!product) {
      return null;
    }

    return this.formatProduct(product);
  }

  async getProductBySlug(slug) {
    const product = await Product.findOne({ slug })
      .populate({
        path: "category_id",
        select: "name slug _id parent",
        populate: {
          path: "parent",
          select: "name slug _id",
        },
      })
      .populate("material_id", "name slug _id")
      .populate({
        path: "variants",
        select: "name color colorThumbnail images sizes",
      })
      .populate({
        path: "comments",
        select:
          "user_id user_name content rating replyContentAdmin createdAt updatedAt",
        populate: {
          path: "user_id",
          select: "_id username email",
        },
      });

    if (!product) {
      return null;
    }

    // Kiểm tra xem danh mục có parent nhưng chưa được populate không
    if (
      product.category_id &&
      product.category_id.parent &&
      typeof product.category_id.parent === "object" &&
      !product.category_id.parent.name
    ) {
      // Populate parent thủ công
      const parentCategory = await Category.findById(
        product.category_id.parent
      );
      if (parentCategory) {
        product.category_id.parent = parentCategory;
      }
    }

    return this.formatProduct(product);
  }

  async getProductsByCategory(categoryId, options = {}) {
    const { page = 1, limit = 10 } = options;

    const categoryExists = await Category.findById(categoryId).populate(
      "parent"
    );
    if (!categoryExists) {
      return {
        products: [],
        category: null,
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
        },
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find({ category_id: categoryId })
      .populate({
        path: "category_id",
        select: "name slug parent",
        populate: {
          path: "parent",
          select: "name slug _id",
        },
      })
      .populate("material_id", "name slug _id")
      .populate(
        "comments",
        "user_id user_name content rating replyContentAdmin createdAt updatedAt",
        {
          populate: {
            path: "user_id",
            select: "_id username email",
          },
        }
      )
      .populate({
        path: "variants",
        select: "name color colorThumbnail images sizes",
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments({ category_id: categoryId });

    const formattedProducts = products.map((product) =>
      this.formatProduct(product)
    );

    return {
      products: formattedProducts,
      category: categoryExists,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async searchProducts(query, options = {}) {
    const { page = 1, limit = 10 } = options;

    if (!query) {
      return {
        products: [],
        search: "",
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
        },
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };

    const products = await Product.find(searchQuery)
      .populate({
        path: "category_id",
        select: "name slug _id parent",
        populate: {
          path: "parent",
          select: "name slug _id",
        },
      })
      .populate("material_id", "name slug _id")
      .populate({
        path: "price",
        select: "original discount discountQuantity currency",
      })
      .populate({
        path: "variants",
        select: "name color colorThumbnail images",
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(searchQuery);

    const formattedProducts = products.map((product) =>
      this.formatProduct(product)
    );

    return {
      products: formattedProducts,
      search: query,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

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

  async createProduct(productData, userId) {
    const { name, description, price, category_id, material_id, variants } =
      productData;

    if (!name || !description || !price || !category_id) {
      throw new Error("Thiếu thông tin sản phẩm bắt buộc");
    }

    // Kiểm tra danh mục tồn tại
    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      throw new Error("Danh mục không tồn tại");
    }

    // Kiểm tra vật liệu tồn tại nếu được cung cấp
    if (material_id) {
      const materialExists = await Material.findById(material_id);
      if (!materialExists) {
        throw new Error("Chất liệu không tồn tại");
      }
    }

    // Tạo slug từ tên sản phẩm
    const slug = this.createSlug(name);

    // Kiểm tra slug không trùng lặp
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      throw new Error("Tên sản phẩm đã tồn tại");
    }

    // Xử lý biến thể và tính tổng số lượng
    let totalQuantity = 0;
    let processedVariants = [];

    if (variants && Array.isArray(variants)) {
      processedVariants = variants.map((variant) => {
        // Xử lý sizes trong mỗi variant
        const sizes =
          variant.sizes?.map((size) => {
            totalQuantity += size.stock || 0;
            return {
              size: size.size,
              stock: size.stock || 0,
            };
          }) || [];

        return {
          name: variant.name || "",
          color: variant.color || "",
          colorThumbnail: variant.colorThumbnail || "",
          sizes,
          images: variant.images || [],
        };
      });
    }

    // Tạo sản phẩm mới
    const newProduct = await Product.create({
      name,
      description,
      slug,
      price: {
        original: price.original,
        discountQuantity: price.discountQuantity || 0,
        currency: price.currency || "VND",
      },
      category_id,
      material_id,
      variants: processedVariants,
      total_quantity: totalQuantity,
      created_by: userId,
    });

    return this.formatProduct(newProduct);
  }

  async updateProduct(id, updateData, userId) {
    // Kiểm tra danh mục tồn tại nếu được cập nhật
    if (updateData.category_id) {
      const categoryExists = await Category.findById(updateData.category_id);
      if (!categoryExists) {
        throw new Error("Danh mục không tồn tại");
      }
    }

    // Kiểm tra vật liệu tồn tại nếu được cập nhật
    if (updateData.material_id) {
      const materialExists = await Material.findById(updateData.material_id);
      if (!materialExists) {
        throw new Error("Chất liệu không tồn tại");
      }
    }

    // Kiểm tra sản phẩm tồn tại
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      throw new Error("Không tìm thấy sản phẩm");
    }

    // Xử lý slug nếu tên được cập nhật
    if (updateData.name) {
      const slug = this.createSlug(updateData.name);
      // Kiểm tra slug không trùng lặp với sản phẩm khác
      const existingProduct = await Product.findOne({
        slug,
        _id: { $ne: id }, // Không bao gồm sản phẩm hiện tại
      });
      if (existingProduct) {
        throw new Error("Tên sản phẩm đã tồn tại");
      }
      updateData.slug = slug;
    }

    // Xử lý cập nhật price nếu được cung cấp
    if (updateData.price && typeof updateData.price === "object") {
      updateData.price = {
        original:
          updateData.price.original || currentProduct.price?.original || 0,
        discount:
          updateData.price.discount || currentProduct.price?.discount || 0,
        discountQuantity:
          updateData.price.discountQuantity ||
          currentProduct.price?.discountQuantity ||
          0,
        currency:
          updateData.price.currency || currentProduct.price?.currency || "VND",
      };
    }

    // Xử lý cập nhật variants
    if (updateData.variants && Array.isArray(updateData.variants)) {
      // Tính toán lại tổng số lượng
      let totalQuantity = 0;

      const processedVariants = updateData.variants.map((variant) => {
        // Xử lý sizes trong mỗi variant
        const sizes =
          variant.sizes?.map((size) => {
            totalQuantity += size.stock || 0;
            return {
              size: size.size,
              stock: size.stock || 0,
            };
          }) || [];

        return {
          name: variant.name || "",
          color: variant.color || "",
          colorThumbnail: variant.colorThumbnail || "",
          sizes,
          images: variant.images || [],
        };
      });

      updateData.variants = processedVariants;
      updateData.total_quantity = totalQuantity;
    }

    // Cập nhật thông tin sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("category_id", "name")
      .populate("material_id", "name");

    if (!updatedProduct) {
      throw new Error("Không tìm thấy sản phẩm");
    }

    return this.formatProduct(updatedProduct);
  }

  async deleteProduct(id) {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      throw new Error("Không tìm thấy sản phẩm để xóa");
    }
    return deletedProduct;
  }

  async getRelatedProducts(productId, limit = 4) {
    // Tìm sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      return [];
    }

    // Tìm các sản phẩm liên quan dựa trên category_id và material_id
    const relatedProducts = await Product.find({
      $or: [
        { category_id: product.category_id },
        { material_id: product.material_id },
      ],
      _id: { $ne: productId }, // Loại trừ sản phẩm hiện tại
    })
      .populate("category_id", "name slug _id")
      .populate("material_id", "name _id")
      .populate({
        path: "variants",
        select: "name color colorThumbnail images",
      })
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    return relatedProducts.map((product) => this.formatProduct(product));
  }

  async addVariantToProduct(productId, variantData) {
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Không tìm thấy sản phẩm");
    }

    // Kiểm tra dữ liệu variant
    if (!variantData.color) {
      throw new Error("Màu sắc là bắt buộc");
    }

    // Xử lý sizes và tính toán tổng số lượng bổ sung
    let additionalStock = 0;
    const sizes =
      variantData.sizes?.map((size) => {
        additionalStock += size.stock || 0;
        return {
          size: size.size,
          stock: size.stock || 0,
        };
      }) || [];

    // Tạo variant mới
    const newVariant = {
      name: variantData.name || variantData.color,
      color: variantData.color,
      colorThumbnail: variantData.colorThumbnail || "",
      sizes,
      images: variantData.images || [],
    };

    // Thêm variant vào sản phẩm
    product.variants.push(newVariant);

    // Cập nhật tổng số lượng
    product.total_quantity += additionalStock;

    // Lưu sản phẩm
    await product.save();

    return this.formatProduct(product);
  }

  async updateStock(productId, stockData) {
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Không tìm thấy sản phẩm");
    }

    // Kiểm tra dữ liệu cập nhật
    if (
      !stockData.variantId ||
      !stockData.sizes ||
      !Array.isArray(stockData.sizes)
    ) {
      throw new Error("Dữ liệu cập nhật không hợp lệ");
    }

    // Tìm variant cần cập nhật
    const variantIndex = product.variants.findIndex(
      (v) => v._id.toString() === stockData.variantId
    );

    if (variantIndex === -1) {
      throw new Error("Không tìm thấy biến thể sản phẩm");
    }

    // Lưu tổng số lượng trước khi cập nhật
    let oldTotalStock = 0;
    product.variants[variantIndex].sizes.forEach((size) => {
      oldTotalStock += size.stock;
    });

    // Cập nhật số lượng cho từng kích thước
    let newTotalStock = 0;
    stockData.sizes.forEach((updateSize) => {
      const sizeIndex = product.variants[variantIndex].sizes.findIndex(
        (s) => s.size === updateSize.size
      );

      if (sizeIndex !== -1) {
        // Cập nhật kích thước hiện có
        product.variants[variantIndex].sizes[sizeIndex].stock =
          updateSize.stock;
      } else {
        // Thêm kích thước mới
        product.variants[variantIndex].sizes.push({
          size: updateSize.size,
          stock: updateSize.stock,
        });
      }

      newTotalStock += updateSize.stock;
    });

    // Cập nhật tổng số lượng của sản phẩm
    product.total_quantity =
      product.total_quantity - oldTotalStock + newTotalStock;

    // Lưu sản phẩm
    await product.save();

    return this.formatProduct(product);
  }

  formatProduct(product) {
    if (!product) return null;

    // Xử lý description để chia thành header và body
    let header = {};
    let body = "";

    if (product.description) {
      try {
        // Thử parse nếu là JSON string
        const descObj =
          typeof product.description === "string"
            ? JSON.parse(product.description)
            : product.description;

        if (typeof descObj === "object") {
          header = descObj.header || {};
          body = descObj.body || "";
        } else {
          // Nếu không phải JSON object, xử lý như text thông thường
          const parts = product.description.split("\n\n");
          if (parts.length > 1) {
            header = { text: parts[0] };
            body = parts.slice(1).join("\n\n");
          } else {
            body = product.description;
          }
        }
      } catch (e) {
        // Nếu không parse được JSON, xử lý như text thông thường
        const parts = product.description.split("\n\n");
        if (parts.length > 1) {
          header = { text: parts[0] };
          body = parts.slice(1).join("\n\n");
        } else {
          body = product.description;
        }
      }
    }

    // Định dạng comments
    const formattedComments = product.comments
      ? product.comments.map((comment) => {
          return {
            name: comment.user_name || comment.user_id?.username || "",
            username: comment.user_id?.username || "",
            email: comment.user_id?.email || "",
            rating: comment.rating || 5,
            content: comment.content || "",
            replyContentAdmin: comment.replyContentAdmin || "",
            created_at: comment.createdAt
              ? comment.createdAt.toISOString()
              : "",
            updated_at: comment.updatedAt
              ? comment.updatedAt.toISOString()
              : "",
          };
        })
      : [];

    // Xử lý variants để trả về định dạng như trong hình
    const formattedVariants = product.variants
      ? product.variants.map((variant) => ({
          name: variant.name || "",
          colorThumbnail: variant.colorThumbnail || "",
          images: variant.images || [],
        }))
      : [];

    // Xử lý thông tin danh mục và danh mục cha
    let categoryInfo = {
      parent: null,
      name: "",
      slug: "",
    };

    if (product.category_id) {
      categoryInfo.name = product.category_id.name || "";
      categoryInfo.slug = product.category_id.slug || "";

      // Xử lý parent
      if (product.category_id.parent) {
        if (typeof product.category_id.parent === "object") {
          categoryInfo.parent = {
            id: product.category_id.parent._id || "",
            name: product.category_id.parent.name || "",
            slug: product.category_id.parent.slug || "",
          };
        } else if (typeof product.category_id.parent === "string") {
          // Nếu parent chỉ là ID nhưng không được populate
          categoryInfo.parent = {
            id: product.category_id.parent,
            name: "Danh mục cha",
            slug: "",
          };
        }
      }
    }

    return {
      id: product._id.toString(),
      name: product.name,
      description: {
        header: header,
        material: product.material_id?.name || "",
        style: product.style || "Regular fit",
        responsible: product.responsible || "",
        features: product.features || "",
        image: product.thumb || "",
        body: body,
      },
      body: body,
      price: {
        price: product.price?.original || 0,
        originalPrice: product.price?.original || 0,
        discountQuantity: product.price?.discountQuantity || 0,
        currency: product.price?.currency || "VND",
      },
      comment: formattedComments,
      category: categoryInfo,
      material: {
        name: product.material_id?.name || "",
        slug: product.material_id?.slug || "",
      },
      tagIsNew: product.tagIsNew || false,
      variants: formattedVariants,
      slug: product.slug || "",
      created_at: product.createdAt ? product.createdAt.toISOString() : "",
      updated_at: product.updatedAt ? product.updatedAt.toISOString() : "",
    };
  }
}

export default new ProductService();
