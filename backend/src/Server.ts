import express from "express";
import DotEnvFile from "./config/DotEnvFile.js";
import showBanner from "node-banner";
import DbConnect from "./database/DbConnect.js";
import RegUserRouter from "./auth/registerSeller.js";
import LoginRouter from "./auth/login.js";
import RequestFilter from "./global/GlobalReqFilter.js";

const app = express();

app.use(express.json());

app.use(RequestFilter);

app.use("/api/user", RegUserRouter);

app.use("/api/user", LoginRouter);

const server = app.listen(DotEnvFile().Port, () => {
  DbConnect();
  showBanner(
    `${DotEnvFile().ServerName}, started at Port ${DotEnvFile().Port}`,
  );
});

// Centralized graceful shutdown function
function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  // 1. Stop the server from accepting new connections
  server.close(async (err) => {
    if (err) {
      console.error("Error while closing the server:", err);
      process.exit(1);
    }
    console.log("HTTP server closed.");

    try {
      // 2. Close your database connections
      console.log("Closing database connections...");
      console.log("Database connections closed safely.");

      // 3. Exit the process cleanly
      process.exit(0);
    } catch (dbErr) {
      console.error("Error closing database connections:", dbErr);
      process.exit(1);
    }
  });

  // 4. Forceful shutdown fallback (Enforce a timeout)
  setTimeout(() => {
    console.error("Shutdown timed out! Forcing exit...");
    process.exit(1);
  }, 10000); // 10 seconds
}

// Intercept termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
