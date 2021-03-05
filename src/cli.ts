#!/usr/bin/env node

const NOVASHEETS_VERSION: string = require('./version');

const { parse, compile } = require('./novasheets');

function runCLI(): void {
    const arg = (n: number): string => process.argv[n + 1] || '';
    const inArg = (val: string): boolean => arg(1).startsWith('-') && arg(1).includes(val);

    if (inArg('-h')) {
        const usage = function (args: string, desc: string): void {
            console.log(`\n    novasheets ${args}\n        ${desc}`);
        }
        usage('{-c, --compile} <input> [<output>]', 'Compile a NovaSheets file from an exact or globbed input.');
        usage('{-p, --parse} "<input>"', 'Parse raw NovaSheets input from the command line.');
        usage('{-h, --help}', 'Display this help message.');
        usage('{-v, --version}', 'Display the current version of NovaSheets. ');
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

export = runCLI;
