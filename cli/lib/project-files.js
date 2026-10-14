// Project path and template copying

import fs from "node:fs";
import path from "node:path";
import { ask, askChoice } from "./prompts.js";
import { getBaseTemplatePath } from "./paths.js";

export async function chooseProjectPath(initialProjectName = null) {
  const locationChoice = await askChoice(
    "Where should the project be initialized?",
    {
      current: "Current directory",
      different: "Different path",
    },
  );

  let projectName;
  let targetPath;

  if (initialProjectName) {
    const parentInput =
      locationChoice === "current"
        ? process.cwd()
        : await ask("Enter parent path: ");

    const parentPath = path.resolve(parentInput);

    projectName = initialProjectName.trim();

    if (
      !projectName ||
      projectName === "." ||
      projectName === ".." ||
      path.isAbsolute(projectName) ||
      path.basename(projectName) !== projectName ||
      projectName.includes("/") ||
      projectName.includes("\\")
    ) {
      throw new Error("Project name must be a folder name, not a path.");
    }

    targetPath = path.resolve(parentPath, projectName);

    // A named project creates a new root; never overwrite an existing one.
    if (fs.existsSync(targetPath)) {
      throw new Error(`Project directory already exists: ${targetPath}`);
    }
  } else {
    const directoryInput =
      locationChoice === "current"
        ? process.cwd()
        : await ask("Enter project directory path: ");

    if (!directoryInput.trim()) {
      throw new Error("Project directory path cannot be empty.");
    }

    // The selected directory is the main project root.
    targetPath = path.resolve(directoryInput);
    projectName = path.basename(targetPath);

    if (!projectName || targetPath === path.parse(targetPath).root) {
      throw new Error("Choose a project directory below the filesystem root.");
    }
  }

  return {
    projectName,
    targetPath,
  };
}

export function copyBaseTemplate(server, targetPath) {
  const templatePath = getBaseTemplatePath(server);

  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);

    if (!stats.isDirectory()) {
      throw new Error(`Project target is not a directory: ${targetPath}`);
    }

    if (fs.readdirSync(targetPath).length > 0) {
      throw new Error(
        `Project directory is not empty: ${targetPath}. ` +
          "Choose an empty directory or a new path.",
      );
    }
  } else {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  for (const entry of fs.readdirSync(templatePath)) {
    fs.cpSync(path.join(templatePath, entry), path.join(targetPath, entry), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
  }

  console.log("");
  console.log("Project created successfully!");
  console.log(`Location: ${targetPath}`);
}
