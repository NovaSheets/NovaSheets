function debug() {
    $('body').append(arguments[0]+'<br>');
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
        stylesheetContents.push(response.toString().replace(/\n/g, ' '));
    }

    console.log(stylesheetContents)

}