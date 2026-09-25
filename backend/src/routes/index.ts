import { Router } from "express";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import ordersRouter from "./orders.js";
import imageRouter from "./image.routes.js";
import storeRouter from "./store.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/admin/products", imageRouter);
apiRouter.use("/store", storeRouter);
