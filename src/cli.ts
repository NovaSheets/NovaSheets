#!/usr/bin/env node

const fs = require('fs');
const { parse, compile } = require('./novasheets');
const NOVASHEETS_VERSION: string = require('../package.json').version;

const arg = (n: number): string => process.argv[n + 1] || '';
const indent = (n: number): string => ' '.repeat(n * 4);
const usage = (cmd: string, desc: string): void =>
    console.log('\n' + indent(2) + cmd.replace(/\n/g, '\n' + indent(2)) + '\n' + indent(3) + desc);

if (/^-*h/.test(arg(1))) {
    console.log(`\n${indent(1)}NovaSheets usage:`);
    usage(`novasheets {--compile|-c} <input> [<output>]`, 'Compile a NovaSheets file from an exact or globbed input.');
    usage(`novasheets {--parse|-p} "<input>"\n(or)\n<cmd> | novasheets (--parse|-p)`, 'Parse raw NovaSheets input from raw input.');
    usage(`novasheets {--help|-h}`, 'Display this help message.');
    usage(`novasheets {--version|-v}`, 'Display the current version of NovaSheets. ');
}
else if (/^-*v/.test(arg(1))) {
    console.log(`<NovaSheets> Current version: ${NOVASHEETS_VERSION}`);
}
else if (/^-*p/.test(arg(1))) {
    let data: string = ''
    try { data = fs.readFileSync(process.stdin.fd, 'utf-8'); }
    catch { }
    console.log(parse(arg(2) || data));
}
else if (/^-*c/.test(arg(1))) {
    compile(arg(2), arg(3));
}
else {
    console.log(' Welcome to NovaSheets, the simple but versatile CSS preprocessor.');
    console.log(' Type `novasheets --help` for a list of commands.');
}
