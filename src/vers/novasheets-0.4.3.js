// NovaSheets 0.4.3 //
String.prototype.hashCode = function (length) {
    let hash = 0;
    for (let i = 0; i < this.length; i++) hash = ((hash << 5) - hash) + this.charCodeAt(i);
    return Math.abs(hash).toString(16).substring(0, length || 8).padStart(length, '0');
};
String.prototype.trim = function () {
    return this.replace(/^ *(.+?) *$/, '$1').replace(/ +/g, ' ');
}
String.prototype.escapeRegex = function () {
    return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nssError(str, args) {
    if (!args) return console.error("<NovaSheets> Parsing failed: " + str);
    if (str == 'func') return nssError(`Unknown argument "${args[1] || ''}" in function "${args[0] || ''}" ${args[2] || ''}`.trim() + '.')
}

function parseNovaSheets() {

    // Generate list of NovaSheet files and get the contents of each stylesheet
    let sheets, inline;
    try { // For browsers that do not support attribute flags
        sheets = document.querySelectorAll('link[rel="novasheet" i], link[rel="novasheets" i]');
        inline = document.querySelectorAll('[type="novasheet" i], [type="novasheets" i]');
    } catch (err) {
        sheets = document.querySelectorAll('link[rel="novasheet"], link[rel="novasheets"]');
        inline = document.querySelectorAll('[type="novasheet"], [type="novasheets"]');
    }
    let fileNames = { full: [], rel: [] };
    let sources = [];
    for (let i of sheets) {
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
        sources.push('inline');
    }

    // Loop through each sheet, parsing the NovaSheet styles
    window.randomHash = window.randomHash || Math.random().toString().hashCode(6);
    for (let s in stylesheetContents) {

        let lines = stylesheetContents[s].replace(/@(var|const|endvar)/g, '\n@$1').split('\n'); // put each declarator on its own line for parsing
        let cssOutput = '';
        for (let i in lines) {
            lines[i] = lines[i].replace(/^(.*?)\s\/\/.*$/, '$1').replace(/[\r\n]/g, '').trim() // remove CRLF and comments and trim
            cssOutput += lines[i];
        }
        cssOutput = cssOutput.replace(/\s*@(var|const)[\s\S]*?((?=\s*@(var|const))|@endvar)/gm, ''); // remove NSS declarations
        let customVars = [];
        let localVars = [];
        let MAX_RECURSION = 50, MAX_ARGUMENTS = 10; // parser constants

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
            else if (lines[i].match(/^\s*@const\s*MAX_RECURSION\s/)) {
                MAX_RECURSION = Number(lines[i].split('MAX_RECURSION')[1]);
            }
            else if (lines[i].match(/^\s*@const\s*MAX_ARGUMENTS\s/)) {
                MAX_ARGUMENTS = Number(lines[i].split('MAX_ARGUMENTS')[1]);
            }
        }

        // Begin variable parsing; phrases below come from using format '$(name|param=arg)'

        /// For each variable declaration, generate local variables from its parameters
        for (let i in customVars) {
            for (let j in customVars[i].params) {
                let param = customVars[i].params[j].trim();
                let newName = [j, customVars[i].name, randomHash, param].join('~'); //= 'j-name-hash-param'
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
                return RegExp(`\\$\\(\\s*${name}\\s*(?:\\|(\\s*${params.join('))?\\s*(?:\\|(\\s*')}))?\\s*\\)`, 'g');
            };
            const getArgs = (str, index) => {
                let arr = str.replace(/\$\((.*)\)/, '$1').split('|');
                if (index) return arr[index] && arr[index].trim();
                else return arr.join('|').replace(/\s*\|\s*/g, '|').split('|').splice(1);
            };

            /// Raw math operators
            const number = '[0-9]*(?:\\.[0-9]*)?';
            const numberRegex = '\\s*(?:0x|0b|0o)?(?:[0-9]*[.])?[0-9]+\\s*';
            const signedNumberRegex = '\\s*[+-]?\\s*(?:0x|0b|0o)?(?:[0-9]*[.])?[0-9]+\\s*';
            const lengthUnitsRegex = '(cm|mm|ft|in)';
            const mathRegex = op => '(' + numberRegex + ')\\s*' + op.escapeRegex() + '\\s*(' + numberRegex + ')\\s*';
            const mathRegexBracketed = op => '\\(\\s*' + mathRegex(op) + '\\s*\\)\\s*';
            const parseMath = (ops, b) => {
                for (let op of ops) {
                    cssOutput = cssOutput
                        .replace(RegExp(numberRegex + '[Ee][+-]?' + numberRegex), arg => { // convert scientific notation
                            let vals = arg.split(/[Ee]/);
                            let calc = Number(vals[0]) * 10 ** Number(vals[1]);
                            return calc.toFixed(20).replace(/\.?0+$/, '');
                        })
                        .replace(/(?:\+|--)+([.0-9]+)/, '+$1') // convert double negatives
                        .replace(/(?:\+-|-\+)+(?:\++)?([.0-9]+)/, '-$1') // convert values which evaluate to negative
                        .replace(RegExp(numberRegex + lengthUnitsRegex), args => { // convert all length units to metres
                            args = args.split(RegExp(lengthUnitsRegex)).splice(0, 2);
                            switch (args[1]) {
                                case "cm": return args[0] / 100 + 'm';
                                case "mm": return args[0] / 1000 + 'm';
                                case "ft": return args[0] * 0.3048 + 'm';
                                case "in": return args[0] * 0.0254 + 'm';
                            }
                        })
                        .replace(RegExp(numberRegex + 'm\\s*(\\*\\*|^|/|\\*|\\+|-)' + numberRegex + '(?=m[^m])'), args => args.replace(/m/g, '')) // parse length math

                    let regex = b ? mathRegexBracketed(op[0]) : mathRegex(op[0]);
                    if (!Array.isArray(op)) op = [op, op];
                    let nums = cssOutput.match(RegExp(regex));
                    if (!nums) continue;
                    let result = eval(`Number(${nums[1]}) ${op[1]} Number(${nums[2]})`);
                    if (nums) cssOutput = cssOutput.replace(RegExp(regex), result);
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
                .replace(nssFunction('@mod', number, 2), args => getArgs(args, 1) % getArgs(args, 2))
                .replace(nssFunction('@min', number), args => Math.min(...getArgs(args)))
                .replace(nssFunction('@max', number), args => Math.max(...getArgs(args)))
                .replace(nssFunction('@sin', number, 1), args => Math.sin(getArgs(args, 1)))
                .replace(nssFunction('@asin', number, 1), args => Math.asin(getArgs(args, 1)))
                .replace(nssFunction('@cos', number, 1), args => Math.cos(getArgs(args, 1)))
                .replace(nssFunction('@acos', number, 1), args => Math.acos(getArgs(args, 1)))
                .replace(nssFunction('@tan', number, 1), args => Math.tan(getArgs(args, 1)))
                .replace(nssFunction('@atan', number, 1), args => Math.atan(getArgs(args, 1)))
                .replace(nssFunction('@abs', number, 1), args => Math.abs(getArgs(args, 1)))
                .replace(nssFunction('@floor', number, 1), args => Math.floor(getArgs(args, 1)))
                .replace(nssFunction('@ceil', number, 1), args => Math.ciel(getArgs(args, 1)))
                .replace(nssFunction('@percent', number, 1), args => Number(getArgs(args, 1)) * 100 + '%')
                .replace(nssFunction('@log', number, 1), args => Math.log(getArgs(args, 1)))
                .replace(nssFunction('@root', number, 2), args => Math.pow(getArgs(args, 2), 1 / getArgs(args, 1)))
                .replace(nssFunction('@round', number, 2), args => {
                    let a = Number(getArgs(args, 1)) + Number.EPSILON;
                    let b = getArgs(args, 2) || 0;
                    return Math.round(a * 10 ** b) / (10 ** b);
                })
                .replace(nssFunction('@clamp', number, 3), args => {
                    let a = getArgs(args, 1);
                    let b = getArgs(args, 2);
                    let c = getArgs(args, 3);
                    if (c < b) [b, c] = [c, b];
                    return a <= b ? b : (a >= c ? c : a);
                })
                .replace(nssFunction('@degrees', number + '\\s*(deg|rad|grad)', 1), args => {
                    let arg = getArgs(args, 1);
                    let num = Number(arg.replace(/[^-+.0-9]+/, ''));
                    if (arg.includes('rad')) return num * Math.PI / 180;
                    if (arg.includes('grad')) return num * 10 / 9;
                    return num;
                })
                .replace(nssFunction('@radians', number + '\\s*(deg|rad|grad)', 1), args => {
                    let arg = getArgs(args, 1);
                    let num = Number(arg.replace(/[^-+.0-9]+/, ''));
                    if (arg.includes('deg')) return num / Math.PI * 180;
                    if (arg.includes('grad')) return num / Math.PI * 200;
                    return num;
                })
                .replace(nssFunction('@gradians', number + '\\s*(deg|rad|grad)', 1), args => {
                    let arg = getArgs(args, 1);
                    let num = Number(arg.replace(/[^-+.0-9]+/, ''));
                    if (arg.includes('deg')) return num * 0.9;
                    if (arg.includes('rad')) return num * Math.PI / 200;
                    return num;
                })

            /// Text functions
            cssOutput = cssOutput
                .replace(nssFunction('@encode'), args => encodeURIComponent(getArgs(args, 1)))
                .replace(nssFunction('@replace'), args => getArgs(args, 1).replace(getArgs(args, 2), (getArgs(args, 3))))
                .replace(nssFunction('@length'), args => getArgs(args, 1).length)

            // Colour functions
            cssOutput = cssOutput
                .replace(nssFunction('@color'), args => {
                    let type = getArgs(args, 1);
                    let a = getArgs(args, 2) || 0;
                    let b = getArgs(args, 3) || 0;
                    let c = getArgs(args, 4) || 0;
                    let d = getArgs(args, 5) || 0;
                    if (type === 'hash' | type === '#') {
                        if (!a) return '#000';
                        a = Math.abs(Math.round(a.replace('#', ''))).toString();
                        if (a.length < 3) a = a.padStart(3, 0);
                        if (a.length === 5) a = a.padStart(6, 0);
                        if (a.length === 7) a = a.padStart(8, 0);
                        return '#' + a;
                    } else if (['rgb', 'hsl'].includes(type)) {
                        return `${type}(${a}, ${b}, ${c})`;
                    } else if (['rgba', 'hsla'].includes(type)) {
                        return `${type}(${a}, ${b}, ${c}, ${d})`;
                    }
                })
                .replace(nssFunction('@colorpart'), args => {
                    let part = getArgs(args, 1);
                    let color = getArgs(args, 2) || 0;
                    let parts = [];
                    const getPart = (str, a) => (Number("0x" + str.substr(a, 2))).toString()

                    if (color.startsWith('#')) {
                        let hex = color.replace('#', '');
                        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + '00';
                        if (hex.length === 4) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
                        if (hex.length === 6) hex = hex.repeat(2) + '00';
                        parts = [getPart(hex, 0), getPart(hex, 2), getPart(hex, 4), getPart(hex, 6)];
                    }
                    else parts = color.replace(/^\s*...a?/, '').split(',');

                    if (color.startsWith('#') || color.startsWith('rgb')) {
                        if (['red', 'r'].includes(part)) return parts[0];
                        else if (['green', 'g'].includes(part)) return parts[1];
                        else if (['blue', 'b'].includes(part)) return parts[2];
                        else if (['alpha', 'a'].includes(part)) return parts[3];
                        else {
                            nssError('func', ['colorpart', part, 'of color type "rgb"/"rgba"/"#"']);
                            return color;
                        }
                    }
                    else if (color.startsWith('hsl')) {
                        if (['hue', 'h'].includes(part)) return parts[0];
                        else if (['saturation', 's'].includes(part)) return parts[1];
                        else if (['lightness', 'l'].includes(part)) return parts[2];
                        else if (['alpha', 'a'].includes(part)) return parts[3];
                        else {
                            nssError('func', ['colorpart', part, 'of color type "hsl"/"hsla"']);
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
                    arg = arg
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
            const logicRegex = arg => `(${signedNumberRegex})\\s*(${arg})\\s*(${signedNumberRegex})`;
            cssOutput = cssOutput
                .replace(nssFunction('@bitwise'), args => {
                    let output = [...getArgs(args)].join('|');
                    for (let i = 0; i < MAX_ARGUMENTS / 10; i++) {
                        output = output
                            .replace(RegExp(`(~|!|not)\\s*(${signedNumberRegex})`), val => { // bitwise not
                                return eval('~' + val.replace(/(~|!|not)/, ''));
                            })
                            .replace(RegExp(logicRegex('or|\\|')), val => { // bitwise or
                                let [a, b] = val.split(/or|\|/);
                                return eval(`(${a}) | (${b})`);
                            })
                            .replace(RegExp(logicRegex('nor')), val => { // bitwise nor
                                let [a, b] = val.split(/nor/);
                                return eval(`~ ( (${a}) | (${b}) )`);
                            })
                            .replace(RegExp(logicRegex('and|&')), val => { // bitwise and
                                let [a, b] = val.split(/and|&/);
                                return eval(`(${a}) & (${b})`);
                            })
                            .replace(RegExp(logicRegex('nand')), val => { // bitwise nand
                                let [a, b] = val.split(/nand/);
                                return eval(`~( (${a}) & (${b}) )`);
                            })
                            .replace(RegExp(logicRegex('xor')), val => { // bitwise xor
                                let [a, b] = val.split(/xor/);
                                return eval(`(${a}) ^ ( ${b})`);
                            })
                            .replace(RegExp(logicRegex('xnor')), val => { // bitwise xnor
                                let [a, b] = val.split(/xnor/);
                                return eval(`~( (${a}) ^ (${b}) )`);
                            })
                    }
                    return output;
                })
                .replace(nssFunction('@boolean'), args => parseLogic(getArgs(args, 1)))
                .replace(nssFunction('@if'), args => parseLogic(getArgs(args, 1)) ? getArgs(args, 2) : getArgs(args, 3))
        }

        // Finalise output
        cssOutput = cssOutput
            .replace(/\$\(.+?\)/g, args => args.includes('static') ? args : '').replace(/@endvar/g, '') // remove unparsed variables
            .replace(/(\s*;)+/g, ';').replace(/\s+/g, ' ').replace(/} */g, '}\n').replace(/\n$/, '') // remove redundant chars

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
document.addEventListener("DOMContentLoaded", function () {
    try { parseNovaSheets(); }
    catch (err) { console.error(err); }
});