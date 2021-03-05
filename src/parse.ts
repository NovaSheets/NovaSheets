import NovaSheets from './novasheets';
import { ParsingReturn, ParsingInput, Constants } from './types';

const addBuiltInFunctions = require('./functions');

//@export
function run(rawInput = '', novasheets: NovaSheets): ParsingReturn {
    return parse(prepare(rawInput), novasheets);
}
function prepare(rawInput = ''): ParsingInput {
    // Generate list of NovaSheet files and get the contents of each stylesheet
    let stylesheetContents = [];
    let sources: string[] = [];
    let externalSheets: HTMLLinkElement[];
    let inlineSheets: HTMLElement[];
    if (rawInput) {
        stylesheetContents = [rawInput.toString()];
        sources = ['raw'];
    }
    else {
        externalSheets = Array.from(document.querySelectorAll('link[rel="novasheet" i], link[rel="novasheets" i]'));
        inlineSheets = Array.from(document.querySelectorAll('[type="novasheet" i], [type="novasheets" i]'));

        let fileNames: Record<string, string[]> = { full: [], rel: [] };
        for (let sheet of externalSheets) {
            fileNames.full.push(sheet.href);
            fileNames.rel.push(sheet.href);
        };
        for (let i in fileNames.full) {
            /*const response = fetch(fileNames.full[i])
              .then(data => data)
              .catch(err => console.warn(`<NovaSheets> File '${fileNames.rel[i]}' cannot be accessed.`, err));*/
            let req = new XMLHttpRequest();
            req.open("GET", fileNames.full[i], false);
            req.send();
            if (req.status == 404) throw 404;
            let response = req.responseText;
            stylesheetContents.push(response);
            sources.push(fileNames.rel[i]);
        }
        for (let contents of inlineSheets) {
            let content = (contents instanceof HTMLInputElement && contents.value) || contents.innerHTML || contents.innerText;
            stylesheetContents.push(content.replace(/^\s*`|`\s*$/, ''));
            sources.push('inline');
        };
    }
    return { rawInput, stylesheetContents, sources };
}

