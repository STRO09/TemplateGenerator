import http from "http";
import app from "./app.js";
import env from "./config/env.js";
import logger from "./utils/logger.js";
// ----imports --------------

async function start() {
  try {

    const server = http.createServer(app);

    logger.info("Starting application");

    server.listen(env.PORT, () => {
      logger.success("Server listening", {
        port: env.PORT,
      });
    });
  } catch (err) {
    logger.error("Failed to start service", { err });
    process.exit(1);
  }
}

start();
