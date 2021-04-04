const fs = require('fs');
const VERSION = require('../src/cli.js')

let content = `// NovaSheets ${VERSION} //\n`;

const scripts = ['parse', 'functions', 'novasheets', 'browser'];

for (let script of scripts) {
    let data = fs.readFileSync(`${__dirname}/../src/${script}.js`).toString();
    content += data.replace(/^.+\/\/\s*@export(.+)\/\/\s*@end.+$/s, '$1');
}

content += `
function compileNovaSheets() { /* Not for browser */ }
const parse_1 = {default: parse}
const compile_1 = {default: compileNovaSheets}
const functions_1 = {default: addBuiltInFunctions}
const novasheets_1 = {default: NovaSheets}

document.addEventListener('DOMContentLoaded', () => parseNovaSheets());
`;

content = content.replace('window.', '');

fs.writeFileSync(`${__dirname}/novasheets-${VERSION}.js`, content, (err) => {
    console.log(err || 'Success');
});
