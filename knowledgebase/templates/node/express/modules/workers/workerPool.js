import path from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";
import os from "os";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workerPath = path.join(__dirname, "worker.js");

/**
 * Manages a pool of reusable Node.js worker threads.
 *
 * The pool distributes submitted tasks across available workers and queues
 * tasks when all workers are busy. Each submitted task is associated with a
 * unique job ID so the corresponding Promise can be resolved or rejected
 * when the worker finishes execution.
 *
 * Each worker tracks the job it is currently executing, allowing the pool
 * to correctly handle worker errors and unexpected termination.
 */
class WorkerPool {
  /**
   * Create a worker pool.
   *
   * @param {number} [size=os.cpus().length]
   * Number of worker threads to maintain in the pool.
   */
  constructor(size = os.cpus().length) {
    this.size = size;
    this.workers = [];
    this.queue = [];
    this.jobs = new Map();

    for (let i = 0; i < size; i++) {
      this.createWorker();
    }
  }

  /**
   * Create and register a worker thread.
   *
   * The worker is registered with handlers for messages, errors, and
   * termination so the pool can track its state and recover from failures.
   *
   * @returns {void}
   */
  createWorker() {
    const worker = new Worker(workerPath);

    const workerState = {
      worker,
      busy: false,
      jobId: null,
    };

    worker.on("message", (message) => {
      this.handleMessage(workerState, message);
    });

    worker.on("error", (error) => {
      this.handleWorkerError(workerState, error);
    });

    worker.on("exit", () => {
      this.handleWorkerExit(workerState);
    });

    this.workers.push(workerState);
  }

  /**
   * Submit a task for execution by the worker pool.
   *
   * If a worker is available, the task is dispatched immediately.
   * Otherwise, the task remains queued until a worker becomes available.
   *
   * @param {string} task
   * Name of the registered worker task to execute.
   *
   * @param {*} payload
   * Data passed to the worker task.
   *
   * @returns {Promise<*>}
   * Resolves with the task result or rejects if the worker task fails.
   */
  run(task, payload) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();

      this.jobs.set(id, {
        resolve,
        reject,
      });

      this.queue.push({
        id,
        task,
        payload,
      });

      this.dispatch();
    });
  }

  /**
   * Dispatch the next queued task to an available worker.
   *
   * Marks the selected worker as busy and associates it with the job
   * so that the job can be correctly resolved or rejected later.
   *
   * @returns {void}
   */
  dispatch() {
    const availableWorker = this.workers.find(
      (workerState) => !workerState.busy,
    );

    if (!availableWorker || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();

    availableWorker.busy = true;
    availableWorker.jobId = job.id;

    availableWorker.worker.postMessage(job);
  }

  /**
   * Handle a completed worker task.
   *
   * Resolves or rejects the Promise associated with the completed job,
   * releases the worker, and dispatches the next queued task.
   *
   * @param {Object} workerState
   * State associated with the worker that produced the message.
   *
   * @param {Object} message
   * Result message received from the worker thread.
   *
   * @param {string} message.id
   * Unique identifier of the completed job.
   *
   * @param {boolean} message.success
   * Whether the worker task completed successfully.
   *
   * @param {*} [message.result]
   * Result returned by the worker task when successful.
   *
   * @param {Object} [message.error]
   * Serialized error information when the task fails.
   *
   * @returns {void}
   */
  handleMessage(workerState, message) {
    const job = this.jobs.get(message.id);

    workerState.busy = false;
    workerState.jobId = null;

    if (!job) {
      this.dispatch();
      return;
    }

    this.jobs.delete(message.id);

    if (message.success) {
      job.resolve(message.result);
    } else {
      const error = new Error(message.error.message);

      error.name = message.error.name;
      error.stack = message.error.stack;

      job.reject(error);
    }

    this.dispatch();
  }

  /**
   * Handle an unexpected worker error.
   *
   * Rejects the job currently assigned to the failed worker and releases
   * the worker so queued tasks can continue to be dispatched.
   *
   * @param {Object} workerState
   * State associated with the failed worker.
   *
   * @param {Error} error
   * Error emitted by the worker thread.
   *
   * @returns {void}
   */
  handleWorkerError(workerState, error) {
    const jobId = workerState.jobId;

    workerState.busy = false;
    workerState.jobId = null;

    if (jobId) {
      const job = this.jobs.get(jobId);

      if (job) {
        this.jobs.delete(jobId);
        job.reject(error);
      }
    }

    this.dispatch();
  }

  /**
   * Handle worker thread termination.
   *
   * Removes the terminated worker from the pool and rejects its active job
   * if it exited unexpectedly. A replacement worker is created to maintain
   * the configured pool size.
   *
   * @param {Object} workerState
   * State associated with the terminated worker.
   *
   * @returns {void}
   */
  handleWorkerExit(workerState) {
    const index = this.workers.indexOf(workerState);

    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    if (workerState.jobId) {
      const job = this.jobs.get(workerState.jobId);

      if (job) {
        this.jobs.delete(workerState.jobId);

        job.reject(new Error("Worker exited before completing the job."));
      }
    }

    this.createWorker();

    this.dispatch();
  }
}

export default new WorkerPool();
