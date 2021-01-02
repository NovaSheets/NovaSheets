const NOVASHEETS_VERSION = "0.6.5";
try { fs = require('fs'); } catch { } // node

function parseNovaSheets(rawInput) {

    try { window } catch { window = {}; } // for cli and node

    String.prototype.strim = function () {
        return this.replace(/^\s*(.+?)\s*$/, '$1').replace(/\s+/g, ' ');
    };
    const r = String.raw;
    const hashCode = (str, length = 8) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
        return Math.abs(hash).toString(16).substring(0, length).padStart(length, '0');
    };
    const nssLog = (str, args) => {
        if (str == 'func') return nssLog(`Unknown value "${args[1]}" in built-in function ${args[0]}. Info: ${args[2]}.`);
        return console.warn("<NovaSheets>", str);
    };

    // Generate list of NovaSheet files and get the contents of each stylesheet
    window.externalSheets = window.inlineSheets = undefined;
    stylesheetContents = [], sources = [], externalSheets, inlineSheets;
    if (rawInput && rawInput.input) {
        compileNovaSheets(rawInput.input, rawInput.output);
    }
    else if (rawInput || Object.is(window, {})) {
        stylesheetContents = [rawInput.toString()];
        sources = 'raw';
    }
    else {
        try { // Test for browsers that do not support attribute flags
            externalSheets = document.querySelectorAll('link[rel="novasheet" i], link[rel="novasheets" i]');
            inlineSheets = document.querySelectorAll('[type="novasheet" i], [type="novasheets" i]');
        } catch {
            try {
                externalSheets = document.querySelectorAll('link[rel="novasheet"], link[rel="novasheets"]');
                inlineSheets = document.querySelectorAll('[type="novasheet"], [type="novasheets"]');
            } catch { }
        }
        let fileNames = { full: [], rel: [] };
        for (let sheet of externalSheets) {
            fileNames.full.push(sheet.href);
            fileNames.rel.push(sheet.getAttribute('href'));
        }
        for (let i in fileNames.full) {
            try {
                let req = new XMLHttpRequest();
                req.open("GET", fileNames.full[i], false);
                req.send();
                if (req.status == 404) throw 404;
                let response = req.responseText;
                stylesheetContents.push(response.toString());
                sources.push(fileNames.rel[i]);
            } catch { nssLog(`File "${fileNames.rel[i]}" cannot be accessed.`); }
        }
        for (let contents of inlineSheets) {
            let content = contents.value || contents.innerHTML || contents.innerText;
            stylesheetContents.push(content.replace(/^\s*`|`\s*$/, ''));
            sources.push('inline');
        }
    }

    // Loop through each sheet, parsing the NovaSheet styles
    window.randomHash = window.randomHash || hashCode(Math.random().toString(), 6);
    for (let s in stylesheetContents) {

        const escapeRegex = str => str.replace(/[.*+?^/${}()|[\]\\]/g, '\\$&');

        // Prepare stylesheet for parsing
        stylesheetContents[s] = stylesheetContents[s]
            .replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
            .replace(/(?<![a-z]+:)\n?\/\/.*$/gm, '') // remove single-line comments
            .replace(/(?:@var.+?=.*$|@var\s*[^=]*(?=\n\s*@var\s.))(?!\n\s*@endvar)/gm, '$& @endvar') // single-line @var declarations
            .replace(/@(var|const|endvar)/g, '\n$&') // put each declarator on its own line for parsing
            .replace(/@const\s*[A-Z_]+\s*(true|false|[0-9]+)|@endvar/g, '$&\n') // put each const on its own line
        let lines = stylesheetContents[s].split('\n');
        let cssOutput = '';
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
        let customVars = [], cssBlocks = [];
        let MAX_RECURSION = 50, MAX_MATH_RECURSION = 5, MAX_ARGUMENTS = 10, DECIMAL_PLACES, KEEP_NAN = false; // parser constants

        // Generate a list of lines that start variable declarations
        for (let i in lines) {
            let matcher;
            if (lines[i].match(/^\s*@var\s/)) {
                let varDeclParts = lines[i].replace(/^\s*@var\s/, '').split('=');
                let linesAfter = lines.slice(i);
                let varEnding;
                for (let j in linesAfter) {
                    if (linesAfter[j].match(/^\s*@endvar\s*$|^\s*@var\s/) && j != 0) { varEnding = j; break; }
                }
                let varName = varDeclParts[0].trim().split('|')[0].trim();
                const inlineContent = varDeclParts.slice(1).join('=') || '';
                const blockContent = linesAfter.slice(1, varEnding).join('\n');
                const varRegex = new RegExp(r`\$\(\s*${varName}\s*\)`, 'g');
                let varContent = (inlineContent + blockContent).trim().replace(varRegex, customVars[varName] || '');
                customVars[varName] = varContent;
            }
            else if (lines[i].match(matcher = /^\s*@const\s+/)) {
                let [name, val] = lines[i].replace(matcher, '').split(/\s+/);
                switch (name.toUpperCase()) {
                    case 'MAX_RECURSION': MAX_RECURSION = parseInt(val); break;
                    case 'MAX_MATH_RECURSION': MAX_MATH_RECURSION = parseInt(val); break;
                    case 'MAX_ARGUMENTS': MAX_ARGUMENTS = parseInt(val); break;
                    case 'DECIMAL_PLACES': DECIMAL_PLACES = val === "false" ? false : val; break;
                    case 'KEEP_NAN': KEEP_NAN = val !== "0" && val !== "false"; break;
                }
            }
        }

        // Save CSS declarations as variables
        cssOutput.replace(/([^{}]+)({.+?})/gms, (_, selector, css) => {
            if (selector.includes('$(') || selector.startsWith('@')) return;
            cssBlocks[escapeRegex(selector.trim().replace(/>/g, ':GT:'))] = css;
        });

        // Declare local functions and variables
        const number = r`(?:[0-9]*\.?[0-9]+)`;
        const basedNumber = r`(?:0x[0-9a-f]*\.?[0-9a-f]+|0b[01]*\.?[01]+|0o[0-7]*\.?[0-7]+|${number})`;
        const bracketedNumber = r`(?:\(\s*${basedNumber}\s*\)|${basedNumber})`;
        const quickMathCheck = r`(?:\(\s*${basedNumber}\s*\)|${basedNumber})\s*[a-z]*[-+*^/e\s]+(?:\(\s*${basedNumber}\s*\)|${basedNumber})\s*[a-z]*`;
        const numberUnit = r`\s*(?:em|rem|en|ex|px|pt|pc|cm|mm|m(?![ms])|ft|in|s|ms)`;
        const operators = b => r`(?:[-^*/+\s${b ? '()' : ''}]+(?=\d|\.))`;
        const mathChecker = obj => {
            const o = r`\(\s*`, c = r`\s*\)`; // open and close brackets
            const numberValue = `${basedNumber}${numberUnit}?`;
            const optBracketedNumber = `(?:${o}${numberValue}${c}|${numberValue})`;
            const op = obj.op || operators(obj.b);
            let unbracketed = r`(?:(?:${optBracketedNumber}\s*${op}\s*)+(?:${numberValue}))`;
            return r`\(${unbracketed}\)|${unbracketed}`;
        }
        const toNumber = val => KEEP_NAN ? Number(val) : (isNaN(Number(val)) ? '' : Number(val));
        const parseMath = () => {
            cssOutput = cssOutput.replace(/(?<!#)\b(\d+)[Ee](\d+)/g, (_, a, b) => a * 10 ** b)
            for (let i = 0; i < MAX_MATH_RECURSION; i++) {
                if (!cssOutput.match(RegExp(quickMathCheck))) break;
                cssOutput = cssOutput.replace(RegExp(mathChecker({}), 'g'), _ => {
                    let matchesOnlyBrackets = !_.match(/[-+e^*/]/);
                    let containsUnitList = _.match(RegExp(r`${numberUnit}\s-?${basedNumber}`));
                    if (matchesOnlyBrackets || containsUnitList) return _;

                    let match = _.match(RegExp(numberUnit, 'g')) || [];
                    let unit = match[match.length - 1] || '';
                    let content = _
                        .replace(RegExp(`(${number})\s*(${numberUnit})`, 'g'), (_, num, u) => {
                            switch (u) {
                                case 'mm': case 'ms': unit = u[1]; return toNumber(num) / 1000;
                                case 'cm': unit = 'm'; return toNumber(num) / 100;
                                case 'in': unit = 'm'; return toNumber(num) * 0.0254;
                                case 'ft': unit = 'm'; return toNumber(num) * 0.3048;
                                default: return _;
                            }
                        })
                        .replace(RegExp(numberUnit, 'g'), '')
                        .replace(/\d\s*e\s*\d/g, '$&'.replace(/\s/g, '')) // prepare exponentation
                        .replace(/--/g, '- -') // double negatives don't work in js
                        .replace(/\^/g, '**') // '^' is xor operator in js
                    try { return eval(content) + unit; } catch { return content + unit; }
                });
            }
        };
        const testNaN = (arg, def) => {
            let test = !arg || arg === Infinity || Number.isNaN(arg);
            if (test && KEEP_NAN) return 'NaN';
            else if (test && !KEEP_NAN) return def || 0;
            else return arg;
        }
        const nssFunction = (name, func, { nonest, notrim, allargs } = {}) => {
            parseMath();
            let matchRegex = RegExp(r`\$\(\s*(?:${name})\b`);
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
            if (!segment.trim() || (nonest && segment.match(/.+\$\(/))) return;
            let replacer = r`^\$\(${notrim ? '|' : r`\s*|\s*`}\)$`;
            let splitter = notrim ? '|' : /\s*\|\s*/;
            let parts = segment.replace(RegExp(replacer, 'g'), '').split(splitter); // [name, arg1, arg2, ...]
            for (let i = 0; i < MAX_ARGUMENTS; i++) if (parts[i] == undefined) parts[i] = '';
            if (!allargs) for (let i = MAX_ARGUMENTS; i > 0; i--) if (parts[i]) { parts = parts.slice(0, i + 1); break; }
            parts[0] = segment;
            cssOutput = cssOutput.replace(segment, func(...parts));
        };

        // Convert NovaSheets styles to CSS
        let loop = 0, lastCssOutput;
        while ((cssOutput.indexOf('$(') > -1 || loop < 1) && loop++ < MAX_RECURSION) {
            if (lastCssOutput === cssOutput) break;
            lastCssOutput = cssOutput;

            // Parse CSS block substitutions
            for (let name in cssBlocks) {
                cssOutput = cssOutput.replace(new RegExp(r`\$<\s*${name.replace(/:GT:/g, '>')}\s*>`), cssBlocks[name] || '{}');
            }
            cssOutput = cssOutput.replace(/\$<.+?>/g, '{}');

            // Parse variable contents
            for (let name in customVars) {
                nssFunction(name, (_, ...paramArgs) => {
                    let content = customVars[name];
                    for (let i in paramArgs) {
                        if (!paramArgs[i]) continue;
                        let parts = paramArgs[i].split('=');
                        let param = parts[1] ? parts[0].strim() : +i + 1;
                        let arg = parts[1] ? parts[1].strim() : parts[0].strim();
                        content = content.replace(RegExp(r`\$\[${param}[^\]]*\]`, 'g'), arg)
                    }
                    content = content.replace(/\$\[.*?(?:\|([^\]]*))?\]/g, '$1') // default args
                    return content;
                });
            }

            // Parse prev selectors
            for (let i = 0; cssOutput.indexOf('%') > -1 && i++ < MAX_RECURSION; i++) { // % takes the prev
                cssOutput = cssOutput.replace(/([^{}|()]+?){[^{}]*?}[^{}]*?%[^{}]*?{/g, (_, a) => {
                    if (a.includes('%')) return _; // for next pass
                    return _.replace(/(?<!\d)%/g, a.strim());
                });
            }
            for (let i = 0; cssOutput.indexOf('&') > -1 && i++ < MAX_RECURSION; i++) { // & takes the prev parent
                cssOutput = cssOutput.replace(/([^{}|()]+?){[^{}]*?}([^{}]*?&[^{}]*?{[^{}]*})+/g, (_, a) => {
                    if (a.includes('&')) return _; // for next pass
                    return _.replace(/&/g, a.strim() + (a.match(/(?<!\d)%/) ? '<' : ''));
                });
            }
            for (let i = 0; cssOutput.indexOf('<') > -1 && i++ < MAX_RECURSION; i++) {
                cssOutput = cssOutput.replace(/[>+~\s]\s*[^&%{}>+~\s<]+\s*</g, '');
            }

            // Parse object notation
            cssOutput = cssOutput.replace(/{([^{}]*?)}\s*<([^\[\]]*?)>/gm, (_, css, item) => {
                const statements = css.split(/\s*;\s*/);
                for (let i in statements) {
                    const [attr, val] = statements[i].split(/\s*:\s*/);
                    if (attr.trim() === item.trim()) return val || '';
                }
                return '';
            });
            cssOutput = cssOutput.replace(/{([^{}]*?)}\s*!/gm, (_, css) => {
                return css;
            });

            // Parse simple breakpoints
            cssOutput = cssOutput.replace(/([^{}]*?)\s*@\s*(\d+px)?\s*(?:\.+|,)?\s*(\d+px)?\s*{(.+?)}/gm, (_, selector, min, max, block) => {
                let query = 'only screen';
                if (min) query += ` and (min-width: ${min})`;
                if (max) query += ` and (max-width: ${max})`;
                return `@media ${query} { ${selector} { ${block} } }`;
            });

            // Parse built-in variables

            /// Loop functions
            nssFunction('@each', (_, a = '', b = '', c = '', ...d) => {
                d = d.join('|');
                let [items, splitter, joiner, content] = d ? [a, b, c, d] : (c ? [a, b, b, c] : [a, ',', ',', b]);
                [items, splitter, joiner, content] = [items.strim(), splitter.strim(), joiner, content.strim()];
                let arr = items.split(splitter);
                let output = [];
                for (let i in arr) {
                    let parsed = content
                        .replace(/\$i/gi, Number(i) + 1)
                        .replace(/\$v\[([0-9]+)([-+*/][0-9]+)?\]/g, (_, a, b) => arr[eval(Number(a - 1) + (b || 0))])
                        .replace(/.?\s*undefined/g, '')
                        .replace(/\$v/gi, arr[i])
                    output.push(parsed);
                }
                return output.join(joiner);
            }, { notrim: true });
            nssFunction('@repeat', (_, a, ...b) => {
                let num = a, 
                [ delim, ...content] = b[1] ? [b[0], b.slice(1)] : ['', [b[1]]];
                if (!b[1]) content = b[0];
                else [delim, ...content] = b;
                let output = '';
                for (let i = 0; i < Number(num); i++) output += (i > 0 ? delim : '') + content.join('|').replace(/\$i/gi, Number(i) + 1);
                return output;
            });

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
                let output = _.includes('@min') ? Math.min(...nums) : Math.max(...nums);
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
            nssFunction('@lowercase', (_, a) => a.toLowerCase());
            nssFunction('@uppercase', (_, a) => a.toUpperCase());
            nssFunction('@titlecase', (_, a) => a.replace(/\b\w/g, a => a.toUpperCase()));
            nssFunction('@capitali[sz]e', (_, a) => a[0].toUpperCase() + a.substr(1));
            nssFunction('@uncapitali[sz]e', (_, a) => a[0].toLowerCase() + a.substr(1));
            nssFunction('@extract', (_, a, b, c) => a.split(c ? b : ',')[toNumber(c ? c : b) - 1] || '');
            nssFunction('@encode', (_, a) => encodeURIComponent(a));
            nssFunction('@length', (_, a) => a.strim().length);
            nssFunction('@replace', (_, ...args) => {
                if (args.length < 3) args = [args[0], args[1] || '', args[2] || ''];
                args = args.slice(0, args.indexOf('') <= 3 ? 3 : args.indexOf(''));
                let text = args[0].strim();
                let finder = args.slice(1, -1).join('|').strim();
                let replacer = args.slice(-1)[0].strim();
                let isRegex = finder.startsWith('/');
                if (isRegex) {
                    let parts = finder.strim().match(/\/(.+?)\/([gimusy]*)/).slice(1);
                    finder = RegExp(parts[0], parts[1] || 's');
                }
                return text.replace(isRegex ? finder : RegExp(escapeRegex(finder), 'g'), replacer);
            }, { notrim: true, allargs: true });

            // Colour functions
            const toPercent = val => Math.floor(Number(val) / 255 * 100);
            const fromPercent = val => Math.ceil(Number(val.replace('%', '')) * 255 / 100);
            const toHex = val => Number(val).toString(16).padStart(2, '0');
            const rgbFromHex = (hex, alpha) => {
                let num = parseInt(hex.replace(/#?(.{0,8})$/, '$1'), 16);
                let r = (num >> 16) & 255;
                let g = (num >> 8) & 255;
                let b = num & 255;
                let a = alpha && toPercent(parseInt(alpha, 16));
                if (a != null) return `rgba(${r}, ${g}, ${b}, ${a})`;
                return `rgb(${r}, ${g}, ${b})`;
            }
            const parseHex = val => {
                let a = val.replace('#', '');
                switch (a.length) {
                    case 0: return rgbFromHex('000000', '00');
                    case 1: return rgbFromHex(a.repeat(6));
                    case 2: return rgbFromHex(a[0].repeat(6), a[1].repeat(2));
                    case 3: return rgbFromHex(a[0] + a[0] + a[1] + a[1] + a[2] + a[2]);
                    case 4: return rgbFromHex(a[0] + a[0] + a[1] + a[1] + a[2] + a[2], a[3] + a[3]);
                    default: return rgbFromHex(a.substr(0, 6).padEnd(6, '0'), a.substr(6, 2) || null);
                }
            }
            const getRawColorParts = col => col.replace(/^\s*\w{3}a?\s*\(\s*|\s*\)$/g, '').split(/,\s*/);
            const getColorParts = color => {
                let parts = getRawColorParts(color.startsWith('#') ? parseHex(color) : color);
                for (let i in parts) {
                    if (!parts[i]) parts[i] = 0;
                    else if (parts[i].includes('%')) {
                        let num = parts[i].replace('%', '');
                        if (color.includes('hsl')) parts[i] = "" + Math.round(num / 100 * (i === 0 ? 360 : 100));
                        else parts[i] = "" + fromPercent(num);
                    }
                    else if (i === 3) parts[i] = Math.round(color.includes('rgb') ? num / 255 : num / 100);
                }
                return parts;
            }
            const hexFromRgb = (rgb) => {
                let [r, g, b, a] = Array.isArray(rgb) ? rgb : getColorParts(rgb);
                return '#' + toHex(r) + toHex(g) + toHex(b) + (a > 0 ? toHex(a) : '');
            }
            const blendColors = (color1, color2, amt) => {
                if (!color2) return nssLog('func', ['@colorblend', color2, 'color can not be empty']), color1 || '';
                let type = color1.match(/^[a-z]{3}a?|^#/).toString();
                let amount = Math.abs(amt.toString().includes('%') ? amt.replace('%', '') / 100 : amt);
                amount = amount > 1 ? 1 : amount;
                const blendVal = (a, b) => Math.floor((toNumber(a) * (1 - amount) + toNumber(b) * (amount)));
                let [[r1, g1, b1, a1], [r2, g2, b2, a2]] = [getColorParts(color1), getColorParts(color2)];
                let [r, g, b, a] = [blendVal(r1, r2), blendVal(g1, g2), blendVal(b1, b2), blendVal(a1, a2)];
                switch (type) {
                    case 'rgba': return `rgba(${r}, ${g}, ${b}, ${a})`;
                    case 'rgb': return `rgb(${r}, ${g}, ${b})`;
                    case 'hsla': return `hsla(${r % 360}, ${g / 100}%, ${b / 100}%, ${a})`;
                    case 'hsl': return `hsla(${r % 360}, ${g / 100}%, ${b / 100}%)`;
                    case '#': return hexFromRgb([r, g, b, a]);
                    default: `${type}(${r}, ${g}, ${b})`;
                }
            }
            const blendGrayscaleHsl = (type, color1, color2, amt) => {
                if (!color1.includes('hsl')) return blendColors(color1, color2, amt || 0.5);
                let [h, s, l, a] = getColorParts(color1);
                let amount = amt.replace('%', '');
                let sNew = toNumber(s) - toNumber(amount);
                let lNew = toNumber(l) + toNumber(amount) * (type === 'shade' ? -1 : 1);
                let sl = type === 'tone' ? `${sNew}%, ${l}%` : `${s}%, ${lNew < 0 ? 0 : lNew}%`;
                return `${color1.match(/^hsla?/)}(${h % 360}, ${sl}${a ? `, ${a}` : ''})`;
            }

            nssFunction('@colou?r', (_, type, a = '0', b = '0', c = '0', d = '') => {
                if (/#|rgba?|hsla?/i.test(a)) {
                    if (a.includes('#')) a = parseHex(a);
                    if (/rgba?|hsla?/.test(a)) [a, b, c, d] = getColorParts(a);
                } else[a, b, c, d] = getColorParts(`${type}(${a}, ${b}, ${c}, ${d})`);

                switch (type = type.toLowerCase()) {
                    case '#': case 'hash': case 'hex': case 'hexadecimal': return '#' + toHex(a) + toHex(b) + toHex(c) + (d ? toHex(fromPercent(d)) : '');
                    case 'rgb': return `rgb(${a}, ${b}, ${c})`;
                    case 'rgba': return `rgba(${a}, ${b}, ${c}, ${d || d === 0 ? 100 : ''}%)`;
                    case 'hsl': return `hsl(${a % 360}, ${b}%, ${c}%)`;
                    case 'hsla': return `hsla(${a % 360}, ${b}%, ${c}%, ${d || d === 0 ? 100 : ''}%)`;
                    default: return `${type}(${a} ${b} ${c}${d ? ` / ${d}` : ''})`;
                }
            });
            nssFunction('@colou?rpart', (_, a = '', b = '') => {
                let [part, color] = [a.toLowerCase(), b.toLowerCase()];
                let parts = getColorParts(color);
                const obj = { r: parts[0], h: parts[0], g: parts[1], s: parts[1], b: parts[2], l: parts[2], a: parts[3] };
                return obj[part[0]] || (nssLog('func', ['@colorpart', part, 'on color' + color]), color);
            });
            nssFunction('@spin', (_, color, amount) => {
                let oldHue = color.replace(/^hsla?\s*\((\d+),\s*.+\s*\)\s*$/g, '$1');
                let newHue = (toNumber(oldHue) + toNumber(amount || 0)) % 360;
                return color.replace(oldHue, newHue);
            });
            nssFunction('@blend', (_, color1, color2, amount = 0.5) => blendColors(color1, color2, amount));
            nssFunction('@tint|@lighten', (_, color, amount) => blendGrayscaleHsl('tint', color, '#fff', amount || 0.5));
            nssFunction('@shade|@darken', (_, color, amount) => blendGrayscaleHsl('shade', color, '#000', amount || 0.5));
            nssFunction('@tone|@desaturate', (_, color, amount) => blendGrayscaleHsl('tone', color, '#808080', amount || 0.5));

            const parseLuma = (arg, rgb) => {
                if (!(arg.startsWith('rgb') || arg.startsWith('#'))) return nssLog('func', ['@luma or @contrast', 'hsl', 'only RGB values are allowed']), arg;
                let [r, g, b] = rgb ? [...rgb] : getColorParts(arg);
                const adjustGamma = a => ((a + 0.055) / 1.055) ** 2.4;
                const getLuma = a => a <= 0.03928 ? a / 12.92 : adjustGamma(a);
                return 0.2126 * getLuma(r / 255) + 0.7152 * getLuma(g / 255) + 0.0722 * getLuma(b / 255); // ITU-R BT.709
            }
            nssFunction('@luma', (_, color) => parseLuma(color));
            nssFunction('@contrast', (_, color, light = '', dark = '') => (parseLuma(color) < 0.5/*'is dark?':*/) ? light : dark);
            nssFunction('@gr[ae]yscale', (_, color) => {
                if (color.startsWith('hsl')) return color.replace(/^(hsla?)\s*\(\s*(\d+),\s*(\d+)/, '$1($2, 0')
                let gray = Math.round(parseLuma(color) * 255);
                let newColor = `rgb(${Array(3).fill(gray).join(', ')})`
                if (color.startsWith('#')) return hexFromRgb(newColor);
                else return newColor;
            });

            /// Logical functions
            const parseLogic = arg => {
                for (let i = 0; i < MAX_ARGUMENTS / 10; i++) {
                    arg = arg.strim()
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
            const logicRegex = arg => RegExp(r`([+-]?${bracketedNumber})\s*(?:${arg})\s*([+-]?${bracketedNumber})`);
            nssFunction('@bitwise', (_, a) => {
                let arg = a.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
                for (let i = 0; i < MAX_ARGUMENTS / 10; i++) {
                    arg = arg
                        .replace(RegExp(r`(?:~|!|not)\s*([+-]?${bracketedNumber})`), (_, a) => eval('~' + toNumber(a))) // bitwise not
                        .replace(logicRegex('or|\\|'), (_, a, b) => eval(`(${toNumber(a)}) | (${toNumber(b)})`)) // bitwise or
                        .replace(logicRegex('nor'), (_, a, b) => eval(`~ (${toNumber(a)}) | (${toNumber(b)})`)) // bitwise nor
                        .replace(logicRegex('and|&'), (_, a, b) => eval(`(${toNumber(a)}) & (${toNumber(b)})`)) // bitwise and
                        .replace(logicRegex('nand'), (_, a, b) => eval(`~ (${toNumber(a)}) & (${toNumber(b)})`)) // bitwise nand
                        .replace(logicRegex('xor'), (_, a, b) => eval(`(${toNumber(a)}) ^ (${toNumber(b)})`)) // bitwise xor
                        .replace(logicRegex('xnor'), (_, a, b) => eval(`~ (${toNumber(a)}) ^ (${toNumber(b)})`)) // bitwise xnor
                }
                return arg;
            });
            nssFunction('@boolean', (_, a) => parseLogic(a));
            nssFunction('@if', (_, a, b = '', c = '') => parseLogic(a) ? b : c);

            /// CSS functions
            nssFunction('@breakpoint', (_, a = 0, b = '', c = '', d = '') => {
                if (!a) return _;
                const makeQuery = (type, width, content) => `@media (${type}-width: ${width}+${type === 'max' ? 0 : 1}px) { ${content}}`;
                let isBlock = (b + c).includes('{');
                let content = isBlock ? [b, c] : [`${b} {${c}} `, `${b} {${d}} `];
                let ltContent = (isBlock ? b : c).trim() ? makeQuery('max', a, content[0]) : '';
                let gtContent = (isBlock ? c : d).trim() ? makeQuery('min', a, content[1]) : '';
                return ltContent + (ltContent && gtContent ? '\n' : '') + gtContent;
            }, { notrim: true });
            nssFunction('@prefix', (_, a, b) => {
                return `-webkit-${a}: ${b}; -moz-${a}: ${b}; -ms-${a}: ${b}; -o-${a}: ${b}; ${a}: ${b};`;
            }, { nonest: true });

        }

        // Remove unparsed variables
        cssOutput = cssOutput.replace(/@endvar/g, '');
        let unparsedContent //= cssOutput.match(/\$[\[(](.+?)[\])]/g);
        if (unparsedContent) for (let val of unparsedContent) {
            let nssVarName = val.replace(/\$[\[(](.*?)(\|.*)?[\])]/, '$1').strim();
            cssOutput = cssOutput.replace(val, '');
            let type = val.includes('$(') ? 'variable' : 'argument';
            nssLog(`Instances of unparsed ${type} "${nssVarName}" have been removed from the output.`);
        }

        // Cleanup output
        cssOutput = cssOutput
            .replace(/(\s*;)+/g, ';').replace(/(?<!^ *) +/gm, ' ') // remove redundant chars
            .replace(/(?<![1-9]+)(0\.\d+)(?=m|s)/, (_, n) => Number(n) * 1000 + 'm').replace(/0mm/g, 'cm') // clean up length units
            .replace(/\.?0{10,}\d/g, '').replace(/((\d)\2{9,})\d/g, '$1').replace(/(\d+)([5-9])\2{10,}\d?(?=\D)/g, (_, a) => Number(a) + 1)//.replace(/(\d)0+(?=\D)/g, '$1') // fix floating point errors
            .replace(RegExp(r`((\d)\.\d{0,${DECIMAL_PLACES || ''}})(\d?)\d*`), (_, val, pre, after) => {
                if (DECIMAL_PLACES === "0") return after.match(/[5-9]$/) ? parseInt(pre) + 1 : pre;
                else return after.match(/[5-9]$/) ? val.replace(/.$/, '') + (parseInt(val.substr(-1)) + 1).toString() : val
            });

        // Readd comments to the output
        for (let i in staticContent) {
            cssOutput = cssOutput.replace(RegExp(r`\/\*STATIC#${i}\*\/`, 'g'), staticContent[i].strim());
        }
        for (let i in commentedContent) {
            cssOutput = cssOutput.replace(RegExp(r`\/\*COMMENT#${i}\*\/`, 'g'), '/*' + commentedContent[i] + '*/');
        }

        // Output: return (node) or add to page (browser)
        if (rawInput) return cssOutput.strim();
        else {
            if (document.querySelectorAll(`[data-hash="${hashCode(cssOutput)}"]`).length) break; // prevent duplicate outputs
            let styleElem = document.createElement('style');
            styleElem.innerHTML = '\n' + cssOutput.trimStart().trimEnd() + '\n';
            styleElem.dataset.hash = hashCode(cssOutput);
            styleElem.dataset.source = sources[s];
            (document.head || document.body).appendChild(styleElem);
        }

    }

    String.prototype.strim = undefined;
}

function compileNovaSheets(input, output) {
    try {
        fs.readFile(input, 'utf8', (err, contents) => {
            if (err) throw `FSReadError: Input file ${input} not found.`;
            fs.writeFile(output, parseNovaSheets(contents).replace(/\}/g, '}\n'), err => {
                if (err) throw `FSWriteError: Output file ${output} is invalid.`;
            });
        });
    } catch (err) { }
}

// Entry points
try {
    // Node
    module.exports.parse = parseNovaSheets;
    module.exports.compile = compileNovaSheets;

    // Command line
    const arg = n => process.argv[n + 1] || '';
    let inArg = val => arg(1).startsWith('-') && arg(1).includes(val);
    if (inArg('-h')) {
        nssLog(`Arguments:\n
    novasheets [{-c, --compile}] <input file> [<output file>]\tCompile a NovaSheets file \n\
    novasheets {-p, --parse} "<input>"\t\t\t\tParse raw NovaSheets input from the command line \n\
    novasheets {-h, --help}\t\t\t\t\tDisplay this help message \n\
    novasheets {-v, --version}\t\t\t\t\tDisplay the current version of NovaSheets \
        `);
    }
    else if (inArg('-v')) { nssLog('Current version: ' + NOVASHEETS_VERSION); }
    else if (inArg('-p')) { console['log'](parseNovaSheets(arg(2))); }
    else if (arg(1)) {
        let explicit = inArg('-c');
        let input = explicit ? arg(2) : arg(1);
        let output = explicit ? arg(3) : arg(2) || input.replace('.nss', '.css');
        compileNovaSheets(input, output);
    }
} catch {
    try {
        // Browser
        document.addEventListener("DOMContentLoaded", parseNovaSheets()); // Parse NovaSheets styles on page load
        compileNovaSheets = undefined; // not a browser function
    } catch (err) {
        // Other
        console['log']("An unknown error has occurred. Stack trace: " + err);
    }
}