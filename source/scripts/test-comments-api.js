/**
 * This is a simple test script to demonstrate and test the product comments API
 * Run it with: node source/scripts/test-comments-api.js
 */

import fetch from "node-fetch";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_URL = "http://localhost:3001"; // Change this to your server port
let accessToken = null;

const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

const login = async () => {
  try {
    const email = await prompt("Enter email: ");
    const password = await prompt("Enter password: ");

    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.status === "success" && data.data?.accessToken) {
      accessToken = data.data.accessToken;
      console.log("Login successful!");
      return true;
    } else {
      console.error("Login failed:", data.message || "Unknown error");
      return false;
    }
  } catch (error) {
    console.error("Error during login:", error.message);
    return false;
  }
};

const getProductComments = async (productId) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/comments/product/${productId}`, {
      method: "GET"
    });

    const data = await response.json();
    console.log("Comments:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error getting comments:", error.message);
  }
};

const getCommentStats = async (productId) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/comments/product/${productId}/stats`, {
      method: "GET"
    });

    const data = await response.json();
    console.log("Comment Stats:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error getting comment stats:", error.message);
  }
};

const addComment = async (productId) => {
  if (!accessToken) {
    console.log("You need to login first!");
    return;
  }

  try {
    const content = await prompt("Enter your comment: ");
    const rating = await prompt("Enter rating (1-5): ");

    const response = await fetch(`${API_URL}/api/v1/comments/product/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        content,
        rating: parseInt(rating, 10)
      })
    });

    const data = await response.json();
    console.log("Add Comment Result:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error adding comment:", error.message);
  }
};

const runTests = async () => {
  try {
    console.log("=== Product Comments API Test ===");
    
    const productId = await prompt("Enter product ID to test: ");
    
    console.log("\n1. Get Comments");
    await getProductComments(productId);
    
    console.log("\n2. Get Comment Stats");
    await getCommentStats(productId);
    
    console.log("\n3. Login to Add Comment");
    const loggedIn = await login();
    
    if (loggedIn) {
      console.log("\n4. Add Comment");
      await addComment(productId);
      
      console.log("\n5. Get Updated Comments");
      await getProductComments(productId);
      
      console.log("\n6. Get Updated Comment Stats");
      await getCommentStats(productId);
    }
    
    console.log("\nTests completed!");
    rl.close();
  } catch (error) {
    console.error("Error running tests:", error);
    rl.close();
  }
};

runTests(); 