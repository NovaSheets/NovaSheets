const fs = require('fs');
const VERSION = require('../src/version');

let content = `// NovaSheets ${VERSION} //\n`;

let scripts = ['parse', 'functions', 'novasheets'];

for (let script of scripts) {
    let data = fs.readFileSync(`${__dirname}/../src/${script}.js`).toString();
    content += data.replace(/^.+\/\/@export(.+)\/\/@end.+$/s, '$1');
}

content += `
function compileNovaSheets() { /* Not for browser */ }
const parse_1 = {default: parse}
const compile_1 = {default: compileNovaSheets}

document.addEventListener('DOMContentLoaded', () => parseNovaSheets());
`;

content = content.replace('window.', '');

fs.writeFileSync(`${__dirname}/novasheets-${VERSION}.js`, content, (err) => {
    console.log(err || 'Success');
});