function parse({ rawInput, stylesheetContents, sources }: ParsingInput, NovaSheets: NovaSheets): ParsingReturn {

    const r = String.raw;
    const strim = (str: string): string => str.replace(/^\s*(.+?)\s*$/, '$1').replace(/\s+/g, ' ');
    const hashCode = (str: string, length: number = 8): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
        return Math.abs(hash).toString(16).substring(0, length).padStart(length, '0');
    };
    const escapeRegex = (str: string): string => str.replace(/[.*+?^/${}()|[\]\\]/g, '\\$&');

    // Loop through each sheet, parsing the NovaSheet styles
    for (let s in stylesheetContents) {

        // Functions for later use
        const number = r`(?:[0-9]*\.?[0-9]+)`;
        const basedNumber = r`(?:-?(?:0x[0-9a-f]*\.?[0-9a-f]+|0b[01]*\.?[01]+|0o[0-7]*\.?[0-7]+|${number}))`;
        const numberUnit = r`\s*(?:em|rem|en|ex|px|pt|pc|cm|mm|m(?![ms])|ft|in|s|ms)`;
        const mathChecker = () => {
            const o = r`\(\s*`, c = r`\s*\)`; // open and close brackets
            const numberValue = r`(?:-?${basedNumber}(?:${numberUnit})?)`;
            const optBracketedNumber = `(?:${o}${numberValue}${c}|${numberValue})`;
            const operators = r`(?:[-^*/+]+\s*(?=\d|\.))`;
            let unbracketed = r`(?:(?:${optBracketedNumber}\s*${operators}\s*)+${numberValue})`;
            return r`\(\s*${unbracketed}\s*\)|${unbracketed}`;
        };
        const toNumber = (val: any): number | '' => constants.KEEP_NAN ? Number(val) : (isNaN(Number(val)) ? '' : Number(val));
        const parseFunction = function (name: string, func: Function, { nonest, notrim, allargs }: Record<string, boolean> = {}): void {
            const match = cssOutput.match(RegExp(r`\$\(\s*(?:${name})\b`));
            if (!match) return;
            const searchString = cssOutput.substr(cssOutput.indexOf(match[0]));
            let segment = '', brackets = 0, hasBrackets;
            for (let i = 0; i < searchString.length; i++) {
                // search until the initial bracket is matched
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
            for (let i = 0; i < constants.MAX_ARGUMENTS; i++) {
                if (parts[i] == undefined) parts[i] = '';
            }
            if (!allargs) {
                for (let i = +constants.MAX_ARGUMENTS; i > 0; i--) {
                    if (parts[+i]) {
                        parts = parts.slice(0, i + 1);
                        break;
                    }
                }
            }
            parts[0] = segment;
            cssOutput = cssOutput.replace(segment, func(...parts));
        };

        // Prepare stylesheet for parsing
        stylesheetContents[s] = stylesheetContents[s]
            .replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
            .replace(/(?<![a-z]+:)\n?\/\/.*$/gm, '') // remove single-line comments
            .replace(/(?:@var.+?=.*$|@var\s*[^=]*(?=\n\s*@var\s.))(?!\n\s*@endvar)/gm, '$& @endvar') // single-line @var declarations
            .replace(/@(var|const|endvar)/g, '\n$&') // put each declarator on its own line for parsing
            .replace(/@option\s*[A-Z_]+\s*(true|false|[0-9]+)|@endvar/g, '$&\n') // put each const on its own line
            ;
        let lines = stylesheetContents[s].split('\n');
        let cssOutput = '';
        let commentedContent: string[] = [];
        let staticContent: string[] = [];
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
            ;
        let customVars: Record<string, string> = {};
        let cssBlocks: Record<string, string> = {};
        const constants: Constants = {
            BUILTIN_FUNCTIONS: true,
            DECIMAL_PLACES: false,
            KEEP_NAN: false,
            KEEP_UNPARSED: false,
            MAX_ARGUMENTS: 10,
            MAX_MATH_RECURSION: 5,
            MAX_RECURSION: 50,
        };

        // Generate a list of lines that start variable declarations
        for (let i in lines) {
            let matcher: RegExp;
            if (lines[i].match(/^\s*@var\s/)) {
                let varDeclParts: string[] = lines[i].replace(/^\s*@var\s/, '').split('=');
                let linesAfter: string[] = lines.slice(+i);

                let varEnding: number | undefined;
                for (let j in linesAfter) {
                    if (linesAfter[j].match(/^\s*@endvar\s*$|^\s*@var\s/) && +j !== 0) {
                        varEnding = +j;
                        break;
                    }
                }

                let varName: string = varDeclParts[0].trim().split('|')[0].trim();
                const inlineContent = varDeclParts.slice(1).join('=') || '';
                const blockContent = linesAfter.slice(1, varEnding).join('\n');
                const varRegex = new RegExp(r`\$\(\s*${varName}\s*\)`, 'g');
                let varContent = (inlineContent + blockContent).trim().replace(varRegex, customVars[varName] || '');
                customVars[varName] = varContent;
            }
            else if (lines[i].match(matcher = /^\s*@option\s+/)) {
                let [name, val]: string[] = lines[i].replace(matcher, '').split(/\s+/);
                const isNotFalse = (val: string) => val !== '0' && val !== 'false';
                switch (name.toUpperCase()) {
                    case 'BUILTIN_FUNCTIONS': constants.BUILTIN_FUNCTIONS = isNotFalse(val); break;
                    case 'DECIMAL_PLACES': constants.DECIMAL_PLACES = val !== 'false' && +val; break;
                    case 'KEEP_NAN': constants.KEEP_NAN = isNotFalse(val); break;
                    case 'KEEP_UNPARSED': constants.KEEP_UNPARSED = isNotFalse(val); break;
                    case 'MAX_ARGUMENTS': constants.MAX_ARGUMENTS = parseInt(val); break;
                    case 'MAX_MATH_RECURSION': constants.MAX_MATH_RECURSION = parseInt(val); break;
                    case 'MAX_RECURSION': constants.MAX_RECURSION = parseInt(val); break;
                }
            }
        }

        // Save CSS declarations as variables
        cssOutput.replace(/([^{}]+)({.+?})/gms, (_: string, selector: string, css: string) => {
            if (selector.includes('$(') || selector.startsWith('@')) return '';
            cssBlocks[escapeRegex(selector.trim().replace(/>/g, ':GT:'))] = css;
            return '';
        });

        // Compile NovaSheets styles

        const hasNovaSheetsStyles = (content: string): boolean => (
            content.includes('$(')
            || RegExp(mathChecker()).test(content)
            || /&%</.test(content)
        );
        for (let loop = 0, lastCssOutput; loop < 1 || loop < constants.MAX_RECURSION && hasNovaSheetsStyles(cssOutput); loop++) {
            if (lastCssOutput === cssOutput) break;
            lastCssOutput = cssOutput;

            // Parse CSS block substitutions
            for (let name in cssBlocks) {
                cssOutput = cssOutput.replace(new RegExp(r`\$<\s*${name.replace(/:GT:/g, '>')}\s*>`), cssBlocks[name] || '{}');
            }
            cssOutput = cssOutput.replace(/\$<.+?>/g, '{}');

            // Parse math
            cssOutput = cssOutput.replace(/(?<!#)\b(\d+)\s*[Ee]\s*(-?\d+)/g, (_, a, b) => String(+a * 10 ** +b));
            for (let i = 0; i < constants.MAX_MATH_RECURSION; i++) {
                if (!cssOutput.match(RegExp(mathChecker()))) break;
                cssOutput = cssOutput.replace(RegExp(mathChecker(), 'g'), mathMatch => {
                    let matchesOnlyBrackets = !mathMatch.match(/[-+Ee^*/]/);
                    let containsUnitList = mathMatch.match(RegExp(r`${numberUnit}\s-?${basedNumber}`));
                    if (matchesOnlyBrackets || containsUnitList) return mathMatch;

                    let numMatch = mathMatch.match(RegExp(numberUnit, 'g')) || [];
                    let unit = numMatch.pop() || '';
                    let content = mathMatch
                        .replace(RegExp(r`(${number})\s*(${numberUnit})`, 'g'), (_, num, u): string => {
                            switch (u) {
                                case 'mm': case 'ms': unit = u[1]; return String((toNumber(num) || 0) / 1000);
                                case 'cm': unit = 'm'; return String((toNumber(num) || 0) / 100);
                                case 'in': unit = 'm'; return String((toNumber(num) || 0) * 0.0254);
                                case 'ft': unit = 'm'; return String((toNumber(num) || 0) * 0.3048);
                                default: return _;
                            }
                        })
                        .replace(RegExp(numberUnit, 'g'), '')
                        .replace(/--|\+\+/g, '+') // double operators don't work in js
                        .replace(/\^/g, '**') // '^' is xor operator in js
                        ;
                    try { return eval(content) + unit; } catch { return content + unit; }
                });
            }

            // Parse variable contents
            for (let name in customVars) {
                parseFunction(name, (_: string, ...paramArgs: string[]): string => {
                    let content = customVars[name];
                    for (let i in paramArgs) {
                        if (!paramArgs[i]) continue;
                        let parts = paramArgs[i].split('=');
                        let param = parts[1] ? strim(parts[0]) : +i + 1;
                        let arg = parts[1] ? strim(parts[1]) : strim(parts[0]);
                        content = content.replace(RegExp(r`\$\[${param}[^\]]*\]`, 'g'), arg);
                    }
                    content = content.replace(/\$\[.*?(?:\|([^\]]*))?\]/g, '$1'); // default args
                    return content;
                });
            }

            // Parse prev selectors
            for (let i = 0, lastOutput; cssOutput.indexOf('%') > -1 && i++ < constants.MAX_RECURSION; i++) { // % takes the prev
                if (cssOutput === lastOutput) break;
                lastOutput = cssOutput;
                const selector = /([^{}|()]+?){[^{}]*?}[^{}]*?%[^{}]*?{/g;
                if (!cssOutput.match(selector)) break;
                cssOutput = cssOutput.replace(selector, (_, a) => {
                    if (a.includes('%')) return _; // for next pass
                    return _.replace(/(?<!\d)%/g, strim(a));
                });
            }
            for (let i = 0, lastOutput; cssOutput.indexOf('&') > -1 && i++ < constants.MAX_RECURSION; i++) { // & takes the prev parent
                if (cssOutput === lastOutput) break;
                lastOutput = cssOutput;
                const selector = /([^{}|()]+?){[^{}]*?}([^{}]*?&[^{}?]*?{[^{}]*})+/g;
                if (!cssOutput.match(selector)) break;
                cssOutput = cssOutput.replace(selector, (_, a) => {
                    if (a.includes('&')) return _; // for next pass
                    return _.replace(/&/g, strim(a) + (a.match(/(?<!\d)%/) ? '<' : ''));
                });
            }
            for (let i = 0, lastOutput; cssOutput.indexOf('<') > -1 && i++ < constants.MAX_RECURSION; i++) {
                if (cssOutput === lastOutput) break;
                lastOutput = cssOutput;
                const selector = /[>+~\s]\s*[^&%{}>+~\s<]+\s*</g;
                if (!cssOutput.match(selector)) break;
                cssOutput = cssOutput.replace(selector, '');
            }

            // Parse object notation
            cssOutput = cssOutput.replace(/{([^{}]*?)}\s*<([^[\]]*?)>/gm, (_, css, item) => {
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
                }
            );

            // Parse functions
            let allFunctions = [];
            if (constants.BUILTIN_FUNCTIONS) {
                const builtinFunctions = addBuiltInFunctions({ constants });
                allFunctions.push(...builtinFunctions);
            }
            const customFunctions = NovaSheets?.getFunctions() || [];
            allFunctions.push(...customFunctions);
            for (let obj of allFunctions) {
                parseFunction(obj.name, obj.body);
            }

        }

        // Remove unparsed variables
        if (!constants.KEEP_UNPARSED) {
            cssOutput = cssOutput.replace(/@endvar/g, '');
            let unparsedContent = cssOutput.match(/\$[[(](.+?)[\])]/g);
            if (unparsedContent) for (let val of unparsedContent) {
                let nssVarName = strim(val.replace(/\$[[(](.*?)(\|.*)?[\])]/, '$1'));
                cssOutput = cssOutput.replace(val, '');
                let type = val.includes('$(') ? 'variable' : 'argument';
                console['log'](`<NovaSheets> Instances of unparsed ${type} "${nssVarName}" have been removed from the output.`);
            }
        }

        // Cleanup output
        cssOutput = cssOutput
            // remove redundant chars
            .replace(/(\s*;)+/g, ';')
            .replace(/(?<!^ *) +/gm, ' ')
            // clean up length units
            .replace(/(?<![1-9]+)(0\.\d+)(?=m|s)/, (_, n) => Number(n) * 1000 + 'm')
            .replace(/(?<=\d)0mm/g, 'cm')
            .replace(/(?<=\d)(000mm|00cm)/g, 'm')
            // fix floating point errors
            .replace(/\.?0{10,}\d/g, '').replace(/((\d)\2{9,})\d/g, '$1').replace(/(\d+)([5-9])\2{10,}\d?(?=\D)/g, (_, a) => String(+a + 1))
            // cleanup decimal places
            .replace(RegExp(r`((\d)\.\d{0,${constants.DECIMAL_PLACES}})(\d?)\d*`), (_, val, pre, after) => {
                const roundsUp = /[5-9]$/.test(after);
                console.log(384, [_, val, roundsUp, pre, after])
                if (constants.DECIMAL_PLACES === 0) {
                    return roundsUp ? parseInt(pre) + 1 : pre;
                }
                else {
                    return roundsUp ? val.replace(/.$/, '') + (parseInt(val.substr(-1)) + 1) : val;
                }
            })
            // cleanup media query endings
            .replace(/}\s*}/g, '}\n}')
            ;

        // Readd comments to the output
        for (let i in staticContent) {
            cssOutput = cssOutput.replace(RegExp(r`\/\*STATIC#${i}\*\/`, 'g'), strim(staticContent[i]));
        }
        for (let i in commentedContent) {
            cssOutput = cssOutput.replace(RegExp(r`\/\*COMMENT#${i}\*\/`, 'g'), '/*' + commentedContent[i] + '*/');
        }

        // Output: return (node) or add to page (browser)
        if (rawInput) {
            return cssOutput.trim();
        }
        else {
            if (document.querySelectorAll(`[data-hash="${hashCode(cssOutput)}"]`).length) break; // prevent duplicate outputs
            let styleElem = document.createElement('style');
            styleElem.innerHTML = '\n' + cssOutput.trim() + '\n';
            styleElem.dataset.hash = hashCode(cssOutput);
            styleElem.dataset.source = sources[s];
            (document.head || document.body).appendChild(styleElem);
        }

    }

    return;
}

const parseNovaSheets: Function = run;
//@end
;
export = parseNovaSheets;
