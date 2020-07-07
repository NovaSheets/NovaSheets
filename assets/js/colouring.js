String.prototype.Wrap = function (className) {
    return `<span class="${className}">${this}</span>`;
}

function colouriseCode() {
    const elements = document.querySelectorAll('code');
    for (let element of [...elements]) {
        element.classList.add('code')
        let content = element.innerHTML.replace(/&(lt|gt|nbsp|amp);/g, '[$1]')
            .replace(/(?<!https?:)\/\/.*$/gm, '$&'.Wrap('comment'))
            .replace(/(\/\*[^\/])(.*?)([^\/]?\*\/)/gm, '$&'.Wrap('comment'))
            .replace(/(\/\*\/)(.*?)(\/\*\/)/gm, '$1'.Wrap('comment') + '$2' + '$3'.Wrap('comment'))
            .replace(/@media[^{}\n]+?(?=\{)/gm, '$&'.Wrap('css-query'))
            .replace(/https?:\/\/[^"]*/gm, '$&'.Wrap('css-value'))
            .replace(/(?<!(?:\/\/|\/\*).*)[^\/{}:;\n]+?(?=\{)/gm, '$&'.Wrap('css-selector'))
            .replace(/(?<!(?:\/\/|\/\*).*)[^\/{}():;\n]+?(?=:)/gm, '$&'.Wrap('css-property'))
            .replace(/(?<!(?:\/\/|\/\*).*)[^\/{}:;\n]+?(?=;)/gm, '$&'.Wrap('css-value'))
            .replace(/@endvar|@const/g, '$&'.Wrap('nss-char'))
            .replace(/^\s*(@var)\s*(.+?)(?==.*$|$)/gm, '$1'.Wrap('nss-char') + ' $2'.Wrap('nss-var'))
            .replace(/(?<!(?:\/\/|\/\*).*)\$\[([^<]*?)(?:(\|)(.*?))?\]/gm, '$[' + '$1'.Wrap('nss-arg') + '$2' + '$3'.Wrap('nss-arg-default') + ']'.Wrap('nss-char'))
            .replace(/(?<!(?:\/\/|\/\*).*)\$\(([^<]*?)(\|.*)\)/gm, '$(' + '$1'.Wrap('nss-var') + '$2' + ')')
            .replace(/\|([^<]*?)=([^|]*?)/gm, '|' + '$1'.Wrap('nss-var-param') + '='.Wrap('nss-char') + '$2'.Wrap('nss-var-arg'))
            .replace(/\$v|\$i/g, '$&'.Wrap('nss-var'))
            .replace(/\[lt\]\/?script.*?\[gt\]/gm, '$&'.Wrap('html-tag')) .replace(/\[([a-z]+)\]/g, '&$1;'.toLowerCase())
            .replace(/src=(".*?")/gm, '<span class="html-attr-name">src</span>=<span class="html-attr-val">$1</span>')
            .replace(/(?<!(?:\/\/|\/\*).*)(\||\$|\(|\)|\[|\])/g, '$&'.Wrap('nss-char'))
        element.innerHTML = content.replace(/\s*\\n/g, '<br>');
    }
}

document.addEventListener("DOMContentLoaded", colouriseCode);