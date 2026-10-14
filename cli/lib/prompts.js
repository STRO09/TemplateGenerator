import readline from "node:readline";

export function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();

      // Preserve capitalization in names and paths.
      resolve(answer.trim());
    });
  });
}

export async function askChoice(question, choices) {
  const entries = Array.isArray(choices)
    ? choices
    : Object.entries(choices).map(([value, label]) => ({ value, label }));

  if (entries.length === 0) {
    throw new Error(`No choices are available for: ${question}`);
  }

  console.log(question);

  entries.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice.label}`);
  });

  while (true) {
    const answer = await ask("> ");
    const index = Number(answer) - 1;

    if (Number.isInteger(index) && index >= 0 && index < entries.length) {
      return entries[index].value;
    }

    const match = entries.find(
      (choice) => String(choice.value).toLowerCase() === answer.toLowerCase(),
    );

    if (match) return match.value;

    console.log("Please choose one of the listed options.");
  }
}
