import socketProvider from "./providers/provider.js";
import logger from "../utils/logger.js";

export function initializeSockets(server) {
  socketProvider.initialize(server);

  socketProvider.onConnection((socket) => {
    logger.info("Socket connected", {
      socketId: socket.id,
    });

    socket.on("disconnect", (reason) => {
      logger.info("Socket disconnected", {
        socketId: socket.id,
        reason,
      });
    });

    socket.on("error", (error) => {
      logger.error(error, {
        socketId: socket.id,
        context: "Socket error",
      });
    });
  });

  logger.success("Socket server initialized");
}
