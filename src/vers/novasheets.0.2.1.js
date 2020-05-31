String.prototype.hashCode = function (length = 8) {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        hash = ((hash << 5) - hash) + this.charCodeAt(i);
    }
    return Math.abs(hash).toString(16).substring(0, length).padStart(length, '0');
};
String.prototype.trim = function () {
    return this.replace(/^ *(.+?) *$/, '$1');
}
String.prototype.escapeRegex = function () {
    return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseNovaSheets() {

    // Generate list of NovaSheet files
    let sheets = document.querySelectorAll('link[rel="novasheet"]');
    let fileNames = [];
    for (let i of sheets) {
        fileNames.push(i.href);
    }

    // Generate contents of each sheet
    let stylesheetContents = [];
    for (let file of fileNames) {
        try {
            let req = new XMLHttpRequest();
            req.open("GET", file, false);
            req.send();
            let response = req.responseText;
            stylesheetContents.push(response.toString());
        } catch (error) {
            console.error(`NovaSheets parsing failed: File "${file}" cannot be accessed.`);
        }
    }

    let inline = document.querySelectorAll('template[type="novasheet"]');
    for (let contents of inline) {
        stylesheetContents.push(contents.innerHTML);
    }

    // Loop through each sheet, parsing the NovaSheet styles
    for (let contents of stylesheetContents) {

        let lines = contents.split('\n');
        let customVars = [];
        let localVars = [];
        let styles = {};

        // Generate a list of lines that start variable declarations
        for (let i in lines) {
            lines[i] = lines[i].replace(/[\r\n]/g, '').replace(/^(.*?)\s?\/\/.+$/, '$1');
            if (lines[i].match(/\s*---\s*/)) {
                lines[i] = "---";
            }
            if (lines[i].match(/^\s*@var\s/)) {
                let varContent = lines[i].replace(/^\s*@var\s/, '');
                customVars.push({
                    line: Number(i),
                    contents: varContent,
                    name: varContent.split('|')[0].trim(),
                    subvars: varContent.split('|').splice(1)
                });
            }
        }

        const varDeclEnding = lines.indexOf('---');
        const cssContent = lines.slice(varDeclEnding + 1).join('\n');
        window.randomHash = window.randomHash || Math.random().toString().hashCode(6);

        // For each variable declaration, add styles to object.
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
                let newName = [randomHash, customVars[i].name, subvar.trim()].join('-');
                let splitText = `$[${subvar.trim()}]`;
                let joinText = `$(${newName})`;
                styles[currentStyle] = styles[currentStyle].split(splitText).join(joinText);
                localVars.push(newName);
            }
        }

        // Convert NovaSheets styles to CSS; phrases below come from using format 'var(name|key=val)'
        let loop = 0, cssOutput = cssContent;
        const MAX_RECURSION = 50, MAX_VAR_ARGS = 10;
        while (cssOutput.indexOf('$(') > -1 && loop++ < MAX_RECURSION) {
            for (let i in customVars) {
                let varName = customVars[i].name.escapeRegex();
                let varArgsRegex = "(?:\\|([^|=)]+?[^|)]+))?".repeat(MAX_VAR_ARGS); //= '|key1=val1|...|key10=val10'
                let matchRegex = `\\$\\((${varName})\\s?${varArgsRegex}\\)`; //= '$(name|key1=val1|...|key10=val10)'
                let varArgs = cssOutput.match(new RegExp(matchRegex)); // generate list of args
                let replaceRegex = '\\$\\(' + customVars[i].name + '[^)]*?\\)'; //= '$(name)'
                cssOutput = cssOutput.replace(new RegExp(replaceRegex), styles[customVars[i].name]); // substitude name

                // Parse local variables
                if (!varArgs) continue;
                for (let j = 0; j < varArgs.length; j++) {
                    if (j < 2 || !varArgs[j]) continue;
                    let [key, val] = varArgs[j].split('=')
                    for (let k in localVars) {
                        let localvar = localVars[k].trim(); //= 'hash-key-val'
                        let localvarFormatted = '\\$\\(\\s*' + localvar.escapeRegex() + '\\)'; //= '$(hash-key-val)'
                        let argvar = localvar.trim().split('-').splice(2).join('-'); //= 'val'
                        if (argvar !== key.trim()) continue;
                        cssOutput = cssOutput.replace(new RegExp(localvarFormatted, 'g'), val); // substitude val
                    }
                }

            }
        }
        cssOutput = cssOutput.replace(/; *;/g, ';').replace(/ +/g, ' ');

        // Prevent duplicate outputs
        if (document.querySelectorAll(`[data-hash="${cssOutput.hashCode()}"]`).length) break;

        // Load converted styles to page
        let styleElem = document.createElement('style');
        styleElem.dataset.hash = cssOutput.hashCode();
        styleElem.innerHTML = '\n' + cssOutput + '\n';
        (document.head || document.body).appendChild(styleElem);

    }

}

// Parse NovaSheets styles on page load
document.addEventListener("DOMContentLoaded", function () {
    parseNovaSheets();
});