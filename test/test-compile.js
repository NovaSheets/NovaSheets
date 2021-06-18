const fs = require('fs');
const { execSync: exec } = require('child_process');

function test_compile() {
    exec('tsc');
    fs.rmdirSync('bin', { recursive: true });
    fs.mkdirSync('bin/glob/', { recursive: true });
    fs.mkdirSync('test/bin/', { recursive: true });
    // Per-file compilation
    exec('node src/cli -c test/example.nvss bin/');
    exec('node src/cli -c test/example.nvss bin/no-extension');
    exec('node src/cli -c test/example.nvss bin/output-w-ext.css');
    // Globbed compilation
    for (let i = 0; i < 3; i++) {
        fs.copyFileSync('test/example.nvss', `test/bin/example${i}.nvss`);
    }
    exec('node src/cli -c test/bin/*.nvss bin/glob/');
}

test_compile();
