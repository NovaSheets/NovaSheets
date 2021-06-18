const fs = require('fs');
const { execSync: exec } = require('child_process');

let success = 0, failure = 0, total = 0;

function compile(infile, out) {
    console.log(`Compiling ${infile} to ${out}`)
    try {
        exec(`node src/cli -c ${infile} ${out}`);
        success++;
    }
    catch { failure++; }
    total++;
}

function test_compile() {
    exec('tsc');
    fs.rmdirSync('bin', { recursive: true });
    fs.mkdirSync('bin/glob/', { recursive: true });
    fs.mkdirSync('test/bin/', { recursive: true });
    // Per-file compilation
    compile('test/example.nvss', 'bin/');
    compile('test/example.nvss', 'bin/no-extension');
    compile('test/example.nvss', 'bin/output-w-ext.css');
    // Globbed compilation
    for (let i = 0; i < 3; i++) {
        fs.copyFileSync('test/example.nvss', `test/bin/example${i}.nvss`);
    }
    compile('test/bin/*.nvss', 'bin/glob/');
    console.log(`\nCompiled ${total} file globs | ${success} passed | ${failure} failed`);
}

test_compile();
