const balanced = require('balanced-match');
const { MathParser } = require('math-and-unit-parser');

import NovaSheets from './index';
import { CustomFunction, CustomFunctionOptions, Constants, CustomFunctionBody } from './common';
import builtInFunctions from './functions';
import { regexes } from './regex';

function parse(content: string, novasheets: NovaSheets = new NovaSheets()): string {
    const r = String.raw;
    const strim = (str: string): string => str.trim().replace(/\s+/g, ' ');
    const escapeRegex = (str: string): string => str.replace(/[.*+?^/${}()|[\]\\]/g, '\\$&');
    const replaceAll = (src: string, a: string, b: string): string => src.replace(new RegExp(escapeRegex(a), 'g'), b);
    const mathOperation: string = regexes.mathChecker().source;
    const parseFunction = (name: string, func: CustomFunctionBody, opts: CustomFunctionOptions = {}): void => {
        if (new RegExp(mathOperation).test(cssOutput)) return; // only run after math is parsed
        const match = cssOutput.match(RegExp(r`\$\(\s*(?:${name})\b`, 'i'));
        if (!match) return;
        const searchString: string = cssOutput.substr(cssOutput.indexOf(match[0]));
        const segment = balanced('(', ')', searchString).body;
        const fullSegment = '$(' + segment + ')';
        let parts: string[] = segment.split('|'); // [name, arg1, arg2, ...]
        if (opts.trim !== false) parts = parts.map(part => part.trim());
        cssOutput = replaceAll(cssOutput, fullSegment, func(fullSegment, ...parts.slice(1)).toString());
    };
    const ESC: Record<string, string> = {
        OPEN_BRACE: Math.random().toString(36).substr(2),
        CLOSE_BRACE: Math.random().toString(36).substr(2),
        SLASH: Math.random().toString(36).substr(2),
    }

    // Prepare stylesheet for parsing //

    let styleContents: string = content
        .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&') // fix html
        .replace(regexes.singleLineComment('gm'), '') // remove single-line comments
        .replace(regexes.singleLineVarDeclaration('gm'), '$& @endvar') // single-line @var declarations
        .replace(/@(var|const|endvar)/g, '\n$&') // put each declarator on its own line for parsing
        .replace(regexes.singleLineDeclarations('g'), '$&\n') // put each const on its own line
        .replace(/}}/g, '} }') // ensure the second brace is not skipped over
        .replace(regexes.implicitParentSelector('g'), ';$1&@') // implicit parent selector for simple breakpoints
    let commentedContent: string[] = [];
    let staticContent: string[] = [];
    let lines: string[] = styleContents.split('\n');
    let cssOutput: string = styleContents;
    let customVars: Record<string, string> = {};
    let constants: Constants = {
        BUILTIN_FUNCTIONS: true,
        DECIMAL_PLACES: false,
        KEEP_UNPARSED: false,
        MAX_ARGUMENTS: 10,
    };

    // Remove comments from output //
    cssOutput = cssOutput
        // .replace(regexes.syntacticDeclaration('gms'), ' ') // remove syntactic declarations
        // store commented content for substitution when done
        .replace(regexes.blockComment('gs'), (_, content) => {
            if (_.startsWith('/*[') && _.endsWith(']*/')) return _.replace(/^\/\*\[/, '/*').replace(/\]\*\/$/, '*/'); // parsed comment
            if (_.startsWith('/*/') || _.endsWith('/*/')) return _; // static comment; skip
            if (commentedContent.indexOf(content) < 0) commentedContent.push(content);
            return '/*COMMENT#' + commentedContent.indexOf(content) + '*/';
        })
        // store static content for substitution when done
        .replace(regexes.staticComment('gs'), (_, a) => {
            if (staticContent.indexOf(a) < 0) staticContent.push(a);
            return '/*STATIC#' + staticContent.indexOf(a) + '*/';
        })

    // Parse variable declarations //

    const cleanupVarContent = (content: string): string => content.replace('{', ESC.OPEN_BRACE).replace('}', ESC.CLOSE_BRACE);
    const isNotFalse = (val: string): boolean => val !== '0' && val !== 'false';
    cssOutput = cssOutput
        .replace(/@var\s(.+)=(.+)$/gm, (_, name, content) => (customVars[name] = cleanupVarContent(content), ''))
        .replace(/@var\s(.+)$\s+([^]+)@endvar/gm, (_, name, content) => (customVars[name] = cleanupVarContent(content), ''))
        .replace(/@option\s+(\S+)\s+(\S+)/g, (_, name, val) => {
            const options: Record<Uppercase<string>, () => void> = {
                'BUILTIN_FUNCTIONS': () => constants.BUILTIN_FUNCTIONS = isNotFalse(val),
                'DECIMAL_PLACES': () => constants.DECIMAL_PLACES = val !== 'false' && +val,
                'KEEP_UNPARSED': () => constants.KEEP_UNPARSED = isNotFalse(val),
                'MAX_ARGUMENTS': () => constants.MAX_ARGUMENTS = parseInt(val),
            }
            options[name.toUpperCase()]();
            return '';
        })

    // Compile NovaSheets styles //

    let lastCssOutput = '';
    do {
        if (lastCssOutput === cssOutput) break;
        lastCssOutput = cssOutput;

        // Parse math //
        cssOutput = cssOutput
            // convert exponential notation
            .replace(regexes.exponential('gi'), (_, a, b) => (+a * 10 ** +b).toString())
            // fix slash edge cases
            .replace(regexes.slashEdgeCaseFunction('g'), '$1' + ESC.SLASH + '$2')
            .replace(regexes.slashEdgeCaseAttribute('g'), '$1' + ESC.SLASH + '$2')
            // compile math
            .replace(new RegExp(mathOperation, 'g'), _ => {
                if (regexes.edgeCaseDelimited('g').test(_)) return _; // delimited values, not subtraction
                let unit: string = '';
                const content: string = _
                    .replace(/\*\*/g, '^')
                    .replace(regexes.numberWithUnit('g'), (_, num, u) => {
                        switch (u) {
                            case 'mm': case 'ms': return unit = u[1], (+num / 1000).toString();
                            case 'cm': return unit = 'm', (+num / 100).toString();
                            case 'in': return unit = 'm', (+num * 0.0254).toString();
                            case 'ft': return unit = 'm', (+num * 0.3048).toString();
                            default: return unit = u, num;
                        }
                    })
                try { return MathParser(content) + unit; }
                catch { return _; }
            })

        // Parse variable contents //

        for (const name in customVars) {
            parseFunction(name, (_, ...paramArgs) => {
                let content: string = customVars[name];
                for (const i in paramArgs) {
                    if (!paramArgs[i]) continue;
                    const parts: string[] = paramArgs[i].split('=');
                    const param: string = parts[1] ? strim(parts[0]) : (+i + 1).toString();
                    const arg: string = parts[1] ? strim(parts.slice(1).join('=')) : strim(parts[0]);
                    content = content.replace(new RegExp(r`\$\[${escapeRegex(param)}[^\]]*\]`, 'g'), arg);
                }
                content = content.replace(regexes.defaultArguments('g'), '$1');
                return content;
            });
        }

        // Parse built-in functions //

        let allFunctions: CustomFunction[] = [];
        if (constants.BUILTIN_FUNCTIONS) allFunctions.push(...builtInFunctions({ constants }));
        allFunctions.push(...(novasheets?.getFunctions() ?? []));
        for (const obj of allFunctions) {
            parseFunction(obj.name, obj.body, obj.options);
        }

        // Parse nesting //

        let compiledOutput = '';
        const check = (s: string) => balanced('{', '}', s);
        const unnest = (css: string, parent: string): void => {
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
            let endStylesMatch: string = data.body.match(/(?<=})[^{}]+?$/g)?.[0] ?? '';
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
            let fullSelector: string = '';
            if (data.pre.includes('@media')) fullSelector = data.pre + parent.replace(regexes.mediaQuery('g'), '');
            else if (data.pre.includes('&')) fullSelector = data.pre.replace(/&/g, parent);
            else fullSelector = parent + ' ' + data.pre;
            fullSelector = strim(fullSelector).replace(regexes.blockComment('g'), '');
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
        cssOutput = compiledOutput
            .replace(regexes.mediaQueryBlock('gs'), '$1 { $2 }')
            .replace(regexes.emptyMediaQueryBlock('g'), '')
            .replace(regexes.nonEmptyMediaQueryBlock('g'), '$1 { $2 {$3} }')
        while (regexes.duplicateMediaQueries('gs').test(cssOutput)) {
            cssOutput = cssOutput.replace(regexes.duplicateMediaQueries('gs'), `$1 {$2 $3}`);
        }

        // Parse CSS block substitutions //

        // save CSS declarations as variables
        cssOutput = replaceAll(cssOutput, ESC.OPEN_BRACE, '{');
        cssOutput = replaceAll(cssOutput, ESC.CLOSE_BRACE, '}');
        const cssBlocks: Record<string, string> = {};
        compiledOutput.replace(/([^{}]+)({.+?})/gms, (_: string, selector: string, css: string) => {
            if (selector.includes('$(') || selector.startsWith('@')) return '';
            selector = selector.replace(/\$(<.+?>){1,2}/g, '')
            cssBlocks[strim(selector)] = css;
            return '';
        });
        // substitute blocks
        for (const name in cssBlocks) {
            cssOutput = cssOutput.replace(new RegExp(r`\$<\s*${escapeRegex(name)}\s*>`, 'g'), cssBlocks[name] ?? '{}');
        }
        // substitute leftovers
        cssOutput = cssOutput.replace(/\$<.+?>/g, '{}');
        // parse object notation
        cssOutput = cssOutput.replace(regexes.objectNotation('gm'), (_, css, item) => {
            const statements: string[] = css.split(';');
            for (const statement of statements) {
                const [attr, val] = statement.trim().split(':');
                if (attr.trim() === item.trim()) return val ?? '';
            }
            return '';
        });
        cssOutput = cssOutput.replace(regexes.blockSubstitutions('gm'), (_, css) => css);

        // Parse simple breakpoints //

        cssOutput = cssOutput.replace(regexes.simpleBreakpoint('gms'), (_, sel, min1, max1, min2, max2, selAfter, block) => {
            let [min, max]: string[] = [min1 ?? min2, max1 ?? max2];
            let selMatch: string[] = selAfter.match(regexes.simpleBreakpointValue('g')) ?? [];
            if (selMatch.length > 0) {
                const matches: string[] = selMatch[selMatch.length - 1].match(regexes.simpleBreakpointValue('')) ?? [];
                [, min, max] = matches;
            }
            let selector: string = (sel + selAfter).replace(regexes.simpleBreakpointValue('g'), '');

            let query: string[] = [];
            if (min) query.push(`(min-width: ${min})`);
            if (max) query.push(`(max-width: ${max.replace(/\d+/, (d) => (+d - 1).toString())})`);
            return `@media ${query.join(' and ')} { ${selector} { ${block} } }`;
        });

    }
    while (cssOutput.includes('$(') || new RegExp(mathOperation).test(cssOutput))

    // Remove unparsed variables //

    if (!constants.KEEP_UNPARSED) {
        cssOutput = cssOutput.replace(/@endvar/g, '');
        const unparsedContent: string[] = cssOutput.match(regexes.unparsedContent('g')) ?? [];
        for (const val of unparsedContent) {
            cssOutput = cssOutput.replace(val, '');
            const varName: string = strim(val.replace(regexes.variableName(''), '$1'));
            const type: string = val.includes('$(') ? 'variable' : 'argument';
            console.log(`<NovaSheets> Instances of unparsed ${type} '${varName}' have been removed from the output.`);
        }
    }

    // Cleanup output //

    cssOutput = cssOutput
        // cleanup whitespace
        .replace(/(?<!^ *) +/gm, ' ') // remove redundant whitespace
        .replace(/\*\/\s*/g, '$&\n') // newline after block comment
        .replace(/}\s*/g, '}\n').replace(/}\s*}/g, '} }') // space after braces
        .replace(/\s*{/g, ' {') // space before braces
        .replace(/^([ \t])\1+/gm, '$1') // single indent
        .replace(/^([ \t].+)}/gm, '$1\n}') // newline before indented block ending
        .replace(/{\s*(.+\r?\n)([ \t])/g, '{\n$2$1$2') // newline after indent block start
        // remove extra punctutation
        .replace(/(\s*;)+/g, ';')
        // clean up length units
        .replace(/(?<![1-9]+)(0\.\d+)\s*(m|s)/, (_, n, u) => +n * 1000 + 'm' + u)
        .replace(/(?<=\d)0\s*mm/g, 'cm')
        .replace(/(?<=\d)(000\s*mm|00\s*cm)/g, 'm')
        // fix floating point errors
        .replace(/\.?0{10,}\d/g, '')
        .replace(/((\d)\2{9,})\d/g, '$1')
        .replace(/(\d+)([5-9])\2{10,}\d?(?=\D)/g, (_, a) => (+a + 1).toString())
        .replace(/\d*\.?\d+e-(?:7|8|9|\d{2,})/, '0')
        // cleanup decimal places
        .replace(/\d\.\d+/g, (val) => constants.DECIMAL_PLACES === false ? val : (+val).toFixed(+constants.DECIMAL_PLACES))
        // fix calc() output
        .replace(/calc(\d)/g, '$1')
        // restore characters
        .replace(RegExp(ESC.SLASH, 'g'), '/')
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
