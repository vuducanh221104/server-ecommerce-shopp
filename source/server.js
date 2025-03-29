import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
import http from "http";
import startServer from "./config/startServer.js";
import routes from "./routes/index.js";
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

startServer(app);
routes(app);
