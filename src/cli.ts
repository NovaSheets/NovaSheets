#!/usr/bin/env node

import fs from 'fs';
import NovaSheets from './index';
import { version as NOVASHEETS_VERSION } from '../package.json';

const [command, ...opts] = process.argv.slice(2);

if (/^-*h/.test(command)) {
    const help = `
    NovaSheets usage:
        novasheets <command>

    Commands:
        {--compile|-c} <input> [<output>]     Compile a NovaSheets file from an exact or globbed input.
        {--parse|-p} "<input>"                Parse raw NovaSheets input from raw input. Accepts input from stdin.
        {--help|-h} [<command>]               Display this help message.
        {--versions|-v}                       Display the current version of NovaSheets.
    `;

    if (opts[0]) {
        const usage = help.split('\n').find(line => RegExp('-' + opts[0].replace(/-*/, '')).test(line));
        console.log(usage ? `Usage for NovaSheets command '${opts[0]}':\n${usage.replace(/ {4}/, '')}` : `Invalid command '${opts[0]}'.`)
    }
    else {
        console.log(help);
    }
}
else if (/^-*v/.test(command)) {
    console.log(`<NovaSheets> Current version: ${NOVASHEETS_VERSION}`);
}
else if (/^-*p/.test(command)) {
    let pipedStdin: string = '';
    try { pipedStdin = fs.readFileSync(process.stdin.fd, 'utf-8'); }
    catch { }
    let parsedContent: string = NovaSheets.parse(opts[0] || pipedStdin);
    console.log(parsedContent);
}
else if (/^-*c/.test(command)) {
    NovaSheets.compile(opts[0], opts[1]);
}
else {
    console.log(' Welcome to NovaSheets, the simple but versatile CSS preprocessor.');
    console.log(' Type `novasheets --help` for a list of commands.');
}
