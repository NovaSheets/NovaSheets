const fs = require('fs')
const jake = require('jake')
const { execSync: exec } = require('child_process')

jake.desc('Compiles example NovaSheets files into bin/ folder')
jake.task('compile', function() {
    fs.rmdirSync('bin', { recursive: true })
    exec(`node . test/example1.nvss bin/`)
    exec(`node . -c test/example1.nvss bin/w-explicit-arg.css`)
    exec(`node . test/example2.nvss bin/no-extension`)
    exec(`node . test/example2.nvss bin/output-w-ext.css`)
    exec(`node . test/*.nvss bin/`)
})

jake.desc('Minify source code')
jake.task('minify', function() {
    exec(`terser src/novasheets.js -c -m eval,toplevel,reserved=['parseNovaSheets'] -o src/novasheets.min.js`)
})

jake.desc('Run unit tests')
jake.task('test', ['compile'], function() {
    exec('qunit')
})
