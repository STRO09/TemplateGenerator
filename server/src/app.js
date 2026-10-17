import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import env from "./config/env.js";
import routes from "./routes/index.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import requestId from "./middleware/requestId.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, "../../client");

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGINS.split(","),
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestId);
app.use(express.static(clientDir));

app.use("/api", routes);

app.use(errorMiddleware);

export default app;
