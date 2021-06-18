#!/usr/bin/env node

const fs = require('fs');
const yargs = require('yargs-parser');
const NOVASHEETS_VERSION: string = require('../package.json').version;

import NovaSheets from "./index";

const indent = (n: number): string => ' '.repeat(n * 4);
const usage = (cmd: string, desc: string): void =>
    console.log('\n' + indent(2) + cmd.replace(/\n/g, '\n' + indent(2)) + '\n' + indent(3) + desc);

const argOpts = {
    alias: {
        help: ['h'],
        version: ['v'],
        parse: ['p'],
        compile: ['c'],
    },
    boolean: ['help', 'version', 'parse', 'compile'],
}
const args = yargs(process.argv.slice(2), argOpts);

if (args.help) {
    const descs: Record<string, [string, string]> = {
        compile: [
            `novasheets {--compile|-c} <input> [<output>]`,
            'Compile a NovaSheets file from an exact or globbed input.'
        ],
        parse: [
            `novasheets {--parse|-p} "<input>"\n(or)\n<...> | novasheets (--parse|-p)`,
            'Parse raw NovaSheets input from raw input.'
        ],
        help: [
            `novasheets {--help|-h} [<command>]`,
            'Display this help message.'
        ],
        version: [
            `novasheets {--version|-v}`,
            'Display the current version of NovaSheets.'
        ],
    };
    console.log(`\n${indent(1)}NovaSheets usage:`);
    let helpOpt: string = args._[0];
    let desc: [string, string] | '' = helpOpt && (descs[helpOpt] || descs[helpOpt[0]]);
    if (desc)
        usage(...desc);
    else
        for (const desc of Object.keys(descs))
            usage(...descs[desc]);
}
else if (args.version) {
    console.log(`<NovaSheets> Current version: ${NOVASHEETS_VERSION}`);
}
else if (args.parse) {
    let pipedStdin: string = '';
    try { pipedStdin = fs.readFileSync(process.stdin.fd, 'utf-8'); }
    catch { }
    let parsedContent: string = NovaSheets.parse(args._[0] || pipedStdin);
    console.log(parsedContent);
}
else if (args.compile) {
    NovaSheets.compile(args._[0], args._[1]);
}
else {
    console.log(' Welcome to NovaSheets, the simple but versatile CSS preprocessor.');
    console.log(' Type `novasheets --help` for a list of commands.');
}
