import jwt from "jsonwebtoken";
import type JwtUserPayLoad from "../types/JwtPayload.js";
import DotEnvFile from "../config/DotEnvFile.js";
export default function JwtCreator(Payload: JwtUserPayLoad): string {
  return jwt.sign(Payload, DotEnvFile().JwtSecret, { expiresIn: "1d" });
}
