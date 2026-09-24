import jwt from "jsonwebtoken";
import DotEnvFile from "../config/DotEnvFile.js";
import type { NextFunction, Request, Response } from "express";
import UnauthorizationEnum from "../enums/Unauthorization.js";

export default function JwtValidator(
  req: Request,
  res: Response,
  nxt: NextFunction,
): void {
  try {
    const Authorization = req.headers.authorization;

    if (!Authorization) {
      throw new Error(UnauthorizationEnum.Unauthorization);
    }

    const [type, token] = Authorization.split(" ");

    if (type !== "Bearer" || !token) {
      throw new Error(UnauthorizationEnum.Unauthorization);
    }

    jwt.verify(token, DotEnvFile().JwtSecret);

    nxt();
  } catch {
    res.status(401).json(UnauthorizationEnum.Unauthorization);
  }
}
