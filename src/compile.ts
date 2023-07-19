import { promises as fs } from 'fs';
import path from 'path';
const isNode = typeof process !== 'undefined' && process?.versions?.node;

import NovaSheets from './index';
import parse from './parse';

async function compileNovaSheets(source: string, outPath: string, novasheets: NovaSheets): Promise<void> {

    let hasGlobs = false;
    let glob: any = null;
    if (isNode) await import('glob').then(async (Glob) => {
        glob = Glob.glob;
        hasGlobs = glob.hasMagic(source);
    });

    const compile = async (inputFiles: string[]): Promise<void> => {
        for (const inputPath of inputFiles) {
            const input = /\.\w+/.test(inputPath) ? inputPath : inputPath + '.nvss';

            const contents = await fs.readFile(input, { encoding: 'utf8' }).catch(err => {
                throw `ReadError: Input file '${input}' not found.\n` + err.message;
            });

            let output = outPath.replace(/[/\\]/g, path.sep);

            const folder: string = output.includes(path.sep) ? output.replace(/[/\\][^/\\]+$/, '') : '';
            if (folder) {
                await fs.mkdir(folder, { recursive: true }).catch(err => {
                    if (err) throw `MkDirError: Could not create directory '${folder}'.\n` + err.message;
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

            await fs.writeFile(output, parse(contents, novasheets)).catch(err => {
                if (err) throw `WriteError: Cannot write to file '${output}'.\n` + err.message;
                console.log(`<NovaSheets> Wrote file '${input}' to '${output}'`);
            });
        }
    }

    if (hasGlobs) {
        glob(source, {}, async (err: Error, files: string[]) => {
            if (err) throw err;
            await compile(files);
        });
    } else {
        await compile([source]);
    }
}

export default compileNovaSheets;
