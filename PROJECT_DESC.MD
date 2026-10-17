# TemplateGen Project Structure

## Root

- `package.json` — Defines the CLI package metadata, dependencies, and executable entry point.

## server/

The dogfooded Node.js + Express backend that powers the web UI and project generator API.

- `src/server.js` — HTTP server entry point.
- `src/app.js` — Configures Express middleware, serves static files from `client/`, and mounts `/api` routes.
- `src/routes/generator.routes.js` — Routes for `GET /api/tech` and `POST /api/generate`.
- `src/controllers/generator.controller.js` — Dispatches tech metadata and streams the generated project ZIP archive.
- `src/services/generator.service.js` — Reuses the CLI patching pipeline (`copyBaseTemplate`, `mergeSelectedDependencies`, `copySelectedModuleFiles`, `applySelectedModuleIntegrations`, and `saveProjectMetadata`) with authoritative registry validation and temporary staging.
- `src/utils/zip.js` — Native Node.js PKZIP archive creator for downloading generated projects.

## client/

- `index.html` — Interactive cyberpunk UI with glitch animations, project name input, live module selector, and generation result modal.
- `styles.css` — Styling tokens, layout, glitch keyframes, and modal components.

## cli/

- `cli.js` — Coordinates registry-defined module integrations and applies the required transformations to generated project files.
- `patcher.js` — Applies registry-defined patches to generated project files.

### cli/commands/

- `create.js` — Creates a project, configures its applications, and integrates selected modules.
- `add.js` — Adds modules to an existing TemplateGen project.

### cli/lib/

- `ast-transformer.js` — Applies AST-based JavaScript transformations, such as adding imports, adding object properties, adding switch cases, and inserting statements before selected calls.
- `env-merger.js` — Merges module environment variables into .env.example, avoiding duplicate entries and detecting conflicting values.
- `dependencies.js` — Merges selected module dependencies into the generated project's `package.json`.
- `help.js` — Displays CLI usage instructions and command help.
- `module-files.js` — Copies selected module files into generated applications using default destinations or provider-defined source-to-destination mappings, validating conflicts before copying.
- `module-integration.js` — Coordinates dependency merging, module file copying, source integration, npm installation, and project metadata saving.
- `module-selection.js` — Handles interactive selection of modules and providers.
- `npm.js` — Runs npm installation in the target application directory.
- `paths.js` — Resolves knowledgebase, registry, and template paths and loads technology configuration.
- `project-files.js` — Selects project locations and copies base templates into application directories.
- `project-metadata.js` — Creates, loads, saves, and merges `.templategen/project.json` metadata.
- `prompts.js` — Provides reusable interactive prompts for CLI input and choices.
- `project-metadata.js` — Creates and updates metadata describing the project's selected technologies and modules.
- `target-setup.js` — Configures the selected client and server technologies using interactive prompts or CLI options.

### cli/tech/

- `node.js` — Configures the Node.js stack and selects its API framework.

## knowledgebase/

- `availableTech.json` — Lists supported languages, frameworks, API frameworks, and modules, including their implementation status. Describes available technologies and which ones are implemented.
- `registry/` — Contains JSON definitions describing available modules, providers, dependencies, and patches.
- `templates/` — Contains base application templates and reusable module files.

### knowledgebase/registry/server/node/

- `express.json` — Defines Express modules and providers, their dependencies, runtime file mappings, and the integrations to apply when modules are selected.

### knowledgebase/templates/node/express/

- `base/` — Contains the starter Express application copied when creating a server app.
- `modules/` — Contains reusable module implementations that can be added to a generated application.

**### knowledgebase/templates/node/express/modules/**

- `<module-name>/` — Contains the runtime source files and supporting integration resources for a module.
- `src/` — Contains runtime source files copied into the generated application.
- `patches/` — (Legacy; during migration) Contains text snippets used to modify existing application files. These are being replaced by registry-defined AST integrations.
- Supporting files — May include configuration templates, environment-variable examples, or other resources needed to integrate the module.