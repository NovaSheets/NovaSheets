function wrap(val, name) {
    return `<span class="${name}">${val}</span>`;
}

function colouriseCode() {
    const elements = document.querySelectorAll('code');
    for (let element of [...elements]) {
        element.classList.add('code')
        let content = element.innerHTML.replace(/&(lt|gt|nbsp|amp);/g, '[$1]')
            .replace(/(?<!https?:)\/\/.*$/gm, wrap('$&', 'comment'))
            .replace(/(\/\*[^\/])(.*?)([^\/]?\*\/)/gm, wrap('$&', 'comment'))
            .replace(/(\/\*\/)(.*?)(\/\*\/)/gm, wrap('$1', 'comment') + '$2' + wrap('$3', 'comment'))
            .replace(/@media[^{}\n]+?(?=\{)/gm, wrap('$&', 'css-query'))
            .replace(/https?:\/\/[^"]*/gm, wrap('$&', 'css-value'))
            .replace(/(?<!(?:\/\/|\/\*).*)[^\/{}:;\n]+?(?=\{)/gm, wrap('$&', 'css-selector'))
            .replace(/(?<!(?:\/\/|\/\*).*)[^\/{}():;\n]+?(?=:)/gm, wrap('$&', 'css-property'))
            .replace(/(?<!(?:\/\/|\/\*).*)[^\/{}:;\n]+?(?=;)/gm, wrap('$&', 'css-value'))
            .replace(/@endvar/g, wrap('$&', 'nss-char'))
            .replace(/(@const)\s+([^ ]*)\s+([^ ]*)?/gi, wrap('$1', 'nss-char') + wrap(' $2', 'nss-var') + wrap(' $3', 'nss-arg'))
            .replace(/\[(lt|gt|nbsp|amp)\]/g, '&$1;'.toLowerCase())
            .replace(/^\s*(@var)\s*(.+?)(?==.*$|$)/gm, wrap('$1', 'nss-char') + wrap(' $2', 'nss-var'))
            .replace(/(?<!(?:\/\/|\/\*).*)\$\[([^<]*?)(?:(\|)(.*?))?\]/gm, '$[' + wrap('$1', 'nss-arg') + '$2' + wrap('$3', 'nss-arg-default') + wrap(']', 'nss-char'))
            .replace(/(?<!(?:\/\/|\/\*).*)\$\(([^<]*?)(\|.*)?\)/gm, '$(' + wrap('$1', 'nss-var') + '$2' + ')')
            .replace(/\|([^<]*?)=([^|]*?)/gm, '|' + wrap('$1', 'nss-var-param') + wrap('=', 'nss-char') + wrap('$2', 'nss-var-arg'))
            .replace(/\$v|\$i/g, wrap('$&', 'nss-var'))
            .replace(/\[lt\]\/?script.*?\[gt\]/gm, wrap('$&', 'html-tag'))
            .replace(/src=(".*?")/gm, '<span class="html-attr-name">src</span>=<span class="html-attr-val">$1</span>')
            .replace(/(?<!(?:\/\/|\/\*).*)(\||\$|\(|\)|\[|\])/g, wrap('$&', 'nss-char'))
            .replace(/\s*\\n/g, '<br>')
        element.innerHTML = content;
    }
}

document.addEventListener("DOMContentLoaded", colouriseCode);