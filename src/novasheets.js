function debug() {
    $('body').append(arguments[0] + '<br>');
}

function parseNovaSheets() {

    const sheets = document.querySelectorAll('link[rel="novasheet"]');
    let fileNames = [];
    for (let i of sheets) {
        fileNames.push(i.href);
    }

    let stylesheetContents = [];
    for (let file of fileNames) {
        let req = new XMLHttpRequest();
        req.open("GET", file, false);
        req.send();
        let response = req.responseText;
        stylesheetContents.push(response.toString());
    }

    for (let s in stylesheetContents) {

        let lines = stylesheetContents[s].split('\n');
        let varLines = [];
        let styles = [];

        for (let i in lines) {
            if (lines[i].startsWith('@var')) {
                varLines.push(i);
            }
        }

        for (let i in varLines) {
            let currentLine = varLines[i];
            while (currentLine < varLines[i+1]) {
                styles.push(lines);
                currentLine++;//end
            }
        }

        console.log(lines,varLines,styles)

    }

}