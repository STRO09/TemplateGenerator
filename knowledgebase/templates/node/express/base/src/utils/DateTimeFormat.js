/**
 * Convert a duration such as `15m`, `2d`, or `1h` into milliseconds.
 *
 * @param {string} value
 * Duration expression.
 *
 * @returns {number}
 * Duration in milliseconds.
 */
export function parseDuration(value) {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);

  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }

  const amount = Number(match[1]);

  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * units[match[2]];
}

/**
 * Format a duration in milliseconds into a human-readable string.
 *
 * @param {number} milliseconds
 * Duration in milliseconds.
 *
 * @returns {string}
 * Human-readable duration.
 */
export function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new Error("Duration must be a non-negative finite number.");
  }

  const seconds = Math.floor(milliseconds / 1000);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];

  if (days) {
    parts.push(`${days}d`);
  }

  if (hours) {
    parts.push(`${hours}h`);
  }

  if (minutes) {
    parts.push(`${minutes}m`);
  }

  if (remainingSeconds || parts.length === 0) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(" ");
}
