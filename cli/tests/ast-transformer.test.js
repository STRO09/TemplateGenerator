import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "acorn";

import {
  applyJavaScriptTransformation,
  applyJavaScriptTransformations,
} from "../lib/ast-transformer.js";

function assertParses(source) {
  assert.doesNotThrow(() =>
    parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
    }),
  );
}

test("adds named imports and is idempotent", () => {
  const source = `import fs from "node:fs";\n\nconst value = 1;\n`;
  const definition = {
    operation: "add-import",
    source: "./config/db.config.js",
    specifiers: [{ kind: "named", imported: "connectDB", local: "connectDB" }],
  };

  const once = applyJavaScriptTransformation(source, definition);
  const twice = applyJavaScriptTransformation(once, definition);

  assert.match(
    once,
    /import \{ connectDB \} from "\.\/config\/db\.config\.js";/,
  );
  assert.equal(twice, once);
  assertParses(once);
});

test("adds imports after leading comments when there are no imports", () => {
  const source = `// server entry point\nconst app = createApp();\n`;

  const result = applyJavaScriptTransformation(source, {
    operation: "add-import",
    source: "socket.io",
    specifiers: [{ kind: "named", imported: "Server", local: "SocketServer" }],
  });

  assert.match(
    result,
    /^\/\/ server entry point\nimport \{ Server as SocketServer \} from "socket.io";\nconst app/m,
  );
  assertParses(result);
});

test("rejects a conflicting top-level import binding", () => {
  const source = `const connectDB = () => {};\n`;

  assert.throws(
    () =>
      applyJavaScriptTransformation(source, {
        operation: "add-import",
        source: "./config/db.config.js",
        specifiers: [
          { kind: "named", imported: "connectDB", local: "connectDB" },
        ],
      }),
    /already declared/,
  );
});

test("adds properties to a multi-line object", () => {
  const source = `const env = {\n  PORT: process.env.PORT,\n};\n`;

  const result = applyJavaScriptTransformation(
    source,
    {
      operation: "add-object-properties",
      object: "env",
      properties: [
        {
          key: "DB_DRIVER",
          value: 'process.env.DB_DRIVER ?? "mongo"',
        },
        { key: "MONGO_URI", value: "process.env.MONGO_URI" },
      ],
    },
    "env.js",
  );

  assert.match(
    result,
    /PORT: process\.env\.PORT,\n  DB_DRIVER: process\.env\.DB_DRIVER \?\? "mongo",\n  MONGO_URI: process\.env\.MONGO_URI,/,
  );
  assertParses(result);
});

test("adds properties to inline and empty objects", () => {
  const inline = applyJavaScriptTransformation(
    `const config = { port: 3000 };`,
    {
      operation: "add-object-properties",
      object: "config",
      properties: [{ key: "host", value: '"localhost"' }],
    },
  );

  assert.match(inline, /port: 3000, host: "localhost"/);
  assertParses(inline);

  const empty = applyJavaScriptTransformation(`const config = {};`, {
    operation: "add-object-properties",
    object: "config",
    properties: [{ key: "port", value: "3000" }],
  });

  assert.match(empty, /\{ port: 3000 \}/);
  assertParses(empty);
});

test("identical properties are idempotent; conflicting values fail", () => {
  const source = `const env = { PORT: process.env.PORT };`;
  const definition = {
    operation: "add-object-properties",
    object: "env",
    properties: [{ key: "PORT", value: "process.env.PORT" }],
  };

  assert.equal(applyJavaScriptTransformation(source, definition), source);

  assert.throws(
    () =>
      applyJavaScriptTransformation(source, {
        ...definition,
        properties: [{ key: "PORT", value: "3000" }],
      }),
    /different value/,
  );
});

test("adds a switch case before default", () => {
  const source = `switch (env.DB_DRIVER) {
  case "postgres":
    connectPostgres();
    break;
  default:
    throw new Error("unsupported");
}
`;

  const result = applyJavaScriptTransformation(
    source,
    {
      operation: "add-switch-case",
      discriminant: "env.DB_DRIVER",
      test: "mongo",
      statements: ["connectMongo();", "break;"],
    },
    "provider.js",
  );

  assert.ok(result.indexOf('case "mongo":') < result.indexOf("default:"));
  assert.match(result, /case "mongo":\n    connectMongo\(\);\n    break;/);
  assertParses(result);
});

test("extends an existing case before its break statement", () => {
  const source = `switch (env.DB_DRIVER) {
  case "mongo":
    repositories.user = userRepository;
    break;
}
`;

  const result = applyJavaScriptTransformation(source, {
    operation: "add-switch-case",
    discriminant: "env.DB_DRIVER",
    test: "mongo",
    statements: [
      "repositories.user = userRepository;",
      "repositories.order = orderRepository;",
    ],
  });

  assert.match(
    result,
    /repositories\.user = userRepository;\n    repositories\.order = orderRepository;\n    break;/,
  );

  assert.equal(
    applyJavaScriptTransformation(result, {
      operation: "add-switch-case",
      discriminant: "env.DB_DRIVER",
      test: "mongo",
      statements: ["repositories.order = orderRepository;"],
    }),
    result,
  );

  assertParses(result);
});

test("inserts statements before an AST-selected call", () => {
  const source = `async function start() {
  const server = http . createServer(app);
  server.listen(port);
}
`;

  const definition = {
    operation: "insert-before-call",
    callee: "http.createServer",
    statements: ["await connectDB();"],
  };

  const result = applyJavaScriptTransformation(source, definition, "server.js");

  assert.match(
    result,
    /await connectDB\(\);\n  const server = http \. createServer\(app\);/,
  );
  assertParses(result);
  assert.equal(
    applyJavaScriptTransformation(result, definition, "server.js"),
    result,
  );
});

test("fails for missing or ambiguous selectors", () => {
  assert.throws(
    () =>
      applyJavaScriptTransformation(`const x = 1;`, {
        operation: "insert-before-call",
        callee: "http.createServer",
        statements: ["await connectDB();"],
      }),
    /found 0/,
  );

  assert.throws(
    () =>
      applyJavaScriptTransformation(`foo(); foo();`, {
        operation: "insert-before-call",
        callee: "foo",
        statements: ["setup();"],
      }),
    /found 2/,
  );
});

test("applies transformations in registry order", () => {
  const source = `const env = {};
switch (env.DB_DRIVER) {
  default:
    break;
}
`;

  const result = applyJavaScriptTransformations(source, [
    {
      operation: "add-object-properties",
      object: "env",
      properties: [{ key: "DB_DRIVER", value: '"mongo"' }],
    },
    {
      operation: "add-switch-case",
      discriminant: "env.DB_DRIVER",
      test: "mongo",
      statements: ["break;"],
    },
  ]);

  assert.match(result, /DB_DRIVER: "mongo"/);
  assert.match(result, /case "mongo":\n    break;\n  default:/);
  assertParses(result);
});
