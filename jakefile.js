const fs = require('fs');
const jake = require('jake');
const { execSync: exec } = require('child_process');

jake.desc('Build for browser');
jake.task('build', function () {
    exec('node build/browser');
});

jake.desc('Build from TypeScript');
jake.task('build', function() {
    exec('tsc');
});

jake.desc('Compiles example NovaSheets files into bin/ folder');
jake.task('test-compile', ['build'], function () {
    fs.rmdirSync('bin', { recursive: true });
    exec('node . -c test/example1.nvss bin/');
    exec('node . -c test/example2.nvss bin/no-extension');
    exec('node . -c test/example2.nvss bin/output-w-ext.css');
    exec('node . -c test/*.nvss bin/');
});

jake.desc('Run unit tests');
jake.task('test', ['test-compile'], function () {
});
