import { parse } from "acorn";

const OPERATIONS = new Set([
  "add-import",
  "add-object-properties",
  "add-switch-case",
  "insert-before-call",
]);

export function applyJavaScriptTransformations(
  source,
  definitions,
  targetFile = "<source>",
) {
  return (definitions ?? []).reduce(
    (current, definition) =>
      applyJavaScriptTransformation(current, definition, targetFile),
    source,
  );
}

export function applyJavaScriptTransformation(
  source,
  definition,
  targetFile = "<source>",
) {
  if (!definition || !OPERATIONS.has(definition.operation)) {
    throw new Error(
      `Unsupported JavaScript transformation: ${definition?.operation}`,
    );
  }

  switch (definition.operation) {
    case "add-import":
      return addImport(source, definition, targetFile);
    case "add-object-properties":
      return addObjectProperties(source, definition, targetFile);
    case "add-switch-case":
      return addSwitchCase(source, definition, targetFile);
    case "insert-before-call":
      return insertBeforeCall(source, definition, targetFile);
  }
}

function parseSource(source, targetFile) {
  try {
    const tokens = [];
    const ast = parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowHashBang: true,
      locations: true,
      onToken: tokens,
    });

    return { ast, tokens };
  } catch (error) {
    throw new Error(
      `Cannot parse JavaScript in ${targetFile}: ${error.message}`,
      { cause: error },
    );
  }
}

function walk(node, visit, parent = null, key = null, index = null) {
  if (!node || typeof node.type !== "string") return;

  visit(node, parent, key, index);

  for (const [childKey, value] of Object.entries(node)) {
    if (["start", "end", "loc"].includes(childKey)) continue;

    if (Array.isArray(value)) {
      value.forEach((child, i) => walk(child, visit, node, childKey, i));
    } else if (value && typeof value.type === "string") {
      walk(value, visit, node, childKey, null);
    }
  }
}

function parseExpression(code, targetFile) {
  if (typeof code !== "string" || !code.trim()) {
    throw new Error(`Empty expression in ${targetFile}.`);
  }

  return parseSource(`(${code})`, targetFile).ast.body[0].expression;
}

// Parse snippets inside a switch clause so that statements such as
// `break;` are syntactically valid during validation.
function parseStatement(code, targetFile) {
  const ast = parseSource(`switch (0) { case 0: ${code}\n}`, targetFile).ast;

  const statements = ast.body[0]?.cases?.[0]?.consequent ?? [];

  if (statements.length !== 1) {
    throw new Error(
      `Each statement entry must contain exactly one statement in ${targetFile}.`,
    );
  }

  return statements[0];
}

function parseStatements(codes, targetFile) {
  if (!Array.isArray(codes) || codes.length === 0) {
    throw new Error(
      `A non-empty "statements" array is required in ${targetFile}.`,
    );
  }

  return codes.map((code) => {
    if (typeof code !== "string" || !code.trim()) {
      throw new Error(`Empty statement in ${targetFile}.`);
    }

    return parseStatement(code, targetFile);
  });
}

function normalized(node) {
  if (Array.isArray(node)) return node.map(normalized);
  if (!node || typeof node !== "object") return node;

  return Object.fromEntries(
    Object.entries(node)
      .filter(
        ([key, value]) =>
          !["start", "end", "loc", "raw"].includes(key) && value !== undefined,
      )
      .map(([key, value]) => [key, normalized(value)]),
  );
}

function sameNode(a, b) {
  return JSON.stringify(normalized(a)) === JSON.stringify(normalized(b));
}

function memberPath(node) {
  if (node?.type === "Identifier") return node.name;

  if (
    node?.type === "MemberExpression" &&
    !node.computed &&
    node.property.type === "Identifier"
  ) {
    const parent = memberPath(node.object);
    return parent ? `${parent}.${node.property.name}` : null;
  }

  return null;
}

function eolOf(source) {
  return source.includes("\r\n") ? "\r\n" : "\n";
}

function lineStart(source, index) {
  return source.lastIndexOf("\n", Math.max(0, index - 1)) + 1;
}

function indentAt(source, index) {
  const prefix = source.slice(lineStart(source, index), index);
  return /^\s*$/.test(prefix) ? prefix : null;
}

function indentUnit(source) {
  return source.split(/\r?\n/).some((line) => /^\t+\S/.test(line))
    ? "\t"
    : "  ";
}

