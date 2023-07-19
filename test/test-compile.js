const fs = require('fs');
const { compile } = require('../dist/index');

let counter = 0;
const OUT_FOLDER = 'test/out';

async function compileTest(input, output) {
    counter++;
    output = `${OUT_FOLDER}/${output}`;
    await compile(input, output)
        .catch((err) => console.error(err))
        .then(() => console.log(`${counter}. Done compiling '${input}' to '${output}'.`));
}

async function runTests() {
    const rmSync = fs.rmSync || fs.rmdirSync;
    try { rmSync(`${OUT_FOLDER}/`, { recursive: true, force: true }); }
    catch { }
    fs.mkdirSync(`${OUT_FOLDER}/glob/`, { recursive: true });
    // Per-file compilation
    await compileTest('this test should fail', '');
    await compileTest('test/example.nvss', 'no-extension');
    await compileTest('test/example.nvss', 'output-w-ext.css');
    // Globbed compilation
    for (let i = 0; i < 3; i++) {
        fs.copyFileSync('test/example.nvss', `${OUT_FOLDER}/example${i}.nvss`);
    }
    await compileTest(`${OUT_FOLDER}/*.nvss`, 'glob/');
}
runTests();
