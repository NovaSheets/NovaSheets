import * as readline from 'readline';
import NovaSheets from './index';

const VERSION = require('../package.json').version;

const [command, ...opts] = process.argv.slice(2);

if (/^-*h/.test(command)) {
    const help = `
    NovaSheets usage:

        novasheets <command>

    Commands:

        {--compile|-c} <input> [<output>]
            Compile a NovaSheets file from an exact or globbed input.

        {--parse|-p} ["<input>"]
            Parse raw NovaSheets input from raw input. Accepts input from stdin.

        {--help|-h} [<command>]
            Display this help message.

        {--versions|-v}
            Display the current version of NovaSheets.
    `;

    if (opts[0]) {
        const usage = help.split('\n').find(line => RegExp('-' + opts[0].replace(/-*/, '')).test(line));
        if (usage)
            console.log(`Usage for NovaSheets command '${opts[0]}':\n${usage.replace(/ {4}/, '')}`);
        else
            console.log(`Invalid command '${opts[0]}'.`);
    }
    else {
        console.log(help);
    }
}
else if (/^-*v/.test(command)) {
    console.log(VERSION);
}
else if (/^-*p/.test(command)) {
    async function readFromStdin() {
        let stdinput = '';
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
        });
        for await (const line of rl) {
            stdinput += line + '\n';
        }
        const parsedContent = NovaSheets.parse(stdinput).trim();
        console.log(parsedContent);
    }
    // Read from given argument if present
    if (opts[0]) {
        const parsedContent = NovaSheets.parse(opts[0]).trim();
        console.log(parsedContent);
    }
    else {
        readFromStdin();
    }
}
else if (/^-*c/.test(command)) {
    NovaSheets.compile(opts[0], opts[1]).catch(err => console.error(err));
}
else {
    console.log(' Welcome to NovaSheets, the simple but versatile CSS preprocessor.');
    console.log(' Type `novasheets --help` for a list of commands.');
}
