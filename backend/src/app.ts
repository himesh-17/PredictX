import cors from "cors";
import express from "express";
import path from "path";
import { config } from "./config/index";
import { apiRouter } from "./routes/index";
import { logger } from "./utils/logger";

export const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Serve static images and production frontend bundle
app.use("/images", express.static(path.resolve(__dirname, "../../frontend/public/images")));
app.use(express.static(path.resolve(__dirname, "../../frontend/dist")));

// Request logging middleware
app.use((req, res, next) => {
  if (req.path !== "/api/v1/health") {
    logger.debug({ method: req.method, path: req.path }, "Incoming HTTP request");
  }
  next();
});

// Versioned API Router
app.use("/api/v1", apiRouter);

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err: err.message, stack: err.stack }, "Unhandled backend exception");
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});
