// Copies selected module files into the generated project.
//
// By default, modules/<moduleKey>/ is copied into src/<moduleKey>/,
// excluding its top-level patches/ directory.
//
// When a provider defines "files" in the registry, those mappings are
// used instead. Each mapping specifies a source relative to the module
// directory and a destination relative to the generated project root.
//
// All copy plans and conflicts are validated before any files are copied.
// Existing identical files can be reused without being overwritten.

import fs from "node:fs";
import path from "node:path";
import { resolveInside } from "./paths.js";

export function copySelectedModuleFiles({
  targetPath,
  stackRoot,
  selectedModules,
  moduleRegistry,
}) {
  const plans = [];

  // Prepare all module-copy plans first.
  for (const [moduleKey, selection] of Object.entries(selectedModules ?? {})) {
    const sourceRoot = resolveInside(
      stackRoot,
      path.join("modules", moduleKey),
      "Module source",
    );

    if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) {
      throw new Error(`Module source directory not found: ${sourceRoot}`);
    }

    const moduleDefinition = moduleRegistry?.modules?.[moduleKey];

    if (!moduleDefinition) {
      throw new Error(`Module "${moduleKey}" was not found in the registry.`);
    }

    const provider = moduleDefinition.providers?.[selection?.provider];

    if (!provider) {
      throw new Error(
        `Provider "${selection?.provider}" was not found ` +
          `for module "${moduleKey}".`,
      );
    }

    let entries;
    let mode;
    let mappingCount = 0;

    if (provider.files === undefined) {
      // Preserve the existing default destination convention.
      const destinationRoot = resolveInside(
        targetPath,
        path.join("src", moduleKey),
        "Module destination",
      );

      entries = collectCopyEntries(sourceRoot, destinationRoot, {
        excludeRootPatches: true,
      });

      mode = "default";
    } else {
      // Explicit mappings are an allowlist: only mapped paths are copied.
      if (!Array.isArray(provider.files) || provider.files.length === 0) {
        throw new Error(
          `Provider "${selection.provider}" for module "${moduleKey}" ` +
            'must define a non-empty "files" array when using mapped copying.',
        );
      }

      entries = [];
      mappingCount = provider.files.length;

      for (const mapping of provider.files) {
        if (
          !mapping ||
          typeof mapping.from !== "string" ||
          !mapping.from.trim() ||
          typeof mapping.to !== "string" ||
          !mapping.to.trim()
        ) {
          throw new Error(
            `Invalid file mapping for module "${moduleKey}". ` +
              'Each mapping requires "from" and "to" paths.',
          );
        }

        const source = resolveInside(
          sourceRoot,
          mapping.from,
          "Mapped module source",
        );

        const destination = resolveInside(
          targetPath,
          mapping.to,
          "Mapped module destination",
        );

        if (!fs.existsSync(source)) {
          throw new Error(
            `Mapped source not found for module "${moduleKey}": ${source}`,
          );
        }

        const sourceStat = fs.statSync(source);

        if (!sourceStat.isFile() && !sourceStat.isDirectory()) {
          throw new Error(
            `Mapped source must be a file or directory: ${source}`,
          );
        }

        entries.push(
          ...collectCopyEntries(source, destination, {
            // A mapping of "." means the module root. Don't ship
            // TemplateGen's top-level patch snippets with the app.
            excludeRootPatches:
              sourceStat.isDirectory() &&
              path.resolve(source) === path.resolve(sourceRoot),
          }),
        );
      }

      mode = "mapped";
    }

    plans.push({
      moduleKey,
      entries,
      mode,
      mappingCount,
    });
  }

  // Detect collisions between mappings or selected modules before writing.
  const plannedDestinations = new Map();

  for (const plan of plans) {
    for (const entry of plan.entries) {
      const destination = path.resolve(entry.destination);
      const previous = plannedDestinations.get(destination);

      if (!previous) {
        plannedDestinations.set(destination, {
          ...entry,
          moduleKey: plan.moduleKey,
        });
        continue;
      }

      // Multiple plans may share an existing destination directory.
      if (previous.kind === "directory" && entry.kind === "directory") {
        continue;
      }

      // Multiple plans may reuse the same destination file only if identical.
      if (
        previous.kind === "file" &&
        entry.kind === "file" &&
        fs.readFileSync(previous.source).equals(fs.readFileSync(entry.source))
      ) {
        continue;
      }

      throw new Error(
        `Module copy conflict at "${destination}" between ` +
          `"${previous.moduleKey}" and "${plan.moduleKey}".`,
      );
    }
  }

  // Validate existing filesystem conflicts before copying anything.
  for (const plan of plans) {
    for (const entry of plan.entries) {
      validateDestinationParents(targetPath, entry.destination);

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

  // Copy only after every plan and conflict has passed validation.
  for (const plan of plans) {
    for (const entry of plan.entries) {
      if (fs.existsSync(entry.destination)) continue;

      if (entry.kind === "directory") {
        fs.mkdirSync(entry.destination, { recursive: true });
      } else {
        fs.mkdirSync(path.dirname(entry.destination), {
          recursive: true,
        });

        fs.copyFileSync(entry.source, entry.destination);
      }
    }

    if (plan.mode === "mapped") {
      console.log(
        `Copied module "${plan.moduleKey}" using ` +
          `${plan.mappingCount} file mapping(s).`,
      );
    } else {
      console.log(
        `Copied module "${plan.moduleKey}" into src/${plan.moduleKey}/.`,
      );
    }
  }

  return plans.map((plan) => plan.moduleKey);
}

function collectCopyEntries(
  sourceRoot,
  destinationRoot,
  { excludeRootPatches = false } = {},
) {
  const rootStat = fs.statSync(sourceRoot);

  if (rootStat.isFile()) {
    return [
      {
        source: sourceRoot,
        destination: destinationRoot,
        kind: "file",
      },
    ];
  }

  const entries = [
    {
      source: sourceRoot,
      destination: destinationRoot,
      kind: "directory",
    },
  ];

  function walk(sourceDirectory, relativeDirectory = "") {
    const dirents = fs.readdirSync(sourceDirectory, {
      withFileTypes: true,
    });

    for (const dirent of dirents) {
      const relativePath = path.join(relativeDirectory, dirent.name);

      // Patch snippets are TemplateGen instructions, not application files.
      if (
        excludeRootPatches &&
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

      // Symlinks and other special entries are not copied.
    }
  }

  walk(sourceRoot);
  return entries;
}

function validateDestinationParents(targetPath, destination) {
  const root = path.resolve(targetPath);
  let parent = path.dirname(path.resolve(destination));

  while (isInsideOrSame(root, parent)) {
    if (fs.existsSync(parent) && !fs.statSync(parent).isDirectory()) {
      throw new Error(
        `Cannot copy module: destination parent is not a directory: ${parent}`,
      );
    }

    if (parent === root) break;

    parent = path.dirname(parent);
  }
}

function isInsideOrSame(root, candidate) {
  const relative = path.relative(root, candidate);

  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}
