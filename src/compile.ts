const path = require('path');
const fs = require('fs');
const glob = require('glob');

import NovaSheets from './novasheets';
import parse from './parse';

function compileNovaSheets(inputStr: string, outputStr: string, novasheets: NovaSheets): void {
    outputStr = outputStr.replace(/[/\\]/g, path.sep);
    const compile = (inputFiles: string[]): void => {
        for (let input of inputFiles) {
            fs.readFile(input, 'utf8', (err: Error, contents: string) => {
                if (err) throw `FS_ReadError: Input file '${input}' not found.\n` + err.message;

                let output = outputStr;

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

                fs.writeFile(output, parse(contents, novasheets), (err: Error) => {
                    if (err) throw `FS_WriteError: Cannot write to file '${output}'.\n` + err.message;
                    console['log'](`<NovaSheets> Wrote file '${input}' to '${output}'`);
                });
            });
        }
    };

    const hasGlobs: boolean = glob.hasMagic(inputStr);
    if (hasGlobs) {
        glob(inputStr, {}, (err: Error, files: string[]) => {
            if (err) throw err;
            compile(files);
        });
    } else {
        compile([inputStr]);
    }
}

export = compileNovaSheets;
