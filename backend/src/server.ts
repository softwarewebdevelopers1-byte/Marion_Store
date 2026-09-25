import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { connectDB, syncIndexes } from "./db.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(generalLimiter);

  app.use("/api", apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

async function bootstrap(): Promise<void> {
  await connectDB();
  await syncIndexes();

  const app = createApp();

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
  });
}

bootstrap().catch((err) => {
  logger.error(err, "Failed to start server");
  process.exit(1);
});
