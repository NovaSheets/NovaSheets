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
    fs.rmdirSync('bin', { recursive: true });
    fs.mkdirSync('bin/');
    fs.mkdirSync('bin/glob/');
    exec('node src/cli -c test/example.nvss bin/');
    exec('node src/cli -c test/example.nvss bin/no-extension');
    exec('node src/cli -c test/example.nvss bin/output-w-ext.css');
    exec('node src/cli -c test/*.nvss bin/glob/');
});

jake.desc('Run unit tests');
jake.task('test', ['test-compile'], function () {
});
