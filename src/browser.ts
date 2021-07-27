import parse from './parse';
import NovaSheets from './index';

declare const window: any;

window.NovaSheets = NovaSheets;

interface PreparedInput {
    stylesheetContents: string[],
    sources: string[],
}

const hashCode = (str: string, length: number = 8): string => {
    let hash: number = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    return Math.abs(hash).toString(16).substring(0, length).padStart(length, '0');
};

window.parseNovaSheets = parseNovaSheets;
function parseNovaSheets(): void; // parse styles from embedded HTML
function parseNovaSheets(rawInput: string, novasheets?: NovaSheets): string; // parse styles from input
function parseNovaSheets(rawInput: string = '', novasheets?: NovaSheets): string | void {
    if (rawInput) return parse(rawInput, novasheets);
    prepare(rawInput).then((data) => data.stylesheetContents.forEach((content, i) => {
        const cssOutput = parse(content, novasheets);
        if (document.querySelectorAll(`[data-hash="${hashCode(cssOutput)}"]`).length) return; // prevent duplicate outputs
        let styleElem = document.createElement('style');
        styleElem.innerHTML = '\n' + cssOutput.trim() + '\n';
        styleElem.dataset.hash = hashCode(cssOutput);
        styleElem.dataset.source = data.sources[i];
        (document.head || document.body).appendChild(styleElem);
    }));
}

window.prepare = prepare;
async function prepare(rawInput: string = ''): Promise<PreparedInput> {
    // Generate list of NovaSheet files and get the contents of each stylesheet

    if (rawInput) return { stylesheetContents: [rawInput], sources: ['raw'] };

    let stylesheetContents: string[] = [];
    let sources: string[] = [];
    let externalSheets: HTMLLinkElement[] = Array.from(document.querySelectorAll('link[rel="novasheet" i], link[rel="novasheets" i]'));
    let inlineSheets: HTMLElement[] = Array.from(document.querySelectorAll('[type="novasheet" i], [type="novasheets" i]'));

    let fileNames: Record<string, string[]> = { full: [], rel: [] };
    for (let sheet of externalSheets) {
        fileNames.full.push(sheet.href);
        fileNames.rel.push(sheet.href);
    }
    for (let i in fileNames.full) {
        await fetch(fileNames.full[i])
            .then(data => data.text()).then(text => { stylesheetContents.push(text), sources.push(fileNames.rel[i]) })
            .catch(err => console.warn(`<NovaSheets> File '${fileNames.rel[i]}' is inacessible.`, err))
    }
    for (const contents of inlineSheets) {
        const content = (contents instanceof HTMLInputElement && contents.value) || contents.innerText;
        stylesheetContents.push(content);
        sources.push('inline');
    }

    return { stylesheetContents, sources };
}
