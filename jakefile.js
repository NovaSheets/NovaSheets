const fs = require('fs');
const jake = require('jake');
const { execSync: exec } = require('child_process');

jake.desc('Build for browser');
jake.task('build', function () {
    exec('node build/browser');
});

jake.desc('Build from TypeScript');
jake.task('compile', function () {
    exec('tsc');
});

jake.desc('Compiles example NovaSheets files into bin/ folder');
jake.task('test-compile', ['compile'], function () {
    fs.rmSync('bin', { recursive: true });
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
});

jake.desc('Run unit tests');
jake.task('test', ['test-compile'], function () {
});
