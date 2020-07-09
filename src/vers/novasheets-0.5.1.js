// NovaSheets 0.5.1 //
const r = String.raw;

String.prototype.trim = function (force) {
    return this.replace(/^\s*(.+?)\s*$/, '$1').replace(/\s+/g, force ? '' : ' ');
};
String.prototype.escapeRegex = function () {
    return this.replace(/[.*+?^/${}()|[\]\\]/g, '\\$&');
};

function hashCode(str, length = 8) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    return Math.abs(hash).toString(16).substring(0, length).padStart(length, '0');
};

function nssLog(str, args) {
    if (str == 'func') return nssLog(`Unknown argument "${args[1]}" in function "${args[0]}" ${args[2]}`.trim() + '.');
    return console.warn("<NovaSheets>", str);
}

function parseNovaSheets(rawInput) {

    // Generate list of NovaSheet files and get the contents of each stylesheet
    let stylesheetContents = [], sources = [], externalSheets, inlineSheets;
    if (rawInput) {
        stylesheetContents = [rawInput];
        sources = 'raw';
    }
    else {
        try { // For browsers that do not support attribute flags
            externalSheets = document.querySelectorAll('link[rel="novasheet" i], link[rel="novasheets" i]');
            inlineSheets = document.querySelectorAll('[type="novasheet" i], [type="novasheets" i]');
        } catch (err) {
            externalSheets = document.querySelectorAll('link[rel="novasheet"], link[rel="novasheets"]');
            inlineSheets = document.querySelectorAll('[type="novasheet"], [type="novasheets"]');
        }
        let fileNames = { full: [], rel: [] };
        for (let i of externalSheets) {
            fileNames.full.push(i.href);
            fileNames.rel.push(i.getAttribute('href'));
        }
        for (let i in fileNames.full) {
            try {
                let req = new XMLHttpRequest();
                req.open("GET", fileNames.full[i], false);
                req.send();
                if (req.status==404) throw 404;
                let response = req.responseText;
                stylesheetContents.push(response.toString());
                sources.push(fileNames.rel[i]);
            } catch (error) { nssLog(`File "${fileNames.rel[i]}" cannot be accessed.`); }
        }
        for (let contents of inlineSheets) {
            stylesheetContents.push(contents.innerHTML);
            sources.push('inline');
        }
    }

    // Loop through each sheet, parsing the NovaSheet styles
    window.randomHash = window.randomHash || hashCode(Math.random().toString(), 6);
    for (let s in stylesheetContents) {

        // Prepare stylesheet for parsing
        stylesheetContents[s] = stylesheetContents[s]
            .replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
            .replace(/(?<![a-z]+:)\n?\/\/.*$/gm, '') // remove single-line comments
            .replace(/(?:@var.+?=.*$|@var\s*[^=]*(?=\n\s*@var\s.))(?!\n\s*@endvar)/gm, '$& @endvar') // single-line @var declarations
            .replace(/@(var|const|endvar)/g, '\n$&') // put each declarator on its own line for parsing
            .replace(/@const\s*[A-Z_]+\s*(true|false|[0-9]+)|@endvar/g, '$&\n') // put each const on its own line
        let lines = stylesheetContents[s].split('\n');
        window.cssOutput = '';
        let commentedContent = [], staticContent = [];
        for (let i in lines) {
            lines[i] = lines[i].replace(/[\r\n]/g, ' '); // remove whitespace
            cssOutput += '\n' + lines[i];
        }
        cssOutput = cssOutput
            .replace(/\s*(?:@var.*?((?=@var)|@endvar)|@const\s*[A-Z_]+\s*(true|false|[0-9]+))/gms, ' ') // remove NSS declarations
            .replace(/\/\*(.+?)\*\//gs, (_, a) => {
                if (_.startsWith('/*[') && _.endsWith(']*/')) return _.replace(/^\/\*\[(.+)\]\*\/$/, '/*$1*/');
                if (_.startsWith('/*/') || _.endsWith('/*/')) return _;
                if (commentedContent.indexOf(a) < 0) commentedContent.push(a);
                return '/*COMMENT#' + commentedContent.indexOf(a) + '*/';
            }) // store commented content for later use
            .replace(/\/\*\/(.+?)\/\*\//gs, (_, a) => {
                if (staticContent.indexOf(a) < 0) staticContent.push(a);
                return '/*STATIC#' + staticContent.indexOf(a) + '*/';
            }) // store static content for later use
        let customVars = [];
        let MAX_RECURSION = 50, MAX_MATH_RECURSION = 5, MAX_ARGUMENTS = 10, KEEP_NAN = false; // parser constants

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
                let varContent = (varDeclParts.slice(1).join('=') || '') + linesAfter.slice(1, varEnding).join(' ');
                customVars.push({
                    name: varDeclaration.split('|')[0].trim(),
                    content: varContent.trim()
                });
            }
            else if (lines[i].match(/^\s*@const\s*MAX_RECURSION\s/)) {
                MAX_RECURSION = parseInt(lines[i].split('MAX_RECURSION')[1]);
            }
            else if (lines[i].match(/^\s*@const\s*MAX_MATH_RECURSION\s/)) {
                MAX_MATH_RECURSION = parseInt(lines[i].split('MAX_MATH_RECURSION')[1]);
            }
            else if (lines[i].match(/^\s*@const\s*MAX_ARGUMENTS\s/)) {
                MAX_ARGUMENTS = parseInt(lines[i].split('MAX_ARGUMENTS')[1]);
            }
            else if (lines[i].match(/^\s*@const\s*KEEP_NAN\s/)) {
                KEEP_NAN = !["0", "false"].includes(lines[i].split('KEEP_NAN')[1].trim());
            }
        }

        // Raw math operators
        const number = r`-?[0-9]*\.?[0-9]+`;
        const basedNumber = r`-?(?:0x[0-9a-f]*\.?[0-9a-f]+|0b[01]*\.?[01]+|0o[0-7]*\.?[0-7]+|${number})`;
        const bracketedNumberRegex = r`\((?:${basedNumber})\)|${basedNumber}`;
        const numberUnitRegex = r`(${bracketedNumberRegex})(?:\s*(cm|mm|m|ft|in|em|rem|en|ex|px|pt|pc))`;
        const toNumber = val => KEEP_NAN ? Number(val) : (isNaN(Number(val)) ? '' : Number(val));
        const mathRegex = op => r`(${bracketedNumberRegex})\s*${op}\s*(${bracketedNumberRegex})`;
        const mathRegexBracketed = op => r`\(\s*${mathRegex(op)}\s*\)`;
        const unitMathRegex = op => r`${numberUnitRegex}?\s*${op}\s*${numberUnitRegex}?`;
        const parseMath = (ops, b) => {
            for (let op of ops) {
                if (!Array.isArray(op)) op = [op, op];
                if (op[0].startsWith('r')) op = [op[0].replace('r', '').escapeRegex(), op[1].replace('r', '')];
                for (let i = 0; i < MAX_MATH_RECURSION; i++) {
                    cssOutput = cssOutput
                        .replace(RegExp('(?<!#[0-9a-f.]*)' + basedNumber, 'g'), a => toNumber(a)) // convert base 2,8,16 to 10
                        .replace(RegExp(r`\b(${number})[Ee]([+-]?${number})\b`), (_, n1, n2) => { // convert scientific notation
                            let val = toNumber(n1) * Math.pow(10, toNumber(n2));
                            return val.toFixed(20).replace(/\.?0+$/, '');
                        })
                        .replace(/(?:\+\s*|-\s*-\s*)+([.0-9]+)/, '+$1') // convert double negatives
                        .replace(/(?:\+\s*-|-\s*\+)+(?:\+\s*)*\s*([.0-9]+)/, '-$1') // convert values which evaluate to negative
                        .replace(RegExp(unitMathRegex(op[0])), (_, n1, u1, n2, u2) => {
                            if (!u1 && !u2) return _;
                            n1 = toNumber(n1.replace(/[()]/g, '')), n2 = toNumber(n2.replace(/[()]/g, ''));
                            let output = (n1, n2) => eval(n1 + op[1] + n2);
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
                        .replace(RegExp(numberUnitRegex), a => a.replace(/[()]\s*/g, '')) // remove brackets from single unit values
                    let regex = b ? mathRegexBracketed(op[0]) : mathRegex(op[0]);
                    let nums = cssOutput.match(RegExp(regex));
                    if (!nums) continue;
                    let n1 = toNumber(nums[1].replace(/[()]/g, '')), n2 = Number(nums[2].replace(/[()]/g, ''));
                    let result = eval(n1 + op[1] + n2);
                    cssOutput = cssOutput.replace(RegExp(regex), result);
                }
            }
        }
        const operators = [ // r=raw
            'r**', ['r^', '**'], [r`(?<!(?:[a-z]+)\([^)]*)\/`, '/'], 'r*', 'r+', [r`(?<!@replace.*?)(?:-(?=\s)|(?<!\s)-(?!\s))`, '-'], ['--', '- -']
        ];
        const testNaN = (arg, def) => {
            let test = !arg || arg === Infinity || Number.isNaN(arg);
            if (test && KEEP_NAN) return 'NaN';
            if (test && !KEEP_NAN) return def || 0;
            else return arg;
        }
        const nssFunction = (name, func, data = {}) => {
            let mathCheckRegex = `${number}[a-z]*\s*[-+^*/e]+\s*${number}[a-z]*`;
            if (cssOutput.match(RegExp(mathCheckRegex))) {
                parseMath(operators, true); // bracketed operators
                parseMath(operators, false); // unbracketed operators
            }
            let matchRegex = RegExp(r`\$\(\s*${name}\b`);
            let match = cssOutput.match(matchRegex);
            if (!match) return;
            let index = match ? cssOutput.indexOf(match[0]) : -1;
            let searchString = cssOutput.substr(index);
            let segment = '', brackets = 0, hasBrackets;
            for (let i = 0; i < searchString.length; i++) { // search until the initial bracket is matched
                segment += searchString[i];
                if (brackets > 0) hasBrackets = true;
                if (searchString[i] === '(') brackets++;
                if (searchString[i] === ')') brackets--;
                if (hasBrackets && brackets === 0) break;
                if (i == searchString.length - 1 && brackets > 0) return; // prevent overflow
            }
            if (!segment.trim('force') /*|| (data.nonest && segment.match(/^.+\$\(/))*/) return;
            let splitter = data.notrim ? '|' : /\s*\|\s*/;
            let parts = segment.replace(/^\$\(\s*|\s*\)$/g, '').split(splitter); // [name, arg1, arg2, ...]
            for (let i = 0; i < MAX_ARGUMENTS; i++) if (!parts[i]) parts[i] = '';
            parts[0] = segment;
            parts = parts.slice(0, parts.indexOf(''));
            cssOutput = cssOutput.replace(segment, func(...parts));
            //if (cssOutput.match(matchRegex)) {
            //    if (loop === Math.floor(MAX_RECURSION / 1.5)) nssLog('Recursion detected; are you missing an `@endvar`?');
            //    if (loop++ < MAX_RECURSION) nssFunction(name, func, data); // recursive to replace all instances
            //}
        };

        // Convert NovaSheets styles to CSS
        let loop = 0, lastCssOutput;
        while ((cssOutput.indexOf('$(') > -1 || loop < 1) && loop++ < MAX_RECURSION) {
            if (lastCssOutput === cssOutput) break;
            lastCssOutput = cssOutput;

            // Parse variable contents
            for (let i in customVars) {
                nssFunction(customVars[i].name, (_, ...paramArgs) => {
                    let content = customVars[i].content;
                    for (let i in paramArgs) {
                        if (!paramArgs[i]) continue;
                        let parts = paramArgs[i].split('=');
                        let param = parts[1] ? parts[0].trim() : +i + 1;
                        let arg = parts[1] ? parts[1].trim() : parts[0].trim();
                        content = content.replace(RegExp(r`\$\[${param}[^\]]*\]`, 'g'), arg)
                    }
                    content = content.replace(/\$\[.*?(?:\|([^\]]*))?\]/g, '$1') // default args
                    return content;
                });
            }

            // Parse built-in variables

            /// Loop functions
            nssFunction('@each', (_, a, b, c, ...d) => { // TODO: fix
                let output = [], arr = a.trim().split(b.trim());
                for (let i in arr) {
                    let parsed = d.join('|')
                        .replace(/\$i/gi, Number(i) + 1)
                        .replace(/\$v\[([0-9]+)([-+*/][0-9]+)?\]/g, (_, a, b) => arr[eval(Number(a - 1) + (b || 0))])
                        .replace(/.?\s*undefined/g, '')
                        .replace(/\$v/gi, arr[i])
                    output.push(parsed);
                }
                return output.join(c);
            }, { notrim: true });
            nssFunction('@repeat', (_, a, ...b) => {
                let output = '';
                for (let i = 0; i < Number(a); i++) output += b.join('|').replace(/\$i/gi, Number(i) + 1);
                return output;
            }, { notrim: true });

            /// Math functions
            nssFunction('@e', _ => Math.E);
            nssFunction('@pi', _ => Math.PI);
            nssFunction('@mod', (_, a, ...b) => testNaN(a % b, _));
            nssFunction('@sin', (_, a) => testNaN(Math.sin(a), _));
            nssFunction('@asin', (_, a) => testNaN(Math.asin(a), _));
            nssFunction('@cos', (_, a) => testNaN(Math.cos(a), _));
            nssFunction('@acos', (_, a) => testNaN(Math.acos(a), _));
            nssFunction('@tan', (_, a) => testNaN(Math.tan(a), _));
            nssFunction('@atan', (_, a) => testNaN(Math.atan(a), _));
            nssFunction('@abs', (_, a) => testNaN(Math.abs(a), _));
            nssFunction('@floor', (_, a) => testNaN(Math.floor(a), _));
            nssFunction('@ceil', (_, a) => testNaN(Math.ceil(a), _));
            nssFunction('@percent', (_, a) => testNaN(toNumber(a) * 100 + '%', _));
            nssFunction('@log', (_, base, num) => testNaN(Math.log(num) / (base ? Math.log(base) : 1), _));
            nssFunction('@root', (_, a, b) => testNaN(Math.pow(b ? b : a, 1 / (b ? a : 2)), _));
            nssFunction('@round', (_, a, b) => {
                let num = toNumber(a) + Number.EPSILON;
                let dp = Math.pow(10, b || 0);
                return testNaN(Math.round(num * dp) / dp, _);
            });
            nssFunction('@(?:max|min)', (_, ...a) => {
                let nums = [];
                for (let item of a) if (item) nums.push(item);
                let output = (_.includes('@min')) ? Math.min(...nums) : Math.max(...nums);
                return testNaN(output, _);
            });
            nssFunction('@clamp', (_, a, b, c) => {
                let val = Number(a), min = Number(b), max = Number(c);
                if (max < min) [min, max] = [max, min];
                let output = val <= min ? min : (val >= max ? max : val);
                return testNaN(output, _);
            });
            nssFunction('@degrees', (_, a) => {
                let [num, type] = [a.replace(/[a-z]+/, ''), a.replace(RegExp(number), '')];
                if (type === 'grad') return num * 0.9;
                let output = num / Math.PI * 180; // default to radians
                return testNaN(output, _);
            });
            nssFunction('@radians', (_, a) => {
                let [num, type] = [a.replace(/[a-z]+/, ''), a.replace(RegExp(number), '')];
                if (type === 'grad') return num * Math.PI / 200;
                let output = num * Math.PI / 180; // default to degrees
                return testNaN(output, _);
            });
            nssFunction('@gradians', (_, a) => {
                let [num, type] = [a.replace(/[a-z]+/, ''), a.replace(RegExp(number), '')];
                if (type === 'rad') return num / Math.PI * 200;
                let output = num / 0.9; // default to degrees
                return testNaN(output, _);
            });

            /// Text functions
            nssFunction('@extract', (_, a, b, c) => a.split(b)[toNumber(c) - 1] || '');
            nssFunction('@encode', (_, a) => encodeURIComponent(a));
            nssFunction('@length', (_, a) => a.trim().length);
            nssFunction('@replace', (_, ...args) => {
                let text = args[0].trim();
                let finder = args.slice(1, -1).join('|').trim() || ' ';
                let replacer = args.slice(-1)[0].trim();
                let isRegex = finder.startsWith('/');
                console.log(args,'\n',text,finder,replacer,'\n',isRegex)
                if (isRegex) {
                    let parts = finder.trim().match(/\/(.+?)\/([gimusy]*)/).slice(1);
                    finder = RegExp(parts[0], parts[1] || 's');
                }
                return text.replace(isRegex ? finder : RegExp(finder.escapeRegex(), 'g'), replacer);
            }, { notrim: true });

            // Colour functions
            const toPercent = val => Math.floor(Number(val) / 255 * 100);
            const fromPercent = val => Math.ceil(Number(val.replace('%', '')) * 255 / 100);
            const toHex = val => Number(val).toString(16).padStart(2, '0');
            const rgbFromHex = (hex, alpha) => {
                let num = parseInt(hex.replace(/#?(.{0,6})(..)?$/, '$1'), 16);
                let r = (num >> 16) & 255;
                let g = (num >> 8) & 255;
                let b = num & 255;
                let a = parseInt(alpha, 16);
                if (a) return `rgba(${r}, ${g}, ${b}, ${a})`;
                return `rgb(${r}, ${g}, ${b})`;
            }
            const parseHex = a => {
                if (a.length < 3) return '0'.repeat(8);
                else if (a.length === 3) return rgbFromHex(a[0] + a[0] + a[1] + a[1] + a[2] + a[2], '00');
                else if (a.length === 4) return rgbFromHex(a[0] + a[0] + a[1] + a[1] + a[2] + a[2], a[3] + a[3]);
                else if (a.length === 6) return rgbFromHex(a.split(/(?=..)/).join(''), '0');
                else return a.padEnd(8, '0');
            }
            nssFunction('@colou?r', (_, type, a, b, c, d) => {
                [a, b, c, d] = [a || '0', b || '0', c || '0', d || ''];

                if (!/#|hash|hex.*|rgba?|hsla?/.test(type)) return `${type.toLowerCase()}(${a} ${b} ${c}${d ? ' / ' + d : ''})`;

                if (a.includes('%')) a = fromPercent(a);
                if (b.includes('%')) b = fromPercent(b);
                if (c.includes('%')) c = fromPercent(c);
                if (d.includes('%')) d = fromPercent(d);

                if (/#|rgba?|hsla?/.test(a)) {
                    if (a.includes('#')) a = parseHex(a.replace('#', ''));
                    if (/rgba?|hsla?/.test(a)) [a, b, c, d] = a.replace(/^[a-z]{3,4}\((.+)\)/g, '$1').split(',');
                }

                if (/#|hash|hex.*/.test(type)) {
                    return '#' + toHex(a) + toHex(b) + toHex(c) + (d ? toHex(d) : '');
                }
                else if (/rgba?/.test(type)) {
                    if (type === 'rgba') return `rgba(${a}, ${b}, ${c}, ${d || 1})`;
                    return `rgb(${a}, ${b}, ${c})`;
                }
                else if (/hsla?/.test(type)) {
                    [b, c] = [toPercent(b), toPercent(c)];
                    if (type === 'hsla') return `${type}(${a % 360}, ${b}%, ${c}%, ${d || 1})`;
                    return `${type}(${a % 360}, ${b}%, ${c}%)`;
                }
            });
            nssFunction('@luma', (_, val) => {
                if (val.startsWith('#')) val = parseHex(val.replace('#', '').substr(0, 6));
                let [a, b, c] = val.replace(/^[a-z]{3,4}\((.+)\)/g, '$1').split(',');
                const adjustGamma = a => ((a + 0.055) / 1.055) ** 2.4;
                const parseLuma = a => a <= 0.03928 ? a / 12.92 : adjustGamma(a);
                return 0.2126 * parseLuma(a / 255) + 0.7152 * parseLuma(b / 255) + 0.0722 * parseLuma(c / 255); // ITU-R BT.709
            });
            nssFunction('@colou?rpart', (_, part, color) => {
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
                    else return (nssLog('func', ['colorpart', part, 'of color type rgb/rgba/#']), color);
                }
                else if (color.startsWith('hsl')) {
                    if (part.startsWith('h')) return parts[0];
                    else if (part.startsWith('s')) return parts[1];
                    else if (part.startsWith('l')) return parts[2];
                    else if (part.startsWith('a')) return parts[3];
                    else return (nssLog('func', ['colorpart', part, 'of color type hsl/hsla']), color);
                } else return (nssLog('func', ['colorpart', part, 'of unknown color type']), color);
            });

            /// Logical functions
            const parseLogic = arg => {
                for (let i = 0; i < MAX_ARGUMENTS / 10; i++) {
                    arg = arg.trim()
                        .replace(/(?:'(.+?)'|"(.+?)")+/, '$1$2') // remove quotes
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
            const logicRegex = arg => RegExp(r`([+-]?${bracketedNumberRegex})\s*(?:${arg})\s*([+-]?${bracketedNumberRegex})`);
            nssFunction('@bitwise', (_, a) => {
                a = a.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
                for (let i = 0; i < MAX_ARGUMENTS / 10; i++) {
                    a = a
                        .replace(RegExp(r`(?:~|!|not)\s*([+-]?${bracketedNumberRegex})`), (_, a) => eval('~' + toNumber(a))) // bitwise not
                        .replace(logicRegex('or|\\|'), (_, a, b) => eval(`(${toNumber(a)}) | (${toNumber(b)})`)) // bitwise or
                        .replace(logicRegex('nor'), (_, a, b) => eval(`~ (${toNumber(a)}) | (${toNumber(b)})`)) // bitwise nor
                        .replace(logicRegex('and|&'), (_, a, b) => eval(`(${toNumber(a)}) & (${toNumber(b)})`)) // bitwise and
                        .replace(logicRegex('nand'), (_, a, b) => eval(`~ (${toNumber(a)}) & (${toNumber(b)})`)) // bitwise nand
                        .replace(logicRegex('xor'), (_, a, b) => eval(`(${toNumber(a)}) ^ (${toNumber(b)})`)) // bitwise xor
                        .replace(logicRegex('xnor'), (_, a, b) => eval(`~ (${toNumber(a)}) ^ (${toNumber(b)})`)) // bitwise xnor
                }
                return a;
            });
            nssFunction('@boolean', (_, a) => parseLogic(a));
            nssFunction('@if', (_, a, b, c) => parseLogic(a) ? b : c || '');
        }

        // Remove unparsed variables
        cssOutput = cssOutput.replace(/@endvar/g, '');
        let unparsedContent = cssOutput.match(/\$[\[(](.+?)[\])]/g)
        if (unparsedContent) for (let val of unparsedContent) {
            let nssVarName = val.replace(/\$[\[(](.*?)(\|.*)?[\])]/, '$1').trim();
            cssOutput = cssOutput.replace(val, '');
            let type = val.includes('$(') ? 'variable' : 'argument';
            nssLog(`Instances of unparsed ${type} "${nssVarName}" have been removed from the output.`);
        }

        // Cleanup output
        cssOutput = cssOutput
            .replace(/(\s*;)+/g, ';').replace(/(?<!^ *) +/gm, ' ') // remove redundant chars
            .replace(/\.?0{10,}\d*/g, '').replace(/(\d)(9{10,})\d?\b/g, (_, a) => Number(a) + 1) // fix floating point errors

        // Readd comments to the output
        for (let i in staticContent) {
            cssOutput = cssOutput.replace(RegExp(r`\/\*STATIC#${i}\*\/`, 'g'), staticContent[i].trim());
        }
        for (let i in commentedContent) {
            cssOutput = cssOutput.replace(RegExp(r`\/\*COMMENT#${i}\*\/`, 'g'), '/*' + commentedContent[i] + '*/');
        }

        // Output: log in console, return, or add to page
        if (rawInput) {
            nssLog('Output: ' + cssOutput.trim());
            return cssOutput.trim();
        }
        else {
            if (document.querySelectorAll(`[data-hash="${hashCode(cssOutput)}"]`).length) break; // prevent duplicate outputs
            let styleElem = document.createElement('style');
            styleElem.innerHTML = '\n' + cssOutput.trimStart().trimEnd() + '\n';
            styleElem.dataset.hash = hashCode(cssOutput);
            styleElem.dataset.source = sources[s];
            (document.head || document.body).appendChild(styleElem);
        }
        window.cssOutput = undefined;

    }
}

document.addEventListener("DOMContentLoaded", parseNovaSheets()); // Parse NovaSheets styles on page load