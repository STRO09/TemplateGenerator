import fs from "node:fs";

const manifestUrl = new URL("./module-integrations.json", import.meta.url);

/**
 * Run registered module hooks sequentially.
 *
 * @param {"beforeServerCreate"|"afterServerCreate"} phase
 * @param {object} context
 * @returns {Promise<void>}
 */
export async function runModuleHooks(phase, context = {}) {
  let manifest;

  try {
    manifest = JSON.parse(fs.readFileSync(manifestUrl, "utf8"));
  } catch (error) {
    throw new Error(`Failed to load module integrations: ${error.message}`);
  }

  const hooks = manifest.hooks?.[phase] ?? [];

  if (!Array.isArray(hooks)) {
    throw new Error(`Invalid module hook configuration for "${phase}".`);
  }

  for (const entry of hooks) {
    if (!entry || typeof entry.module !== "string") {
      throw new Error(`Invalid module hook entry in phase "${phase}".`);
    }

    const moduleUrl = new URL(entry.module, manifestUrl);
    const imported = await import(moduleUrl.href);
    const exportName = entry.export ?? "default";
    const hook = imported[exportName];

    if (typeof hook !== "function") {
      throw new Error(
        `Module hook "${entry.module}" must export ` +
          `"${exportName}" as a function.`,
      );
    }

    await hook(context);
  }
}
