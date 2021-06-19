const fs = require('fs');
const { execSync: exec } = require('child_process');
const { compile } = require('../src/index');

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
}

test_compile();
