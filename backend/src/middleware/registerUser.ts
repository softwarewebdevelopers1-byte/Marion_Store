import type { NextFunction, Request, Response } from "express";
import ApiResponse from "../response/SystemRes.js";
import EmailValidator from "../validator/emailValidator.js";
import UserModel from "../model/user.model.js";

async function FilterRequest(req: Request, res: Response, nxt: NextFunction) {
  try {
    if (!req.body) {
      throw new Error("Request body is empty");
    }
    const Email = req?.body?.email;
    const Password = req?.body?.password;
    const Location = req?.body?.location;

    if (!Email) {
      throw new Error("email is required");
    }
    if (!EmailValidator(Email)) {
      throw new Error("invalid email format");
    }
    if (!Password) {
      throw new Error("password is required");
    }
    if (!Location) {
      throw new Error("location is required");
    }

    const ExistingUser = await UserModel.findOne({ Email: Email });

    if (ExistingUser) {
      throw new Error("user with that email already exists");
    }
    nxt();
  } catch (err: any) {
    res.status(400).json(ApiResponse(err?.message));
  }
}

export default FilterRequest;
