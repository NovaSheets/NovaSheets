function debug() {
    $('body').append(arguments[0] + '<br>');
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

    // Loop through each sheet, parsing the NovaSheet Styles
    for (let s in stylesheetContents) {

        let lines = stylesheetContents[s].split('\n');
        let varLines = [];
        let styles = {};

        // Generate a list of lines that start variable declarations
        for (let i in lines) {
            if (lines[i].startsWith('@var')) {
                varLines.push({ line: i, name: lines[i].replace(/@var (.+):?/, '$1') });
            }
        }

        let varDeclEnding = lines.indexOf('----');
        // For each variable declaration, add styles to object.
        for (let i in varLines) {
            let currentLine = varLines[i].line;
            let currentStyle = varLines[i].name;
            while (currentLine < varLines[i + 1] && currentLine < varDeclEnding) {
                styles[currentStyle] += lines[currentLine];
                currentLine++;//end
            }
        }

        console.log(lines, varLines, styles)

    }

}