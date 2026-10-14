import fs from "node:fs";
import path from "node:path";

const SUPPORTED_OPERATIONS = new Set([
  "add-import",
  "insert-before-anchor",
  "append-object-property",
  "append",
]);

export function copySelectedModuleFiles({
  targetPath,
  stackRoot,
  selectedModules,
}) {
  const copiedModules = [];

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
      throw new Error(`Module folder not found: ${sourcePath}`);
    }

    fs.mkdirSync(path.dirname(destinationPath), {
      recursive: true,
    });

    fs.cpSync(sourcePath, destinationPath, {
      recursive: true,
      force: false,
      errorOnExist: true,

      filter(source) {
        const relativePath = path.relative(sourcePath, source);

        // Keep the source root, but exclude its patches directory.
        if (!relativePath) {
          return true;
        }

        const firstSegment = relativePath.split(path.sep)[0];

        return firstSegment !== "patches";
      },
    });

    copiedModules.push(moduleKey);

    console.log(`Copied module "${moduleKey}" to ${destinationPath}`);
  }

  return copiedModules;
}

export function applySelectedModulePatches({
  targetPath,
  stackRoot,
  moduleRegistry,
  selectedModules,
}) {
  const stagedFiles = new Map();

  for (const [moduleKey, selection] of Object.entries(selectedModules ?? {})) {
    const moduleDefinition = moduleRegistry.modules?.[moduleKey];

    if (!moduleDefinition) {
      throw new Error(`Module "${moduleKey}" was not found in the registry.`);
    }

    const provider = moduleDefinition.providers?.[selection.provider];

    if (!provider) {
      throw new Error(
        `Provider "${selection.provider}" was not found for module "${moduleKey}".`,
      );
    }

    for (const patch of provider.patches ?? []) {
      validatePatch(patch);

      const patchPath = resolveInside(stackRoot, patch.patch, "Patch source");

      const targetFile = resolveInside(targetPath, patch.file, "Patch target");

      if (!fs.existsSync(patchPath) || !fs.statSync(patchPath).isFile()) {
        throw new Error(`Patch file not found: ${patchPath}`);
      }

      if (!fs.existsSync(targetFile) || !fs.statSync(targetFile).isFile()) {
        throw new Error(`Target file not found: ${targetFile}`);
      }

      const patchContents = fs.readFileSync(patchPath, "utf8");

      const originalContents = stagedFiles.has(targetFile)
        ? stagedFiles.get(targetFile)
        : fs.readFileSync(targetFile, "utf8");

      const updatedContents = applyPatchOperation(
        originalContents,
        patch,
        patchContents,
        targetFile,
      );

      stagedFiles.set(targetFile, updatedContents);
    }
  }

  // All patches must validate before any target file is written.
  for (const [file, contents] of stagedFiles) {
    fs.writeFileSync(file, contents, "utf8");
  }

  console.log(`Patched ${stagedFiles.size} file(s).`);

  return {
    patchedFiles: [...stagedFiles.keys()],
  };
}

function validatePatch(patch) {
  if (!patch || typeof patch !== "object") {
    throw new Error("Invalid patch definition.");
  }

  if (typeof patch.file !== "string" || !patch.file.trim()) {
    throw new Error('Every patch requires a "file" path.');
  }

  if (typeof patch.patch !== "string" || !patch.patch.trim()) {
    throw new Error('Every patch requires a "patch" source path.');
  }

  if (!SUPPORTED_OPERATIONS.has(patch.operation)) {
    throw new Error(`Unsupported patch operation: ${patch.operation}`);
  }

  if (
    ["add-import", "insert-before-anchor"].includes(patch.operation) &&
    (typeof patch.anchor !== "string" || !patch.anchor)
  ) {
    throw new Error(`Operation "${patch.operation}" requires an anchor.`);
  }

  if (
    patch.operation === "append-object-property" &&
    (typeof patch.object !== "string" || !patch.object)
  ) {
    throw new Error(
      'Operation "append-object-property" requires an object name.',
    );
  }
}

function applyPatchOperation(source, definition, patchContents, targetFile) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const snippet = patchContents.trim();

  if (!snippet && definition.operation !== "append") {
    throw new Error(`Patch file is empty: ${targetFile}`);
  }

  switch (definition.operation) {
    case "add-import":
      return addImport(source, definition.anchor, snippet, eol, targetFile);

    case "insert-before-anchor":
      return insertBeforeAnchor(
        source,
        definition.anchor,
        snippet,
        eol,
        targetFile,
      );

    case "append-object-property":
      return appendObjectProperty(
        source,
        definition.object,
        snippet,
        eol,
        targetFile,
      );

    case "append":
      return appendText(source, snippet, eol);

    default:
      throw new Error(`Unsupported operation: ${definition.operation}`);
  }
}

// Add an import immediately after the imports-section anchor.
function addImport(source, anchor, snippet, eol, targetFile) {
  if (source.includes(snippet)) {
    return source;
  }

  const anchorIndex = findUniqueAnchor(
    source,
    anchor,
    targetFile,
    "add-import",
  );

  // Insert before the anchor's line.
  const lineStart = source.lastIndexOf("\n", anchorIndex - 1) + 1;

  const formattedSnippet = normalizeEol(snippet, eol);

  return (
    source.slice(0, lineStart) +
    formattedSnippet +
    eol +
    source.slice(lineStart)
  );
}

