const path = require('path');
const fs = require('fs');
const isNode = typeof process !== "undefined" && process?.versions?.node;
const glob = isNode && require('glob');

import NovaSheets from './index';
import parse from './parse';

async function compileNovaSheets(source: string, outPath: string, novasheets: NovaSheets): Promise<void> {
    outPath = outPath.replace(/[/\\]/g, path.sep);
    const compile = async (inputFiles: string[]): Promise<void> => {
        for (let input of inputFiles) {
            await fs.readFile(input, 'utf8', async (err: Error, contents: string) => {
                if (err) throw `FS_ReadError: Input file '${input}' not found.\n` + err.message;

                let output = outPath;

                const folder: string = output.includes(path.sep) ? output.replace(/[/\\][^/\\]+$/, '') : '';
                if (folder) {
                    fs.mkdir(folder, { recursive: true }, (err: Error) => {
                        if (err) throw `FS_MkDirError: Could not create directory '${folder}'.\n` + err.message;
                    });
                }

                const filename: string = input.replace(/.+[/\\]([^/\\]+)$/, '$1'); // 'foo/bar.ext' -> 'bar.ext'

                if (!output) {
                    if (hasGlobs) output = input.replace(/[/\\][^/\\]+$/, path.sep); // 'foo.ext' -> 'foo/'
                    else output = input.replace(/\.\w+$/, '.css'); // 'foo.ext' -> 'foo.css'
                }

                if (output.endsWith(path.sep)) output += filename; // 'foo.nvss bar/' -> 'bar/foo.nvss'
                else if (hasGlobs) output += path.sep + filename; // '*.nvss bar' -> 'bar/$file.nvss'
                else if (!output.match(/\.\w+$/)) output += '.css'; // 'foo.nvss bar' -> 'bar.css'
                output = output.replace(/\.\w+$/, '.css'); // force .css extension

                await fs.writeFile(output, parse(contents, novasheets), (err: Error) => {
                    if (err) throw `FS_WriteError: Cannot write to file '${output}'.\n` + err.message;
                    console['log'](`<NovaSheets> Wrote file '${input}' to '${output}'`);
                });
            });
        }
    };

    const hasGlobs: boolean = glob?.hasMagic(source);
    if (hasGlobs) {
        glob?.(source, {}, async (err: Error, files: string[]) => {
            if (err) throw err;
            await compile(files);
        });
    } else {
        await compile([source]);
    }
}

export = compileNovaSheets;
