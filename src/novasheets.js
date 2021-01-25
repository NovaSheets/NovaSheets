#!/usr/bin/env node

function parseNovaSheets(rawInput, NovaSheets) {

    const isNode = typeof window === 'undefined';

    String.prototype.strim = function () {
        return this.replace(/^\s*(.+?)\s*$/, '$1').replace(/\s+/g, ' ');
    };

    const r = String.raw;
    const hashCode = (str, length = 8) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
        return Math.abs(hash).toString(16).substring(0, length).padStart(length, '0');
    };
    const escapeRegex = str => str.replace(/[.*+?^/${}()|[\]\\]/g, '\\$&');
    const debug = (...args) => console.log('<NovaSheets|debug> ', ...args); // should not be unused in prod

    // Generate list of NovaSheet files and get the contents of each stylesheet
    let stylesheetContents = [], sources = [], externalSheets, inlineSheets;
    if (rawInput && rawInput.input) {
        compileNovaSheets(rawInput.input, rawInput.output);
    }
    else if (rawInput) {
        stylesheetContents = [rawInput.toString()];
        sources = 'raw';
    }
    else {
        externalSheets = document.querySelectorAll('link[rel="novasheet" i], link[rel="novasheets" i]');
        inlineSheets = document.querySelectorAll('[type="novasheet" i], [type="novasheets" i]');

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
            } catch {
                console.warn(`<NovaSheets> File '${fileNames.rel[i]}' cannot be accessed.`);
            }
        }
        for (let contents of inlineSheets) {
            let content = contents.value || contents.innerHTML || contents.innerText;
            stylesheetContents.push(content.replace(/^\s*`|`\s*$/, ''));
            sources.push('inline');
        }
    }

    // Loop through each sheet, parsing the NovaSheet styles
    for (let s in stylesheetContents) {

        // Prepare stylesheet for parsing
        stylesheetContents[s] = stylesheetContents[s]
            .replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
            .replace(/(?<![a-z]+:)\n?\/\/.*$/gm, '') // remove single-line comments
            .replace(/(?:@var.+?=.*$|@var\s*[^=]*(?=\n\s*@var\s.))(?!\n\s*@endvar)/gm, '$& @endvar') // single-line @var declarations
            .replace(/@(var|const|endvar)/g, '\n$&') // put each declarator on its own line for parsing
            .replace(/@option\s*[A-Z_]+\s*(true|false|[0-9]+)|@endvar/g, '$&\n') // put each const on its own line
        let lines = stylesheetContents[s].split('\n');
        let cssOutput = '';
        let commentedContent = [], staticContent = [];
        for (let i in lines) {
            lines[i] = lines[i].replace(/[\r\n]/g, ' '); // remove whitespace
            cssOutput += '\n' + lines[i];
        }
        cssOutput = cssOutput
            .replace(/\s*(?:@var.*?((?=@var)|@endvar)|@option\s*[A-Z_]+\s*(true|false|[0-9]+))/gms, ' ') // remove NSS declarations
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
        let constants = {
            BUILTIN_FUNCTIONS: true,
            DECIMAL_PLACES: false,
            KEEP_NAN: false,
            KEEP_UNPARSED: false,
            MAX_ARGUMENTS: 10,
            MAX_MATH_RECURSION: 5,
            MAX_RECURSION: 50,
        }

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
            else if (lines[i].match(matcher = /^\s*@option\s+/)) {
                let [name, val] = lines[i].replace(matcher, '').split(/\s+/);
                switch (name.toUpperCase()) {
                    case 'BUILTIN_FUNCTIONS': constants.BUILTIN_FUNCTIONS = val !== "0" && val !== "false"; break;
                    case 'DECIMAL_PLACES': constants.DECIMAL_PLACES = val === "false" ? false : val; break;
                    case 'KEEP_NAN': constants.KEEP_NAN = val !== "0" && val !== "false"; break;
                    case 'KEEP_UNPARSED': constants.KEEP_UNPARSED = val !== "0" && val !== "false"; break;
                    case 'MAX_ARGUMENTS': constants.MAX_ARGUMENTS = parseInt(val); break;
                    case 'MAX_MATH_RECURSION': constants.MAX_MATH_RECURSION = parseInt(val); break;
                    case 'MAX_RECURSION': constants.MAX_RECURSION = parseInt(val); break;
                }
            }
        }

        // Save CSS declarations as variables
        cssOutput.replace(/([^{}]+)({.+?})/gms, (_, selector, css) => {
            if (selector.includes('$(') || selector.startsWith('@')) return;
            cssBlocks[escapeRegex(selector.trim().replace(/>/g, ':GT:'))] = css;
        });

        // Functions for later use
        const number = r`(?:[0-9]*\.?[0-9]+)`;
        const basedNumber = r`(?:0x[0-9a-f]*\.?[0-9a-f]+|0b[01]*\.?[01]+|0o[0-7]*\.?[0-7]+|${number})`;
        const quickMathCheck = r`(?:\(\s*${basedNumber}\s*\)|${basedNumber})\s*[a-z]*[-+*^/Ee\s]+(?:\(\s*${basedNumber}\s*\)|${basedNumber})\s*[a-z]*`;
        const numberUnit = r`\s*(?:em|rem|en|ex|px|pt|pc|cm|mm|m(?![ms])|ft|in|s|ms)`;
        const operators = b => r`(?:[-^*/+\s${b ? '()' : ''}]+(?=\d|\.))`;
        const mathChecker = obj => {
            const o = r`\(\s*`, c = r`\s*\)`; // open and close brackets
            const numberValue = `${basedNumber}(?:${numberUnit})?`;
            const optBracketedNumber = `(?:${o}${numberValue}${c}|${numberValue})`;
            const op = obj.op || operators(obj.b);
            let unbracketed = r`(?:(?:${optBracketedNumber}\s*${op}\s*)+(?:${numberValue}))`;
            return r`\(${unbracketed}\)|${unbracketed}`;
        }
        const toNumber = val => constants.KEEP_NAN ? Number(val) : (isNaN(Number(val)) ? '' : Number(val));
        const parseMath = () => {
            cssOutput = cssOutput.replace(/(?<!#)\b(\d+)[Ee](\d+)/g, (_, a, b) => a * 10 ** b)
            for (let i = 0; i < constants.MAX_MATH_RECURSION; i++) {
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
                        .replace(/\d\s*[Ee]\s*\d/g, '$&'.replace(/\s/g, '')) // prepare exponentation
                        .replace(/--/g, '- -') // double negatives don't work in js
                        .replace(/\^/g, '**') // '^' is xor operator in js
                    try { return eval(content) + unit; } catch { return content + unit; }
                });
            }
        };
        const parseFunction = (name, func, { nonest, notrim, allargs } = {}) => {
            parseMath();
            const match = cssOutput.match(RegExp(r`\$\(\s*(?:${name})\b`));
            if (!match) return;
            const searchString = cssOutput.substr(cssOutput.indexOf(match[0]));
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
            const replacer = r`^\$\(${notrim ? '|' : r`\s*|\s*`}\)$`;
            const splitter = notrim ? '|' : /\s*\|\s*/;
            let parts = segment.replace(RegExp(replacer, 'g'), '').split(splitter); // [name, arg1, arg2, ...]
            for (let i = 0; i < constants.MAX_ARGUMENTS; i++) if (parts[i] == undefined) parts[i] = '';
            if (!allargs) for (let i = constants.MAX_ARGUMENTS; i > 0; i--) if (parts[i]) { parts = parts.slice(0, i + 1); break; }
            parts[0] = segment;
            cssOutput = cssOutput.replace(segment, func(...parts));
        };

        // Convert NovaSheets styles to CSS
        const hasNovaSheetsStyles = content => (
            content.includes('$(')
            || content.match(RegExp(quickMathCheck))
            || content.match(/&%</)
        );
        let loop = 0, lastCssOutput;
        while ((hasNovaSheetsStyles(cssOutput) || loop < 1) && loop++ < constants.MAX_RECURSION) {
            if (lastCssOutput === cssOutput) break;
            lastCssOutput = cssOutput;

            // Parse CSS block substitutions
            for (let name in cssBlocks) {
                cssOutput = cssOutput.replace(new RegExp(r`\$<\s*${name.replace(/:GT:/g, '>')}\s*>`), cssBlocks[name] || '{}');
            }
            cssOutput = cssOutput.replace(/\$<.+?>/g, '{}');

            // Parse variable contents
            for (let name in customVars) {
                parseFunction(name, (_, ...paramArgs) => {
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
            for (let i = 0; cssOutput.indexOf('%') > -1 && i++ < constants.MAX_RECURSION; i++) { // % takes the prev
                cssOutput = cssOutput.replace(/([^{}|()]+?){[^{}]*?}[^{}]*?%[^{}]*?{/g, (_, a) => {
                    if (a.includes('%')) return _; // for next pass
                    return _.replace(/(?<!\d)%/g, a.strim());
                });
            }
            for (let i = 0; cssOutput.indexOf('&') > -1 && i++ < constants.MAX_RECURSION; i++) { // & takes the prev parent
                cssOutput = cssOutput.replace(/([^{}|()]+?){[^{}]*?}([^{}]*?&[^{}]*?{[^{}]*})+/g, (_, a) => {
                    if (a.includes('&')) return _; // for next pass
                    return _.replace(/&/g, a.strim() + (a.match(/(?<!\d)%/) ? '<' : ''));
                });
            }
            for (let i = 0; cssOutput.indexOf('<') > -1 && i++ < constants.MAX_RECURSION; i++) {
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
            cssOutput = cssOutput.replace(/{([^{}]*?)}\s*!/gm, (_, css) => css);

            // Parse simple breakpoints
            cssOutput = cssOutput.replace(
                /([^{}]*?)\s*@\s*(?:(\d+px)(?:\s*\.{2,})?(\s*\d+px)?|(\d+px)?(?:\s*\.{2,})?(\s*\d+px))([^{}]*?){(.*?)}/gm,
                (_, sel, min1, max1, min2, max2, selAfter, block) => {
                    let [min, max] = [min1 || min2, max1 || max2];
                    let simpBrkpRegex = r`@\s*(\d+px)?\s*(?:\.{2,})?\s*(\d+px)?`;
                    let selMatch = selAfter.match(RegExp(simpBrkpRegex, 'g'));
                    if (selMatch) [, min, max] = selMatch[selMatch.length - 1].match(RegExp(simpBrkpRegex));
                    let selector = (sel + selAfter).replace(RegExp(simpBrkpRegex, 'g'), '');

                    let query = 'only screen';
                    if (min) query += ` and (min-width: ${min})`;
                    if (max) query += ` and (max-width: ${max}-1px)`;
                    return `@media ${query} { ${selector} { ${block} } }`;
                });

            // Parse functions
            let allFunctions = [];
            if (constants.BUILTIN_FUNCTIONS) {
                const fromImport = isNode ? require('./functions') : addBuiltInFunctions;
                const builtinFunctions = fromImport({ constants });
                allFunctions.push(...builtinFunctions);
            }
            const customFunctions = NovaSheets && NovaSheets.getFunctions && NovaSheets.getFunctions() || [];
            allFunctions.push(...customFunctions);
            for (let obj of allFunctions) {
                parseFunction(obj.name, obj.body);
            }

        }

        // Remove unparsed variables
        if (!constants.KEEP_UNPARSED) {
            cssOutput = cssOutput.replace(/@endvar/g, '');
            let unparsedContent = cssOutput.match(/\$[\[(](.+?)[\])]/g);
            if (unparsedContent) for (let val of unparsedContent) {
                let nssVarName = val.replace(/\$[\[(](.*?)(\|.*)?[\])]/, '$1').strim();
                cssOutput = cssOutput.replace(val, '');
                let type = val.includes('$(') ? 'variable' : 'argument';
                console.log(`<NovaSheets> Instances of unparsed ${type} "${nssVarName}" have been removed from the output.`);
            }
        }

        // Cleanup output
        cssOutput = cssOutput
            // remove redundant chars
            .replace(/(\s*;)+/g, ';').replace(/(?<!^ *) +/gm, ' ')
            // clean up length units
            .replace(/(?<![1-9]+)(0\.\d+)(?=m|s)/, (_, n) => Number(n) * 1000 + 'm')
            .replace(/(?<=\d)0mm/g, 'cm')
            .replace(/(?<=\d)(000mm|00cm)/g, 'm')
            // fix floating point errors
            .replace(/\.?0{10,}\d/g, '').replace(/((\d)\2{9,})\d/g, '$1').replace(/(\d+)([5-9])\2{10,}\d?(?=\D)/g, (_, a) => Number(a) + 1)
            // cleanup decimal places
            .replace(RegExp(r`((\d)\.\d{0,${constants.DECIMAL_PLACES || ''}})(\d?)\d*`), (_, val, pre, after) => {
                if (constants.DECIMAL_PLACES === "0") return after.match(/[5-9]$/) ? parseInt(pre) + 1 : pre;
                else return after.match(/[5-9]$/) ? val.replace(/.$/, '') + (parseInt(val.substr(-1)) + 1).toString() : val
            })
            // cleanup media query endings
            .replace(/}\s*}/, '}\n}')

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

    delete String.prototype.strim;
    return;
}

function compileNovaSheets(inputStr, outputStr, NovaSheets) {
    const fs = require('fs');
    const glob = require('glob');
    try {
        const compile = inputFiles => {
            for (let input of inputFiles) {
                fs.readFile(input, 'utf8', (err, contents) => {
                    if (err) throw `FS_ReadError: Input file '${input}' not found.`;

                    let output = outputStr;

                    const folder = output.includes('/') && output.replace(/\/[^\/]+$/, '');
                    if (folder) {
                        fs.mkdir(folder, { recursive: true }, err => {
                            if (err) throw `FS_MkDirError: Could not create directory '${folder}'.`
                        });
                    }

                    const filename = input.replace(/.+\/([^\/]+)$/, '$1'); // 'foo/bar.ext' -> 'bar.ext'
                    if (!output) {
                        if (hasGlobs) output = input.replace(/\/[^\/]+$/, '/'); // 'foo.ext' -> 'foo/'
                        else output = input.replace(/\.\w+$/, '.css'); // 'foo.ext' -> 'foo.css'
                    }
                    if (output.endsWith('/')) output += filename; // 'foo.nvss bar/' -> 'bar/foo.nvss'
                    else if (hasGlobs) output += '/' + filename; // '*.nvss bar' -> 'bar/$file.nvss'
                    else if (!output.match(/\.\w+$/)) output += '.css'; // 'foo.nvss bar' -> 'bar.css'
                    output = output.replace(/\.\w+$/, '.css'); // force .css extension

                    fs.writeFile(output, parseNovaSheets(contents, NovaSheets), err => {
                        if (err) throw `FS_WriteError: Output file '${output}' is invalid.`;
                        else console.log(`<NovaSheets> Wrote file '${input}' to '${output}'`)
                    });
                });
            }
        }

        const hasGlobs = glob.hasMagic(inputStr);
        if (hasGlobs) {
            glob(inputStr, {}, (err, files) => {
                if (err) throw err;
                compile(files);
            })
        } else {
            compile([inputStr]);
        }

    } catch { }
}

//{% include './functions' %}//

class NovaSheets {
    constructor() {
        this.functions = [];
    }
    static parse(...args) {
        return parseNovaSheets(...args);
    }
    static compile(...args) {
        return compileNovaSheets(...args)
    }
    addFunction(name, func) {
        this.functions.push({ name, body: func });
        return this;
    }
    getFunctions() {
        return this.functions;
    }
}

try {
    module.exports = NovaSheets;
} catch {
    document.addEventListener("DOMContentLoaded", () => NovaSheets.parse()); // Parse NovaSheets styles on page load
}
