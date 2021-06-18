const fs = require('fs');
const { execSync } = require('child_process');

function cleanDeps() {
    // Inline an import in `math-and-unit-parser` to remove bloat
    const moduleFolder = `node_modules/math-and-unit-parser/`;
    fs.rmSync(moduleFolder, { recursive: true });
    execSync('npm i math-and-unit-parser --save=false');
    const file = `${moduleFolder}build/constants/MathParser.js`;
    let content = fs.readFileSync(file, { encoding: 'utf8' });
    const changeCase = `{constantCase: val => (val || '').toUpperCase()}`;
    content = content.replace(`require("change-case");`, changeCase);
    fs.writeFileSync(file, content);
}

function compile() {
    cleanDeps();
    const browserify = 'npx browserify --detect-globals --exclude=glob src/browser.js';
    execSync(`${browserify} > dist/novasheets.js`);
    execSync(`${browserify} | npx uglifyjs -cm > dist/novasheets.min.js`);
}

execSync('npx tsc');
compile();
