#!usr/bin/env node
const NovaSheets = require ? require('./novasheets') : NovaSheets;

function addBuiltInFunctions({ constants }) {
    const novasheets = new NovaSheets();
    const r = String.raw;

    /// Loop functions

    novasheets.addFunction('@each', (_, a = '', b = '', c = '', ...d) => {
        d = d.join('|');
        let [items, splitter, joiner, content] = d ? [a, b, c, d] : (c ? [a, b, b, c] : [a, ',', ',', b]);
        [items, splitter, joiner, content] = [items.strim(), splitter.strim(), joiner, content.strim()];
        let arr = items.split(splitter);
        let output = [];
        for (let i in arr) {
            let parsed = content
                .replace(/\$i/gi, Number(i) + 1)
                .replace(/\$v\[([0-9]+)([-+*/][0-9]+)?\]/g, (_, a, b) => arr[eval(Number(a - 1) + (b || 0))])
                .replace(/.?\s*undefined/g, '')
                .replace(/\$v/gi, arr[i])
            output.push(parsed);
        }
        return output.join(joiner);
    }, { notrim: true });

    novasheets.addFunction('@repeat', (_, a, ...b) => {
        let num = a, delim, content;
        if (b[1]) [delim, content] = [b[0], b.slice(1).join('|')];
        else[delim, content] = ['', b.join('|')];
        let output = '';
        for (let i = 0; i < Number(num); i++) output += (i > 0 ? delim : '') + content.replace(/\$i/gi, Number(i) + 1);
        return output;
    });


    /// Math functions

    const number = r`(?:[0-9]*\.?[0-9]+)`;
    const basedNumber = r`(?:0x[0-9a-f]*\.?[0-9a-f]+|0b[01]*\.?[01]+|0o[0-7]*\.?[0-7]+|${number})`;
    const toNumber = val => constants.KEEP_NAN ? Number(val) : (isNaN(Number(val)) ? '' : Number(val));
    const testNaN = (arg, def) => {
        let test = !arg || arg === Infinity || Number.isNaN(arg);
        if (test && constants.KEEP_NAN) return 'NaN';
        else if (test && !constants.KEEP_NAN) return def || 0;
        else return arg;
    }

    novasheets.addFunction('@e', _ => Math.E);
    novasheets.addFunction('@pi', _ => Math.PI);
    novasheets.addFunction('@mod', (_, a, b) => testNaN(a % b, _));
    novasheets.addFunction('@sin', (_, a) => testNaN(Math.sin(a), _));
    novasheets.addFunction('@asin', (_, a) => testNaN(Math.asin(a), _));
    novasheets.addFunction('@cos', (_, a) => testNaN(Math.cos(a), _));
    novasheets.addFunction('@acos', (_, a) => testNaN(Math.acos(a), _));
    novasheets.addFunction('@tan', (_, a) => testNaN(Math.tan(a), _));
    novasheets.addFunction('@atan', (_, a) => testNaN(Math.atan(a), _));
    novasheets.addFunction('@abs', (_, a) => testNaN(Math.abs(a), _));
    novasheets.addFunction('@floor', (_, a) => testNaN(Math.floor(a), _));
    novasheets.addFunction('@ceil', (_, a) => testNaN(Math.ceil(a), _));
    novasheets.addFunction('@percent', (_, a) => testNaN(toNumber(a) * 100 + '%', _));
    novasheets.addFunction('@log', (_, base, num) => testNaN(Math.log(num) / (base ? Math.log(base) : 1), _));
    novasheets.addFunction('@root', (_, a, b) => testNaN(Math.pow(b ? b : a, 1 / (b ? a : 2)), _));

    novasheets.addFunction('@round', (_, a, b) => {
        let num = toNumber(a) + Number.EPSILON;
        let dp = Math.pow(10, b || 0);
        return testNaN(Math.round(num * dp) / dp, _);
    });

    novasheets.addFunction('@min|@max', (_, ...a) => {
        let nums = [];
        for (let item of a) if (item) nums.push(item);
        let output = Math[_.includes('@min') ? 'min' : 'max'](...nums);
        return testNaN(output, _);
    });

    novasheets.addFunction('@clamp', (_, a, b, c) => {
        let val = Number(a), min = Number(b), max = Number(c);
        if (max < min) [min, max] = [max, min];
        let output = val <= min ? min : (val >= max ? max : val);
        return testNaN(output, _);
    });

    novasheets.addFunction('@degrees', (_, a) => {
        let [num, type] = [a.replace(/[a-z]+/, ''), a.replace(RegExp(number), '')];
        if (type === 'grad') return num * 0.9;
        let output = num / Math.PI * 180; // default to radians
        return testNaN(output, _);
    });

    novasheets.addFunction('@radians', (_, a) => {
        let [num, type] = [a.replace(/[a-z]+/, ''), a.replace(RegExp(number), '')];
        if (type === 'grad') return num * Math.PI / 200;
        let output = num * Math.PI / 180; // default to degrees
        return testNaN(output, _);
    });

    novasheets.addFunction('@gradians', (_, a) => {
        let [num, type] = [a.replace(/[a-z]+/, ''), a.replace(RegExp(number), '')];
        if (type === 'rad') return num / Math.PI * 200;
        let output = num / 0.9; // default to degrees
        return testNaN(output, _);
    });


    /// Text functions

    novasheets.addFunction('@lowercase', (_, a) => a.toLowerCase());
    novasheets.addFunction('@uppercase', (_, a) => a.toUpperCase());
    novasheets.addFunction('@titlecase', (_, a) => a.replace(/\b\w/g, a => a.toUpperCase()));
    novasheets.addFunction('@capitali[sz]e', (_, a) => a[0].toUpperCase() + a.substr(1));
    novasheets.addFunction('@uncapitali[sz]e', (_, a) => a[0].toLowerCase() + a.substr(1));
    novasheets.addFunction('@extract', (_, a, b, c) => a.split(c ? b : ',')[toNumber(c ? c : b) - 1] || '');
    novasheets.addFunction('@encode', (_, a) => encodeURIComponent(a));
    novasheets.addFunction('@length', (_, a) => a.strim().length);

    novasheets.addFunction('@replace', (_, ...args) => {
        if (args.length < 3) args = [args[0], args[1] || '', args[2] || ''];
        args = args.slice(0, args.indexOf('') <= 3 ? 3 : args.indexOf(''));
        let text = args[0].strim();
        let finder = args.slice(1, -1).join('|').strim();
        let replacer = args.slice(-1)[0].strim();
        let isRegex = finder.startsWith('/');
        if (isRegex) {
            let parts = finder.strim().match(/\/(.+?)\/([gimusy]*)/).slice(1);
            finder = RegExp(parts[0], parts[1] || 's');
        }
        return text.replace(isRegex ? finder : RegExp(escapeRegex(finder), 'g'), replacer);
    }, { notrim: true, allargs: true });


    /// Colour functions

    const toPercent = val => Math.floor(Number(val) / 255 * 100);
    const fromPercent = val => Math.ceil(Number(val.replace('%', '')) * 255 / 100);
    const toHex = val => Number(val).toString(16).padStart(2, '0');
    const rgbFromHex = (hex, alpha) => {
        let num = parseInt(hex.replace(/#?(.{0,8})$/, '$1'), 16);
        let r = (num >> 16) & 255;
        let g = (num >> 8) & 255;
        let b = num & 255;
        let a = alpha && toPercent(parseInt(alpha, 16));
        if (a != null) return `rgba(${r}, ${g}, ${b}, ${a})`;
        return `rgb(${r}, ${g}, ${b})`;
    }
    const parseHex = val => {
        let a = val.replace('#', '');
        switch (a.length) {
            case 0: return rgbFromHex('000000', '00');
            case 1: return rgbFromHex(a.repeat(6));
            case 2: return rgbFromHex(a[0].repeat(6), a[1].repeat(2));
            case 3: return rgbFromHex(a[0] + a[0] + a[1] + a[1] + a[2] + a[2]);
            case 4: return rgbFromHex(a[0] + a[0] + a[1] + a[1] + a[2] + a[2], a[3] + a[3]);
            default: return rgbFromHex(a.substr(0, 6).padEnd(6, '0'), a.substr(6, 2) || null);
        }
    }
    const getRawColorParts = col => col.replace(/^\s*\w{3}a?\s*\(\s*|\s*\)$/g, '').split(/,\s*/);
    const getColorParts = color => {
        let parts = getRawColorParts(color.startsWith('#') ? parseHex(color) : color);
        for (let i in parts) {
            if (!parts[i]) parts[i] = 0;
            else if (parts[i].includes('%')) {
                let num = parts[i].replace('%', '');
                if (color.includes('hsl')) parts[i] = "" + Math.round(num / 100 * (i === 0 ? 360 : 100));
                else parts[i] = "" + fromPercent(num);
            }
            else if (i === 3) parts[i] = Math.round(color.includes('rgb') ? num / 255 : num / 100);
        }
        return parts;
    }
    const hexFromRgb = (rgb) => {
        let [r, g, b, a] = Array.isArray(rgb) ? rgb : getColorParts(rgb);
        return '#' + toHex(r) + toHex(g) + toHex(b) + (a > 0 ? toHex(a) : '');
    }
    const blendColors = (color1, color2, amt) => {
        if (!color2) return color1 || '';
        let type = color1.match(/^[a-z]{3}a?|^#/).toString();
        let amount = Math.abs(amt.toString().includes('%') ? amt.replace('%', '') / 100 : amt);
        amount = amount > 1 ? 1 : amount;
        const blendVal = (a, b) => Math.floor((toNumber(a) * (1 - amount) + toNumber(b) * (amount)));
        let [[r1, g1, b1, a1], [r2, g2, b2, a2]] = [getColorParts(color1), getColorParts(color2)];
        let [r, g, b, a] = [blendVal(r1, r2), blendVal(g1, g2), blendVal(b1, b2), blendVal(a1, a2)];
        switch (type) {
            case 'rgba': return `rgba(${r}, ${g}, ${b}, ${a})`;
            case 'rgb': return `rgb(${r}, ${g}, ${b})`;
            case 'hsla': return `hsla(${r % 360}, ${g / 100}%, ${b / 100}%, ${a})`;
            case 'hsl': return `hsla(${r % 360}, ${g / 100}%, ${b / 100}%)`;
            case '#': return hexFromRgb([r, g, b, a]);
            default: `${type}(${r}, ${g}, ${b})`;
        }
    }
    const blendGrayscaleHsl = (type, color1, color2, amt) => {
        if (!color1.includes('hsl')) return blendColors(color1, color2, amt || 0.5);
        let [h, s, l, a] = getColorParts(color1);
        let amount = amt.replace('%', '');
        let sNew = toNumber(s) - toNumber(amount);
        let lNew = toNumber(l) + toNumber(amount) * (type === 'darken' ? -1 : 1);
        let sl = type === 'desat' ? `${sNew}%, ${l}%` : `${s}%, ${lNew < 0 ? 0 : lNew}%`;
        return `${color1.match(/^hsla?/)}(${h % 360}, ${sl}${a ? `, ${a}` : ''})`;
    }

    novasheets.addFunction('@colou?r', (_, type, a = '0', b = '0', c = '0', d = '') => {
        if (/#|rgba?|hsla?/i.test(a)) {
            if (a.includes('#')) a = parseHex(a);
            if (/rgba?|hsla?/.test(a)) [a, b, c, d] = getColorParts(a);
        } else[a, b, c, d] = getColorParts(`${type}(${a}, ${b}, ${c}, ${d})`);

        switch (type = type.toLowerCase()) {
            case '#': case 'hash': case 'hex': case 'hexadecimal': return '#' + toHex(a) + toHex(b) + toHex(c) + (d ? toHex(fromPercent(d)) : '');
            case 'rgb': return `rgb(${a}, ${b}, ${c})`;
            case 'rgba': return `rgba(${a}, ${b}, ${c}, ${d || d === 0 ? 100 : ''}%)`;
            case 'hsl': return `hsl(${a % 360}, ${b}%, ${c}%)`;
            case 'hsla': return `hsla(${a % 360}, ${b}%, ${c}%, ${d || d === 0 ? 100 : ''}%)`;
            default: return `${type}(${a} ${b} ${c}${d ? ` / ${d}` : ''})`;
        }
    });

    novasheets.addFunction('@colou?rpart', (_, a = '', b = '') => {
        let [part, color] = [a.toLowerCase(), b.toLowerCase()];
        let parts = getColorParts(color);
        const obj = { r: parts[0], h: parts[0], g: parts[1], s: parts[1], b: parts[2], l: parts[2], a: parts[3] };
        return obj[part[0]] || color;
    });

    novasheets.addFunction('@spin', (_, color, amount) => {
        let oldHue = color.replace(/^hsla?\s*\((\d+),\s*.+\s*\)\s*$/g, '$1');
        let newHue = (toNumber(oldHue) + toNumber(amount || 0)) % 360;
        return color.replace(oldHue, newHue);
    });

    novasheets.addFunction('@blend', (_, color1, color2, amount = 0.5) => blendColors(color1, color2, amount));
    novasheets.addFunction('@tint|@lighten', (_, color, amount = 0.5) => blendGrayscaleHsl('lighten', color, '#fff', amount));
    novasheets.addFunction('@shade|@darken', (_, color, amount = 0.5) => blendGrayscaleHsl('darken', color, '#000', amount));
    novasheets.addFunction('@tone|@desaturate', (_, color, amount = 0.5) => blendGrayscaleHsl('desat', color, '#808080', amount));

    const parseLuma = (arg, rgb) => {
        if (!(arg.startsWith('rgb') || arg.startsWith('#'))) return arg;
        let [r, g, b] = rgb ? [...rgb] : getColorParts(arg);
        const adjustGamma = a => ((a + 0.055) / 1.055) ** 2.4;
        const getLuma = a => a <= 0.03928 ? a / 12.92 : adjustGamma(a);
        return 0.2126 * getLuma(r / 255) + 0.7152 * getLuma(g / 255) + 0.0722 * getLuma(b / 255); // ITU-R BT.709
    }

    novasheets.addFunction('@luma', (_, color) => parseLuma(color));

    novasheets.addFunction('@contrast', (_, color, light = '', dark = '') => (parseLuma(color) < 0.5/*'is dark?':*/) ? light : dark);

    novasheets.addFunction('@gr[ae]yscale', (_, color) => {
        if (color.startsWith('hsl')) return color.replace(/^(hsla?)\s*\(\s*(\d+),\s*(\d+)/, '$1($2, 0')
        let gray = Math.round(parseLuma(color) * 255);
        let newColor = `rgb(${Array(3).fill(gray).join(', ')})`
        if (color.startsWith('#')) return hexFromRgb(newColor);
        else return newColor;
    });


    /// Logical functions

    const bracketedNumber = r`(?:\(\s*${basedNumber}\s*\)|${basedNumber})`;
    const parseLogic = arg => {
        for (let i = 0; i < constants.MAX_ARGUMENTS / 10; i++) {
            arg = arg.strim()
                .replace(/(?:'(.+?)'|"(.+?)")+/, '$1$2') // remove quotes
                .replace(/\bor\b/gi, '||').replace(/\band\b/gi, '&&').replace(/\bnot\b/gi, '!') // default logical operators
                .replace(/(.+?)\bnor\b(.+)?/gi, '!($1) && !($2)') // 'nor' logical operator
                .replace(/(.+?)\bnand\b(.+)?/gi, '!($1) || !($2)') // 'nand' logical operator
                .replace(/(.+?)\bxor\b(.+)?/gi, '($1 && !($2)) || (!($1) && $2)') // 'xor' logical operator
                .replace(/(.+?)\bxnor\b(.+)?/gi, '$1 == $2') // 'xnor' logical operator
                .replace(/(?!=)(!?)=(==)?(?!=)/g, '$1$2==') // normalise equality signs
        }
        if (arg.match(/(<|<=|>|>=|==|!=|&|\||!)/)) arg = eval(arg);
        if (['false', 'undefined', 'null', 'NaN', ''].includes(arg)) arg = false;
        return arg;
    };
    const logicRegex = arg => RegExp(r`([+-]?${bracketedNumber})\s*(?:${arg})\s*([+-]?${bracketedNumber})`);

    novasheets.addFunction('@bitwise', (_, a) => {
        let arg = a.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<') // fix html
        for (let i = 0; i < constants.MAX_ARGUMENTS / 10; i++) {
            arg = arg
                .replace(RegExp(r`(?:~|!|not)\s*([+-]?${bracketedNumber})`), (_, a) => eval('~' + toNumber(a))) // bitwise not
                .replace(logicRegex('or|\\|'), (_, a, b) => eval(`(${toNumber(a)}) | (${toNumber(b)})`)) // bitwise or
                .replace(logicRegex('nor'), (_, a, b) => eval(`~ (${toNumber(a)}) | (${toNumber(b)})`)) // bitwise nor
                .replace(logicRegex('and|&'), (_, a, b) => eval(`(${toNumber(a)}) & (${toNumber(b)})`)) // bitwise and
                .replace(logicRegex('nand'), (_, a, b) => eval(`~ (${toNumber(a)}) & (${toNumber(b)})`)) // bitwise nand
                .replace(logicRegex('xor'), (_, a, b) => eval(`(${toNumber(a)}) ^ (${toNumber(b)})`)) // bitwise xor
                .replace(logicRegex('xnor'), (_, a, b) => eval(`~ (${toNumber(a)}) ^ (${toNumber(b)})`)) // bitwise xnor
        }
        return arg;
    });

    novasheets.addFunction('@boolean', (_, a) => parseLogic(a));
    novasheets.addFunction('@if', (_, a, b = '', c = '') => parseLogic(a) ? b : c);


    /// CSS functions

    novasheets.addFunction('@breakpoint', (_, a = 0, b = '', c = '', d = '') => {
        if (!a) return _;
        const makeQuery = (type, width, content) => {
            return `@media (${type}-width: ${width.trim()}${type === 'max' ? '-1px' : ''}) { ${content}}`;
        };
        let isBlock = (b + c).includes('{');
        let content = isBlock ? [b, c] : [`${b} {${c}} `, `${b} {${d}} `];
        let ltContent = (isBlock ? b : c).trim() ? makeQuery('max', a, content[0]) : '';
        let gtContent = (isBlock ? c : d).trim() ? makeQuery('min', a, content[1]) : '';
        return ltContent + (ltContent && gtContent ? '\n' : '') + gtContent;
    }, { notrim: true });

    novasheets.addFunction('@prefix', (_, a, b) => {
        return `-webkit-${a}: ${b}; -moz-${a}: ${b}; -ms-${a}: ${b}; -o-${a}: ${b}; ${a}: ${b};`;
    }, { nonest: true });

    /// Return
    return novasheets.getFunctions();

}

// Export

try {
    module.exports = addBuiltInFunctions;
} catch { }
