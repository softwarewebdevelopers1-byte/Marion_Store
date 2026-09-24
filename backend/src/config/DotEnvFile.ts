import dotenv from "dotenv";
import path from "path";
import type DotEnvTypes from "../types/DotEnvTypes.js";

dotenv.config({ path: `${path.resolve(process.cwd(), ".env")}` });

export default function DotEnvFile(): DotEnvTypes {
  return {
    Port: process.env.PORT ? process.env.PORT : process.exit(1),
    DatabaseConnection: process.env.LOCAL_MONGO_DB_URI
      ? process.env.LOCAL_MONGO_DB_URI
      : process.exit(1),
    ServerName: process.env.SERVER_NAME || "SERVER",
    JwtSecret: process.env.JWT_SECRET
      ? process.env.JWT_SECRET
      : process.exit(1),
  };
}
