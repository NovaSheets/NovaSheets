function wrap(val, name) {
    return `§${name}¶${val}¶${name}§`;
}

function wrapRaw(val, name) {
    return `<span class="${name}">${val}</span>`;
}

function colouriseCode() {
    const elements = document.querySelectorAll('code, .code');
    for (let element of [...elements]) {
        element.classList.add('code')
        let content = element.innerHTML

            // HTML fixing
            .replace(/&(amp|lt|gt|nbsp);/g, '↑$1↓')

            // Comments
            .replace(/(?<!https?:)\/\/.*$/gm, wrapRaw('$&', 'comment')) // inline
            .replace(/(\/\*[^\/])(.*?)([^\/]?\*\/)/gm, wrapRaw('$&', 'comment')) // block
            .replace(/(\/\*\/)(.*?)(\/\*\/)/gm, wrapRaw('$1', 'comment') + '$2' + wrap('$3', 'comment')) // static

            // CSS content
            .replace(/@media[^{}\n]+?(?=\{)/gm, wrap('$&', 'css-query')) // media
            //.replace(/https?:\/\/[^"]*/gm, wrap('$&', 'css-value')) // URLs
            .replace(/(?<!(?:\/\/|\/\*).*)[^\/|{}:;\n]+?(?=\{)/gm, wrap('$&', 'css-selector')) // selector
            .replace(/(?<!(?:\/\/|\/\*).*)[^\/|{}():;\n]+?(?=:(?!\/))/gm, wrap('$&', 'css-property')) // property
            .replace(/(?<!(?:\/\/|\/\*).*)(?<=:\s*)[^\/|{}:;\n]+?(?=;)/gm, wrap('$&', 'css-value')) // value

            // NSS declarations
            .replace(/^\s*(@var)\s*(.+?)(?==.*$|$)/gm, wrap('$1', 'nss-char') + wrap(' $2', 'nss-var')) // var decl
            .replace(/(?<!(?:\/\/|\/\*).*)\$\[([^<]*?)(?:(\|)(.*?))?\]/gm, wrap('$[', 'nss-char') + wrap('$1', 'nss-arg') + wrap('$2', 'nss-char') + wrap('$3', 'nss-arg-default') + wrap(']', 'nss-char')) // param decl
            .replace(/@endvar/g, wrap('$&', 'nss-char')) // endvar
            .replace(/(@const)\s+(\S*)\s+(\S*)?/gi, wrap('$1', 'nss-char') + wrap(' $2', 'nss-var') + wrap(' $3', 'nss-arg')) // const

            // NSS substitutions
            .replace(/(?<!(?:\/\/|\/\*).*)\$\(([^<]*?)(\|.*)?\)/gm, wrap('$(', 'nss-char') + wrap('$1', 'nss-var') + '$2' + wrap(')', 'nss-char')) // var subst
            .replace(/\|([^<]*?)=([^|]*?)/gm, wrap('|', 'nss-char') + wrap('$1', 'nss-var-param') + wrap('=', 'nss-char') + wrap('$2', 'nss-var-arg')) // arg decl
            .replace(/\$(↑lt↓)([\w.:+~>()]+)(↑gt↓)/g, wrap('$<', 'nss-char') + wrap('$2', 'css-selector') + wrap('>', 'nss-char')) // decl block subst
            .replace(/(↑lt↓)(\w*?)(↑gt↓)/g, wrap('$1', 'nss-char') + wrap('$2', 'css-property') + wrap('$3', 'nss-char')) // obj getter
            .replace(/!/g, wrap('$&', 'nss-char')) // obj subster

            // NSS other
            .replace(/\$v|\$i/g, wrap('$&', 'nss-var')) // $v, $i
            .replace(/↑amp↓(↑lt↓)*|%(↑lt↓)*/g, wrap('$&', 'nss-selector')) // prev selectors
            .replace(/[|]/g, wrap('$&', 'nss-char'))

            // HTML
            .replace(/(↑gt↓)?(↑lt↓)\/?script(↑gt↓)?/gm, wrap('$&', 'html-tag'))
            .replace(/src=(".*?")/gm, wrap('src', 'html-attr-name') + '=' + wrap('$1', 'html-attr-val'))
            //.replace(/(?<!(?:\/\/|\/\*).*)(\||\$|\(|\)|\[|\])/g, wrap('$&', 'nss-char'))
            .replace(/[{}]/g, wrap('$&', 'css-char')) // brackets

            // HTML re-fixing
            .replace(/↑(amp|lt|gt|nbsp)↓/g, '&$1;')
            .replace(/\\n/g, '\n<br>')

            // Comment fixing
            .replace(/(?<=(?<!https?:)\/\/.+)[§¶].+?[§¶]/g, '')
            
        content = content.replace(/§([\w-]+)¶([^¶§]+?)¶\1§/g, '<span class="$1">$2</span>').replace(/[§¶].+?[§¶]/g, '');
        element.innerHTML = content;
    }
}

document.addEventListener("DOMContentLoaded", colouriseCode);