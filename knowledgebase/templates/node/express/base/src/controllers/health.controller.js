import asyncHandler from "../utils/asyncHandler.js";
import { success } from "../utils/response.js";
import { register } from "../utils/metrics.js";
import {formatDuration} from "../utils/DateTimeFormat.js"

class HealthController {
  /**
   * Return the current health status of the application.
   *
   * @returns {Promise<void>}
   */
  check = asyncHandler(async (req, res) => {
    return success(res, {
      message: "Service is healthy.",
      data: {
        status: "ok",
        uptime: formatDuration(process.uptime()),
      },
    });
  });

  /**
   * Expose application metrics in Prometheus exposition format.
   *
   * @returns {Promise<void>}
   */
  getMetrics = asyncHandler(async (req, res) => {
    res.set("Content-Type", register.contentType);

    return res.send(await register.metrics());
  });
}

export default new HealthController();
