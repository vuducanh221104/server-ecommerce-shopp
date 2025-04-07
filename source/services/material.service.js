import { Material } from "../models/Material.js";
import slugify from "slugify";

class MaterialService {
  // Lấy tất cả nguyên liệu
  getAllMaterials = async () => {
    const materials = await Material.find().sort({ createdAt: -1 });
    return materials;
  };

  // Lấy nguyên liệu theo ID
  getMaterialById = async (id) => {
    const material = await Material.findById(id);
    return material;
  };

  // Lấy nguyên liệu theo slug
  getMaterialBySlug = async (slug) => {
    const material = await Material.findOne({ slug });
    return material;
  };

  // Tạo nguyên liệu mới
  createMaterial = async (materialData) => {
    // Kiểm tra slug
    if (!materialData.slug) {
      materialData.slug = slugify(materialData.name, { lower: true });
    }

    // Kiểm tra slug đã tồn tại chưa
    const existingMaterial = await Material.findOne({
      slug: materialData.slug,
    });
    if (existingMaterial) {
      throw new Error("Slug đã tồn tại");
    }

    const newMaterial = await Material.create(materialData);
    return newMaterial;
  };

  // Cập nhật nguyên liệu
  updateMaterial = async (id, updateData) => {
    // Nếu có cập nhật tên, tự động cập nhật slug nếu không có slug được cung cấp
    if (updateData.name && !updateData.slug) {
      updateData.slug = slugify(updateData.name, { lower: true });
    }

    // Kiểm tra slug đã tồn tại chưa (nếu có slug mới)
    if (updateData.slug) {
      const existingMaterial = await Material.findOne({
        slug: updateData.slug,
        _id: { $ne: id },
      });
      if (existingMaterial) {
        throw new Error("Slug đã tồn tại");
      }
    }

    const updatedMaterial = await Material.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedMaterial) {
      throw new Error("Không tìm thấy nguyên liệu");
    }

    return updatedMaterial;
  };

  // Xóa nguyên liệu
  deleteMaterial = async (id) => {
    // Kiểm tra xem nguyên liệu có tồn tại không
    const material = await Material.findById(id);
    if (!material) {
      throw new Error("Không tìm thấy nguyên liệu");
    }

    // Kiểm tra xem có nguyên liệu con không
    const childMaterials = await Material.find({ parent_id: id });
    if (childMaterials.length > 0) {
      throw new Error("Không thể xóa nguyên liệu có nguyên liệu con");
    }

    await Material.findByIdAndDelete(id);
    return true;
  };

  // Lấy danh sách nguyên liệu con
  getChildMaterials = async (parentId) => {
    const materials = await Material.find({ parent_id: parentId });
    return materials;
  };

  // Format dữ liệu nguyên liệu trả về
  formatMaterial = (material) => {
    return {
      id: material._id,
      name: material.name,
      slug: material.slug,
      parent_id: material.parent_id,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
    };
  };
}

export default new MaterialService();
