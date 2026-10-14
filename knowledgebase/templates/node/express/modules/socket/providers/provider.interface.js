/**
 * Abstract contract for socket providers.
 *
 * Socket providers encapsulate real-time communication
 * implementations.
 *
 * Implementations may use:
 *
 * - Socket.IO
 * - ws
 *
 * Application services should depend on this contract
 * rather than directly interacting with a specific
 * socket library.
 *
 * @abstract
 */
export default class SocketProvider {
  /**
   * Initialize the socket server.
   *
   * @abstract
   *
   * @param {import("http").Server} server
   *
   * @returns {void}
   */
  initialize() {
    throw new Error("Method not implemented.");
  }

  /**
   * Register a connection handler.
   *
   * @abstract
   *
   * @param {function} handler
   *
   * @returns {void}
   */

  onConnection(handler) {
    throw new Error("Method not implemented.");
  }

  /**
   * Emit an event.
   *
   * @abstract
   *
   * @param {string} event
   *
   * @param {*} payload
   *
   * @returns {void}
   */
  emit() {
    throw new Error("Method not implemented.");
  }

  /**
   * Emit an event to a specific room.
   *
   * @abstract
   *
   * @param {string} room
   *
   * @param {string} event
   *
   * @param {*} payload
   *
   * @returns {void}
   */
  emitToRoom() {
    throw new Error("Method not implemented.");
  }
}
