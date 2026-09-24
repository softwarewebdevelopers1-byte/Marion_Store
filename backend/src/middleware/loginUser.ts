import type { NextFunction, Request, Response } from "express";
import ApiResponse from "../response/SystemRes.js";
import EmailValidator from "../validator/emailValidator.js";

export default function VerifyLogin(
  req: Request,
  res: Response,
  nxt: NextFunction,
) {
  try {
    if (!req.body) {
      throw new Error("Request body is empty");
    }
    const Email = req?.body?.email;
    const Password = req?.body?.password;

    if (!Email) {
      throw new Error("email is required");
    }
    if (!EmailValidator(Email)) {
      throw new Error("invalid email format");
    }
    if (!Password) {
      throw new Error("password is required");
    }

    nxt();
  } catch (err: any) {
    res.status(400).json(ApiResponse(err?.message));
  }
}
