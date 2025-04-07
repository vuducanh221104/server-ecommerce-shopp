import MaterialService from "../services/material.service.js";
import { CatchError } from "../config/catchError.js";

class MaterialController {
  getAllMaterials = CatchError(async (req, res) => {
    const materials = await MaterialService.getAllMaterials();

    const formattedMaterials = materials.map((material) =>
      MaterialService.formatMaterial(material)
    );

    return res.status(200).json({
      status: "success",
      message: "Lấy danh sách nguyên liệu thành công",
      data: {
        materials: formattedMaterials,
      },
    });
  });

  getMaterialById = CatchError(async (req, res) => {
    const { id } = req.params;
    const material = await MaterialService.getMaterialById(id);

    if (!material) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy nguyên liệu",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lấy thông tin nguyên liệu thành công",
      data: {
        material: MaterialService.formatMaterial(material),
      },
    });
  });

  getMaterialBySlug = CatchError(async (req, res) => {
    const { slug } = req.params;
    const material = await MaterialService.getMaterialBySlug(slug);

    if (!material) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy nguyên liệu",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lấy thông tin nguyên liệu thành công",
      data: {
        material: MaterialService.formatMaterial(material),
      },
    });
  });

  createMaterial = CatchError(async (req, res) => {
    const materialData = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!materialData.name) {
      return res.status(400).json({
        status: "error",
        message: "Tên nguyên liệu là bắt buộc",
      });
    }

    try {
      const newMaterial = await MaterialService.createMaterial(materialData);

      return res.status(201).json({
        status: "success",
        message: "Tạo nguyên liệu thành công",
        data: {
          material: MaterialService.formatMaterial(newMaterial),
        },
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });

  updateMaterial = CatchError(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const updatedMaterial = await MaterialService.updateMaterial(
        id,
        updateData
      );

      return res.status(200).json({
        status: "success",
        message: "Cập nhật nguyên liệu thành công",
        data: {
          material: MaterialService.formatMaterial(updatedMaterial),
        },
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });

  deleteMaterial = CatchError(async (req, res) => {
    const { id } = req.params;

    try {
      await MaterialService.deleteMaterial(id);

      return res.status(200).json({
        status: "success",
        message: "Xóa nguyên liệu thành công",
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  });

  getChildMaterials = CatchError(async (req, res) => {
    const { id } = req.params;

    const childMaterials = await MaterialService.getChildMaterials(id);

    const formattedMaterials = childMaterials.map((material) =>
      MaterialService.formatMaterial(material)
    );

    return res.status(200).json({
      status: "success",
      message: "Lấy danh sách nguyên liệu con thành công",
      data: {
        materials: formattedMaterials,
      },
    });
  });
}

export default new MaterialController();
