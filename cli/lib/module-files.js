// This copies modules/socket/ into the generated project at src/socket/, excluding its top-level patches/ directory.
// It also checks for file conflicts before copying, allowing identical files to be reused without overwriting existing project files.

import fs from "node:fs";
import path from "node:path";
import { resolveInside } from "./paths.js";

export function copySelectedModuleFiles({
  targetPath,
  stackRoot,
  selectedModules,
}) {
  const plans = [];

  // Prepare all module-copy plans first.
  for (const moduleKey of Object.keys(selectedModules ?? {})) {
    const sourcePath = resolveInside(
      stackRoot,
      path.join("modules", moduleKey),
      "Module source",
    );

    const destinationPath = resolveInside(
      targetPath,
      path.join("src", moduleKey),
      "Module destination",
    );

    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
      throw new Error(`Module source directory not found: ${sourcePath}`);
    }

    plans.push({
      moduleKey,
      entries: collectCopyEntries(sourcePath, destinationPath),
    });
  }

  // Validate every conflict before copying any selected module.
  for (const plan of plans) {
    for (const entry of plan.entries) {
      if (!fs.existsSync(entry.destination)) continue;

      const existingStat = fs.statSync(entry.destination);

      if (entry.kind === "directory" && existingStat.isDirectory()) {
        continue;
      }

      if (entry.kind === "file" && existingStat.isFile()) {
        const existing = fs.readFileSync(entry.destination);
        const incoming = fs.readFileSync(entry.source);

        if (existing.equals(incoming)) continue;
      }

      throw new Error(
        `Cannot copy module "${plan.moduleKey}": destination ` +
          `already contains a different file or folder: ${entry.destination}`,
      );
    }
  }

  // Copy only after all plans pass validation.
  for (const plan of plans) {
    for (const entry of plan.entries) {
      if (fs.existsSync(entry.destination)) continue;

      if (entry.kind === "directory") {
        fs.mkdirSync(entry.destination, {
          recursive: true,
        });
      } else {
        fs.mkdirSync(path.dirname(entry.destination), { recursive: true });

        fs.copyFileSync(entry.source, entry.destination);
      }
    }

    console.log(
      `Copied module "${plan.moduleKey}" into src/${plan.moduleKey}/ .`,
    );
  }

  return plans.map((plan) => plan.moduleKey);
}

function collectCopyEntries(sourceRoot, destinationRoot) {
  const entries = [
    {
      source: sourceRoot,
      destination: destinationRoot,
      kind: "directory",
    },
  ];

  function walk(sourceDirectory, relativeDirectory = "") {
    const dirents = fs.readdirSync(sourceDirectory, { withFileTypes: true });

    for (const dirent of dirents) {
      const relativePath = path.join(relativeDirectory, dirent.name);

      // Patch snippets are instructions for TemplateGen,
      // not files to ship inside the generated project.
      if (
        !relativeDirectory &&
        dirent.name === "patches" &&
        dirent.isDirectory()
      ) {
        continue;
      }

      const source = path.join(sourceRoot, relativePath);
      const destination = path.join(destinationRoot, relativePath);

      if (dirent.isDirectory()) {
        entries.push({
          source,
          destination,
          kind: "directory",
        });

        walk(source, relativePath);
      } else if (dirent.isFile()) {
        entries.push({
          source,
          destination,
          kind: "file",
        });
      }
    }
  }

  walk(sourceRoot);
  return entries;
}
