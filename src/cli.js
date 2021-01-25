#!usr/bin/env node
const NOVASHEETS_VERSION = "1.0.0-pre1";

const { parse, compile } = require('./novasheets.js');

function runCLI() {
    const arg = n => process.argv[n + 1] || '';
    const inArg = val => arg(1).startsWith('-') && arg(1).includes(val);

    if (inArg('-h')) {
        const logUsage = (args, desc) => console.log(`\n    novasheets ${args}\n        ${desc}`);
        logUsage('{-c, --compile} <input> [<output>]', 'Compile a NovaSheets file from an exact or globbed input.')
        logUsage('{-p, --parse} "<input>"', 'Parse raw NovaSheets input from the command line.')
        logUsage('{-h, --help}', 'Display this help message.')
        logUsage('{-v, --version}', 'Display the current version of NovaSheets. ')
    }
    else if (inArg('-v')) {
        console.log('<NovaSheets> Current version: ' + NOVASHEETS_VERSION);
    }
    else if (inArg('-p')) {
        console.log(parse(arg(2)));
    }
    else if (inArg('-c')) {
        compile(arg(2), arg(3));
    }
    else {
        console.log('Welcome to NovaSheets, the simple but versatile CSS preprocessor.');
        console.log('Type `novasheets --help` for a list of commands.');
    }
}

module.exports = runCLI;
