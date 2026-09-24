import type { NextFunction, Request, Response } from "express";
import ApiResponse from "../response/SystemRes.js";

export default function RequestFilter(
  req: Request,
  res: Response,
  nxt: NextFunction,
) {
  const ReqHeader = req.headers.authorization;
  try {
    if (!ReqHeader) {
      throw new Error("unauthorized");
    }
    nxt();
  } catch (err: any) {
    res.status(401).json(ApiResponse(err.message));
  }
}
