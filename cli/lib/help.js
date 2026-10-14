// help text

export function showMainHelp() {
  console.log(`
TemplateGen
Project scaffolding from reusable templates.

Usage:
  templategen <command> [options]

Commands:
  create [name]  Create a project, optionally adding modules and providers.
  add            Add modules and providers to an existing TemplateGen project.

Help:
  templategen --help
  templategen create --help
  templategen add --help
`);
}

export function showCreateHelp() {
  console.log(`
templategen create
Create a project with separately named application folders.

Usage:
  templategen create [project-name]
  templategen create <project-name> --servername <folder> --serverframework <framework> --apiframework <framework>
  templategen create <project-name> --clientname <folder> --clientframework <framework>

Options:
  --servername <folder>          Server app folder name
  --serverframework <framework> Server technology, e.g. node
  --apiframework <framework>    API framework, e.g. express
  --clientname <folder>         Client app folder name
  --clientframework <framework> Client framework, e.g. react

Examples:
  templategen create
  templategen create my-project --servername api --serverframework node --apiframework express
  templategen create my-project --servername api --serverframework node --apiframework express --clientname web --clientframework react

With a project name, TemplateGen creates that folder inside the selected parent.
Without a project name, the selected directory itself becomes the project root.
Application folder names are prompted for when they are not supplied.
Client scaffolding is not implemented yet.
`);
}

export function showAddHelp() {
  console.log(`
templategen add
Add modules and providers to an existing TemplateGen project, update its
metadata and dependencies, copy module files, and apply provider patches.

Usage:
  templategen add

Run this command from the project root. Modules already recorded in
.templategen/project.json are not offered again.

Example:
  cd my-app
  templategen add
`);
}