function indentSnippet(code, indent, eol) {
  return code
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => (line.trim() ? indent + line.trimStart() : ""))
    .join(eol);
}

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

function addImport(source, definition, targetFile) {
  if (
    typeof definition.source !== "string" ||
    !definition.source ||
    !Array.isArray(definition.specifiers) ||
    !definition.specifiers.length
  ) {
    throw new Error(
      `"add-import" requires "source" and "specifiers" in ${targetFile}.`,
    );
  }

  const { ast } = parseSource(source, targetFile);
  const imports = ast.body.filter((node) => node.type === "ImportDeclaration");
  const missing = [];

  for (const raw of definition.specifiers) {
    const spec = normalizeSpecifier(raw);

    const exists = imports.some(
      (declaration) =>
        declaration.source.value === definition.source &&
        declaration.specifiers.some((item) => importMatches(item, spec)),
    );

    if (exists) continue;

    const bindingExists = ast.body.some((node) => {
      if (node.type === "ImportDeclaration") {
        return node.specifiers.some((item) => item.local.name === spec.local);
      }

      if (["FunctionDeclaration", "ClassDeclaration"].includes(node.type)) {
        return node.id?.name === spec.local;
      }

      return (
        node.type === "VariableDeclaration" &&
        node.declarations.some(
          (item) =>
            item.id.type === "Identifier" && item.id.name === spec.local,
        )
      );
    });

    if (bindingExists) {
      throw new Error(
        `Cannot import "${spec.local}" in ${targetFile}: ` +
          "that name is already declared.",
      );
    }

    missing.push(spec);
  }

  if (!missing.length) return source;

  const lines = renderImports(definition.source, missing);
  const eol = eolOf(source);

  if (imports.length) {
    const position = imports.at(-1).end;

    return (
      source.slice(0, position) + eol + lines.join(eol) + source.slice(position)
    );
  }

  // Preserve any initial comments and directive statements.
  const directives = [];

  for (const node of ast.body) {
    if (node.type === "ExpressionStatement" && node.directive) {
      directives.push(node);
    } else {
      break;
    }
  }

  const position =
    directives.at(-1)?.end ?? ast.body[0]?.start ?? source.length;

  const before = source.slice(0, position);
  const after = source.slice(position);
  const prefixEol = before && !before.endsWith("\n") ? eol : "";
  const suffixEol = after.startsWith("\n") ? "" : eol;

  return before + prefixEol + lines.join(eol) + suffixEol + after;
}

function normalizeSpecifier(spec) {
  if (!spec || typeof spec !== "object") {
    throw new Error("Invalid import specifier.");
  }

  const local = spec.local ?? spec.imported;

  if (!/^[A-Za-z_$][\w$]*$/.test(local ?? "")) {
    throw new Error(`Invalid import local name: ${local}`);
  }

  if (spec.kind === "named") {
    if (!/^[A-Za-z_$][\w$]*$/.test(spec.imported ?? "")) {
      throw new Error(`Invalid imported name: ${spec.imported}`);
    }

    return { kind: "named", imported: spec.imported, local };
  }

  if (spec.kind === "default") {
    return { kind: "default", local };
  }

  throw new Error(`Unsupported import specifier kind: ${spec.kind}`);
}

function importMatches(existing, spec) {
  if (spec.kind === "default") {
    return (
      existing.type === "ImportDefaultSpecifier" &&
      existing.local.name === spec.local
    );
  }

  return (
    existing.type === "ImportSpecifier" &&
    (existing.imported.name ?? existing.imported.value) === spec.imported &&
    existing.local.name === spec.local
  );
}

function renderImports(moduleSource, specifiers) {
  const defaultImport = specifiers.find((item) => item.kind === "default");

  const named = specifiers
    .filter((item) => item.kind === "named")
    .map((item) =>
      item.imported === item.local
        ? item.imported
        : `${item.imported} as ${item.local}`,
    );

  let clause = defaultImport?.local ?? "";

  if (named.length) {
    clause += `${clause ? ", " : ""}{ ${named.join(", ")} }`;
  }

  return [`import ${clause} from ${JSON.stringify(moduleSource)};`];
}

// -----------------------------------------------------------------------------
// Configuration-object properties
// -----------------------------------------------------------------------------

function objectKey(property) {
  if (property.computed) return null;
  if (property.key.type === "Identifier") return property.key.name;
  if (property.key.type === "Literal") return String(property.key.value);
  return null;
}

