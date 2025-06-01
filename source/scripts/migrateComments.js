import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../models/Product.js";

dotenv.config();

const migrateComments = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to MongoDB!");

    console.log("Starting comment migration...");
    
    // Find all products with comments
    const products = await Product.find({ "comments": { $exists: true, $ne: [] } });
    let updatedCount = 0;
    
    for (const product of products) {
      let hasChanges = false;
      
      for (let i = 0; i < product.comments.length; i++) {
        if (!product.comments[i].replyContentAdmin) {
          product.comments[i].replyContentAdmin = [];
          hasChanges = true;
          updatedCount++;
        } else if (!Array.isArray(product.comments[i].replyContentAdmin)) {
          product.comments[i].replyContentAdmin = [];
          hasChanges = true;
          updatedCount++;
        }
      }
      
      if (hasChanges) {
        await product.save();
        console.log(`Updated comments for product: ${product.name}`);
      }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} comments.`);
    process.exit(0);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
};

migrateComments(); 