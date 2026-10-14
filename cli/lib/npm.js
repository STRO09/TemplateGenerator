// npm related commands are run in a child process, so we don't need to use the npm API directly.

import { spawn } from "node:child_process";

export function runNpmInstall(projectPath) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";

    const child = spawn(isWindows ? "npm.cmd" : "npm", ["install"], {
      cwd: projectPath,
      stdio: "inherit",
      shell: isWindows,
    });

    child.once("error", reject);

    child.once("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install failed with exit code ${code}.`));
      }
    });
  });
}
