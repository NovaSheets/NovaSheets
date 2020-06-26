// NovaSheets 0.4.7 //
String.prototype.hashCode = function (length) {
    let hash = 0;
    for (let i = 0; i < this.length; i++) hash = ((hash << 5) - hash) + this.charCodeAt(i);
    return Math.abs(hash).toString(16).substring(0, length || 8).padStart(length, '0');
};
String.prototype.trim = function (force) {
    return this.replace(/^\s*(.+?)\s*$/, '$1').replace(/\s+/g, force ? '' : ' ');
};
String.prototype.escapeRegex = function () {
    return this.replace(/[.*+?^/${}()|[\]\\]/g, '\\$&');
};

function nssError(str, args) {
    if (!args) return console.error("<NovaSheets> Parsing failed: " + str);
    if (str == 'func') return nssError(`Unknown argument "${args[1]}" in function "${args[0]}" ${args[2]}`.trim() + '.');
}

function parseNovaSheets() {

    // Generate list of NovaSheet files and get the contents of each stylesheet
    let external, inline;
    try { // For browsers that do not support attribute flags
        external = document.querySelectorAll('link[rel="novasheet" i], link[rel="novasheets" i]');
        inline = document.querySelectorAll('[type="novasheet" i], [type="novasheets" i]');
    } catch (err) {
        external = document.querySelectorAll('link[rel="novasheet"], link[rel="novasheets"]');
        inline = document.querySelectorAll('[type="novasheet"], [type="novasheets"]');
    }
    let fileNames = { full: [], rel: [] };
    let sources = [];
    for (let i of external) {
        fileNames.full.push(i.href);
        fileNames.rel.push(i.getAttribute('href'));
    }
    let stylesheetContents = [];
    for (let i in fileNames.full) {
        try {
            let req = new XMLHttpRequest();
            req.open("GET", fileNames.full[i], false);
            req.send();
            let response = req.responseText;
            stylesheetContents.push(response.toString());
            sources.push(fileNames.rel[i]);
        } catch (error) {
            nssError(`File "${fileNames.rel[i]}" cannot be accessed.`);
        }
    }
    for (let contents of inline) {
        stylesheetContents.push(contents.innerHTML);
        sources.push('inl' + 'ine');
    }

    // Loop through each sheet, parsing the NovaSheet styles
    window.randomHash = window.randomHash || Math.random().toString().hashCode(6);
    for (let s in stylesheetContents) {

        // Prepare stylesheet for parsing
        stylesheetContents[s] = stylesheetContents[s]
            .replace(/^(.*?)\/\/.*$/gm, '$1') // remove single-line comments
            .replace(/^@var.+?=.*$/gm, '$& @endvar') // single-line @var declarations
            .replace(/@(var|const|endvar)/g, '\n$&') // put each declarator on its own line for parsing
            .replace(/@const\s*[A-Z_]+\s*(true|false|[0-9]+)|@endvar/g, '$&\n') // put each const on its own line
        let lines = stylesheetContents[s].split('\n');
        let cssOutput = '';
        for (let i in lines) {
            lines[i] = lines[i].replace(/[\r\n]/g, ' ').trim(); // remove CRLF and trim
            cssOutput += ' ' + lines[i];
        }
        cssOutput = cssOutput.replace(/\s*@var[\s\S]*?((?=\s*@var)|@endvar)|@const\s*[A-Z_]+\s*(true|false|[0-9]+)/gm, ' '); // remove NSS declarations
        let customVars = [];
        let localVars = [];
        let MAX_RECURSION = 50, MAX_ARGUMENTS = 10, KEEP_NAN = false; // parser constants

        // Generate a list of lines that start variable declarations
        for (let i in lines) {
            if (lines[i].match(/^\s*@var\s/)) {
                let varDeclParts = lines[i].replace(/^\s*@var\s/, '').split('=');
                let linesAfter = lines.slice(i);
                let varEnding;
                for (let j in linesAfter) {
                    if (linesAfter[j].match(/^\s*@endvar\s*$|^\s*@var\s/) && j != 0) {
                        varEnding = j; break;
                    }
                }
                let varDeclaration = varDeclParts[0].trim();
                let varContent = (varDeclParts[1] || '') + linesAfter.slice(1, varEnding).join(' ');
                customVars.push({
                    line: Number(i),
                    ending: Number(varEnding),
                    content: varContent.trim(),
                    name: varDeclaration.split('|')[0].trim(),
                    params: varDeclaration.split('|').slice(1)
                });
            }
            else if (lines[i].match(/^\s*@const\s*MAX[_]RECURSION\s/)) {
                MAX_RECURSION = Number(lines[i].split('MAX' + '_' + 'RECURSION')[1]);
            }
            else if (lines[i].match(/^\s*@const\s*MAX[_]ARGUMENTS\s/)) {
                MAX_ARGUMENTS = Number(lines[i].split('MAX' + '_' + 'ARGUMENTS')[1]);
            }
            else if (lines[i].match(/^\s*@const\s*KEEP[_]NAN\s/)) {
                KEEP_NAN = !["0", "false"].includes(lines[i].split('KEEP' + '_' + 'NAN')[1].trim());
            }
        }

        // Begin variable parsing; phrases below come from using format '$(name|param=arg)'

        /// For each variable declaration, generate local variables from its parameters
        for (let i in customVars) {
            for (let j in customVars[i].params) {
                let param = customVars[i].params[j].trim();
                let newName = [j, customVars[i].name, window.randomHash, param].join('~'); //= 'j-name-hash-param'
                let splitText = `$[${param}]`;
                let joinText = `$(${newName})`;
                customVars[i].content = customVars[i].content.split(splitText).join(joinText);
                localVars.push(newName);
            }
        }

        /// Convert NovaSheets styles to CSS
        let loop = 0;
        while ((cssOutput.indexOf('$(') > -1 || loop < 2) && loop++ < MAX_RECURSION) {
            for (let i in customVars) {
                let varName = customVars[i].name.escapeRegex(); //= 'name'
                let varPartsRegex = a => '\\s*(?:\\|\\s*([^' + (a || '') + '|$()]+)\\s*)?'; //= '|param=arg'
                let allVarArgsRegex = varPartsRegex().repeat(MAX_ARGUMENTS); //= '|param1=arg1|...'
                let varContentRegex = `\\$\\(\\s*(${varName})\\s*${allVarArgsRegex}\\s*\\)`; //= '$(name|param1=arg1|...)'
                let anonVarRegex = `\\$\\(\\s*${varName}${varPartsRegex('=').repeat(MAX_ARGUMENTS)}\\s*\\)`;
                let anonVarOutput = '$(' + varName;
                for (let i = 1; i <= MAX_ARGUMENTS; i++) anonVarOutput += '|' + i + '=$' + i;
                cssOutput = cssOutput.replace(RegExp(anonVarRegex), anonVarOutput + ')'); // change anonymous variables to explicit
                let varParts = cssOutput.match(RegExp(varContentRegex)); // generate list of params and args
                if (!varParts) continue;
                let replaceRegex = '\\$\\(\\s*' + varName + '[^$()]*?\\)'; //= '$(name...)'
                cssOutput = cssOutput.replace(RegExp(replaceRegex), customVars[i].content); // substitute '$(name...)'

                // Parse local variables
                for (let j = 0; j < varParts.length; j++) {
                    if (j < 2 || !varParts[j]) continue;
                    let [param, arg] = varParts[j].split('=');
                    for (let localVar of localVars) {
                        let localVarFormatted = '\\$\\(\\s*' + localVar.escapeRegex() + '\\)'; //= '$(i-name-hash-param)'
                        let varParam = localVar.split('~').splice(3).join('~'); // 'i-name-hash-param' -> 'param'
                        if (varParam !== param.trim()) continue; // skip if the current param does not match the substituting var's param
                        cssOutput = cssOutput.replace(RegExp(localVarFormatted, 'g'), arg.trim()); // subst 'param' with its 'arg'
                    }
                }

            }

            // Parse built-in functions
            const nssFunction = (name, params, count) => {
                if (!Array.isArray(params)) params = Array(count || MAX_ARGUMENTS).fill(params || '[^|)]*?');
                return RegExp(`\\$\\(\\s*${name}\\s*(?:\\|\\s*(${params.join('))?\\s*(?:\\|\\s*(')}))?\\s*\\)`, 'g');
            };

            /// Raw math operators
            const number = '[0-9]*[.]?[0-9]+';
            const basedNumber = '0x[0-9a-f]*\.?[0-9a-f]+|0b[01]*\.?[01]+|0o[0-7]*\.?[0-7]+|' + number;
            const bracketedNumberRegex = `\\(${basedNumber}\\)|${basedNumber}`;
            const numberUnitRegex = `([+-]?${bracketedNumberRegex})(?:\\s*(cm|mm|m|ft|in|em|rem|en|ex|px|pt|pc))?`;
            const toNumber = val => KEEP_NAN ? Number(val) : (isNaN(Number(val)) ? '' : Number(val));
            const mathRegex = op => `(${bracketedNumberRegex})\\s*${op.escapeRegex()}\\s*(${bracketedNumberRegex})`;
            const mathRegexBracketed = op => '\\(\\s*' + mathRegex(op) + '\\s*\\)';
            const unitMathRegex = op => `${numberUnitRegex}\\s*${op.escapeRegex()}\\s*${numberUnitRegex}`;
            const parseMath = (ops, b) => {
                for (let op of ops) {
                    if (!Array.isArray(op)) op = [op, op];
                    cssOutput = cssOutput
                        .replace(RegExp(basedNumber, 'g'), a => toNumber(a)) // convert base 2,8,16 to 10
                        .replace(RegExp(`(?<!(?:#|0x)[0-9a-f.]*)(${number})[Ee]([+-]?${number})`), (_, n1, n2) => { // convert scientific notation
                            let val = toNumber(n1) * Math.pow(10, toNumber(n2));
                            return val.toFixed(20).replace(/\.?0+$/, '');
                        })
                        .replace(/(?:\+\s*|-\s*-\s*)+([.0-9]+)/, '+$1') // convert double negatives
                        .replace(/(?:\+\s*-|-\s*\+)+(?:\+\s*)*\s*([.0-9]+)/, '-$1') // convert values which evaluate to negative
                        .replace(RegExp(unitMathRegex(op[0])), (_, n1, u1, n2, u2) => {
                            n1 = toNumber(n1), n2 = toNumber(n2);
                            let output = (n1, n2) => eval(n1 + op[0] + n2);
                            if (!u1 && !u2) return _; // skip if no units are present
                            switch (u1 + ',' + u2) {
                                case 'm,cm': return output(n1 * 100, n2) + u2;
                                case 'cm,m': return output(n1 / 100, n2) + u2;
                                case 'm,mm': return output(n1 * 1000, n2) + u2;
                                case 'mm,m': return output(n1 / 1000, n2) + u2;
                                case 'cm,mm': return output(n1 * 10, n2) + u2;
                                case 'mm,cm': return output(n1 / 10, n2) + u2;
                                case 'm,in': return output(n1 * 39.3701, n2) + u2;
                                case 'in,m': return output(n1 / 39.3701, n2) + u2;
                                case 'cm,in': return output(n1 * 0.393701, n2) + u2;
                                case 'in,cm': return output(n1 / 0.393701, n2) + u2;
                                case 'mm,in': return output(n1 * 0.0393701, n2) + u2;
                                case 'in,mm': return output(n1 / 0.393701, n2) + u2;
                                case 'm,ft': return output(n1 * 3.28084, n2) + u2;
                                case 'ft,m': return output(n1 / 3.28084, n2) + u2;
                                case 'cm,ft': return output(n1 * 0.0328084, n2) + u2;
                                case 'ft,cm': return output(n1 / 0.0328084, n2) + u2;
                                case 'mm,ft': return output(n1 * 0.00328084, n2) + u2;
                                case 'ft,mm': return output(n1 / 0.00328084, n2) + u2;
                                default: return output(n1, n2) + (u2 || u1);
                            }
                        }) // parse units
                    let regex = b ? mathRegexBracketed(op[0]) : mathRegex(op[0]);
                    let nums = cssOutput.match(RegExp(regex));
                    if (!nums) continue;
                    let result = eval(`toNumber(${nums[1]}) ${op[1]} toNumber(${nums[2]})`);
                    cssOutput = cssOutput.replace(RegExp(regex), result);
                }
            }
            for (let i = 0; i < MAX_RECURSION / 10; i++) {
                const operators = ['**', ['^', '**'], '/', '*', '+', '-', ['--', '- -']];
                parseMath(operators, true); // bracketed operators
                parseMath(operators, false); // unbracketed operators
            }

            /// Math functions
            cssOutput = cssOutput
                .replace(/\$\(@pi\)/g, Math.PI)
                .replace(/\$\(@e\)/g, Math.E)
                .replace(nssFunction('@mod', number, 2), (_, a, b) => a % b)
                .replace(nssFunction('@sin', number, 1), (_, a) => Math.sin(a))
                .replace(nssFunction('@asin', number, 1), (_, a) => Math.asin(a))
                .replace(nssFunction('@cos', number, 1), (_, a) => Math.cos(a))
                .replace(nssFunction('@acos', number, 1), (_, a) => Math.acos(a))
                .replace(nssFunction('@tan', number, 1), (_, a) => Math.tan(a))
                .replace(nssFunction('@atan', number, 1), (_, a) => Math.atan(a))
                .replace(nssFunction('@abs', number, 1), (_, a) => Math.abs(a))
                .replace(nssFunction('@floor', number, 1), (_, a) => Math.floor(a))
                .replace(nssFunction('@ceil', number, 1), (_, a) => Math.ceil(a))
                .replace(nssFunction('@percent', number, 1), (_, a) => toNumber(a) * 100 + '%')
                .replace(nssFunction('@log', number, 2), (_, base, num) => Math.log(num) / (base ? Math.log(base) : 1))
                .replace(nssFunction('@root', number, 2), (_, a, b) => Math.pow(b, 1 / a))
                .replace(nssFunction('@round', number, 2), (_, a, b) => {
                    return Math.round((toNumber(a) + Number.EPSILON) * Math.pow(10, b || 0)) / Math.pow(10, b || 0);
                })
                .replace(nssFunction('@min', number), (_, ...a) => {
                    let nums = [];
                    for (let item of a) if (item && !item.toString().includes(_)) nums.push(item);
                    return Math.min(...nums);
                })
                .replace(nssFunction('@max', number), (_, ...a) => {
                    let nums = [];
                    for (let item of a) if (item && !item.toString().includes(_)) nums.push(item);
                    return Math.max(...nums);
                })
                .replace(nssFunction('@clamp', number, 3), (_, a, b, c) => {
                    if (c < b) [b, c] = [c.trim(), b.trim()];
                    return a <= b ? b : (a >= c ? c : a);
                })
                .replace(nssFunction('@degrees', '(' + number + ')\\s*(deg|rad|grad)?', 1), (_, a, num, type) => {
                    if (type === 'grad') return num * 10 / 9;
                    return num / Math.PI * 180; // default to radians
                })
                .replace(nssFunction('@radians', '(' + number + ')\\s*(deg|rad|grad)?', 1), (_, a, num, type) => {
                    if (type === 'grad') return num * Math.PI / 200;
                    return num * Math.PI / 180; // default to degrees
                })
                .replace(nssFunction('@gradians', '(' + number + ')\\s*(deg|rad|grad)?', 1), (_, a, num, type) => {
                    if (type === 'rad') return num / Math.PI * 200;
                    return num * 0.9; // default to degrees
                })

            /// Text functions
            cssOutput = cssOutput
                .replace(nssFunction('@encode'), (_, a) => encodeURIComponent(a))
                .replace(nssFunction('@length'), (_, a) => a.trim().length)
                .replace(nssFunction('@replace'), (_, a, b, c) => {
                    let isRegex = b.startsWith('/');
                    if (isRegex) {
                        let regex = b.replace(/\/(.+?)\/[gimusy]*/, '$1').trim();
                        let flags = b.replace(/\/.+?\/([gimusy]*)/, '$1').trim(' ') || 's';
                        b = RegExp(regex, flags);
                    }
                    return a.trim().replace(RegExp((b || ' ').escapeRegex(), 'g'), c.trim());
                })

            // Colour functions
            const colorArgRegex = `(?:rgba?|hsla?)\\(\\s*\\d{1,3}\\s*,${(`\\s*,\\s*${number}%?\\s*`).repeat(3)}(?:\\s*,\\s*${number})?\\s*\\)|#[0-9a-f]{3,8}`;
            cssOutput = cssOutput
                .replace(nssFunction('@color', ['\\w+', number, number + '%?', number + '%?', number + '%?'], 4), (_, type, a, b, c, d) => {
                    if (type === 'hash' || type.startsWith('hex') || type === '#') {
                        if (!a) return '#000';
                        if (a.startsWith('rgb')) [a, b, c, d] = a.replace(/rgba?\(|\)/g, '').split(',')
                        const val = num => (toNumber(num) || 0).toString(16).padStart(2, '0');
                        return '#' + val(a) + val(b) + val(c) + (val(d) < 1 ? '' : val(d));
                    }
                    else if (['rgb', 'rgba'].includes(type)) {
                        if (b.includes('%')) b = toNumber(b.replace(/%/, '')) / 100 * 256 - 1;
                        if (c.includes('%')) c = toNumber(c.replace(/%/, '')) / 100 * 256 - 1;
                        return `${type}(${toNumber(a)}, ${toNumber(b)}, ${toNumber(c)}${d && type === 'rgba' ? ',' + toNumber(d.replace(/%/g, '')) : ''}${d.includes('%') ? '%' : ''})`;
                    }
                    else if (['hsl', 'hsla'].includes(type)) {
                        return `${type}(${toNumber(a)}, ${toNumber(b.replace(/%/, ''))}%, ${toNumber(c.replace(/%/, ''))}%${d && type === 'hsla' ? ', ' + toNumber(d.replace(/%/g, '')) : ''}${d.includes('%') ? '%' : ''})`;
                    }
                })
                .replace(nssFunction('@color', ['\\w+', colorArgRegex]), (_, type, a) => {
                    if (a.startsWith('#')) {
                        let parts;
                        if (a.length - 1 === 3) parts = [a[1].repeat(2), a[2].repeat(2), a[3].repeat(2)];
                        else if (a.length - 1 === 4) parts = [a[1].repeat(2), a[2].repeat(2), a[3].repeat(2), a[4].repeat(2)];
                        else if ([5, 6].includes(a.length - 1)) parts = [a[1] + a[2], a[3] + a[4], a[5] + (a[6] || '0')];
                        else if ([7, 8].includes(a.length - 1)) parts = [a[1] + a[2], a[3] + a[4], a[5] + a[6], a[7] + (a[8] || '0')];
                        a = parseInt(parts[0], 16);
                        b = parseInt(parts[1], 16).toString() || 0;
                        c = parseInt(parts[2], 16).toString() || 0;
                        d = parseInt(parts[3], 16) || 0;
                    } else {
                        parts = a.replace(/^\s*...a?\s*/, '').replace(/[()]/g, '').split(','); // replace 'rgba' etc & '('/')'
                        [a, b, c, d] = parts;
                    }
                    return `${type}(${a}, ${b}, ${c}${d ? ', ' + d : ''})`;
                })
                .replace(nssFunction('@colorpart', ['\\w+', colorArgRegex]), (_, part, color) => {
                    part = part.trim().toLowerCase(), color = color.trim().toLowerCase();
                    let parts = [];
                    const toHex = (str, a) => (toNumber("0x" + str.substr(a, 2))).toString()

                    if (color.startsWith('#')) {
                        let hex = color.replace('#', '');
                        if (hex.length === 3) hex = hex[0].repeat(2) + hex[1].repeat(2) + hex[2].repeat(2) + '00';
                        if (hex.length === 4) hex = hex[0].repeat(2) + hex[1].repeat(2) + hex[2].repeat(2) + hex[3].repeat(2);
                        if (hex.length === 6) hex += '00';
                        parts = [toHex(hex, 0), toHex(hex, 2), toHex(hex, 4), toHex(hex, 6)];
                    }
                    else parts = color.replace(/^\s*...a?\s*/, '').replace(/[()]/g, '').split(','); // replace 'rgba' etc & '('/')'

                    if (color.startsWith('#') || color.startsWith('rgb')) {
                        if (part.startsWith('r')) return parts[0];
                        else if (part.startsWith('g')) return parts[1];
                        else if (part.startsWith('b')) return parts[2];
                        else if (part.startsWith('a')) return parts[3];
                        else {
                            nssError('func', ['colorpart', part, 'of color type rgb/rgba/#']);
                            return color;
                        }
                    }
                    else if (color.startsWith('hsl')) {
                        if (part.startsWith('h')) return parts[0];
                        else if (part.startsWith('s')) return parts[1];
                        else if (part.startsWith('l')) return parts[2];
                        else if (part.startsWith('a')) return parts[3];
                        else {
                            nssError('func', ['colorpart', part, 'of color type hsl/hsla']);
                            return color;
                        }
                    } else {
                        nssError('func', ['colorpart', part, 'of unknown color type']);
                        return color;
                    }
                })

            /// Logical functions
            const parseLogic = arg => {
                for (let i = 0; i < MAX_ARGUMENTS / 10; i++) {
                    arg = arg.trim()
                        .replace(/(?:'(.+?)'|"(.+?)")+/, '$1$2') // remove quotes
                        .replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
                        .replace(/\bor\b/gi, '||').replace(/\band\b/gi, '&&').replace(/\bnot\b/gi, '!') // default logical operators
                        .replace(/(.+?)\bnor\b(.+)?/gi, '!($1) && !($2)') // 'nor' logical operator
                        .replace(/(.+?)\bnand\b(.+)?/gi, '!($1) || !($2)') // 'nand' logical operator
                        .replace(/(.+?)\bxor\b(.+)?/gi, '($1 && !($2)) || (!($1) && $2)') // 'xor' logical operator
                        .replace(/(.+?)\bxnor\b(.+)?/gi, '$1 == $2') // 'xnor' logical operator
                        .replace(/(?!=)(!?)=(==)?(?!=)/g, '$1$2==') // normalise equality signs
                }
                if (arg.match(/(<|<=|>|>=|==|!=|&|\||!)/)) arg = eval(arg);
                if (['false', 'undefined', 'null', 'NaN', ''].includes(arg)) arg = false;
                return arg;
            };
            const logicRegex = arg => RegExp(`([+-]?${bracketedNumberRegex})\\s*(?:${arg})\\s*([+-]?${bracketedNumberRegex})`);
            cssOutput = cssOutput
                .replace(nssFunction('@bitwise'), (_, a) => {
                    a = a.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
                    for (let i = 0; i < MAX_ARGUMENTS / 10; i++) {
                        a = a
                            .replace(RegExp(`(?:~|!|not)\\s*([+-]?${bracketedNumberRegex})`), (_, a) => eval('~' + toNumber(a))) // bitwise not
                            .replace(logicRegex('or|\\|'), (_, a, b) => eval(`(${toNumber(a)}) | (${toNumber(b)})`)) // bitwise or
                            .replace(logicRegex('nor'), (_, a, b) => eval(`~ (${toNumber(a)}) | (${toNumber(b)})`)) // bitwise nor
                            .replace(logicRegex('and|&'), (_, a, b) => eval(`(${toNumber(a)}) & (${toNumber(b)})`)) // bitwise and
                            .replace(logicRegex('nand'), (_, a, b) => eval(`~ (${toNumber(a)}) & (${toNumber(b)})`)) // bitwise nand
                            .replace(logicRegex('xor'), (_, a, b) => eval(`(${toNumber(a)}) ^ (${toNumber(b)})`)) // bitwise xor
                            .replace(logicRegex('xnor'), (_, a, b) => eval(`~ (${toNumber(a)}) ^ (${toNumber(b)})`)) // bitwise xnor
                    }
                    return a;
                })
                .replace(nssFunction('@boolean'), (_, a) => parseLogic(a))
                .replace(nssFunction('@if'), (_, a, b, c) => parseLogic(a) ? b : c || '')
        }

        // Finalise output
        cssOutput = cssOutput
            .replace(/\$\(.+?\)/g, '').replace(/@endvar/g, '') // remove unparsed variables
            .replace(/(\s*;)+/g, ';').replace(/\s+/g, ' ').replace(/} *(?!$)/g, '}\n') // remove redundant chars
            .replace(/\.?0{8,}\d/, '').replace(/(\d)(9{8,})\d?\b/g, (_, a) => toNumber(a) + 1); // fix floating point errors

        // Load converted styles to page
        if (document.querySelectorAll(`[data-hash="${cssOutput.hashCode()}"]`).length) break; // prevent duplicate output stylesheets
        let styleElem = document.createElement('style');
        styleElem.innerHTML = '\n' + cssOutput + '\n';
        styleElem.dataset.hash = cssOutput.hashCode();
        styleElem.dataset.source = sources[s];
        (document.head || document.body).appendChild(styleElem);

    }
}

// Parse NovaSheets styles on page load
document.addEventListener("DOMContentLoaded", parseNovaSheets());