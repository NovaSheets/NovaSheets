const balanced = require('balanced-match')
const { MathParser } = require('math-and-unit-parser');

import NovaSheets from './index';
import { CustomFunction, CustomFunctionOptions, Constants } from './common';
import builtInFunctions from './functions';

function parse(content: string, novasheets: NovaSheets = new NovaSheets()): string {
    const r = String.raw;
    const strim = (str: string): string => str.trim().replace(/\s+/g, ' ');
    const escapeRegex = (str: string): string => str.replace(/[.*+?^/${}()|[\]\\]/g, '\\$&');
    const number: string = r`(?:\d*\.?\d+|\d+\.)`;
    const basedNumber: string = r`(?:-?(?:0x[0-9a-f]*\.?[0-9a-f]+|0b[01]*\.?[01]+|0o[0-7]*\.?[0-7]+|${number}))`;
    const numberUnit: string = r`\s*(?:em|rem|en|ex|px|pt|pc|ft|in|s|ms|cm|mm|m)\b`;
    const mathChecker: string = (() => {
        const o = r`\(\s*`, c = r`\s*\)`; // open and close brackets
        const numberValue: string = r`(?:-?${basedNumber}(?:${numberUnit})?)`;
        const optBracketedNumber: string = `(?:${o}${numberValue}${c}|${numberValue})`;
        const operators: string = r`(?:(?:[-^*/+]+\s*)+(?=\d|\.))`;
        const unbracketed: string = r`(?:(?:${optBracketedNumber}\s*${operators}\s*)+${numberValue})`;
        return r`\(\s*${unbracketed}\s*\)|${unbracketed}`;
    })();
    const parseFunction = (name: string, func: Function, opts: CustomFunctionOptions = {}): void => {
        if (RegExp(mathChecker).test(cssOutput)) return; // only run after math is parsed
        const match: string[] = Array.from(cssOutput.match(RegExp(r`\$\(\s*(?:${name})\b`, 'i')) || []);
        if (match.length === 0) return;
        const searchString: string = cssOutput.substr(cssOutput.indexOf(match[0]));
        let segment: string = '';
        let brackets: number = 0;
        let hasBrackets: boolean = false;
        for (let i = 0; i < searchString.length; i++) {
            // search until the initial bracket is matched
            segment += searchString[i];
            if (brackets > 0) hasBrackets = true;
            if (searchString[i] === '(') brackets++;
            if (searchString[i] === ')') brackets--;
            if (hasBrackets && brackets === 0) break;
            if (i === searchString.length - 1 && brackets > 0) return; // prevent overflow
        }
        if (!segment.trim()) return;
        const replacer: RegExp = opts.trim === false ? /^\$\(|\)$/ : /^\$\(\s*|\s*\)$/g;
        const splitter: RegExp | string = opts.trim === false ? '|' : /\s*\|\s*/;
        let parts: string[] = segment.replace(replacer, '').split(splitter); // [name, arg1, arg2, ...]
        for (let i = 0; i < constants.MAX_ARGUMENTS; i++) {
            if (!parts[i]) parts[i] = '';
        }
        if (!opts.allArgs) {
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
    const ESC: Record<string, string> = {
        OPEN_BRACE: Math.random().toString(36).substr(2),
        CLOSE_BRACE: Math.random().toString(36).substr(2),
        SLASH: Math.random().toString(36).substr(2),
    }

    // Prepare stylesheet for parsing //

    let styleContents: string = content
        .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&') // fix html
        .replace(/(?<![a-z]:)\n?\/\/.*$/gm, '') // remove single-line comments
        .replace(/(?:@var.+?=.*$|@var\s*[^=]*(?=\n\s*@var\s.))(?!\n\s*@endvar)/gm, '$& @endvar') // single-line @var declarations
        .replace(/@(var|const|endvar)/g, '\n$&') // put each declarator on its own line for parsing
        .replace(/@option\s*[A-Z_]+\s*(true|false|[0-9]+)|@endvar/g, '$&\n') // put each const on its own line
        .replace(/}}/g, '} }') // ensure the second brace is not skipped over
        .replace(/;(\s*)@/g, ';$1&@') // implicit parent selector for simple breakpoints
    let commentedContent: string[] = [];
    let staticContent: string[] = [];
    let lines: string[] = styleContents.split('\n');
    let cssOutput: string = styleContents
        .replace(/\s*(?:@var.*?((?=@var)|@endvar)|@endvar|@option\s*[A-Z_]+\s*(true|false|[0-9]+))/gms, ' ') // remove syntactic declarations
        .replace(/\/\*(.+?)\*\//gs, (_, content) => {
            if (_.startsWith('/*[') && _.endsWith(']*/')) return _.replace(/^\/\*\[(.+)\]\*\/$/, '/*$1*/'); // parsed comment
            if (_.startsWith('/*/') || _.endsWith('/*/')) return _; // static comment; skip
            if (commentedContent.indexOf(content) < 0) commentedContent.push(content);
            return '/*COMMENT#' + commentedContent.indexOf(content) + '*/';
        }) // store commented content for replacement at end
        .replace(/\/\*\/(.+?)\/\*\//gs, (_, a) => {
            if (staticContent.indexOf(a) < 0) staticContent.push(a);
            return '/*STATIC#' + staticContent.indexOf(a) + '*/';
        }) // store static content for replacement at end
    let customVars: Record<string, string> = {};
    let constants: Constants = {
        BUILTIN_FUNCTIONS: true,
        DECIMAL_PLACES: false,
        KEEP_UNPARSED: false,
        MAX_ARGUMENTS: 10,
        MAX_RECURSION: 50,
    };

    // Generate a list of lines that start variable declarations //

    for (let i in lines) {
        let matcher: RegExp;
        if (lines[i].match(/\s*@var\s/)) {
            const varDeclParts: string[] = lines[i].replace(/\s*@var\s/, '').split('=');
            const linesAfter: string[] = lines.slice(+i);

            let varEnding: number | undefined;
            for (let j in linesAfter) {
                if (linesAfter[j].match(/\s*@endvar\s*|\s*@var\s/) && +j !== 0) {
                    varEnding = +j;
                    break;
                }
            }

            let varName: string = varDeclParts[0].trim().split('|')[0].trim();
            const inlineContent: string = varDeclParts.slice(1).join('=') || '';
            const blockContent: string = linesAfter.slice(1, varEnding).join('\n');
            const variables: RegExp = new RegExp(r`\$\(\s*${varName}\s*\)`, 'g');
            let varContent: string = (inlineContent + blockContent).trim().replace(variables, customVars[varName] || '');
            customVars[varName] = varContent.replace('{', ESC.OPEN_BRACE).replace('}', ESC.CLOSE_BRACE);
        }
        else if (lines[i].match(matcher = /^\s*@option\s+/)) {
            let [name, val]: string[] = lines[i].replace(matcher, '').split(/\s+/);
            const isNotFalse = (val: string): boolean => val !== '0' && val !== 'false';
            switch (name.toUpperCase()) {
                case 'BUILTIN_FUNCTIONS': constants.BUILTIN_FUNCTIONS = isNotFalse(val); break;
                case 'DECIMAL_PLACES': constants.DECIMAL_PLACES = val !== 'false' && +val; break;
                case 'KEEP_UNPARSED': constants.KEEP_UNPARSED = isNotFalse(val); break;
                case 'MAX_ARGUMENTS': constants.MAX_ARGUMENTS = parseInt(val); break;
                case 'MAX_RECURSION': constants.MAX_RECURSION = parseInt(val); break;
            }
        }
    }

    // Compile NovaSheets styles //

    const hasNovaSheetsStyles = (): boolean => cssOutput.includes('$(') || RegExp(mathChecker).test(cssOutput);
    for (let loop = 0, lastCssOutput; loop < 1 || loop < constants.MAX_RECURSION && hasNovaSheetsStyles(); loop++) {
        if (lastCssOutput === cssOutput) break;
        lastCssOutput = cssOutput;

        // Parse math //
        cssOutput = cssOutput
            // convert exponential notation
            .replace(RegExp(r`(?<!#|\w)(${number})\s*e\s*([+-]?${number})`, 'gi'), (_, a, b) => String(+a * 10 ** +b))
            // fix edge case of slashes in CSS functions
            .replace(/((?:rgba?|hsla?)\(.+?[\s\d%]+)\/([\s\d%]+\))/g, (_, before, after) => before + ESC.SLASH + after)
            // compile math
            .replace(RegExp(mathChecker, 'g'), _ => {
                if (/\d[a-z]{0,2}\s+-\d/.test(_)) return _; // delimited values, not subtraction
                let unit: string = '';
                let content: string = _
                    .replace(/\*\*/g, '^')
                    .replace(RegExp(r`(${number})\s*(${numberUnit})`, 'g'), (_, num, u) => {
                        switch (u) {
                            case 'mm': case 'ms': unit = u[1]; return String(+num / 1000);
                            case 'cm': unit = 'm'; return String(+num / 100);
                            case 'in': unit = 'm'; return String(+num * 0.0254);
                            case 'ft': unit = 'm'; return String(+num * 0.3048);
                            default: unit = u; return num;
                        }
                    })
                try { return MathParser(content) + unit; }
                catch { return _; }
            })

        // Parse variable contents //

        for (let name in customVars) {
            parseFunction(name, (_: string, ...paramArgs: string[]): string => {
                let content: string = customVars[name];
                for (const i in paramArgs) {
                    if (!paramArgs[i]) continue;
                    const parts: string[] = paramArgs[i].split('=');
                    const param: string = parts[1] ? strim(parts[0]) : (+i + 1).toString();
                    const arg: string = parts[1] ? strim(parts.slice(1).join('=')) : strim(parts[0]);
                    content = content.replace(RegExp(r`\$\[${param}[^\]]*\]`, 'g'), arg);
                }
                content = content.replace(/\$\[.*?(?:\|([^\]]*))?\]/g, '$1'); // default args
                return content;
            });
        }

        // Parse functions //

        let allFunctions: CustomFunction[] = [];
        if (constants.BUILTIN_FUNCTIONS) allFunctions.push(...builtInFunctions({ constants }));
        allFunctions.push(...(novasheets?.getFunctions() ?? []));
        for (const obj of allFunctions) {
            parseFunction(obj.name, obj.body);
        }

        // Parse nesting //

        let compiledOutput = '';
        const check = (s: string) => balanced('{', '}', s);
        function unnest(css: string, parent: string): void {
            // early return if block has no parent (is an object literal)
            if (!parent && /^\s*{/.test(css)) {
                compiledOutput += css;
                return;
            }
            // parse data
            const data = check(css);
            // check if block has no children
            if (!data) {
                // write styles if there are any
                let styleContent: string = css.trim();
                if (styleContent) compiledOutput += parent ? `{${styleContent}}` : styleContent;
                return;
            }
            // move any trailing styles to front of block
            let endStylesMatch: string = data.body.match(/(?<=})[^{}]+?$/g)?.[0] || '';
            if (endStylesMatch) {
                let endStyles = endStylesMatch;
                if (endStyles.trim() && !/}\s*$/.test(data.body)) endStyles += ';';
                data.body = data.body.replace(endStylesMatch, '').replace(/[^;]+{/, endStyles + '$&');
            }
            // check if block has both styles and children
            let styles: string[] = data.pre.split(';');
            if (styles.length) {
                // remove styles from child selector content
                data.pre = styles.pop();
                // add selectors to parent selector if applicable
                if (styles.length) {
                    let styleContent: string = styles.join(';') + ';';
                    compiledOutput += parent ? `${parent} {${styleContent}}` : styleContent;
                }
            }
            // create selector
            let fullSelector: string = strim(data.pre.includes('&') ? data.pre.replace(/&/g, parent) : parent + ' ' + data.pre);
            // write selector if the block has styles
            if (!/}\s*$/.test(data.body)) compiledOutput += fullSelector;
            // add empty styles if selector has no styles
            if (parent && !data.pre) compiledOutput += '{}';
            // parse children
            unnest(data.body, fullSelector);
            // continue to next block
            unnest(data.post, strim(parent));
        }
        unnest(cssOutput, '');
        const mediaRegex: string = r`@media[^{}]+(?:\([^()]+?\))+`;
        cssOutput = compiledOutput
            .replace(RegExp(r`(${mediaRegex})\s*(?:{})?(?=\s*@media)`, 'g'), '')
            .replace(RegExp(r`(${mediaRegex})\s*([^{}]+){([^{}]+)}`, 'g'), '$1 { $2 {$3} }')

        // Parse CSS block substitutions //

        //save CSS declarations as variables
        cssOutput = cssOutput.replace(ESC.OPEN_BRACE, '{').replace(ESC.CLOSE_BRACE, '}'); // unescape
        const cssBlocks: Record<string, string> = {};
        compiledOutput.replace(/([^{}]+)({.+?})/gms, (_: string, selector: string, css: string) => {
            if (selector.includes('$(') || selector.startsWith('@')) return '';
            selector = selector.replace(/\$(<.+?>){1,2}/g, '')
            const selectorVal: string = escapeRegex(strim(selector));
            cssBlocks[selectorVal] = css;
            return '';
        });
        //substitute blocks
        for (let name in cssBlocks) {
            cssOutput = cssOutput.replace(new RegExp(r`\$<\s*${name}\s*>`), cssBlocks[name] || '{}');
        }
        cssOutput = cssOutput.replace(/\$<.+?>/g, '{}');
        //parse object notation
        cssOutput = cssOutput.replace(/{([^{}]*?)}\s*<([^[\]]*?)>/gm, (_, css, item) => {
            const statements: string[] = css.split(/\s*;\s*/);
            for (const statement of statements) {
                const [attr, val] = statement.split(/\s*:\s*/);
                if (attr.trim() === item.trim()) return val || '';
            }
            return '';
        });
        cssOutput = cssOutput.replace(/{([^{}]*?)}\s*!/gm, (_, css) => css);

        // Parse simple breakpoints //

        cssOutput = cssOutput.replace(
            /([^{};]*?)\s*@\s*(?:(\d+px)(?:\s*\.{2,})?(\s*\d+px)?|(\d+px)?(?:\s*\.{2,})?(\s*\d+px))([^{}]*?){(.*?)}/gms,
            (_, sel, min1, max1, min2, max2, selAfter, block) => {
                let [min, max] = [min1 || min2, max1 || max2];
                let simpleBreakpoint: string = r`@\s*(\d+px)?\s*(?:\.{2,})?\s*(\d+px)?`;
                let selMatch: string[] = selAfter.match(RegExp(simpleBreakpoint, 'g')) as string[];
                if (selMatch) [, min, max] = selMatch[selMatch.length - 1].match(RegExp(simpleBreakpoint)) as string[];
                let selector: string = (sel + selAfter).replace(RegExp(simpleBreakpoint, 'g'), '');

                let query: string[] = [];
                if (min) query.push(`(min-width: ${min})`);
                if (max) query.push(`(max-width: ${max.replace(/\d+/, (d: string) => +d - 1)})`);
                return `@media ${query.join(' and ')} { ${selector} { ${block} } }`;
            }
        );

    }

    // Remove unparsed variables //

    if (!constants.KEEP_UNPARSED) {
        cssOutput = cssOutput.replace(/@endvar/g, '');
        let unparsedContent: string[] = cssOutput.match(/\$[[(](.+?)[\])]/g) || [];
        for (const val of unparsedContent) {
            let nssVarName: string = strim(val.replace(/\$[[(](.*?)(\|.*)?[\])]/, '$1'));
            cssOutput = cssOutput.replace(val, '');
            let type: string = val.includes('$(') ? 'variable' : 'argument';
            console.log(`<NovaSheets> Instances of unparsed ${type} '${nssVarName}' have been removed from the output.`);
        }
    }

    // Cleanup output //

    cssOutput = cssOutput
        // remove redundant chars
        .replace(/(\s*;)+/g, ';')
        .replace(/(?<!^ *) +/gm, ' ')
        .replace(/}\s*/g, '}\n').replace(/}\s*}/g, '} }')
        // clean up length units
        .replace(/(?<![1-9]+)(0\.\d+)\s*(m|s)/, (_, n, u) => +n * 1000 + 'm' + u)
        .replace(/(?<=\d)0\s*mm/g, 'cm')
        .replace(/(?<=\d)(000\s*mm|00\s*cm)/g, 'm')
        // fix floating point errors
        .replace(/\.?0{10,}\d/g, '')
        .replace(/((\d)\2{9,})\d/g, '$1')
        .replace(/(\d+)([5-9])\2{10,}\d?(?=\D)/g, (_, a) => String(+a + 1))
        .replace(/\d*\.?\d+e-(?:7|8|9|\d{2,})/, '0')
        // cleanup decimal places
        .replace(RegExp(r`((\d)\.\d{0,${constants.DECIMAL_PLACES}})(\d?)\d*`, 'g'), (_, val, pre, after) => {
            const roundsUp: boolean = /[5-9]$/.test(after);
            if (constants.DECIMAL_PLACES === 0) return roundsUp ? parseInt(pre) + 1 : pre;
            else return roundsUp ? val.replace(/.$/, '') + (parseInt(val.substr(-1)) + 1) : val;
        })
        // fix calc() output
        .replace(/calc(\d)/g, '$1')
        // restore characters
        .replace(new RegExp(ESC.SLASH, 'g'), '/')
    // re-add comments to output
    for (const i in staticContent) {
        cssOutput = cssOutput.replace(RegExp(r`\/\*STATIC#${i}\*\/`, 'g'), strim(staticContent[i]));
    }
    for (const i in commentedContent) {
        cssOutput = cssOutput.replace(RegExp(r`\/\*COMMENT#${i}\*\/`, 'g'), '/*' + commentedContent[i] + '*/');
    }

    // Return output //
    return cssOutput.trim() + '\n';
}

export = parse;
