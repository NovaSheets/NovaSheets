const NovaSheets = require('../src/novasheets.js');
const QUnit = require('qunit');

const ditto = null;

function test(assert, content) {
    for (let item of content) {
        if (!item[1]) item[1] = item[0];
        assert.equal(NovaSheets.parse(item[0]), item[1], item[0] + ' -> ' + item[1]);
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
            ['@const DECIMAL_PLACES 2\n2/3', '0.67'],
            ['@const DECIMAL_PLACES 0\n2/3', '1'],
        ];
        test(q, tests);
    });
    QUnit.test('Object notation and declaration substitution', q => {
        const tests = [
            ['{color: blue;}<color>', 'blue'],
            ['{color: blue;}!', 'color: blue;'],
            ['@var obj\n{color: blue;}@endvar$(obj)<color>', 'blue'],
            ['div {width:100%} $<div><width>', 'div {width:100%} 100%'],
        ];
        test(q, tests);
    });
    QUnit.test('Simple breakpoints', q => {
        const tests = [
            ['.element @ ..10px {display: none;}', '@media only screen and (max-width: 9px) { .element { display: none; } }'],
            ['.element @ 10px {display: none;}', '@media only screen and (min-width: 10px) { .element { display: none; } }'],
            ['.element @ 10px... {display: none;}', '@media only screen and (min-width: 10px) { .element { display: none; } }'],
            ['.element @ 10px 20px {display: none;}', '@media only screen and (min-width: 10px) and (max-width: 19px) { .element { display: none; } }'],
            ['a @ 10px {b} & c @ 20px {d}', '@media only screen and (min-width: 10px) { a { b } }@media only screen and (min-width: 20px) { a c { d } }'],
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
            ['1--2', '3'],
            ['1-2', '-1'],
            ['1- 2', '-1'],
            ['1 - 2', '-1'],
            ['1 -2', '-1'],
            ['1-2-3-4-5-6-7-8-9-10', '-53'],
            ['1/2', '0.5'],
            ['1*2', '2'],
            ['1^2', '1'],
            ['1**2', '1'],
            ['1e2', '100'],
            ['(1+2)', '3'],
            ['(1+3)/2', '2'],
            ['(1 -- 2) /3', '1'],
            ['(1 + 3**2) - (2 / 2**4 + 1 / 4)', '9.625'],
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
            ['$(@round | $(@e) | 5 )', '2.71828'],
            ['$(@round | $(@pi) | 5 )', '3.14159'],
            ['$(@abs | -5 )', '5'],
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
        ];
        test(q, tests)
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
            ['$(@each | a,b,c | , |; | $v: $(@cos|$(@pi)*$i) )', 'a: -1; b: 1; c: -1'],
            ['$(@repeat | 3 | ; | (10x$i)exp2=$(@root | 0.5 | 10*$i ) );', '(10x1)exp2=100;(10x2)exp2=400;(10x3)exp2=900;'],
            ['$(@each | 1,2,3,4,5,6,7,8,9 | , | | $v($i) )', '1(1) 2(2) 3(3) 4(4) 5(5) 6(6) 7(7) 8(8) 9(9)'],
        ];
        test(q, tests);
    });
    QUnit.test('CSS functions', q => {
        const tests = [
            ['$(@breakpoint | 500px | selector | less | more )', ' @media (max-width: 499px) { selector { less } } @media (min-width: 500px) { selector { more } }'],
            ['$(@breakpoint | 500px | less {} | more {} )', ' @media (max-width: 499px) { less {} } @media (min-width: 500px) { more {} }'],
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
    QUnit.test('Prev selectors', q => {
        const tests = [
            ['.list {} & .item {}', '.list {} .list .item {}'],
            ['.list p {} &< .item {}', '.list p {} .list .item {}'],
            ['.a .b .c << {}', '.a {}'],
            ['.a {} % .b {} % .c {}', '.a {} .a .b {} .a .b .c {}'],
        ];
        test(q, tests);
    });
});
QUnit.module('Misc', () => {
    QUnit.test('Watchlist', q => {
        const tests = [
            ['https://example.com', ditto],
            ['::root {color: red;}', ditto],
            ['#1e4', ditto],
            ['{} [attr] {}', ditto],
        ];
        test(q, tests);
    });
});
