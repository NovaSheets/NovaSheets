const fs = require('fs');
const { execSync: exec } = require('child_process');
const { compile } = require('../src/index');

let counter = 1;
const OUT_FOLDER = 'test/out/';

async function compileTest(input, output) {
    output = OUT_FOLDER + output;
    await compile(input, output).catch(err => console.error(err));
    console.log(`${counter++} Compiled ${input} to ${output}.`);
}

(async () => {
    exec('tsc');
    const rmSync = fs.rmSync || fs.rmdirSync;
    try { rmSync(OUT_FOLDER, { recursive: true, force: true }); }
    catch { }
    fs.mkdirSync(`${OUT_FOLDER}glob/`, { recursive: true });
    // Per-file compilation
    await compileTest('this test should fail', '');
    await compileTest('test/example.nvss', 'no-extension');
    await compileTest('test/example.nvss', 'output-w-ext.css');
    // Globbed compilation
    for (let i = 0; i < 3; i++) {
        fs.copyFileSync('test/example.nvss', `${OUT_FOLDER}example${i}.nvss`);
    }
    await compileTest('test/out/*.nvss', 'glob/');
})()
