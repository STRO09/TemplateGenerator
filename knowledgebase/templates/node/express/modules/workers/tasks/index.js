/**
 * Worker task registry.
 *
 * Maps task names to their implementations so worker threads can resolve
 * and execute tasks requested by the main thread.
 */

import exampleTask from "./example.task.js";

export default {
  example: exampleTask,
};
