import { Router, type Request, type Response } from "express";
import FilterRequest from "../middleware/registerUser.js";
import ApiResponse from "../response/SystemRes.js";
import UserModel from "../model/user.model.js";
import bcrypt from "bcrypt";

const AppRouter = Router();
AppRouter.post(
  "/register/seller",
  FilterRequest,
  async (req: Request, res: Response) => {
    const Email = req?.body?.email;
    const Password = req?.body?.password;
    const Location = req?.body?.location;
    const HashedPassword = await bcrypt.hash(Password, 10);
    try {
      await UserModel.create({
        Email: Email,
        Password: HashedPassword,
        Location: Location,
      });

      return res.status(201).json(ApiResponse("Account created successfully"));
    } catch (err: any) {
      res.status(501).json(ApiResponse(err?.message));
    }
  },
);
export default AppRouter;
