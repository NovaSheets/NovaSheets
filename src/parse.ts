import NovaSheets from './novasheets';
import { CustomFunction, CustomFunctionOptions, Constants } from './common';
import builtInFunctions from './functions';

//@export

function parse(content: string, novasheets: NovaSheets = new NovaSheets()): string {
    const r = String.raw;
    const strim = (str: string): string => str.replace(/^\s*(.+?)\s*$/, '$1').replace(/\s+/g, ' ');
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
    const toNumber = (val: any): number => constants.KEEP_NAN ? +val : (isNaN(+val) ? 0 : +val);
    const parseFunction = (name: string, func: Function, opts: CustomFunctionOptions = {}): void => {
        if (RegExp(mathChecker).test(cssOutput)) return; // only run after math is parsed
        const match: string[] = Array.from(cssOutput.match(RegExp(r`\$\(\s*(?:${name})\b`)) || []);
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

    // Prepare stylesheet for parsing //

    let styleContents: string = content
        .replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
        .replace(/(?<![a-z]:)\n?\/\/.*$/gm, '') // remove single-line comments
        .replace(/(?:@var.+?=.*$|@var\s*[^=]*(?=\n\s*@var\s.))(?!\n\s*@endvar)/gm, '$& @endvar') // single-line @var declarations
        .replace(/@(var|const|endvar)/g, '\n$&') // put each declarator on its own line for parsing
        .replace(/@option\s*[A-Z_]+\s*(true|false|[0-9]+)|@endvar/g, '$&\n') // put each const on its own line
        .replace(/}}/g, '} }') // ensure the second brace is not skipped over
        .replace(/calc\(.+?\)/g, '/*/$&/*/') // skip parsing of vanilla CSS calc()
        .replace(/(rgba?|hsla?)\(\d+%?\s+\d+%?\s*\d+%?\s*(\/\s*\d+%?)?\)/g, '/*/$&/*/') // skip parsing of vanilla CSS4 color functions
    let commentedContent: string[] = [];
    let staticContent: string[] = [];
    let lines: string[] = styleContents.split('\n');
    let cssOutput: string = styleContents
        .replace(/\s*(?:@var.*?((?=@var)|@endvar)|@option\s*[A-Z_]+\s*(true|false|[0-9]+))/gms, ' ') // remove syntactic declarations
        .replace(/\/\*(.+?)\*\//gs, (_, a) => {
            if (_.startsWith('/*[') && _.endsWith(']*/')) return _.replace(/^\/\*\[(.+)\]\*\/$/, '/*$1*/'); // parsed comment
            if (_.startsWith('/*/') || _.endsWith('/*/')) return _; // static comment; skip
            if (commentedContent.indexOf(a) < 0) commentedContent.push(a);
            return '/*COMMENT#' + commentedContent.indexOf(a) + '*/';
        }) // store commented content for replacement at end
        .replace(/\/\*\/(.+?)\/\*\//gs, (_, a) => {
            if (staticContent.indexOf(a) < 0) staticContent.push(a);
            return '/*STATIC#' + staticContent.indexOf(a) + '*/';
        }) // store static content for replacement at end
    let customVars: Record<string, string> = {};
    let constants: Constants = {
        BUILTIN_FUNCTIONS: true,
        DECIMAL_PLACES: false,
        KEEP_NAN: false,
        KEEP_UNPARSED: false,
        MAX_ARGUMENTS: 10,
        MAX_MATH_RECURSION: 5,
        MAX_RECURSION: 50,
    };

    // Generate a list of lines that start variable declarations //

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
            const inlineContent: string = varDeclParts.slice(1).join('=') || '';
            const blockContent: string = linesAfter.slice(1, varEnding).join('\n');
            const variables: RegExp = new RegExp(r`\$\(\s*${varName}\s*\)`, 'g');
            let varContent: string = (inlineContent + blockContent).trim().replace(variables, customVars[varName] || '');
            customVars[varName] = varContent;
        }
        else if (lines[i].match(matcher = /^\s*@option\s+/)) {
            let [name, val]: string[] = lines[i].replace(matcher, '').split(/\s+/);
            const isNotFalse = (val: string): boolean => val !== '0' && val !== 'false';
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

    // Compile NovaSheets styles //

    const hasNovaSheetsStyles = (): boolean => cssOutput.includes('$(') || RegExp(mathChecker).test(cssOutput);
    for (let loop = 0, lastCssOutput; loop < 1 || loop < constants.MAX_RECURSION && hasNovaSheetsStyles(); loop++) {
        if (lastCssOutput === cssOutput) break;
        lastCssOutput = cssOutput;

        // Parse math //
        cssOutput = cssOutput.replace(RegExp(r`(?<!#|\w)(${number})\s*e\s*([+-]?${number})`, 'gi'), (_, a, b) => String(+a * 10 ** +b));
        for (let i = 0; i < constants.MAX_MATH_RECURSION; i++) {
            if (!cssOutput.match(RegExp(mathChecker))) break;
            if (/\d\s+-\d/.test(cssOutput)) break; // avoid edge cases like '0 -2em'
            cssOutput = cssOutput.replace(RegExp(mathChecker, 'g'), mathMatch => {
                let matchesOnlyBrackets: boolean = !/[-+^*/]/.test(mathMatch);
                let containsUnitList: string[] = mathMatch.match(RegExp(r`${numberUnit}\s-?${basedNumber}`)) as string[];
                if (matchesOnlyBrackets || containsUnitList) return mathMatch;

                let numMatch = mathMatch.match(RegExp(numberUnit, 'g')) || [];
                let unit: string = numMatch.pop() || '';
                let content: string = mathMatch
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
                    .replace(/-\s*-|\+\s*\+/g, '+') // double operators don't work in js
                    .replace(/\^/g, '**') // '^' is xor operator in js
                try { return eval(content) + unit; } catch { return content + unit; }
            });
        }

        // Parse variable contents //

        for (let name in customVars) {
            parseFunction(name, (_: string, ...paramArgs: string[]): string => {
                let content: string = customVars[name];
                for (const i in paramArgs) {
                    if (!paramArgs[i]) continue;
                    const parts: string[] = paramArgs[i].split('=');
                    const param: string = parts[1] ? strim(parts[0]) : (+i + 1).toString();
                    const arg: string = parts[1] ? strim(parts[1]) : strim(parts[0]);
                    content = content.replace(RegExp(r`\$\[${param}[^\]]*\]`, 'g'), arg);
                }
                content = content.replace(/\$\[.*?(?:\|([^\]]*))?\]/g, '$1'); // default args
                return content;
            });
        }

        // Parse functions //

        let allFunctions: CustomFunction[] = [];
        if (constants.BUILTIN_FUNCTIONS) allFunctions.push(...builtInFunctions({ constants }));
        allFunctions.push(...(novasheets?.getFunctions() || []));
        for (const obj of allFunctions) {
            parseFunction(obj.name, obj.body);
        }

        // Parse nesting //

        type TokenName = 'Root' | 'Style' | 'Block';
        type Token = { name: TokenName, content: string, body: Token[] };
        let content: string = '';
        let tokenTree: Token[] = [{ name: 'Root', content: '', body: [] }];
        let selectorTree: string[] = [];
        let rawAtRules = '';
        cssOutput = cssOutput.replace(/@(import|charset|namespace)(.+?);/g, (m) => { rawAtRules += m; return ''; });
        // loop through stylesheet and create a token tree
        for (let i = 0; i < cssOutput.length; i++) {
            const char: string = cssOutput[i];
            const stylesMatch: RegExp = /[\w-]+:[^;]+;/g;
            const trailingSelectorMatch: RegExp = /[^;]+$/;
            let currentToken: Token = tokenTree[tokenTree.length - 1];
            if (char === '{') {
                if (!content) continue;

                let selector: string = content.replace(stylesMatch, '').trim();
                let styles: string = content.replace(trailingSelectorMatch, '').trim();

                if (styles) {
                    currentToken.body.push({ name: 'Style', content: styles, body: [] });
                }

                const parentSelector: string = selectorTree[selectorTree.length - 1] || '';
                if (selector.includes('&')) {
                    selector = selector.replace(/&/g, parentSelector).trim();
                }
                else {
                    selector = parentSelector.split(',').map(psel => psel + ' ' + selector).join(',');
                }
                selectorTree.push(selector.trim());

                let newToken: Token = { name: 'Block', content: selector, body: [] };
                currentToken.body.push(newToken);
                currentToken = newToken;
                tokenTree.push(currentToken);
                content = '';
            }
            else if (char === '}') {
                if (tokenTree.length < 1 || !content) continue;
                selectorTree.pop();
                currentToken = tokenTree.pop() as Token;
                if (content.trim()) {
                    currentToken.body.push({ name: 'Style', content: content.trim(), body: [] });
                }
                content = '';
            }
            else {
                content += char;
            }
        }
        // clear parsed blocks
        const blockRegex: RegExp = /[^{}]+{[^{}]*}/gs;
        while (blockRegex.test(cssOutput)) {
            cssOutput = cssOutput.replace(blockRegex, '');
        }
        // move all sub-blocks to root
        let blocks: Token[] = [];
        const flatten = (obj: Token): void => {
            if (!obj) return;
            for (const o of obj.body) {
                if (o.name === 'Style') blocks.push({ name: obj.name, content: obj.content, body: [o] });
                else flatten(o);
            }
        };
        flatten(tokenTree[0]);
        // create unnested CSS
        let flattenedOutput: string = '';
        for (const block of blocks) {
            flattenedOutput += block.content + ' {' + block.body[0].content + '}';
        }
        let compiledOutput = rawAtRules + flattenedOutput + cssOutput;
        const mediaRegex: string = r`@media[^{}]+(?:\([^()]+?\))+`;
        cssOutput = compiledOutput
            .replace(RegExp(r`(${mediaRegex})\s*(?:{})?(?=\s*@media)`, 'g'), '')
            .replace(RegExp(r`(${mediaRegex})\s*([^{}]+){([^{}]+)}`, 'g'), '$1 { $2 {$3} }')

        // Parse CSS block substitutions //

        //save CSS declarations as variables
        let cssBlocks: Record<string, string> = {};
        flattenedOutput.replace(/([^{}]+)({.+?})/gms, (_: string, selector: string, css: string) => {
            if (selector.includes('$(') || selector.startsWith('@')) return '';
            selector = selector.replace(/\$(<.+?>){1,2}/g, '')
            cssBlocks[escapeRegex(selector.trim())] = css;
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
            /([^{}]*?)\s*@\s*(?:(\d+px)(?:\s*\.{2,})?(\s*\d+px)?|(\d+px)?(?:\s*\.{2,})?(\s*\d+px))([^{}]*?){(.*?)}/gms,
            (_, sel, min1, max1, min2, max2, selAfter, block) => {
                let [min, max] = [min1 || min2, max1 || max2];
                let simpleBreakpoint: string = r`@\s*(\d+px)?\s*(?:\.{2,})?\s*(\d+px)?`;
                let selMatch: string[] = selAfter.match(RegExp(simpleBreakpoint, 'g')) as string[];
                if (selMatch) [, min, max] = selMatch[selMatch.length - 1].match(RegExp(simpleBreakpoint)) as string[];
                let selector: string = (sel + selAfter).replace(RegExp(simpleBreakpoint, 'g'), '');

                let query: string = 'only screen';
                if (min) query += ` and (min-width: ${min})`;
                if (max) query += ` and (max-width: ${max}-1px)`;
                return `@media ${query} { ${selector} { ${block} } }`;
            }
        );
        const dupedMediaQuery: RegExp = /(@media.+?\s*){(.+?)}\s*\1\s*{/gms;
        while (dupedMediaQuery.test(cssOutput)) {
            cssOutput = cssOutput.replace(dupedMediaQuery, '$1{$2');
        }

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
        .replace(RegExp(r`((\d)\.\d{0,${constants.DECIMAL_PLACES}})(\d?)\d*`), (_, val, pre, after) => {
            const roundsUp: boolean = /[5-9]$/.test(after);
            if (constants.DECIMAL_PLACES === 0) return roundsUp ? parseInt(pre) + 1 : pre;
            else return roundsUp ? val.replace(/.$/, '') + (parseInt(val.substr(-1)) + 1) : val;
        })
    // re-add comments to output
    for (const i in staticContent) {
        cssOutput = cssOutput.replace(RegExp(r`\/\*STATIC#${i}\*\/`, 'g'), strim(staticContent[i]));
    }
    for (const i in commentedContent) {
        cssOutput = cssOutput.replace(RegExp(r`\/\*COMMENT#${i}\*\/`, 'g'), '/*' + commentedContent[i] + '*/');
    }

    // Return output //
    return cssOutput.trim();
}

//@end
;
export = parse;
