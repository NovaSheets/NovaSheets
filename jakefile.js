const fs = require('fs')
const jake = require('jake')
const { execSync: exec } = require('child_process')

jake.desc('Compiles example NovaSheets files into bin/ folder')
jake.task('compile', function() {
    fs.rmdirSync('bin', { recursive: true })
    exec(`node src/cli test/example1.nvss bin/`)
    exec(`node src/cli -c test/example1.nvss bin/w-explicit-arg.css`)
    exec(`node src/cli test/example2.nvss bin/no-extension`)
    exec(`node src/cli test/example2.nvss bin/output-w-ext.css`)
    exec(`node src/cli test/*.nvss bin/`)
})

jake.desc('Run unit tests')
jake.task('test', ['compile'], function() {
    exec('qunit')
})
