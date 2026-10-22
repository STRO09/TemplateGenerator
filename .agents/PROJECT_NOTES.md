# TemplateGen — Agent Project Notes

> Notes taken by Antigravity agent to understand the codebase before tasks.
> Last updated: 2026-10-21

---

## What Is This Project?

**TemplateGen** is a registry-driven, AST-powered project scaffolding tool.
It lets developers generate production-ready Node.js/Express projects with opt-in modules
(Database, Sockets, Auth, etc.) via either a **CLI** or an **interactive Cyberpunk Web UI**.

The key innovation is using **Acorn AST transformations** instead of fragile regex/string
replacements to inject code into generated project files.

---

## Core Concepts

### 1. Registry (Single Source of Truth)
- knowledgebase/registry/server/node/express.json — Declares all available modules, their:
  - npm dependencies
  - Runtime file source->destination mappings
  - AST transformation instructions (imports, object props, switch cases, function calls)
- knowledgebase/availableTech.json — Lists supported languages/frameworks with 'implemented' flags

### 2. Templates
- knowledgebase/templates/node/express/base/ — Minimal working Express starter
- knowledgebase/templates/node/express/modules/ — Module-specific source files:
  - auth/, cache/, db/, emailNotifications/, fileUpload/, payment/, socket/, testpages/

### 3. AST Transformation Engine (cli/lib/ast-transformer.js)
Four transformation types:
- add-import — Injects named/default ES imports, prevents duplicates
- add-object-properties — Appends key-value pairs to config objects
- add-switch-case — Inserts switch cases before default: handler
- insert-before-call — Inserts async init/listener code before target function calls

### 4. Generation Pipeline
User Input (CLI or Web UI)
  -> Load & validate registry (express.json)
  -> Copy base template to staging dir
  -> Merge npm dependencies into package.json
  -> Copy selected module files into staging
  -> AST parse JS files -> apply transformations -> write verified files
  -> Merge .env variables into .env.example
  -> Write .templategen/project.json metadata
  -> (Web) Stream as .zip | (CLI) Scaffold to disk

---

## Implementation Status

Implemented (server):
- Node.js + Express stack
- Modules: socket (Socket.IO), db (Mongoose)

Roadmap:
- Client: React, Next.js (not implemented)
- Server modules: auth, cache, emailNotifications, fileUpload, payment (dirs exist, partial)
- Other runtimes: Go, Java (not implemented)

---

## Key Technical Details

- Runtime: Node.js v18+ (ES Modules)
- AST Parser: Acorn
- Compression: Native Node.js zlib (PKZIP)
- CLI: npm link creates symlink in global npm prefix
- Dogfooding: server/ is itself a generated TemplateGen Express project
- Staging: Isolated temp area, atomic cleanup on failure
- Metrics: prom-client (Prometheus) in server
