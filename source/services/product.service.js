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

    // Lọc theo giá
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.original = { $gte: parseInt(minPrice) };
      if (maxPrice)
        query.price.original = {
          ...query.price.original,
          $lte: parseInt(maxPrice),
        };
    }

    // Tìm kiếm theo tên sản phẩm
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Lọc sản phẩm nổi bật
    if (isFeatured !== undefined) {
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
      .populate({
        path: "material_id",
        select: "name slug _id", // Ensure we select all fields needed
      })
      .populate({
        path: "variants",
        select: "name colorThumbnail images sizes",
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
        select: "name colorThumbnail images sizes",
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
        select: "name colorThumbnail images sizes",
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
    if (Array.isArray(product.category_id)) {
      for (let i = 0; i < product.category_id.length; i++) {
        const category = product.category_id[i];
        if (
          category &&
          category.parent &&
          typeof category.parent === "object" &&
          !category.parent.name
        ) {
          // Populate parent thủ công
          const parentCategory = await Category.findById(category.parent);
          if (parentCategory) {
            product.category_id[i].parent = parentCategory;
          }
        }
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

    // Tìm sản phẩm có categoryId trong mảng category_id
    const products = await Product.find({ category_id: { $in: [categoryId] } })
      .populate({
        path: "category_id",
        select: "name slug parent",
        populate: {
          path: "parent",
          select: "name slug _id",
        },
      })
      .populate({
        path: "material_id",
        select: "name slug _id",
      })
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

    const total = await Product.countDocuments({
      category_id: { $in: [categoryId] },
    });

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
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    // Tìm kiếm sản phẩm
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    })
      .populate({
        path: "category_id",
        select: "name slug parent",
        populate: {
          path: "parent",
          select: "name slug _id",
        },
      })
      .populate({
        path: "material_id",
        select: "name slug _id",
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    });

    const formattedProducts = products.map((product) =>
      this.formatProduct(product)
    );

    return {
      products: formattedProducts,
      search: query,
      pagination: this.createPaginationInfo(total, page, limit),
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
    const {
      name,
      description,
      price,
      category_id,
      material_id,
      variants,
      total_quantity,
      tagIsNew,
      thumb,
    } = productData;

    if (!name || !description || !price || !total_quantity) {
      throw new Error("Thiếu thông tin sản phẩm bắt buộc");
    }

    // Kiểm tra danh mục tồn tại
    let categoryIds = [];
    if (Array.isArray(category_id)) {
      // Nếu là mảng, kiểm tra từng danh mục
      for (const id of category_id) {
        const categoryExists = await Category.findById(id);
        if (!categoryExists) {
          throw new Error(`Danh mục với ID ${id} không tồn tại`);
        }
        categoryIds.push(id);
      }
    } else if (category_id) {
      // Nếu là một ID đơn lẻ, chuyển đổi thành mảng
      const categoryExists = await Category.findById(category_id);
      if (!categoryExists) {
        throw new Error("Danh mục không tồn tại");
      }
      categoryIds.push(category_id);
    }

    // Kiểm tra vật liệu tồn tại nếu được cung cấp
    let materialIds = [];
    if (Array.isArray(material_id)) {
      // Nếu là mảng, kiểm tra từng vật liệu
      for (const id of material_id) {
        const materialExists = await Material.findById(id);
        if (!materialExists) {
          throw new Error(`Chất liệu với ID ${id} không tồn tại`);
        }
        materialIds.push(id);
      }
    } else if (material_id) {
      // Nếu là một ID đơn lẻ, chuyển đổi thành mảng
      const materialExists = await Material.findById(material_id);
      if (!materialExists) {
        throw new Error("Chất liệu không tồn tại");
      }
      materialIds.push(material_id);
    }

    // Tạo hoặc sử dụng slug từ request
    let slug = productData.slug || this.createSlug(name);

    // Kiểm tra slug không trùng lặp
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      // Nếu slug đã tồn tại, thêm timestamp để tạo slug duy nhất
      slug = `${slug}-${Date.now()}`;
    }

    // Xử lý giá
    const productPrice = {
      original: typeof price === "number" ? price : price?.original || 0,
      discount: price?.discount || 0,
      discountQuantity: price?.discountQuantity || 0,
      currency: price?.currency || "VND",
    };

    // Xử lý biến thể và tính tổng số lượng
    let calculatedTotalQuantity = total_quantity;
    let processedVariants = [];

    if (variants && Array.isArray(variants)) {
      // Tính tổng số lượng từ các biến thể nếu không có total_quantity
      if (!total_quantity) {
        calculatedTotalQuantity = 0;
      }

      processedVariants = variants.map((variant) => {
        // Xử lý sizes trong mỗi variant
        const sizes =
          variant.sizes?.map((size) => {
            if (!total_quantity) {
              calculatedTotalQuantity += size.stock || 0;
            }
            return {
              size: size.size,
              stock: size.stock || 0,
            };
          }) || [];

        return {
          name: variant.name || "",
          colorThumbnail: variant.colorThumbnail || "",
          sizes,
          images: variant.images || [],
        };
      });
    }

    // Xử lý comments nếu có
    let processedComments = [];
    if (productData.comments && Array.isArray(productData.comments)) {
      processedComments = productData.comments.map((comment) => ({
        ...comment,
        username: comment.username || comment.user_name || "Anonymous User",
        avatar: comment.avatar || "",
        createdAt: comment.createdAt || new Date(),
        updatedAt: comment.updatedAt || new Date(),
      }));
    }

    // Tạo đối tượng sản phẩm
    const productObject = {
      name,
      slug,
      description,
      price: productPrice,
      category_id: categoryIds,
      material_id: materialIds,
      total_quantity: calculatedTotalQuantity,
      variants: processedVariants,
      tagIsNew: tagIsNew !== undefined ? tagIsNew : true,
      thumb: thumb || "",
      comments: processedComments, // Sử dụng comments đã xử lý
    };

    // Tạo sản phẩm mới
    const newProduct = await Product.create(productObject);

    // Populate các trường cần thiết và format kết quả
    const populatedProduct = await Product.findById(newProduct._id)
      .populate({
        path: "category_id",
        select: "name slug _id parent",
        populate: {
          path: "parent",
          select: "name slug _id",
        },
      })
      .populate("material_id", "name slug _id");

    return this.formatProduct(populatedProduct);
  }

  async updateProduct(id, updateData, userId) {
    console.log("Starting product update for ID:", id);
    console.log("Update data:", JSON.stringify(updateData, null, 2));
    console.log("User ID provided:", userId || "No user ID provided");

    // Kiểm tra danh mục tồn tại nếu được cập nhật
    if (updateData.category_id) {
      let categoryIds = [];
      if (Array.isArray(updateData.category_id)) {
        // Nếu là mảng, kiểm tra từng danh mục
        for (const catId of updateData.category_id) {
          const categoryExists = await Category.findById(catId);
          if (!categoryExists) {
            throw new Error(`Danh mục với ID ${catId} không tồn tại`);
          }
          categoryIds.push(catId);
        }
        updateData.category_id = categoryIds;
      } else {
        // Nếu là một ID đơn lẻ, chuyển đổi thành mảng
        const categoryExists = await Category.findById(updateData.category_id);
        if (!categoryExists) {
          throw new Error("Danh mục không tồn tại");
        }
        updateData.category_id = [updateData.category_id];
      }
    }

    // Kiểm tra vật liệu tồn tại nếu được cập nhật
    if (updateData.material_id) {
      let materialIds = [];
      if (Array.isArray(updateData.material_id)) {
        // Nếu là mảng, kiểm tra từng vật liệu
        for (const matId of updateData.material_id) {
          const materialExists = await Material.findById(matId);
          if (!materialExists) {
            throw new Error(`Chất liệu với ID ${matId} không tồn tại`);
          }
          materialIds.push(matId);
        }
        updateData.material_id = materialIds;
      } else {
        // Nếu là một ID đơn lẻ, chuyển đổi thành mảng
        const materialExists = await Material.findById(updateData.material_id);
        if (!materialExists) {
          throw new Error("Chất liệu không tồn tại");
        }
        updateData.material_id = [updateData.material_id];
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

    // Xử lý cập nhật comments nếu được cung cấp
    if (updateData.comments && Array.isArray(updateData.comments)) {
      // Thiết lập các trường timestamps và đảm bảo có username và avatar
      updateData.comments = updateData.comments.map((comment) => ({
        ...comment,
        username: comment.username || comment.user_name || "Anonymous User",
        avatar: comment.avatar || "",
        createdAt: comment.createdAt || new Date(),
        updatedAt: comment.updatedAt || new Date(),
      }));
    }

    // Xử lý cập nhật variants
    if (updateData.variants && Array.isArray(updateData.variants)) {
      console.log(
        "Processing variants:",
        JSON.stringify(
          updateData.variants.map((v) => v.name),
          null,
          2
        )
      );
      // Tính toán lại tổng số lượng
      let totalQuantity = 0;

      const processedVariants = updateData.variants.map((variant) => {
        // Xử lý sizes trong mỗi variant
        const sizes =
          variant.sizes?.map((size) => {
            totalQuantity += size.stock || 0;

            // Create a new size object without _id if it's a client-side object
            // This helps avoid issues with MongoDB ObjectId validation
            return {
              size: size.size,
              stock: size.stock || 0,
              // Only include _id if it's a valid MongoDB ObjectId
              // This is a common issue when editing existing records
              ...(size._id &&
              typeof size._id === "string" &&
              /^[0-9a-fA-F]{24}$/.test(size._id)
                ? { _id: size._id }
                : {}),
            };
          }) || [];

        return {
          name: variant.name || "",
          colorThumbnail: variant.colorThumbnail || "",
          sizes,
          images: variant.images || [],
        };
      });

      updateData.variants = processedVariants;
      updateData.total_quantity = totalQuantity;
    }

    // Kiểm tra và xử lý cập nhật description.header
    if (updateData.description && updateData.description.header) {
      console.log(
        "Processing description.header:",
        JSON.stringify(updateData.description.header, null, 2)
      );
    }

    // Cập nhật thông tin sản phẩm
    console.log("Final update data:", JSON.stringify(updateData, null, 2));
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: "category_id",
        select: "name slug _id parent",
        populate: {
          path: "parent",
          select: "name slug _id",
        },
      })
      .populate("material_id", "name slug _id");

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
    // Kiểm tra sản phẩm cơ sở để tìm các sản phẩm liên quan
    const product = await Product.findById(productId);
    if (!product) return [];

    // Tìm các sản phẩm liên quan dựa trên category_id và material_id
    const relatedProducts = await Product.find({
      $or: [
        { category_id: product.category_id },
        { material_id: product.material_id },
      ],
      _id: { $ne: productId }, // Loại trừ sản phẩm hiện tại
    })
      .populate({
        path: "category_id",
        select: "name slug _id",
      })
      .populate({
        path: "material_id",
        select: "name slug _id",
      })
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
      name: variantData.name || "",
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

  async getProductsByCategorySlug(slug, options = {}) {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const skip = (page - 1) * limit;

    // Tìm danh mục dựa trên slug
    const category = await Category.findOne({ slug }).populate(
      "parent",
      "name slug _id"
    );

    if (!category) {
      return {
        products: [],
        pagination: this.createPaginationInfo(0, page, limit),
        category: null,
        filters: {},
      };
    }

    // Tìm tất cả các danh mục con của danh mục hiện tại
    const childCategories = await Category.find({ parent: category._id });

    // Tạo mảng chứa ID của tất cả các danh mục để tìm sản phẩm (bao gồm danh mục hiện tại và các danh mục con)
    const categoryIds = [
      category._id,
      ...childCategories.map((cat) => cat._id),
    ];

    // Xây dựng query để tìm sản phẩm thuộc cả danh mục hiện tại và các danh mục con
    const query = { category_id: { $in: categoryIds } };

    // Lưu các bộ lọc đã áp dụng để trả về client
    const appliedFilters = {};

    // Khi có lọc theo màu sắc hoặc kích cỡ, sẽ lấy tất cả sản phẩm trước
    // rồi lọc sau khi đã lấy dữ liệu để tránh lỗi với subdocuments
    let usePostFilter = false;
    let colorFilter = null;
    let sizeFilter = null;

    // Lưu thông tin lọc
    if (options.color) {
      const normalizedColor = this.normalizeColor(options.color);
      colorFilter = normalizedColor;
      appliedFilters.color = normalizedColor;
      usePostFilter = true;
    }

    if (options.size) {
      sizeFilter = options.size.toUpperCase();
      appliedFilters.size = sizeFilter;
      usePostFilter = true;
    }

    // Lọc theo khoảng giá nếu có
    if (options.minPrice) {
      query["price.original"] = { $gte: parseInt(options.minPrice) };
      appliedFilters.minPrice = parseInt(options.minPrice);
    }

    if (options.maxPrice) {
      if (query["price.original"]) {
        query["price.original"].$lte = parseInt(options.maxPrice);
      } else {
        query["price.original"] = { $lte: parseInt(options.maxPrice) };
      }
      appliedFilters.maxPrice = parseInt(options.maxPrice);
    }

    // Xác định cách sắp xếp
    let sortOption = { createdAt: -1 }; // Mặc định sắp xếp theo mới nhất

    if (options.sort) {
      switch (options.sort) {
        case "price_asc":
          sortOption = { "price.original": 1 };
          appliedFilters.sort = "price_asc";
          break;
        case "price_desc":
          sortOption = { "price.original": -1 };
          appliedFilters.sort = "price_desc";
          break;
        case "newest":
          sortOption = { createdAt: -1 };
          appliedFilters.sort = "newest";
          break;
        case "bestseller":
          sortOption = { sold: -1 };
          appliedFilters.sort = "bestseller";
          break;
        case "discount":
          sortOption = { "price.discountQuantity": -1 };
          appliedFilters.sort = "discount";
          break;
        default:
          appliedFilters.sort = "newest";
          break;
      }
    }

    // Đếm tổng số sản phẩm thỏa mãn điều kiện - cần đếm lại sau khi lọc
    let totalProducts = await Product.countDocuments(query);

    // Lấy tất cả sản phẩm để lọc thủ công nếu cần
    let products;

    if (usePostFilter) {
      // Nếu có lọc theo màu sắc hoặc kích cỡ, lấy nhiều sản phẩm hơn để lọc sau
      const maxProducts = limit * 10; // Lấy nhiều hơn để đảm bảo đủ sau khi lọc

      products = await Product.find(query)
        .populate({
          path: "category_id",
          select: "name slug parent",
          populate: {
            path: "parent",
            select: "name slug _id",
          },
        })
        .populate({
          path: "material_id",
          select: "name slug _id",
        })
        .sort(sortOption)
        .limit(maxProducts);

      // Lọc thủ công theo màu sắc và kích cỡ
      if (colorFilter) {
        products = products.filter((product) => {
          return (
            product.variants &&
            product.variants.some(
              (variant) =>
                variant.name &&
                variant.name.toLowerCase().includes(colorFilter.toLowerCase())
            )
          );
        });
      }

      if (sizeFilter) {
        products = products.filter((product) => {
          return (
            product.variants &&
            product.variants.some(
              (variant) =>
                variant.sizes &&
                variant.sizes.some(
                  (size) => size.size === sizeFilter && size.stock > 0
                )
            )
          );
        });
      }

      // Cập nhật lại số lượng sau khi lọc
      totalProducts = products.length;

      // Áp dụng phân trang thủ công
      products = products.slice(skip, skip + limit);
    } else {
      // Nếu không cần lọc thủ công thì thực hiện truy vấn với phân trang bình thường
      products = await Product.find(query)
        .populate({
          path: "category_id",
          select: "name slug parent",
          populate: {
            path: "parent",
            select: "name slug _id",
          },
        })
        .populate({
          path: "material_id",
          select: "name slug _id",
        })
        .skip(skip)
        .limit(limit)
        .sort(sortOption);
    }

    // Format sản phẩm để trả về
    const formattedProducts = products.map((product) =>
      this.formatProduct(product)
    );

    return {
      products: formattedProducts,
      pagination: this.createPaginationInfo(totalProducts, page, limit),
      category,
      filters: appliedFilters,
    };
  }

  // Hàm chuẩn hóa màu sắc từ URL (den -> Đen, trang -> Trắng, v.v.)
  normalizeColor(colorSlug) {
    const colorMap = {
      den: "Đen",
      trang: "Trắng",
      xam: "Xám",
      "xanh-lam": "Xanh Lam",
      "xanh-la": "Xanh Lá",
      do: "Đỏ",
      vang: "Vàng",
      tim: "Tím",
      hong: "Hồng",
      cam: "Cam",
      nau: "Nâu",
      be: "Be",
    };

    return colorMap[colorSlug.toLowerCase()] || colorSlug;
  }

  createPaginationInfo(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
    };
  }

  formatProduct(product) {
    if (!product) return null;

    // Xử lý thông tin các danh mục
    const categories = Array.isArray(product.category_id)
      ? product.category_id
          .map((category) => {
            if (!category) return null;
            return {
              id: category._id.toString(),
              name: category.name || "",
              slug: category.slug || "",
              parent: category.parent
                ? {
                    id: category.parent._id.toString(),
                    name: category.parent.name || "",
                    slug: category.parent.slug || "",
                  }
                : null,
            };
          })
          .filter(Boolean)
      : [];

    // Xử lý thông tin chất liệu
    const materials = Array.isArray(product.material_id)
      ? product.material_id
          .map((material) => {
            if (!material) return null;
            return {
              id: material._id.toString(),
              name: material.name || "",
              slug: material.slug || "",
            };
          })
          .filter(Boolean)
      : [];

    // Chuẩn hóa description
    let description = {
      header: {
        material: "", // Remove material from description since we'll use material_id directly
        style: product.style || "",
        responsible: product.responsible || "",
        features: product.features || "",
        image: product.thumb || "",
      },
      body: {
        content: "",
      },
    };

    if (product.description) {
      if (typeof product.description === "string") {
        description.body.content = product.description;
      } else if (typeof product.description === "object") {
        description = {
          header: {
            ...description.header,
            ...(product.description.header || {}),
          },
          body: {
            content:
              product.description.body?.content ||
              product.description.content ||
              "",
          },
        };
      }
    }

    // Định dạng comments
    const formattedComments = product.comments
      ? product.comments.map((comment) => ({
          user_id: comment.user_id || "",
          rating: comment.rating || 5,
          content: comment.content || "",
          replyContentAdmin: comment.replyContentAdmin || "",
          created_at: comment.createdAt
            ? comment.createdAt.toISOString()
            : new Date().toISOString(),
          updated_at: comment.updatedAt
            ? comment.updatedAt.toISOString()
            : new Date().toISOString(),
        }))
      : [];

    // Xử lý variants
    const formattedVariants = product.variants
      ? product.variants.map((variant) => ({
          name: variant.name || "",
          colorThumbnail: variant.colorThumbnail || "",
          images: variant.images || [],
          sizes: variant.sizes || [],
        }))
      : [];

    // Tạo đối tượng sản phẩm đã format
    return {
      id: product._id.toString(),
      name: product.name,
      description,
      price: {
        original: product.price?.original || 0,
        discount: product.price?.discount || 0,
        discountQuantity: product.price?.discountQuantity || 0,
        currency: product.price?.currency || "VND",
      },
      comment: formattedComments,
      category: categories,
      materials: materials,
      variants: formattedVariants,
      tagIsNew: product.tagIsNew || false,
      slug: product.slug || "",
      created_at: product.createdAt ? product.createdAt.toISOString() : "",
      updated_at: product.updatedAt ? product.updatedAt.toISOString() : "",
    };
  }
}

export default new ProductService();
