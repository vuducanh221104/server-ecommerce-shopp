import { log, error } from "console";
import { exit } from "node:process";
import ConnectDB from "../db/index.js";
import dotenv from "dotenv";
dotenv.config();
import { CatchError } from "./catchError.js";

const startServer = (app) => {
  const connectToDatabase = CatchError(async () => {
    const connection = ConnectDB();
    if (!connection) {
      throw new Error("Failed to connect to the database.");
    }
    log("Connected to the database successfully.");
  });
  connectToDatabase();
  if (!process.env.PORT) {
    error("PORT is not defined in .env file.");
    exit(1);
  }

  app.listen(process.env.PORT, () => {
    log(`Server is running on port ${process.env.PORT}`);
  });
};

export default startServer;
