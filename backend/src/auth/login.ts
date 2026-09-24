import { Router, type Request, type Response } from "express";
import ApiResponse from "../response/SystemRes.js";
import UserModel from "../model/user.model.js";
import bcrypt from "bcrypt";
import VerifyLogin from "../middleware/loginUser.js";
import JwtCreator from "../jwt/JwtCreator.js";

const AppRouter = Router();
AppRouter.post(
  "/login/seller",
  VerifyLogin,
  async (req: Request, res: Response) => {
    const Email = req?.body?.email;
    const Password = req.body.password;
    try {
      const ExistingUser = await UserModel.findOne({ Email: Email });

      if (!ExistingUser) {
        throw new Error("user not found");
      }
      const ExistingUserPassword = ExistingUser.Password;
      if (!(await bcrypt.compare(Password, ExistingUserPassword))) {
        throw new Error("invalid email or password");
      }
      const Token = JwtCreator({
        email: Email,
        userId: ExistingUser._id.toString(),
      });
      return res
        .status(200)
        .json(ApiResponse("Login successfully", new Date(), Token));
    } catch (err: any) {
      res.status(404).json(ApiResponse(err?.message));
    }
  },
);
export default AppRouter;
