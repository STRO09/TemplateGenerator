export function mergeEnvEntries(source, entries, targetFile) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);
  const existing = new Map();

  for (let i = 0; i < lines.length; i++) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(lines[i]);
    if (!match) continue;

    const [, key, value] = match;
    existing.set(key, { value: value.trim(), line: i });
  }

  const additions = [];

  for (const [key, rawValue] of Object.entries(entries ?? {})) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new Error(`Invalid environment key "${key}" in ${targetFile}.`);
    }

    const value = String(rawValue);
    const found = existing.get(key);

    if (found) {
      if (found.value !== value) {
        throw new Error(
          `Environment key "${key}" already has a different value in ${targetFile}.`,
        );
      }
      continue;
    }

    additions.push(`${key}=${value}`);
    existing.set(key, { value, line: -1 });
  }

  if (!additions.length) return source;

  const base = source.replace(/(?:\r\n|\r|\n)*$/, "");
  return `${base}${base ? eol : ""}${additions.join(eol)}${eol}`;
}
