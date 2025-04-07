import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
import http from "http";
import startServer from "./config/startServer.js";
import routes from "./routes/index.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
const server = http.createServer(app);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Headers",
    ],
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all requests
app.use("/api", apiLimiter);

startServer(app);
routes(app);
