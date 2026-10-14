used the shebang in cli.js #!/usr/bin/env node a standard script can be turned into an 
executable cli command.

shebang is instructions for unix like os to tell them which interpreter to use to execute 
the script

• #! — The Magic Number
The system looks at the very first two bytes of a file. The hexadecimal values 0x23 (#) and 0x21 (!) serve as a "magic marker." When you try to execute the file directly (e.g., ./script.js), the kernel reads these bytes and realizes, "This isn't a compiled binary program; it's a script that needs a separate engine to read it."
• /usr/bin/env — The Path to the Executable
This specifies the absolute path to the program that will load your script.
• node — The Argument
This is the specific language interpreter or environment variable you are passing to the tool listed before it.


1. The Hardcoded Approach (e.g., #!/usr/bin/node or #!/usr/bin/python)

This tells the kernel to look precisely in the /usr/bin/ folder for the runtime engine.
• The Problem: It breaks easily across different computers. For instance, if one developer installs Node via a package manager into /usr/bin/node, but another developer installs it via homebrew into /usr/local/bin/node, the script will fail to run on the second machine with a "No such file or directory" error.

2. The Flexible Approach (e.g., #!/usr/bin/env node)

This utilizes a helper utility built into Unix systems called env, which always resides at /usr/bin/env.
• The Solution: Instead of finding Node directly, the operating system launches env and hands it the word node. The env utility looks at your current system's environment variables—specifically your $PATH list. It searches your system's directories sequentially and uses whichever valid version of Node it encounters first. 


1. How the templategen command is recognized

By defining:

"bin": {
  "templategen": "./cli.js"
} in package.json


how are commands even recognized ? 

Your shell doesn't search every folder on your computer for a file named templategen. It searches directories listed in the PATH environment variable.
For example, imagine your PATH contains:
/usr/local/bin
/usr/bin
/home/user/.nvm/bin


If templategen exists in one of those directories, the shell can find it.

Your package.json is metadata for npm. Your shell doesn't understand npm's bin field.
That's why simply writing "templategen": "./cli.js" in bin in package.json doesn't register the command.

running npm link, creates a symlink to your script by exposing the commands declared in bin 
field in global npm installation area

so your os can look inside npm : 
C:\Users\Sagar>npm config get prefix
C:\nvm4w\nodejs

C:\Users\Sagar>where templategen
C:\nvm4w\nodejs\templategen
C:\nvm4w\nodejs\templategen.cmd

Symlink (symbolic link) ->  special filesystem entry to another file or directory. so templategen here is the symlink 
pointing to cli.js


separate steps for client and server taken from availableTech.json

current directory or choose your directory where your project will be created / copied to.

separate instructions per tech

the json per tech contains all the modules available to patch and the dependencies and the patches needed to add a specific module