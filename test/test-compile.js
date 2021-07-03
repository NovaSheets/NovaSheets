const fs = require('fs');
const { execSync: exec } = require('child_process');
const { compile } = require('../src/index');

let counter = 1;

async function compileTest(input, output) {
    await compile(input, output).catch(err => console.error(err));
    console.log(`${counter++} Compiled ${input} to ${output}.`);
}

(async () => {
    exec('tsc');
    try { fs.rmdirSync('./bin/', { recursive: true, force: true }); } catch { }
    fs.mkdirSync('./bin/glob/', { recursive: true });
    fs.mkdirSync('./test/bin/', { recursive: true });
    // Per-file compilation
    await compileTest('test/invalid.nvss', 'bin/');
    await compileTest('test/example.nvss', 'bin/no-extension');
    await compileTest('test/example.nvss', 'bin/output-w-ext.css');
    // Globbed compilation
    for (let i = 0; i < 3; i++) {
        fs.copyFileSync('test/example.nvss', `test/bin/example${i}.nvss`);
    }
    await compileTest('test/bin/*.nvss', 'bin/glob/');
})()
