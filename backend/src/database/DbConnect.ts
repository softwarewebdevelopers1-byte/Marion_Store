import mongoose from "mongoose";
import DotEnvFile from "../config/DotEnvFile.js";

function DbConnect() {
  mongoose
    .connect(DotEnvFile().DatabaseConnection)
    .then(() => console.log("Database connected"))
    .catch((err) => {
      console.log("Database failed to connect", err);
      process.exit(1);
    });
}

export default DbConnect;
