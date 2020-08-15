---
layout: layouts/docs.njk
permalink: /docs/default-variables/
title: Default Variables
js: "headings"
---

# NovaSheets Default Variables <!-- omit in toc -->
NovaSheets includes many built-in [variables](/docs/variables/) which take the form of a variety of functions. The following is a list of these and their syntax.

## Contents <!-- omit in toc -->

<div id="toc"></div>

- [Mathematics](#mathematics)
  - [@abs](#abs)
  - [@acos](#acos)
  - [@asin](#asin)
  - [@atan](#atan)
  - [@degrees](#degrees)
  - [@e](#e)
  - [@ceil](#ceil)
  - [@clamp](#clamp)
  - [@cos](#cos)
  - [@floor](#floor)
  - [@gradians](#gradians)
  - [@log](#log)
  - [@max](#max)
  - [@min](#min)
  - [@mod](#mod)
  - [@pi](#pi)
  - [@percent](#percent)
  - [@radians](#radians)
  - [@root](#root)
  - [@round](#round)
  - [@sin](#sin)
  - [@tan](#tan)
- [Logic](#logic)
  - [@bitwise](#bitwise)
  - [@boolean](#boolean)
  - [@if](#if)
- [Text](#text)
  - [@each](#each)
  - [@encode](#encode)
  - [@extract](#extract)
  - [@length](#length)
  - [@replace](#replace)
- [Color](#color)
  - [@color](#color-1)
    - [hash](#hash)
    - [rgb](#rgb)
    - [rgba](#rgba)
    - [hsl](#hsl)
    - [hsla](#hsla)
    - [*custom*](#custom)
  - [@colorpart](#colorpart)
  - [@contrast](#contrast)
  - [@blend](#blend)
  - [@grayscale](#grayscale)
  - [@luma](#luma)
  - [@shade](#shade)
  - [@spin](#spin)
  - [@tint](#tint)
  - [@tone](#tone)
- [CSS](#css)
  - [@breakpoint](#breakpoint)
  - [@prefix](#prefix)

## Mathematics

### @abs
**Syntax:** `$( @abs | <num> )`<br>
**Result:** Outputs the absolute value of `<num>`.<br>
**Example:** `$( @abs | -2 )` &rarr; `2`

### @acos
**Syntax:** `$( @acos | <num> )`<br>
**Result:** Outputs the arccosine of `<num>`.<br>
**Example:** `$( @acos | 0 )` &rarr; `1.5707963267948966`

### @asin
**Syntax:** `$( @asin | <num> )`<br>
**Result:** Outputs the arcsine of `<num>`.<br>
**Example:** `$( @asin | 0.5 )` &rarr; `0.5235987755982989`

### @atan
**Syntax:** `$( @atan | <num> )`<br>
**Result:** Outputs the arctangent of `<num>`.<br>
**Example:** `$( @atan | 10 )` &rarr; `1.4711276743037347`

### @degrees
**Syntax:** `$( @degrees | <num>[rad|grad] )`<br>
**Result:** Converts `<num>` from either radians (default) or gradians to degrees.<br>
**Example:** `$( @degrees | 100grad )` &rarr; `90`

### @e
**Syntax:** `$( @e )`<br>
**Result:** Outputs e (2.71828...).<br>
**Example:** `$( @e )` &rarr; `2.718281828459045`

### @ceil
**Syntax:** `$( @ceil | <num> )`<br>
**Result:** Rounds `<num>` up to the nearest integer.<br>
**Example:** `$( @ceil | 4.2 )` &rarr; `5`

### @clamp
**Syntax:** `$( @clamp | <val> | <min> | <max>)`<br>
**Result:** Outputs `<val>` only if it is between `<min>` and `<max>`, otherwise outputs either `<min>` or `<max>`, whichever is closer to `<val>`.<br>
**Example:** `$( @clamp | 1.4 | 2 | 5 )` &rarr; `2`

### @cos
**Syntax:** `$( @cos | <num> )`<br>
**Result:** Outputs the cosine of `<num>` in radians.<br>
**Example:** `$( @cos | 0 )` &rarr; `1`

### @floor
**Syntax:** `$( @floor | <num> )`<br>
**Result:** Rounds `<num>` down to the nearest integer.<br>
**Example:** `$( @floor | 3.8 )` &rarr; `3`

### @gradians
**Syntax:** `$( @gradians | <num>[deg|rad] )`<br>
**Result:** Converts `<num>` from either degrees (default) or radians to gradians.<br>
**Example:** `$( @gradians | 90deg )` &rarr; `100`

### @log
**Syntax:** `$( @log | <base> | <val> )`<br>
**Result:** Outputs the logarithm (base `base`) of `<val>`.<br>
**Example:** `$( @log | 2 | 64 )` &rarr; `6`

### @max
**Syntax:** `$( @max | <a> | <b> | ...)`<br>
**Result:** Outputs the maximum value of its arguments.<br>
**Example:** `$( @max | 2 | 7 | 5 )` &rarr; `7`;

### @min
**Syntax:** `$( @min | <a> | <b> | ...)`<br>
**Result:** Outputs the minimum value of its arguments.<br>
**Example:** `$( @min | 1 | 2 | 3 )` &rarr; `1`;

### @mod
**Syntax:** `$( @mod | <a> | <b> )`<br>
**Result:** Outputs `<a>` modulo (remainder after division by) `<b>`.<br>
**Example:** `$( @mod | 10 | 6 )` &rarr; `4`

### @pi
**Syntax:** `$( @pi )`<br>
**Result:** Outputs pi (3.14159...).<br>
**Example:** `$( @pi )` &rarr; `3.141592653589793`

### @percent
**Syntax:** `$( @percent | <num> )`<br>
**Result:** Outputs `<num>` as a percentage.<br>
**Example:** `$( @percent | 0.5 )` &rarr; `50%`

### @radians
**Syntax:** `$( @radians | <num>[deg|grad] )`<br>
**Result:** Converts `<num>` from either degrees (default) or gradians to radians.<br>
**Example:** `$( @radians | 90 / $(@pi) )` &rarr; `0.5 ` 

### @root
**Syntax:** `$( @root | <n> | <val> )`<br>
**Result:** Outputs the `<n>`th root of `<val>`.<br>
**Example:** `$( @root | 3 | 27 )` &rarr; `3`

### @round
**Syntax:** `$( @round | <val> | <dp> )`<br>
**Result:** Rounds `<val>` to `<dp>` decimal places.<br>
**Example:** `$( @round | $(@pi) | 5 )` &rarr; `3.14159`

### @sin
**Syntax:** `$( @sin | <num> )`<br>
**Result:** Outputs the sine of `<num>` in radians.<br>
**Example:** `$( @sin | 0.5*$(@pi) )` &rarr; `1`

### @tan
**Syntax:** `$( @tan | <num> )`<br>
**Result:** Outputs the tangent of `<num>` in radians.<br>
**Example:** `$( @tan | 12 )` &rarr; `-0.6358599286615808`

## Logic

### @bitwise
**Syntax:** `$( @bitwise | <contents> )`<br>
**Result:** Performs bitwise operations on `<contents>`.<br>
**Example:** `$(@bitwise | ~2 & 3)` &rarr; `1`

### @boolean
**Syntax:** `$( @boolean | <contents> )`<br>
**Result:** Performs bitwise operations on `<contents>`.<br>
**Example:** `$(@boolean | true && false )` &rarr; `false`

### @if
**Syntax:** `$( @if | <test> | <if true> | <if false>)`<br>
**Result:** Outputs the either content of `<if true>` if `<test>` resolves to boolean "true" or `<if false>` if it resolves to false. Allowed operators for `test` include `==`, `!=`, `!`, `<`, `>`, `!`, `or`, `nor`, `and`, `nand`, `xor`, `xnor`. If `<test>` resolves to `false`, `null`, `undefined`, `NaN`, or an empty string, `<if false>` will be called, otherwise `<if true>` will be..<br>
**Example:** `$(@if | 1 == 2 | nonsense | truth )` &rarr; `truth`

## Text

### @camelcase
**Syntax:** `$( @camelcase | <string> )`<br>
**Result:** Capitalizes the first letter of each word in `string` except for the first one.<br>
**Example:** `$( @camelcase | camel CASE sentence )` &rarr; `camel CASE Sentence`

### @capitalize
**Syntax:** `$( @capitalize | <string> )`<br> (alias: `$( @capitalise | ... )`)
**Result:** Changes `string` to be capitalized.<br>
**Example:** `$( @capitalize | caps )` &rarr; `Caps`

### @each
**Syntax:** `$( @each | <list> [| <splitter = ","> [| <joiner = splitter>]] | <content> )`<br>
**Result:** Peforms iterative content on items in `<list>` (where each item is separated using `<splitter>`). Instances of `$i` in `<content>` will be replaced with the index (one-based), instances of `$v` will be replaced with the value of the current item, and variants of `$v[0]`, `$v[$i+1]`, etc, will be replaced with the value of that specified item. The output will be delimited with `<joiner>`; when `<joiner>` is not set, it defaults to the value of `<splitter>`, which in turn defaults to a comma (`,`). The value of `<joiner>` is not trimmed, so any whitespace inside will appear in the output.<br>
**Example:** `$(@each | 10,20,30 | , | | $v+$i )` &rarr; `11 22 33`

### @encode
**Syntax:** `$( @encode | <string> )`<br>
**Result:** Encodes `string` as a URL segment.<br>
**Example:** `$( @encode | <text>=true )` &rarr; `%3Ctext%3E%3Dtrue`

### @extract
**Syntax:** `$( @extract | <list> [| <delimiter = ",">] | <index> )`<br>
**Result:** Extracts an item from the specified `<index>` (one-based) from `<list>` in which each list item is separated by `<delimiter>`, which defaults to a comma (`,`).<br>
**Example:** `$(@extract | A,B,C | 1 )` &rarr; `A`

### @length
**Syntax:** `$( @length | <string> )`<br>
**Result:** Outputs the length of `string`.<br>
**Example:** `$( @length | 123456 )` &rarr; `6`

### @lowercase
**Syntax:** `$( @lowercase | <string> )`<br>
**Result:** Changes `string` to be lowercase.<br>
**Example:** `$( @lowercase | is NOW Lowercase )` &rarr; `is now lowercase`

### @replace
**Syntax:** `$( @replace | <string> | <find> | <replace> )`<br>
**Result:** Replaces all instances of `<find>` in `<string>` with `<replace>`. Supports regular expressions.<br>
**Example:** `$( @replace | t3xt | 3 | e )` &rarr; `text`

### @titlecase
**Syntax:** `$( @titlecase | <string> )`<br>
**Result:** Capitalizes the first letter of each word in  `string`.<br>
**Example:** `$( @titlecase | title case text )` &rarr; `Title Case Text`

### @uppercase
**Syntax:** `$( @uppercase | <string> )`<br>
**Result:** Changes `string` to be uppercase.<br>
**Example:** `$( @uppercase | is now uppercase )` &rarr; `IS NOW UPPERCASE`

## Color

### @color
**Syntax:** `$( @color | <type> | <args> )` (alternatively, `$( @colour | ... )`)<br>
**Result:** Outputs a CSS color depending on the value of `<type>` (see subsections below).

#### hash
**Syntax:** `$( @color | {hex|hexadecimal|hash|#} | <r> | <g> | <b> | [<a>] )`<br>
**Result:** Converts its arguments into a hexadecimal color.<br>
**Example:** `$( @color | hash | 255 | 64 | 128)` &rarr; `#ff4080`

#### rgb
**Syntax:** `$( @color | rgb | <r> | <g> | <b> )` or `$( @color | rgb | <hash> )`<br>
**Result:** Outputs CSS color function `rgb(<r>, <g>, <b>)`.<br>
**Example:** `$( @color | rgb | #f71a8e )` &rarr; `rgb(247, 26, 142)`

#### rgba
**Syntax:** `$( @color | rgba | <r> | <g> | <b> | <a> )` or `$( @color | rgba | <hash> )`<br>
**Result:** Outputs CSS color function `rgba(<r>, <g>, <b>, <a>)`.<br>
**Example:** `$( @color | rgba | 0xff | 0 | 128 | 80 )` &rarr; `rgba(255, 0, 128, 80)`

#### hsl
**Syntax:** `$( @color | hsl | <h> | <s> | <l> )`<br>
**Result:** Outputs CSS color function `hsl(<h>, <s>, <l>)`.<br>
**Example:** `$( @color | hsl | 200 | 53 | 158/2 )` &rarr; `hsl(200, 20%, 30%)`

#### hsla
**Syntax:** `$( @color | <hsla> | <h> | <s> | <l> | <a> )`<br>
**Result:** Outputs CSS color function `hsla(<h>, <s>, <l>, <a>)`.<br>
**Example:** `$( @color | hsla | 10% | 128 | 0xfa | 95% )` &rarr; `hsla(26, 50%, 98%, 243)`

#### *custom*
**Syntax:** `$( @color | <type> | <x> | <y> | <z> | [<a>] )`<br>
**Result:** Outputs CSS level-4 color function `<type>(<x> <y> <z>)` or `<type>(<x> <y> <z> / <a>)`.<br>
**Example:** `$( @color | lch | 20 | 60 | 250 )` &rarr; `lch(20 60 250)`

### @colorpart
**Syntax:** `$( @colorpart | <part> | <color> )` (alternatively, `$( @colourpart | ... )`)<br>
**Result:** Outputs CSS color segment `part` from outputted color function `color`. Accepted values for `part` are `red`, `green`, `blue`, or `alpha` for hex or RGB(A) colors; `hue`, `saturation`, `lightness`, or `alpha` from HSL(A) colors; all are case insensitive and allow truncated forms (e.g., `r` or `rd` for "red").<br>
**Example:** `$( @colorpart | red | #fff )` &rarr; `255`

### @contrast
**Syntax:** `$(@contrast | <color> | <light value> | <dark value> )`<br>
**Result:** If the luminance of `<color>` is dark (below `0.5`), `<light value>` is outputted; otherwise `<dark value>` is.<br>
**Example:** `$(@contrast | #fff | white | black )` &rarr; `black`

### @blend
**Syntax:** `$( @blend | <color1> | <color2> | [<amount = 0.5>] )`<br>
**Result:** Blends two input colors. Has an optional `<amount>` parameter (which defaults to `0.5`/`50%`) which controls which color is more dominant; values between `0%` and `0.5`/`50%` bias the output to `<color1>` while values between `0.5`/`50%` and `1`/`100%` bias the output to `<color2>`.<br>
**Example:** `$( @blend | #000 | rgb(255,255,255) | 0.25 )` &rarr; `rgb(63, 63, 63)`

### @grayscale
**Syntax:** `$( @grayscale | <color> )` (alternatively, `$( @greyscale | ... )`)<br>
**Result:** Neutralizes the red, green, and blue color channels of an RGB or hex color, or changes the saturation of an HSL color to 0%.<br>
**Example:** `$( @grayscale | hsl(100, 30%, 40%) )` &rarr; `hsl(100, 0%, 40%)`

### @luma
**Syntax:** `$( @luma | <color> )`<br>
**Result:** Outputs the relative luminance (between 0 and 1) of an RGB or hex `<color>`. Fails if given an HSL value or another type of color.<br>
**Example:** `$( @luma | #f05 )` &rarr; `0.21915877154744204`

### @shade
**Syntax:** `$( @tone | <color> | [<amount = 0.5>] )`<br>
**Result:** Blends `<color>` with black by `<amount>` (which defaults to `0.5`/`50%`).<br>
**Example:** `$( @shade | hsl(300, 50%, 20%) | 10% )` &rarr; `hsl(300, 50%, 10%)`

### @spin
**Syntax:** `$( @spin | <color> | <amount = 0.5> )`<br>
**Result:** Cycles the hue of `<color>` by `<amount>`.
**Example:** `$( @spin | hsl(100, 50%, 20%) | 100 )` &rarr; `hsl(200, 50%, 20%)`

### @tint
**Syntax:** `$( @tint | <color> | [<amount = 0.5>] )`<br>
**Result:** Blends `<color>` with white by `<amount>` (which defaults to `0.5`/`50%`).<br>
**Example:** `$( @tint | #000 | 50% )` &rarr; `#7f7f7f`

### @tone
**Syntax:** `$( @tone | <color> | [<amount = 0.5>] )`<br>
**Result:** Blends `<color>` with gray by `<amount>` (which defaults to `0.5`/`50%`).<br>
**Example:** `$( @tone | rgb(128, 10, 255) | 0.4 )` &rarr; `rgb(128, 57, 204)`

## CSS

### @breakpoint
**Syntax:** `$(@breakpoint | <pixels>[px] [| <selector>] | <smaller> [| <larger>] )`<br>
**Result:** Outputs two media queries, one for widths less than or equal to than `<pixels>` (containing `<smaller>`) and one for widths greater than `<pixels>` (containing `<larger>`). When `<selector>` is set, `<smaller>` and `<larger>` should not be block declarations; otherwise, they should be. `<larger>` is optional in both cases.<br>
**Example:** `$(@breakpoint | 800px | .container | width: 100%; | width: 20vw; )` &rarr; `@media (min-width: 801px) { .container { width: 100%; } } @media (max-width: 800px) { .container { width: 20vw;} }`

### @prefix
**Syntax:** `$(@prefix | <property> | <value> )`<br>
**Result:** Adds all vendor prefixes to a CSS property.<br>
**Example:** `$(@prefix | transition | all 1s )` &rarr; `-webkit-transition: all 1s; -moz-transition: all 1s; -ms-transition: all 1s; -o-transition: all 1s; transition: all 1s;`<br>