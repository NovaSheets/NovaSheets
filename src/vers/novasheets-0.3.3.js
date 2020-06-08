String.prototype.hashCode = function (length) {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        hash = ((hash << 5) - hash) + this.charCodeAt(i);
    }
    return Math.abs(hash).toString(16).substring(0, length || 8).padStart(length, '0');
};

String.prototype.escapeRegex = function () {
    return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nssError(str) {
    console.error("<NovaSheets> Parsing failed: " + str);
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
    let fileNames = [];
    let sources = [];
    for (let i of sheets) {
        fileNames.push(i.href);
    }
    let stylesheetContents = [];
    for (let file of fileNames) {
        try {
            let req = new XMLHttpRequest();
            req.open("GET", file, false);
            req.send();
            let response = req.responseText;
            stylesheetContents.push(response.toString());
            sources.push(file);
        } catch (error) {
            nssError(`File "${file}" cannot be accessed.`);
        }
    }
    for (let contents of inline) {
        stylesheetContents.push(contents.innerHTML);
        sources.push('inline');
    }

    // Loop through each sheet, parsing the NovaSheet styles
    for (let s in stylesheetContents) {

        let lines = stylesheetContents[s].split('\n');
        let customVars = [];
        let localVars = [];
        let styles = {};
        let MAX_RECURSION = 50, MAX_ARGUMENTS = 10;

        // Generate a list of lines that start variable declarations
        for (let i in lines) {
            lines[i] = lines[i].replace(/[\r\n]/g, '').replace(/^(.*?)\s?\/\/.+$/, '$1');
            if (lines[i].match(/\s*---\s*/)) {
                lines[i] = "---";
            }
            else if (lines[i].match(/^\s*@var\s/)) {
                let varContent = lines[i].replace(/^\s*@var\s/, '');
                customVars.push({
                    line: Number(i),
                    contents: varContent,
                    name: varContent.split('|')[0].trim(),
                    subvars: varContent.split('|').splice(1)
                });
            }
            else if (lines[i].match(/^\s*@const\s*MAX_RECURSION\s/)) MAX_RECURSION = Number(lines[i].split('MAX_RECURSION')[1]);
            else if (lines[i].match(/^\s*@const\s*MAX_ARGUMENTS\s/)) MAX_ARGUMENTS = Number(lines[i].split('MAX_ARGUMENTS')[1]);
        }

        // Begin variable parsing
        window.randomHash = window.randomHash || Math.random().toString().hashCode(6);
        const varDeclEnding = lines.indexOf('---');
        const cssContent = lines.slice(varDeclEnding + 1).join('\n');
        let cssOutput = cssContent;
        let loop = 0;

        /// For each variable declaration, add styles to an object.
        for (let i in customVars) {
            let currentLine = customVars[i].line + 1;
            let currentStyle = customVars[i].name.trim();
            let lastLine = customVars[i + 1] && customVars[i + 1].line || varDeclEnding;
            styles[currentStyle] = "";
            while (currentLine < lastLine) {
                if (lines[currentLine].match(/\s*@var\s/)) break;
                styles[currentStyle] += lines[currentLine].trim();
                currentLine++;
            }
            for (let subvar of customVars[i].subvars) {
                let newName = [randomHash, i, customVars[i].name, subvar.trim()].join('~');
                let splitText = `$[${subvar.trim()}]`;
                let joinText = `$(${newName})`;
                styles[currentStyle] = styles[currentStyle].split(splitText).join(joinText);
                localVars.push(newName);
            }
        }

        /// Convert NovaSheets styles to CSS; phrases below come from using format 'var(name|key=val)'
        while ((cssOutput.indexOf('$(') > -1 || loop < 2) && loop++ < MAX_RECURSION) {
            for (let i in customVars) {
                let varName = customVars[i].name.escapeRegex();
                let varArgsRegex = "(?:\\|([^|=$()]+?[^|$()]+))?".repeat(MAX_ARGUMENTS); //= '|key1=val1|...|key10=val10'
                let matchRegex = `\\$\\((${varName})\\s?${varArgsRegex}\\)`; //= '$(name|key1=val1|...|key10=val10)'
                let varArgs = cssOutput.match(RegExp(matchRegex)); // generate list of args
                if (!varArgs) continue;
                let replaceRegex = '\\$\\(' + customVars[i].name + '[^$()]*?\\)'; //= '$(name)'
                cssOutput = cssOutput.replace(RegExp(replaceRegex), styles[customVars[i].name]); // substitude name

                // Parse local variables
                for (let j = 0; j < varArgs.length; j++) {
                    if (j < 2 || !varArgs[j]) continue;
                    let [key, val] = varArgs[j].split('=');
                    for (let k in localVars) {
                        let localvar = localVars[k].trim(); //= 'hash-key-val'
                        let localvarFormatted = '\\$\\(\\s*' + localvar.escapeRegex() + '\\)'; //= '$(hash-key-val)'
                        let argvar = localvar.trim().split('~').splice(3).join('~'); //= 'val'
                        if (argvar !== key.trim()) continue;
                        cssOutput = cssOutput.replace(RegExp(localvarFormatted, 'g'), val); // substitude val
                    }
                }
            }

            // Parse built-in functions

            const number = '[0-9]*(?:\\.[0-9]*)?';
            const nssFunction = (name, params, count) => {
                if (!Array.isArray(params)) params = Array(count || MAX_ARGUMENTS).fill(params || '[^|)]*?');
                return RegExp(`\\$\\(\\s*${name}\\s*(?:\\|(\\s*${params.join('))?\\s*(?:\\|(\\s*')}))?\\s*\\)`, 'g');
            };
            const getArgs = (str, index) => {
                let arr = str.replace(/\$\((.*)\)/, '$1').split('|');
                if (index) return arr[index] && arr[index].trim();
                else return arr.join('|').replace(/\s*\|\s*/g, '|').split('|').splice(1);
            };

            /// Logical functions
            cssOutput = cssOutput
                .replace(nssFunction('@if'), args => {
                    let a = getArgs(args, 1);
                    let b = getArgs(args, 2);
                    let c = getArgs(args, 3);
                    let test = a
                        .replace(/(?:'(.+?)'|"(.+?)")+/, '$1$2') // remove quotes
                        .replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
                        .replace(/(?!=)(!?)=(==)?(?!=)/g, '$1$2==') // normalise equality signs
                        ;
                    if (test.match(/(<|<=|>|>=|==|!=)/)) test = eval(test);
                    if (['false', 'undefined', 'null', 'NaN', ''].includes(test)) test = false; else test = true;
                    return test ? b : c;
                })
                ;

            /// Raw math operators
            const numberRegex = '(?:0x|0b|0o)?(?:[0-9]*[.])?[0-9]+';
            const unitsRegex = '(?:cm|mm|in|ex|en|em|rem|ch|pt|pc|px|vh|vw|vmin|vmax|%)'
            const mathRegex = op => '(' + numberRegex + ')\\s*' + op.escapeRegex() + '\\s*(' + numberRegex + ')';
            const unitMathRegex = op => '(' + numberRegex + unitsRegex + ')\\s*' + op.escapeRegex() + '\\s*(' + numberRegex + ')';
            const mathRegexBracketed = op => '\\(\\s*' + mathRegex(op) + '\\s*\\)';
            const parseMath = (ops, type) => {
                for (let op of ops) {
                    if (!Array.isArray(op)) op = [op, op];
                    let regex = type === 'unit' ? unitMathRegex(op[0]) : (type === 'brac' ? mathRegexBracketed(op[0]) : mathRegex(op[0]));
                    let nums = cssOutput.match(RegExp(regex));
                    if (!nums) continue;
                    let result = eval(`Number(${nums[1].replace(RegExp(unitsRegex), '')}) ${op[1]} Number(${nums[2]})`) + nums[1].match(RegExp(unitsRegex, 'g'));
                    if (nums) cssOutput = cssOutput.replace(RegExp(regex), result);
                }
            }
            for (let i = 0; i < 5; i++) {
                cssOutput = cssOutput
                    .replace(/(?:\+|--)+([.0-9]+)/, '+$1')
                    .replace(/(?:\+-|-\+)+(?:\++)?([.0-9]+)/, '-$1')
                    ;
                parseMath(['**', ['^', '**'], '/', '*', '+', '-', ['--', '- -']], 'unit');
                parseMath(['**', ['^', '**'], '/', '*', '+', '-', ['--', '- -']], 'brac');
                parseMath(['**', ['^', '**'], '/', '*', '+', '-', ['--', '- -']], 'dflt');
            }

            /// Math functions
            cssOutput = cssOutput
                .replace(nssFunction('@mod', number, 2), args => getArgs(args, 1) % getArgs(args, 2))
                .replace(nssFunction('@min', number), args => Math.min(...getArgs(args)))
                .replace(nssFunction('@max', number), args => Math.max(...getArgs(args)))
                .replace(nssFunction('@clamp', number, 3), args => {
                    let a = getArgs(args, 1);
                    let b = getArgs(args, 2);
                    let c = getArgs(args, 3);
                    if (c < b) [b, c] = [c, b];
                    return a <= b ? b : (a >= c ? c : a);
                })
                .replace(nssFunction('@sin', number, 1), args => Math.sin(getArgs(args, 1)))
                .replace(nssFunction('@asin', number, 1), args => Math.asin(getArgs(args, 1)))
                .replace(nssFunction('@cos', number, 1), args => Math.cos(getArgs(args, 1)))
                .replace(nssFunction('@acos', number, 1), args => Math.acos(getArgs(args, 1)))
                .replace(nssFunction('@tan', number, 1), args => Math.tan(getArgs(args, 1)))
                .replace(nssFunction('@atan', number, 1), args => Math.atan(getArgs(args, 1)))
                .replace(nssFunction('@abs', number, 1), args => Math.abs(getArgs(args, 1)))
                .replace(nssFunction('@floor', number, 1), args => Math.floor(getArgs(args, 1)))
                .replace(nssFunction('@ceil', number, 1), args => Math.ciel(getArgs(args, 1)))
                .replace(nssFunction('@round', number, 2), args => {
                    let a = Number(getArgs(args, 1)) + Number.EPSILON;
                    let b = getArgs(args, 2) || 0;
                    return Math.round(a * 10 ** b) / (10 ** b);
                })
                .replace(nssFunction('@log', number, 1), args => Math.log(getArgs(args, 1)))
                .replace(nssFunction('@root', number, 2), args => Math.pow(getArgs(args, 2), 1 / getArgs(args, 1)))
                .replace(/\$\(@pi\)/g, Math.PI)
                .replace(/\$\(@e\)/g, Math.E)
                ;

            /// Text functions
            cssOutput = cssOutput
                .replace(nssFunction('@encode'), args => encodeURIComponent(getArgs(args, 1)))
                .replace(nssFunction('@replace'), args => getArgs(args, 1).replace(getArgs(args, 2), (getArgs(args, 3))))
                .replace(nssFunction('@length'), args => getArgs(args, 1).length)
                ;

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
                            nssError(`Unknown part identifier "${part}" in function "@colorpart" of color type "rgb"/"rgba"/"#".`);
                            return color;
                        }
                    }
                    else if (color.startsWith('hsl')) {
                        if (['hue', 'h'].includes(part)) return parts[0];
                        else if (['saturation', 's'].includes(part)) return parts[1];
                        else if (['lightness', 'l'].includes(part)) return parts[2];
                        else if (['alpha', 'a'].includes(part)) return parts[3];
                        else {
                            nssError(`Unknown part identifier "${part}" in function "@colorpart" of color type "hsl"/"hsla".`);
                            return color;
                        }
                    } else {
                        nssError(`Unknown part identifier "${part}" in function "@colorpart" of unknown color type.`);
                        return color;
                    }

                })
                ;
        }

        // Cleanup output
        cssOutput = cssOutput.replace(/;\s*;/g, ';').replace(/\s+/g, ' ');

        // Prevent duplicate outputs
        if (document.querySelectorAll(`[data-hash="${cssOutput.hashCode()}"]`).length) break;

        // Load converted styles to page
        let styleElem = document.createElement('style');
        styleElem.dataset.hash = cssOutput.hashCode();
        styleElem.dataset.source = sources[s];
        styleElem.innerHTML = '\n' + cssOutput + '\n';
        (document.head || document.body).appendChild(styleElem);

    }

}

// Parse NovaSheets styles on page load
document.addEventListener("DOMContentLoaded", function () {
    try {
        parseNovaSheets();
    }
    catch (err) {
        console.error(err);
    }
});