#!/usr/bin/env node

// only dispatches commands and handles uncaught errors. Project creation and module addition live elsewhere.

import { createCommand } from "./commands/create.js";
import { addCommand } from "./commands/add.js";
import {
  showAddHelp,
  showCreateHelp,
  showMainHelp,
} from "./lib/help.js";

const [command, ...args] = process.argv.slice(2);

async function run() {
  const helpRequested =
    args.includes("--help") || args.includes("-h");

  if (
    !command ||
    command === "--help" ||
    command === "-h"
  ) {
    showMainHelp();
    return;
  }

  if (command === "help") {
    if (args[0] === "create") showCreateHelp();
    else if (args[0] === "add") showAddHelp();
    else showMainHelp();
    return;
  }

  if (command === "create") {
    if (helpRequested) {
      showCreateHelp();
      return;
    }

    await createCommand(args);
    return;
  }

  if (command === "add") {
    if (helpRequested) {
      showAddHelp();
      return;
    }

    if (args.length > 0) {
      throw new Error(
        "'templategen add' does not take positional arguments. " +
        "Run 'templategen add --help'.",
      );
    }

    await addCommand();
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.error(
    "Run 'templategen --help' to see available commands.",
  );
  process.exitCode = 1;
}

run().catch((error) => {
  console.error("");
  console.error(`Error: ${error.message}`);

  if (error instanceof AggregateError) {
    for (const nested of error.errors) {
      console.error(`  - ${nested.message}`);
    }
  }

  process.exitCode = 1;
});