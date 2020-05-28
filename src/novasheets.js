String.prototype.hashCode = function () {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        var character = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + character;
    }
    return hash.toString(16);
}

function parseNovaSheets() {

    // Generate list of NovaSheet files
    const sheets = document.querySelectorAll('link[rel="novasheet"]');
    let fileNames = [];
    for (let i of sheets) {
        fileNames.push(i.href);
    }

    // Generate contents of each sheet
    let stylesheetContents = [];
    for (let file of fileNames) {
        let req = new XMLHttpRequest();
        req.open("GET", file, false);
        req.send();
        let response = req.responseText;
        stylesheetContents.push(response.toString());
    }

    // Loop through each sheet, parsing the NovaSheet styles
    for (let s in stylesheetContents) {

        let lines = stylesheetContents[s].split('\n');
        let customVars = [];
        let styles = {};
        const varDeclEnding = lines.indexOf('---');
        const cssContent = lines.slice(varDeclEnding + 1).join('\n');

        // Generate a list of lines that start variable declarations
        for (let i in lines) {
            if (lines[i].match(/ *@var /)) {
                customVars.push({ line: Number(i), name: lines[i].replace(/@var (.+)$/, '$1') });
            }
        }

        // For each variable declaration, add styles to object.
        for (let i in customVars) {
            let currentLine = customVars[i].line + 1;
            let currentStyle = customVars[i].name;
            while (currentLine < (customVars[i + 1]?.line ?? varDeclEnding)) {
                if (lines[currentLine].match(/ *@var /)) break;
                if (!styles[currentStyle]) styles[currentStyle] = "";
                styles[currentStyle] += lines[currentLine];
                currentLine++;
            }
        }

        // Convert NovaSheets styles to CSS
        let cssOutput = cssContent;
        for (let i in customVars) {
            cssOutput = cssOutput.split('$(' + customVars[i].name + ')').join( styles[customVars[i].name] || '');
        }

        // Load converted styles to page
        let styleElem = document.createElement('style');
        styleElem.dataset.source = fileNames[s].split('/')[-2];
        styleElem.dataset.hash = cssContent.hashCode();
        styleElem.innerHTML = cssContent;
        document.head.appendChild(styleElem);

    }

}
