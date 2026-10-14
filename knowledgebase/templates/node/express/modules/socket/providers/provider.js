import env from "../../config/env.js";

import socketIOProvider from "./socketio.provider.js";

// import wsProvider from "./ws.provider.js";

const providers = {
  socketio: socketIOProvider,

  // ws: wsProvider
};

const socketProvider = providers[env.SOCKET_PROVIDER];

if (!socketProvider) {
  throw new Error(`Unsupported socket provider: ${env.SOCKET_PROVIDER}`);
}

export default socketProvider;
