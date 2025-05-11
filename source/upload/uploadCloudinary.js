import express from "express";

import cloudinary from "../config/cloudinary/cloudinary.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
// TEST
const router = express.Router();

// Add debugging log
console.log("Cloudinary config initialized:", cloudinary.config().cloud_name);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ecommerce_uploads", // Add a folder for organization
    allowedFormats: ["jpg", "png", "jpeg", "webp"],
    transformation: [
      { quality: "auto:good" }, // Tự động tối ưu chất lượng
      { fetch_format: "auto" }, // Tự động chọn định dạng tốt nhất (webp nếu trình duyệt hỗ trợ)
      { strip: true },
    ],
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB cho mỗi file
  },
});

router.post("/", upload.array("img", 20), async (req, res) => {
  try {
    console.log("Upload request received", { files: req.files?.length });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const data = req.files;
    console.log("Files uploaded successfully", { count: data.length });

    // Return more detailed information
    res.json(data);
  } catch (error) {
    console.error("Error in upload route:", error);
    res
      .status(500)
      .json({ message: "Error uploading files", error: error.message });
  }
});

// Add a test route to verify the endpoint is working
router.get("/test", (req, res) => {
  res.json({ message: "Upload service is working", timestamp: new Date() });
});

export default router;