// Insert statements before an anchor line, preserving indentation.
function insertBeforeAnchor(source, anchor, snippet, eol, targetFile) {
  if (snippetAlreadyPresent(source, snippet)) {
    return source;
  }

  const anchorIndex = findUniqueAnchor(
    source,
    anchor,
    targetFile,
    "insert-before-anchor",
  );

  const lineStart = source.lastIndexOf("\n", anchorIndex - 1) + 1;

  const anchorPrefix = source.slice(lineStart, anchorIndex);
  const anchorIndent = /^[\t ]*/.exec(anchorPrefix)?.[0] ?? "";

  // The inserted statements belong one indentation level inside
  // the block whose closing line is the anchor.
  const statementIndent = `${anchorIndent}  `;

  const formattedSnippet = indentSnippet(snippet, statementIndent, eol);

  return (
    source.slice(0, lineStart) +
    formattedSnippet +
    eol +
    source.slice(lineStart)
  );
}

// Append a property to the end of a simple named configuration object.
function appendObjectProperty(source, objectName, snippet, eol, targetFile) {
  const propertyMatch = /^([A-Za-z_$][\w$]*)\s*:/.exec(snippet);

  if (!propertyMatch) {
    throw new Error(
      `The patch for "${objectName}" must start with a property name and colon.`,
    );
  }

  const propertyName = propertyMatch[1];

  const declarationPattern = new RegExp(
    `\\b(?:const|let|var)\\s+${escapeRegExp(objectName)}\\s*=\\s*\\{`,
  );

  const declarationMatch = declarationPattern.exec(source);

  if (!declarationMatch) {
    throw new Error(
      `Could not find the object declaration for "${objectName}" in ${targetFile}.`,
    );
  }

  const openBraceIndex = source.indexOf("{", declarationMatch.index);

  const closeBraceIndex = findMatchingBrace(
    source,
    openBraceIndex,
    targetFile,
    objectName,
  );

  const objectBody = source.slice(openBraceIndex + 1, closeBraceIndex);

  // Avoid adding the same property twice.
  const existingPropertyPattern = new RegExp(
    `(?:^|[,\\n])\\s*${escapeRegExp(propertyName)}\\s*:`,
  );

  if (existingPropertyPattern.test(objectBody)) {
    return source;
  }

  const trimmedBody = objectBody.trimEnd();

  if (trimmedBody && !trimmedBody.endsWith(",")) {
    throw new Error(
      `Cannot safely append "${propertyName}" to "${objectName}". ` +
        "The last property must end with a comma.",
    );
  }

  // Insert on its own line before the closing-brace line.
  const closingLineStart = source.lastIndexOf("\n", closeBraceIndex - 1) + 1;

  if (closingLineStart <= openBraceIndex) {
    throw new Error(
      `Object "${objectName}" must be formatted across multiple lines.`,
    );
  }

  const closingLineIndent = source.slice(closingLineStart, closeBraceIndex);

  const indentationMatch = /\r?\n([\t ]+)[A-Za-z_$][\w$]*\s*:/.exec(objectBody);

  const propertyIndent = indentationMatch?.[1] ?? `${closingLineIndent}  `;

  const formattedSnippet = indentSnippet(snippet, propertyIndent, eol);

  return (
    source.slice(0, closingLineStart) +
    formattedSnippet +
    eol +
    source.slice(closingLineStart)
  );
}

// Append the patch contents to the end of a file.
function appendText(source, snippet, eol) {
  if (!snippet) {
    return source;
  }

  const prefix = source.length === 0 || source.endsWith("\n") ? "" : eol;

  return source + prefix + normalizeEol(snippet, eol) + eol;
}

function findUniqueAnchor(source, anchor, targetFile, operation) {
  const firstIndex = source.indexOf(anchor);

  if (firstIndex === -1) {
    throw new Error(
      `Anchor for "${operation}" was not found in ${targetFile}: ${anchor}`,
    );
  }

  const secondIndex = source.indexOf(anchor, firstIndex + anchor.length);

  if (secondIndex !== -1) {
    throw new Error(
      `Anchor for "${operation}" occurs more than once in ${targetFile}: ${anchor}`,
    );
  }

  return firstIndex;
}

// Intended for the simple configuration objects in our templates.
// This is not a replacement for a JavaScript AST parser.
function findMatchingBrace(source, openBraceIndex, targetFile, objectName) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openBraceIndex; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (char === "\n") {
        lineComment = false;
      }
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        i++;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      i++;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      i++;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;

      if (depth === 0) {
        return i;
      }
    }
  }

  throw new Error(
    `Could not find the closing brace of "${objectName}" in ${targetFile}.`,
  );
}

function snippetAlreadyPresent(source, snippet) {
  return normalizeWhitespace(source).includes(normalizeWhitespace(snippet));
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function indentSnippet(snippet, indentation, eol) {
  return normalizeEol(snippet, eol)
    .split(eol)
    .map((line) => (line.trim() ? `${indentation}${line.trimStart()}` : ""))
    .join(eol);
}

function normalizeEol(value, eol) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .join(eol);
}

function resolveInside(root, relativePath, label) {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`${label} must be relative: ${relativePath}`);
  }

  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, resolvedPath);

  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label} escapes its allowed directory: ${relativePath}`);
  }

  return resolvedPath;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
