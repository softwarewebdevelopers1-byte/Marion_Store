import { Router, type Request, type Response } from "express";
import JwtValidator from "../jwt/JwtValidator.js";
import GetAllProducts from "../service/GetProduct.js";

const AppRouter = Router();

AppRouter.get("/", JwtValidator, (req: Request, res: Response) => {
  console.log(req.query ?? null);
});

export default AppRouter;
