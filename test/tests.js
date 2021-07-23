const NovaSheets = require('../src/index');
const QUnit = require('qunit');

const ditto = null;

function test(assert, content, functions) {
    for (const [input, expected, notrim] of content) {
        let execVal = NovaSheets.parse(input, functions);
        let expecVal = expected || input;
        if (!notrim) {
            execVal = execVal.replace(/\s/g, '');
            expecVal = expecVal.replace(/\s/g, '');
        }
        assert.equal(execVal.trim(), expecVal.trim(), input + ' -> ' + expecVal);
    }
}

QUnit.module('NovaSheets content', () => {
    QUnit.test('Variables', q => {
        const vars = `
            @var var1 // void
            @var var2 = $[1] content // void
            @var var3 // void
                $[type] content // void
            @endvar // void
        `;
        const tests = [
            [vars + '$(var1)', ' '],
            [vars + '$(var2|inline)', 'inline content'],
            [vars + '$(var3|type = block)', 'block content'],
        ];
        test(q, tests);
    });
    QUnit.test('Parser constants', q => {
        const tests = [
            ['@option DECIMAL_PLACES 2\n2/3', '0.67'],
            ['@option DECIMAL_PLACES 0\n2/3', '1'],
        ];
        test(q, tests);
    });
    QUnit.test('Object notation and declaration substitution', q => {
        const tests = [
            ['{color: blue;}<color>', 'blue'],
            ['{color: blue;}!', 'color: blue;'],
            ['@var obj\n{color: blue;}@endvar$(obj)<color>', 'blue'],
            ['div {width: 100%} a {width: $<div><width>}', 'div {width: 100%} a {width: 100%}'],
            ['a { b {color: red;} u {color: $<a b><color>;} }', 'a b {color: red;} a u {color:red;}'],
            ['a {b:c;} x {$<a>!; $<a><b>; $<a><b>;}', 'a {b:c;} x {b:c; c; c;}'],
        ];
        test(q, tests);
    });
    QUnit.test('Simple breakpoints', q => {
        const tests = [
            ['.element @ ..10px {display: none;}', '@media (max-width: 9px) { .element { display: none; } }'],
            ['.element @ 10px {display: none;}', '@media (min-width: 10px) { .element { display: none; } }'],
            ['.element @ 10px... {display: none;}', '@media (min-width: 10px) { .element { display: none; } }'],
            ['.element @ 10px 20px {display: none;}', '@media (min-width: 10px) and (max-width: 19px) { .element { display: none; } }'],
            ['@var bp = 100px @endvar td @ $(bp).. {margin: 0;} a @ ..$(bp) { &&.foo {margin: 0;}}', '@media (min-width:100px) {td{margin:0;}} @media (max-width:99px) {aa.foo{margin:0;}}'],
        ];
        test(q, tests);
    });
    QUnit.test('Nesting', q => {
        const tests = [
            ['a { &b { x:y; } }', 'ab {x:y;}', 'notrim'],
            ['a { b { x:y; } }', 'a b {x:y;}', 'notrim'],
            ['a { color: red; b { x:y; } }', 'a {color: red;} a b {x:y;}'],
            ['a { b { x:y; } color: red; }', 'a {color: red;} a b {x:y;}'],
            ['a @ 10px {a:b; &c @ 20px {d:1} }', '@media (min-width: 10px) { a { a:b; } } @media (min-width: 20px) { ac { d:1 } }'],
            ['a {a:b; b {c:a} d {e{x:y}} x:y }', 'a {a:b; x:y;} a b {c:a} a d e {x:y}'],
            ['@var x = red;\n a {color: $(x)}', 'a {color: red;}'],
            ['a { @media (min-width: 100px) { color: red; } }', '@media (min-width: 100px) { a {color: red;} }'],
        ];
        test(q, tests);
    });
});
QUnit.module('Math', () => {
    QUnit.test('Basic math', q => {
        const tests = [
            ['1+2', '3'],
            ['1 +2', '3'],
            ['1 + 2', '3'],
            ['1 + +2', '3'],
            ['1 + -2', '-1'],
            ['1--2', '3'],
            ['1-2', '-1'],
            ['1- 2', '-1'],
            ['1 - 2', '-1'],
            ['1 - -2', '3'],
            ['1-2-3-4-5-6-7-8-9-10', '-53'],
            ['1/2', '0.5'],
            ['1*2', '2'],
            ['1^2', '1'],
            ['1**2', '1'],
            ['1e2', '100'],
            ['2e-2', '0.02'],
            ['1 ++ 2e-2', '1.02'],
            ['(1+2)', '3'],
            ['(1+3)/2', '2'],
            ['(1 -- 2) /3', '1'],
            ['(1 + 3**2) - (2 / 2**4 + 1 / 4)', '9.625'],
            ['0 -3em', ditto],
            ['1em -2em', ditto],
            ['1em 2em', ditto],
            ['(1+3)em/2', '2em'],
            ['(1+3)em/2em', '2em'],
            ['(1+3)/2em', '2em'],
            ['1ms + 2ms', '3ms'],
            ['1s + 1000ms', '2s'],
            ['1s + 50ms', '1.05s'],
            ['1cm + 20mm', '3cm'],
        ];
        test(q, tests);
    });
});
QUnit.module('Built-in functions', () => {
    QUnit.test('Math functions', q => {
        const tests = [
            ['$(@round | 1.2 )', '1'],
            ['$(@ceil | 0.7 )', '1'],
            ['$(@floor | 1.7 )', '1'],
            ['$(@round | 2.1  )', '2'],
            ['$(@round | $(@e) | 5 )', '2.71828'],
            ['$(@round | $(@pi) | 5 )', '3.14159'],
            ['$(@abs | -5 )', '5'],
            ['$(@sin | $(@pi) )', '0'],
            ['$(@sin | $(@pi)/2 )', '1'],
            ['$(@cos | $(@pi) )', '-1'],
            ['$(@round | $(@acos | 0) | 5 )', '1.5708'],
            ['$(@clamp | -5 | 1 | 5 )', '1'],
            ['$(@clamp | 10 | 1 | 5 )', '5'],
            ['$(@min | -5 | 1 | 6 )', '-5'],
            ['$(@max | -5 | 1 | 6 )', '6'],
            ['$(@degrees | 2*$(@pi) )', '360'],
            ['$(@degrees | 2*$(@pi) )', '360'],
            ['$(@radians | 90deg )/$(@pi)', '0.5'],
            ['$(@gradians | $(@pi)rad )', '200'],
            ['$(@gradians | 180 )', '200'],
            ['$(@log | 10 | 10000 )', '4'],
            ['$(@log | 2 | 64 )', '6'],
            ['$(@root | 2 | 64 )', '8'],
            ['$(@root | 2 | 25 )', '5'],
            ['$(@mod | 10 | 6 )', '4'],
            ['$(@percent | 0.5 )', '50%'],
        ];
        test(q, tests);
    });
    QUnit.test('Logic functions', q => {
        const tests = [
            ['$(@bitwise | ~2 & 4)', '4'],
            ['$(@boolean | true and false or true)', 'true'],
            ['$(@if | 1 < 2 | iftrue | iffalse)', 'iftrue'],
        ];
        test(q, tests);
    });
    QUnit.test('Text functions', q => {
        const tests = [
            ['$(@lowercase | Lowercase Text )', 'lowercase text'],
            ['$(@uppercase | UpperCase Text )', 'UPPERCASE TEXT'],
            ['$(@titlecase | title case TEXT )', 'Title Case TEXT'],
            ['$(@capitalize | capitaliZed )', 'CapitaliZed'],
            ['$(@uncapitalize | CAPS )', 'cAPS'],
            ['$(@length | 123456 )', '6'],
            ['$(@encode | [text]="true")', '%5Btext%5D%3D%22true%22'],
            ['$(@replace | text | /te(.)t/ | !$1! )', '!x!'],
            ['$(@replace | teExt | /e/gi | 3)', 't33xt'],
        ];
        test(q, tests);
    });
    QUnit.test('Colour functions', q => {
        const tests = [
            ['$(@color | hash | rgb(128, 255, 0) )', '#80ff00'],
            ['$(@colourpart | red | #fff)', '255'],
            ['$(@luma | rgb(10, 20%, 100%) )', '0.09652182741852182'],
            ['$(@spin | hsl(10, 20%, 30) | -10 )', 'hsl(0, 20%, 30)'],
            ['$(@shade | #fff | 50% )', '#7f7f7f'],
            ['$(@tint | rgb(10, 75%, 20) | 10% )', 'rgb(34, 198, 43)'],
            ['$(@tone | hsl(100, 75%, 20%) | 50% )', 'hsl(100, 25%, 20%)'],
            ['$(@contrast | #1a5 | white | black )', 'white'],
        ];
        test(q, tests);
    });
    QUnit.test('Loop functions', q => {
        const tests = [
            ['$(@each | tr td | | | $v {display:none;} )', 'tr {display:none;} td {display:none;}'],
            ['$(@each | a,b,c | , |; | $v: $(@cos|$(@pi)*$i) )', 'a: -1; b: 1; c: -1'],
            ['$(@repeat | 3 | ; | (10x$i)exp2=$(@root | 0.5 | 10*$i ) );', '(10x1)exp2=100;(10x2)exp2=400;(10x3)exp2=900;'],
            ['$(@each | 1,2,3,4,5,6,7,8,9 | , | | $v($i) )', '1(1) 2(2) 3(3) 4(4) 5(5) 6(6) 7(7) 8(8) 9(9)'],
        ];
        test(q, tests);
    });
    QUnit.test('CSS functions', q => {
        const tests = [
            ['$(@breakpoint | 500px | selector | less: 1 | more: 1 )', ' @media (max-width: 499px) { selector { less: 1 } } @media (min-width: 500px) { selector { more: 1 } }'],
            ['$(@breakpoint | 500px | less {a:b} | more {a:b} )', ' @media (max-width: 499px) { less {a:b} } @media (min-width: 500px) { more {a:b} }'],
            ['x {$(@breakpoint|300px|y|a:b;|c:d;)}', '@media (max-width: 299px) { x y {a:b;} } @media (min-width: 300px) { x y {c:d;} }'],
            ['$(@prefix | transition | all 1s )', '-webkit-transition: all 1s; -moz-transition: all 1s; -ms-transition: all 1s; -o-transition: all 1s; transition: all 1s;']
        ];
        test(q, tests);
    });
});
QUnit.module('CSS aspects', () => {
    QUnit.test('Comments', q => {
        const tests = [
            [' // inline comment', ' '],
            ['/*regular block comment, $(@e)*/', ditto],
            ['/*/static comment, $(@e)/*/', 'static comment, $(@e)'],
            ['/*[parsed comment, $(@e)]*/', '/*parsed comment, 2.718281828459045*/'],
        ];
        test(q, tests);
    });
});
QUnit.module('Misc', () => {
    QUnit.test('Custom functions', q => {
        const nova = new NovaSheets();
        nova.addFunction('@give null', () => 'null');
        nova.addFunction('@return1', () => 1);
        nova.addFunction('@invert boolean', (_, boolean) => boolean !== 'true');
        const tests = [
            ['$(@give null)', 'null'],
            ['$(@return1)', '1'],
            ['$(@invert boolean | false)', 'true']
        ];
        test(q, tests, nova);
    });
    QUnit.test('Watchlist', q => {
        const tests = [
            ['https://example.com', ditto],
            ['::root {color: red;}', ditto],
            ['@a; @b;', ditto],
            ['#1e4', ditto],
            ['padding: 0 -2em;', ditto],
            ['@import url(foo); a {x:y;}', ditto],
            ['calc(1 + 2 / 4)', '1.5'],
            ['font: 12px/18px Arial', ditto],
            ['grid-area: 2 / 4', ditto],
            ['rgb(0% 64 12 / 50%)', ditto],
            ['td {height: $(@round|1.2)em; margin: calc(var(--a)+1);}', 'td {height: 1em; margin: calc(var(--a)+1);}'],
        ];
        test(q, tests);
    });
});

const testResults = {};

const padNum = num => num.toString().padStart(2, ' ');

QUnit.testDone(info => {
    testResults[info.name] = `${padNum(info.runtime)}ms:  ${padNum(info.passed)} passed ${padNum(info.failed)} failed`;
});
QUnit.done(info => {
    for (let test in testResults) console.log(`${test.substr(0, 20).padEnd(20, ' ')} ${testResults[test]}`);
    console.log(`Ran ${info.total} tests in ${info.runtime}ms with ${info.failed} failures\n`);
});
