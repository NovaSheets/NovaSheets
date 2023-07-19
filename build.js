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

function inlineFiles() {
    let fileName;
    const getContent = () => fs.readFileSync(fileName, { encoding: 'utf-8' });
    // Inline the content of data/regexes.yaml
    const regexData = fs.readFileSync('data/regexes.yaml', { encoding: 'utf-8' });
    fileName = 'dist/regex.js';
    fs.writeFileSync(fileName, getContent().replace(/(const yamlFile.+=).+/, `$1 \`${regexData.replace(/\\/g, '\\\\')}\`;`));
    // Remove Node-only packages
    fileName = 'dist/compile.js';
    fs.writeFileSync(fileName, getContent().replace(/(const glob.+=).+/, `$1 0;//GLOB UNUSED`));
}

function compile() {
    cleanDeps();
    inlineFiles();
    const browserify = 'npx browserify --detect-globals dist/browser.js';
    execSync(`${browserify} > out/novasheets.js`);
    execSync(`${browserify} | npx uglifyjs -cm > out/novasheets.min.js`);
}

try { execSync('mkdir out'); } catch (e) { }
execSync('npx tsc');
compile();