function addObjectProperties(source, definition, targetFile) {
  if (
    typeof definition.object !== "string" ||
    !Array.isArray(definition.properties) ||
    !definition.properties.length
  ) {
    throw new Error(
      `"add-object-properties" requires "object" and "properties" in ${targetFile}.`,
    );
  }

  const { ast, tokens } = parseSource(source, targetFile);
  const matches = [];

  walk(ast, (node) => {
    if (
      node.type === "VariableDeclarator" &&
      node.id.type === "Identifier" &&
      node.id.name === definition.object &&
      node.init?.type === "ObjectExpression"
    ) {
      matches.push(node.init);
    }
  });

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one object named "${definition.object}" ` +
        `in ${targetFile}; found ${matches.length}.`,
    );
  }

  const object = matches[0];
  const additions = [];

  for (const { key, value } of definition.properties) {
    if (typeof key !== "string" || !key) {
      throw new Error(`Invalid property key in ${targetFile}.`);
    }

    const valueAst = parseExpression(value, targetFile);
    const existing = object.properties.find(
      (property) => objectKey(property) === key,
    );

    if (existing) {
      if (!sameNode(existing.value, valueAst)) {
        throw new Error(
          `Property "${key}" already exists with a different value ` +
            `in ${targetFile}.`,
        );
      }

      continue;
    }

    const renderedKey = /^[A-Za-z_$][\w$]*$/.test(key)
      ? key
      : JSON.stringify(key);

    additions.push(`${renderedKey}: ${value}`);
  }

  if (!additions.length) return source;

  const eol = eolOf(source);
  const open = object.start;
  const close = object.end - 1;
  const inside = source.slice(open + 1, close);
  const unit = indentUnit(source);

  if (!object.properties.length) {
    if (inside.includes("\n")) {
      const closingIndent = indentAt(source, close) ?? "";
      const propertyIndent = closingIndent + unit;

      return (
        source.slice(0, open + 1) +
        eol +
        additions.map((line) => propertyIndent + line + ",").join(eol) +
        eol +
        closingIndent +
        source.slice(close)
      );
    }

    return (
      source.slice(0, open + 1) +
      ` ${additions.join(", ")} ` +
      source.slice(close)
    );
  }

  const lastProperty = object.properties.at(-1);
  const hasComma = tokens.some(
    (token) =>
      token.type.label === "," &&
      token.start >= lastProperty.end &&
      token.end <= close,
  );

  const closeLine = lineStart(source, close);
  const multiline =
    inside.includes("\n") &&
    indentAt(source, close) !== null &&
    source.slice(closeLine, close).trim() === "";

  if (multiline) {
    let current = source;
    let adjustedClose = close;

    if (!hasComma) {
      current =
        current.slice(0, lastProperty.end) +
        "," +
        current.slice(lastProperty.end);

      adjustedClose++;
    }

    const insertionLine = lineStart(current, adjustedClose);
    const closingIndent = indentAt(current, adjustedClose) ?? "";
    const propertyIndent =
      indentAt(current, object.properties[0].start) ?? closingIndent + unit;

    const newLines = additions
      .map((line) => propertyIndent + line + ",")
      .join(eol);

    return (
      current.slice(0, insertionLine) +
      newLines +
      eol +
      closingIndent +
      current.slice(insertionLine + closingIndent.length)
    );
  }

  const spacer =
    source.slice(lastProperty.end, close).match(/^\s*/)?.[0] ?? " ";

  return (
    source.slice(0, lastProperty.end) +
    `, ${additions.join(", ")}${spacer}` +
    source.slice(close)
  );
}

// -----------------------------------------------------------------------------
// Switch cases
// -----------------------------------------------------------------------------

function addSwitchCase(source, definition, targetFile) {
  if (
    typeof definition.discriminant !== "string" ||
    typeof definition.test !== "string"
  ) {
    throw new Error(
      `"add-switch-case" requires "discriminant" and string "test" in ${targetFile}.`,
    );
  }

  const wanted = parseExpression(definition.discriminant, targetFile);
  const statements = parseStatements(definition.statements, targetFile);
  const { ast } = parseSource(source, targetFile);
  const switches = [];

  walk(ast, (node) => {
    if (
      node.type === "SwitchStatement" &&
      sameNode(node.discriminant, wanted)
    ) {
      switches.push(node);
    }
  });

  if (switches.length !== 1) {
    throw new Error(
      `Expected exactly one switch on "${definition.discriminant}" ` +
        `in ${targetFile}; found ${switches.length}.`,
    );
  }

  const switchNode = switches[0];
  const clause = switchNode.cases.find(
    (item) =>
      item.test?.type === "Literal" && item.test.value === definition.test,
  );
  const eol = eolOf(source);

  if (clause) {
    const missing = statements
      .map((node, index) => ({
        node,
        code: definition.statements[index],
      }))
      .filter(
        ({ node }) =>
          !clause.consequent.some((existing) => sameNode(existing, node)),
      );

    if (!missing.length) return source;

    const breakNode = clause.consequent.find(
      (node) => node.type === "BreakStatement",
    );

    const caseIndent = indentAt(source, clause.start) ?? "";
    const bodyIndent =
      (clause.consequent[0] && indentAt(source, clause.consequent[0].start)) ??
      caseIndent + indentUnit(source);

    const rendered = missing
      .map(({ code }) => indentSnippet(code, bodyIndent, eol))
      .join(eol);

    if (breakNode) {
      const position = lineStart(source, breakNode.start);
      return (
        source.slice(0, position) + rendered + eol + source.slice(position)
      );
    }

    const position = clause.consequent.at(-1)?.end ?? clause.end;

    return source.slice(0, position) + eol + rendered + source.slice(position);
  }

  const defaultCase = switchNode.cases.find((item) => item.test === null);
  const closeBrace = switchNode.end - 1;
  const position = lineStart(source, defaultCase?.start ?? closeBrace);

  const caseIndent = switchNode.cases.length
    ? (indentAt(source, switchNode.cases[0].start) ?? "")
    : (indentAt(source, closeBrace) ?? "") + indentUnit(source);

  const bodyIndent = caseIndent + indentUnit(source);

  const block = [
    `${caseIndent}case ${JSON.stringify(definition.test)}:`,
    ...definition.statements.map((code) =>
      indentSnippet(code, bodyIndent, eol),
    ),
  ].join(eol);

  return source.slice(0, position) + block + eol + source.slice(position);
}

// -----------------------------------------------------------------------------
// Statement insertion using a call-expression selector
// -----------------------------------------------------------------------------

function insertBeforeCall(source, definition, targetFile) {
  if (typeof definition.callee !== "string" || !definition.callee) {
    throw new Error(`"insert-before-call" requires "callee" in ${targetFile}.`);
  }

  const wanted = parseStatements(definition.statements, targetFile);
  const { ast } = parseSource(source, targetFile);
  const parentInfo = new WeakMap();
  const matches = [];

  walk(ast, (node, parent, key, index) => {
    if (parent) parentInfo.set(node, { parent, key, index });

    if (
      node.type !== "CallExpression" ||
      memberPath(node.callee) !== definition.callee
    ) {
      return;
    }

    let statement = node;

    while (statement && !isStatement(statement)) {
      statement = parentInfo.get(statement)?.parent;
    }

    if (statement) matches.push(statement);
  });

  const unique = [...new Set(matches)];

  if (unique.length !== 1) {
    throw new Error(
      `Expected exactly one call to "${definition.callee}" ` +
        `in ${targetFile}; found ${unique.length}.`,
    );
  }

  const target = unique[0];
  const info = parentInfo.get(target);
  const siblings = info?.parent?.[info?.key];

  if (!Array.isArray(siblings)) {
    throw new Error(
      `Cannot locate statement for "${definition.callee}" in ${targetFile}.`,
    );
  }

  const index = siblings.indexOf(target);

  // Make rerunning the same integration idempotent.
  if (
    index >= wanted.length &&
    siblings
      .slice(index - wanted.length, index)
      .every((node, i) => sameNode(node, wanted[i]))
  ) {
    return source;
  }

  const position = lineStart(source, target.start);
  const indent = indentAt(source, target.start);

  if (indent === null) {
    throw new Error(
      `Cannot insert before "${definition.callee}": ` +
        `target statement must start on its own line in ${targetFile}.`,
    );
  }

  const eol = eolOf(source);
  const lines = definition.statements
    .map((code) => indentSnippet(code, indent, eol))
    .join(eol);

  return source.slice(0, position) + lines + eol + source.slice(position);
}

function isStatement(node) {
  return (
    node?.type === "VariableDeclaration" ||
    node?.type === "FunctionDeclaration" ||
    node?.type === "ClassDeclaration" ||
    node?.type?.endsWith("Statement")
  );
}
