/**
 * Worker thread entry point.
 *
 * Receives tasks and their payloads from the main thread, executes the
 * corresponding registered task, and sends the result or error back.
 */

import { parentPort } from "worker_threads";
import tasks from "./tasks/index.js";

if (!parentPort) {
  throw new Error("Worker must be started as a worker thread.");
}

parentPort.on("message", async ({ id, task, payload }) => {
  try {
    const handler = tasks[task];

    if (!handler) {
      throw new Error(`Unknown worker task: ${task}`);
    }

    const result = await handler(payload);

    parentPort.postMessage({
      id,
      success: true,
      result,
    });
  } catch (error) {
    parentPort.postMessage({
      id,
      success: false,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }
});
