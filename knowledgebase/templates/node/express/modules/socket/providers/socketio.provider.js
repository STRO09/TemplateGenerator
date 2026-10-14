import { Server } from "socket.io";

import SocketProvider from "./provider.interface.js";

class SocketIOProvider extends SocketProvider {
  constructor() {
    super();

    this.io = null;
  }

  initialize(server, options = {}) {
    if (this.io) {
      return;
    }

    try {
      this.io = new Server(server, options);
    } catch (error) {
      this.io = null;
      throw error;
    }
  }

  onConnection(handler) {
    this.ensureInitialized();
    this.io.on("connection", handler);
  }

  emit(event, payload) {
    this.ensureInitialized();
    this.io.emit(event, payload);
  }

  emitToRoom(room, event, payload) {
    this.ensureInitialized();
    this.io.to(room).emit(event, payload);
  }

  ensureInitialized() {
    if (!this.io) {
      throw new Error("Socket provider has not been initialized.");
    }
  }

  close() {
    if (!this.io) {
      return;
    }

    this.io.close();
    this.io = null;
  }
}

export default new SocketIOProvider();
