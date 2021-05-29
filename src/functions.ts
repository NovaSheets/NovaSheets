// Default built-in functions

import NovaSheets from './novasheets';
import { Constants, CustomFunction } from './common';

//@export
function addBuiltInFunctions({ constants }: { constants: Constants }): CustomFunction[] {
    const novasheets: NovaSheets = new (typeof require !== 'undefined' ? require('./novasheets') : NovaSheets)();
    const escapeRegex = (str: string): string => str.replace(/[.*+?^/${}()|[\]\\]/g, '\\$&');
    const strim = (str: string): string => str.toString().replace(/^\s*(.+?)\s*$/, '$1').replace(/\s+/g, ' ');
    const r = String.raw;

    /// Loop functions

    novasheets.addFunction('@each', (_, a = '', b = '', c = '', ...rest) => {
        let d: string = rest.join('|');
        let [items, splitter, joiner, content]: string[] = d ? [a, b, c, d] : (c ? [a, b, b, c] : [a, ',', ',', b]);
        let arr: string[] = strim(items).split(strim(splitter));
        let output: string[] = [];
        for (let i in arr) {
            let parsed = strim(content)
                .replace(/\$i/gi, String(+i + 1))
                .replace(/\$v\[([0-9]+)([-+*/][0-9]+)?\]/g, (_, a, b) => arr[+a - 1 + (b || 0)])
                .replace(/.?\s*undefined/g, '')
                .replace(/\$v/gi, arr[i])
                ;
            output.push(parsed);
        }
        return output.join(joiner);
    }, { trim: false, allArgs: true });

    novasheets.addFunction('@repeat', (_, a, ...b) => {
        let [delim, content]: string[] = b[1] ? [b[0], b.slice(1).join('|')] : ['', b.join('|')];
        let output: string = '';
        for (let i = 0; i < +a; i++) {
            output += (i > 0 ? delim : '') + content.replace(/\$i/gi, (+i + 1).toString());
        }
        return output;
    }, { trim: false, allArgs: true });


    /// Math functions

    const number = r`(?:[0-9]*\.?[0-9]+)`;
    const basedNumber = r`(?:0x[0-9a-f]*\.?[0-9a-f]+|0b[01]*\.?[01]+|0o[0-7]*\.?[0-7]+|${number})`;
    const toNum = (val: string | number): number => constants.KEEP_NAN ? +val : (Number.isNaN(val) ? 0 : parseFloat(val + ""));
    const testNaN = (arg: any, def: string) => {
        let test: boolean = !arg || arg === Infinity || Number.isNaN(arg);
        if (test && constants.KEEP_NAN) return 'NaN';
        else if (test && !constants.KEEP_NAN) return def || 0;
        else if (Math.abs(+arg) <= 1e-7) return 0;
        else return +arg;
    };

    novasheets.addFunction('@e', () => Math.E);
    novasheets.addFunction('@pi', () => Math.PI);
    novasheets.addFunction('@mod', (_, a, b) => testNaN(toNum(a) % toNum(b), a));
    novasheets.addFunction('@sin', (_, a) => testNaN(Math.sin(toNum(a)), a));
    novasheets.addFunction('@asin', (_, a) => testNaN(Math.asin(toNum(a)), a));
    novasheets.addFunction('@cos', (_, a) => testNaN(Math.cos(toNum(a)), a));
    novasheets.addFunction('@acos', (_, a) => testNaN(Math.acos(toNum(a)), a));
    novasheets.addFunction('@tan', (_, a) => testNaN(Math.tan(toNum(a)), a));
    novasheets.addFunction('@atan', (_, a) => testNaN(Math.atan(toNum(a)), a));
    novasheets.addFunction('@abs', (_, a) => testNaN(Math.abs(toNum(a)), a));
    novasheets.addFunction('@floor', (_, a) => testNaN(Math.floor(toNum(a)), a));
    novasheets.addFunction('@ceil', (_, a) => testNaN(Math.ceil(toNum(a)), a));
    novasheets.addFunction('@percent', (_, a) => testNaN(toNum(a) * 100, a) + '%');
    novasheets.addFunction('@log', (_, base, num) => testNaN(Math.log(+num) / (base ? Math.log(+base) : 1), num));
    novasheets.addFunction('@root', (_, a, b) => testNaN(Math.pow(toNum(b) ? toNum(b) : toNum(a), 1 / (toNum(b) ? toNum(a) : 2)), b));

    novasheets.addFunction('@round', (_, a, b) => {
        let num: number = toNum(a) + Number.EPSILON;
        let dp: number = Math.pow(10, toNum(b) || 0);
        return testNaN(Math.round(num * dp) / dp, a);
    });

    novasheets.addFunction('@min|@max', (_, ...a) => {
        let nums: number[] = [];
        for (let item of a) if (item) nums.push(+item);
        let output: number = Math[_.includes('@min') ? 'min' : 'max'](...nums);
        return testNaN(output, '0');
    });

    novasheets.addFunction('@clamp', (_, a, b, c) => {
        let [val, min, max]: number[] = [toNum(a), toNum(b), toNum(c)];
        if (max < min) [min, max] = [max, min];
        let output: number = val <= min ? min : (val >= max ? max : val);
        return testNaN(output, a);
    });

    novasheets.addFunction('@degrees|@radians|@gradians', (_, a) => {
        let num: number = +a.replace(/[a-z]+/, '');
        let type: string = a.replace(RegExp(number), '');
        let output: number = toNum(a);
        if (_.includes('@degrees')) {
            if (type === 'grad') output = num * 0.9;
            else output = num / Math.PI * 180; // default to radians
        }
        else if (_.includes('@radians')) {
            if (type === 'grad') output = num * Math.PI / 200;
            else output = +num * Math.PI / 180; // default to degrees
        }
        else if (_.includes('@gradians')) {
            if (type === 'rad') output = num / Math.PI * 200;
            else output = num / 0.9; // default to degrees
        }
        return testNaN(output, a);
    });


    /// Text functions

    novasheets.addFunction('@lowercase', (_, a) => a.toLowerCase());
    novasheets.addFunction('@uppercase', (_, a) => a.toUpperCase());
    novasheets.addFunction('@titlecase', (_, a) => a.replace(/\b\w/g, a => a.toUpperCase()));
    novasheets.addFunction('@capitali[sz]e', (_, a) => a[0].toUpperCase() + a.substr(1));
    novasheets.addFunction('@uncapitali[sz]e', (_, a) => a[0].toLowerCase() + a.substr(1));
    novasheets.addFunction('@extract', (_, a, b, c) => a.split(c ? b : ',')[Number(c ? c : b) - 1] || '');
    novasheets.addFunction('@encode', (_, a) => encodeURIComponent(a));
    novasheets.addFunction('@length', (_, a) => strim(a).length);

    novasheets.addFunction('@replace', (_, ...args) => {
        if (args.length < 3) args = [args[0], args[1] || '', args[2] || ''];
        args = args.slice(0, args.indexOf('') <= 3 ? 3 : args.indexOf(''));
        let text: string = strim(args[0]);
        let finder: string = strim(args.slice(1, -1).join('|'));
        let replacer: string = strim(args.slice(-1)[0]);
        let isRegex: boolean = finder.startsWith('/');
        let regexFinder: RegExp = RegExp('');
        if (isRegex) {
            let parts = strim(finder).match(/\/(.+?)\/([gimusy]*)/)?.slice(1) || [];
            regexFinder = RegExp(parts[0], parts[1] || 's');
        }
        return text.replace(isRegex ? regexFinder : RegExp(escapeRegex(finder), 'g'), replacer);
    }, { trim: false, allArgs: true });


    /// Colour functions

    const toPercent = (val: number): number => Math.floor(+val / 255 * 100);
    const fromPercent = (val: string): number => Math.ceil(Number(val.replace('%', '')) * 255 / 100);
    const toHex = (val: string | number): string => Number(val).toString(16).padStart(2, '0');
    const rgbFromHex = (hex: string, alpha?: string): string => {
        let num = parseInt(hex.replace(/#?(.{0,8})$/, '$1'), 16);
        let r = (num >> 16) & 255;
        let g = (num >> 8) & 255;
        let b = num & 255;
        let a = alpha ? toPercent(parseInt(alpha, 16)) : null;
        if (a === null) return `rgb(${r}, ${g}, ${b})`;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    };
    const parseHex = (val: string): string => {
        let a = val.replace('#', '');
        switch (a.length) {
            case 0: return rgbFromHex('000000', '00');
            case 1: return rgbFromHex(a.repeat(6));
            case 2: return rgbFromHex(a[0].repeat(6), a[1].repeat(2));
            case 3: return rgbFromHex(a[0] + a[0] + a[1] + a[1] + a[2] + a[2]);
            case 4: return rgbFromHex(a[0] + a[0] + a[1] + a[1] + a[2] + a[2], a[3] + a[3]);
            default: return rgbFromHex(a.substr(0, 6).padEnd(6, '0'), a.substr(6, 2) || undefined);
        }
    };
    const getRawColorParts = (col: string): string[] => col.replace(/^\s*\w{3}a?\s*\(\s*|\s*\)$/g, '').split(/,\s*/);
    const getColorParts = (color: string): string[] => {
        let parts: string[] = getRawColorParts(color.startsWith('#') ? parseHex(color) : color);
        for (let i in parts) {
            let num: string = parts[i];
            if (!parts[i]) {
                parts[i] = "0";
            }
            else if (parts[i].includes('%')) {
                num = num.replace('%', '');
                if (color.includes('hsl')) parts[i] = Math.round(+num / 100 * (+i === 0 ? 360 : 100)).toString();
                else parts[i] = fromPercent(num).toString();
            }
            else if (+i === 3) {
                parts[i] = Math.round(color.includes('rgb') ? +num / 255 : +num / 100).toString();
            }
        }
        return parts;
    };
    const hexFromRgb = (rgb: string | string[] | number[]): string => {
        let [r, g, b, a]: string[] | number[] = Array.isArray(rgb) ? rgb : getColorParts(rgb);
        return '#' + toHex(r) + toHex(g) + toHex(b) + (toNum(a) > 0 ? toHex(a) : '');
    };
    const blendColors = (color1: string, color2: string, amt: string): string => {
        if (!color2) return color1 || '';
        let type: string = color1.match(/^[a-z]{3}a?|^#/)?.toString() || '';
        let amount: number = amt.includes('%') ? +amt.replace('%', '') / 100 : +amt;
        amount = Math.min(Math.abs(amount), 1);

        const blendVal = (a: string, b: string): number => Math.floor((toNum(a) * (1 - amount) + toNum(b) * (amount)));

        let [[r1, g1, b1, a1], [r2, g2, b2, a2]]: string[][] = [getColorParts(color1), getColorParts(color2)];
        let [r, g, b, a]: number[] = [blendVal(r1, r2), blendVal(g1, g2), blendVal(b1, b2), blendVal(a1, a2)];

        switch (type) {
            case 'rgba': return `rgba(${r}, ${g}, ${b}, ${a})`;
            case 'rgb': return `rgb(${r}, ${g}, ${b})`;
            case 'hsla': return `hsla(${r % 360}, ${g / 100}%, ${b / 100}%, ${a})`;
            case 'hsl': return `hsla(${r % 360}, ${g / 100}%, ${b / 100}%)`;
            case '#': return hexFromRgb([r, g, b, a]);
            default: return `${type}(${r}, ${g}, ${b})`;
        }
    };
    const blendGrayscaleHsl = (type: string, color1: string, color2: string, amt: string): string => {
        if (!color1.includes('hsl')) return blendColors(color1, color2, amt || '50%');
        let [h, s, l, a]: string[] = getColorParts(color1);
        let amount: number = +amt.replace('%', '');
        let sNew: number = +s - amount;
        let lNew: number = +l + amount * (type === 'darken' ? -1 : 1);
        let sl: string = type === 'desat' ? `${sNew}%, ${l}%` : `${s}%, ${lNew < 0 ? 0 : lNew}%`;
        return `${color1.match(/^hsla?/)?.toString() || 'hsl'}(${+h % 360}, ${sl}${a ? `, ${a}` : ''})`;
    };

    novasheets.addFunction('@colou?r', (_, type, a = '0', b = '0', c = '0', d = '') => {
        if (/#|rgba?|hsla?/i.test(a)) {
            if (a.includes('#')) a = parseHex(a);
            if (/rgba?|hsla?/.test(a)) [a, b, c, d] = getColorParts(a);
        }
        else {
            [a, b, c, d] = getColorParts(`${type}(${a}, ${b}, ${c}, ${d})`);
        }

        switch (type = type.toLowerCase()) {
            case '#': case 'hash': case 'hex': case 'hexadecimal': return '#' + toHex(a) + toHex(b) + toHex(c) + (d ? toHex(fromPercent(d)) : '');
            case 'rgb': return `rgb(${a}, ${b}, ${c})`;
            case 'rgba': return `rgba(${a}, ${b}, ${c}, ${d || +d === 0 ? 100 : ''}%)`;
            case 'hsl': return `hsl(${toNum(a) % 360}, ${b}%, ${c}%)`;
            case 'hsla': return `hsla(${toNum(a) % 360}, ${b}%, ${c}%, ${d || +d === 0 ? 100 : ''}%)`;
            default: return `${type}(${a} ${b} ${c}${d ? ` / ${d}` : ''})`;
        }
    });

    novasheets.addFunction('@colou?rpart', (_, a = '', b = '') => {
        let [part, color] = [a.toLowerCase(), b.toLowerCase()];
        let parts = getColorParts(color);
        const obj: Record<string, string> = { r: parts[0], h: parts[0], g: parts[1], s: parts[1], b: parts[2], l: parts[2], a: parts[3] };
        return obj[part[0]] || color;
    });

    novasheets.addFunction('@spin', (_, color, amount) => {
        let oldHue: string = color.replace(/^hsla?\s*\((\d+),\s*.+\s*\)\s*$/g, '$1');
        let newHue: string = ((+oldHue + +amount) % 360).toString();
        return color.replace(oldHue, newHue);
    });

    novasheets.addFunction('@blend', (_, color1, color2, amount) => blendColors(color1, color2, amount || '50%'));
    novasheets.addFunction('@tint|@lighten', (_, color, amount) => blendGrayscaleHsl('lighten', color, '#fff', amount || '50%'));
    novasheets.addFunction('@shade|@darken', (_, color, amount) => blendGrayscaleHsl('darken', color, '#000', amount || '50%'));
    novasheets.addFunction('@tone|@desaturate', (_, color, amount) => blendGrayscaleHsl('desat', color, '#808080', amount || '50%'));

    const parseLuma = (arg: string, rgb?: string[]): number => {
        if (!(arg.startsWith('rgb') || arg.startsWith('#'))) return +arg;
        let [r, g, b]: string[] = rgb ? [...rgb] : getColorParts(arg);
        const adjustGamma = (a: number): number => ((a + 0.055) / 1.055) ** 2.4;
        const getLuma = (a: number): number => a <= 0.03928 ? a / 12.92 : adjustGamma(a);
        return 0.2126 * getLuma(+r / 255) + 0.7152 * getLuma(+g / 255) + 0.0722 * getLuma(toNum(b) / 255); // ITU-R BT.709
    };

    novasheets.addFunction('@luma', (_, color) => parseLuma(color));

    novasheets.addFunction('@contrast', (_, color, light = '', dark = '') => {
        const isDark: boolean = parseLuma(color) < 0.5;
        return isDark ? light : dark;
    });

    novasheets.addFunction('@gr[ae]yscale', (_, color) => {
        if (color.startsWith('hsl')) return color.replace(/^(hsla?)\s*\(\s*(\d+),\s*(\d+)/, '$1($2, 0');
        let gray: number = Math.round(parseLuma(color) * 255);
        let newColor: string = `rgb(${Array(3).fill(gray).join(', ')})`;
        if (color.startsWith('#')) return hexFromRgb(newColor);
        else return newColor;
    });


    /// Logical functions

    const bracketedNumber: string = r`(?:\(\s*${basedNumber}\s*\)|${basedNumber})`;
    const logicRegex = (arg: string): RegExp => RegExp(r`([+-]?${bracketedNumber})\s*(?:${arg})\s*([+-]?${bracketedNumber})`);
    const parseLogic = (arg: string): string => {
        if (!/^([<>=!&|()-\d\s]|true|false|undefined|null|NaN|x?n?or|n?and)+$/.test(arg)) return arg;
        for (let i = 0; i < constants.MAX_ARGUMENTS; i++) {
            arg = strim(arg)
                .replace(/(?:'(.+?)'|"(.+?)")+/, '$1$2') // remove quotes
                .replace(/\bor\b/gi, '||').replace(/\band\b/gi, '&&').replace(/\bnot\b/gi, '!') // default logical operators
                .replace(/(.+?)\bnor\b(.+)?/gi, '!($1) && !($2)') // 'nor' logical operator
                .replace(/(.+?)\bnand\b(.+)?/gi, '!($1) || !($2)') // 'nand' logical operator
                .replace(/(.+?)\bxor\b(.+)?/gi, '($1 && !($2)) || (!($1) && $2)') // 'xor' logical operator
                .replace(/(.+?)\bxnor\b(.+)?/gi, '$1 == $2') // 'xnor' logical operator
                .replace(/(?!=)(!?)=(==)?(?!=)/g, '$1$2==') // normalise equality signs
                ;
        }
        if (/(<|<=|>|>=|==|!=|&|!|\|)/.test(arg)) arg = eval(arg);
        if (['false', 'undefined', 'null', 'NaN', ''].includes(arg)) arg = 'false';
        return arg;
    };

    novasheets.addFunction('@bitwise', (_, a) => {
        let arg: string = a;
        for (let i = 0; i < constants.MAX_ARGUMENTS; i++) {
            arg = arg
                .replace(RegExp(r`(?:~|!|not)\s*([+-]?${bracketedNumber})`), (_, a) => eval('~' + toNum(a))) // bitwise not
                .replace(logicRegex('or|\\|'), (_, a, b) => eval(`(${toNum(a)}) | (${toNum(b)})`)) // bitwise or
                .replace(logicRegex('nor'), (_, a, b) => eval(`~ (${toNum(a)}) | (${toNum(b)})`)) // bitwise nor
                .replace(logicRegex('and|&'), (_, a, b) => eval(`(${toNum(a)}) & (${toNum(b)})`)) // bitwise and
                .replace(logicRegex('nand'), (_, a, b) => eval(`~ (${toNum(a)}) & (${toNum(b)})`)) // bitwise nand
                .replace(logicRegex('xor'), (_, a, b) => eval(`(${toNum(a)}) ^ (${toNum(b)})`)) // bitwise xor
                .replace(logicRegex('xnor'), (_, a, b) => eval(`~ (${toNum(a)}) ^ (${toNum(b)})`)) // bitwise xnor
                ;
        }
        return arg;
    });

    novasheets.addFunction('@boolean', (_, ...a) => parseLogic(a.join('|')));
    novasheets.addFunction('@if', (_, a, b = '', c = '') => parseLogic(a) ? b : c);


    /// CSS functions

    novasheets.addFunction('@breakpoint', (_, a = '0', b = '', c = '', d = '') => {
        if (!a) return _;
        const makeQuery = (type: string, width: string, content: string): string => {
            return `@ ${type === 'min' ? `${width}..` : `..${width}`} { ${content} }`;
        };
        let isBlock: boolean = (b + c).includes('{');
        let content: string[] = isBlock ? [b, c] : [`${b} {${c}} `, `${b} {${d}} `];
        let ltContent: string = (isBlock ? b : c).trim() ? makeQuery('max', a, content[0]) : '';
        let gtContent: string = (isBlock ? c : d).trim() ? makeQuery('min', a, content[1]) : '';
        return ltContent + (ltContent && gtContent ? '\n' : '') + gtContent;
    }, { trim: false });

    novasheets.addFunction('@prefix', (_, a, b) => {
        return `-webkit-${a}: ${b}; -moz-${a}: ${b}; -ms-${a}: ${b}; -o-${a}: ${b}; ${a}: ${b};`;
    });


    // Return
    return novasheets.getFunctions();

}
//@end
;
export = addBuiltInFunctions;
