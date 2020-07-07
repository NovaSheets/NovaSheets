---
layout: layouts/docs.njk
permalink: /docs/variables/default/
title: Default Variables
js: "headings"
js2: "colouring"
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
  - [@luma](#luma)

## Mathematics

### @abs
**Syntax:** `$( @abs | <num> )`  
**Result:** Outputs the absolute value of `num`    
**Example:** `$( @abs | -2 )` &rarr; `2`  

### @acos
**Syntax:** `$( @acos | <num> )`  
**Result:** Outputs the arccosine of `num`  
**Example:** `$( @acos | 0 )` &rarr; `1.5707963267948966`  

### @asin
**Syntax:** `$( @asin | <num> )`  
**Result:** Outputs the arcsine of `num`  
**Example:** `$( @asin | 0.5 )` &rarr; `0.5235987755982989`  

### @atan
**Syntax:** `$( @atan | <num> )`  
**Result:** Outputs the arctangent of `num`  
**Example:** `$( @atan | 10 )` &rarr; `1.4711276743037347`  

### @degrees
**Syntax:** `$( @degrees | <num>[rad|grad] )`  
**Result:** Converts `num` from either radians (default) or gradians to degrees.  
**Example:** `$( @degrees | 100grad )` &rarr; 90  

### @e
**Syntax:** `$( @e )`  
**Result:** Outputs e (2.71828...)  
**Example:** `$( @e )` &rarr; `2.718281828459045`  

### @ceil
**Syntax:** `$( @ceil | <num> )`  
**Result:** Rounds `num` up to the nearest integer  
**Example:** `$( @ceil | 4.2 )` &rarr; `5`  

### @clamp
**Syntax:** `$( @clamp | <val> | <min> | <max>)`  
**Result:** Outputs `val` only if it is between `min` and `max`, otherwise outputs either `min` or `max`, whichever is closer to `val`.`$( @clamp | 1.4 | 2 | 5 )` &rarr; `2`  

### @cos
**Syntax:** `$( @cos | <num> )`  
**Result:** Outputs the cosine of `num` in radians  
**Example:** `$( @cos | 0 )` &rarr; `1`  

### @floor
**Syntax:** `$( @floor | <num> )`  
**Result:** Rounds `num` down to the nearest integer  
**Example:** `$( @floor | 3.8 )` &rarr; `3`  

### @gradians
**Syntax:** `$( @gradians | <num>[deg|rad] )`  
**Result:** Converts `num` from either degrees (default) or radians to gradians.  
**Example:** `$( @gradians | 90deg )` &rarr; 100  

### @log
**Syntax:** `$( @log | <base> | <val> )`  
**Result:** Outputs the logarithm (base `base`) of `val`  
**Example:** `$( @log | 2 | 64 )` &rarr; `6`  

### @max
**Syntax:** `$( @max | <a> | <b> | ...)`  
**Result:** Outputs the maximum value of its arguments  
**Example:** `$( @max | 2 | 7 | 5 )` &rarr; `7`;  

### @min
**Syntax:** `$( @min | <a> | <b> | ...)`  
**Result:** Outputs the minimum value of its arguments  
**Example:** `$( @min | 1 | 2 | 3 )` &rarr; `1`;  

### @mod
**Syntax:** `$( @mod | <a> | <b> )`  
**Result:** Outputs `a` modulo (remainder after division by) `b`  
**Example:** `$( @mod | 10 | 6 )` &rarr; `4`  

### @pi
**Syntax:** `$( @pi )`  
**Result:** Outputs pi (3.14159...)  
**Example:** `$( @pi )` &rarr; `3.141592653589793`  

### @percent
**Syntax:** `$( @percent | <num> )`  
**Result:** Outputs `num` as a percentage.  
**Example:** `$( @percent | 0.5 )` &rarr; `50%`  

### @radians
**Syntax:** `$( @radians | <num>[deg|grad] )`  
**Result:** Converts `num` from either degrees (default) or gradians to radians.  
**Example:** `$( @radians | 90 / $(@pi) )` &rarr; 0.5  

### @root
**Syntax:** `$( @root | <n> | <val> )`  
**Result:** Outputs the `n`th root of `val`  
**Example:** `$( @root | 3 | 27 )` &rarr; `3`  

### @round
**Syntax:** `$( @round | <val> | <dp> )`  
**Result:** Rounds `val` to `dp` decimal places  
**Example:** `$( @round | $(@pi) | 5 )` &rarr; `3.14159`  

### @sin
**Syntax:** `$( @sin | <num> )`  
**Result:** Outputs the sine of `num` in radians  
**Example:** `$( @sin | 0.5*$(@pi) )` &rarr; `1`  

### @tan
**Syntax:** `$( @tan | <num> )`  
**Result:** Outputs the tangent of `num` in radians  
**Example:** `$( @tan | 12 )` &rarr; `-0.6358599286615808`  

## Logic

### @bitwise
**Syntax:** `$( @bitwise | <contents> )`  
**Result:** Performs bitwise operations on `contents`.  
**Example:** `$(@bitwise | ~2 & 3)` &rarr; 1  

### @boolean
**Syntax:** `$( @boolean | <contents> )`  
**Result:** Performs bitwise operations on `contents`.  
**Example:** `$(@boolean | true && false )` &rarr; false  

### @if
**Syntax:** `$( @if | <test> | <iftrue> | <iffalse>)`  
**Result:** Outputs the either content of `iftrue` if `test` resolves to boolean "true" or `iffalse` if it resolves to false. Allowed values for `test` are `false`, `null`, `undefined`, `NaN`, or an empty string for "false"; everything else resolves to "true". Allowed operators for `test` include `# =`, `!`, `<`, `>`, `!`, `or`, `nor`, `and`, `nand`, `xor`, `xnor`.  

## Text

### @each
**Syntax:** `$( @each | <list> | <delimiter> | <replacement> )`  
**Result:** Peforms iterative replacement on items in `list` (where each item is separated using `delimiter`). Instances of `$i` in `replacement` will be replaced with the index (one-based), instances of `$v` will be replaced with the value of the current item, and variants of `$v[0]`, `$v[$i+1]`, etc, will be replaced with the value of that specified item.  
**Example:** `$(@each | 10,20,30 | , | $v+$i )` &rarr; `11 22 33`  

### @encode
**Syntax:** `$( @encode | <string> )`  
**Result:** Encodes `string` as a URL segment  
**Example:** `$( @encode | <text>=true )` &rarr; `%3Ctext%3E%3Dtrue`  

### @extract
**Syntax:** `$( @each | <list> | <delimiter> | <index> )`  
**Result:** Extracts an item from the specified `index` (one-based) from `list` in which each list item is separated by `delimiter`.  
**Example:** `$(@extract | A,B,C | , | 1 )` &rarr; `A`  

### @length
**Syntax:** `$( @length | <string> )`  
**Result:** Outputs the length of `string`  
**Example:** `$( @length | 123456 )` &rarr; `6`  

### @replace
**Syntax:** `$( @replace | <string> | <find> | <replace> )`  
**Result:** Replaces all instances of `find` in `string` with `replace`  
**Example:** `$( @replace | <t>3xt | 3 | <e> )` &rarr; `text`  

## Color

### @color
**Syntax:** `$( @color | <type> | <args> )` (alternatively, `$( @colour | ... )`)  
**Result:** Outputs a CSS color depending on the value of `type` (see subsections below)  

#### hash
**Syntax:** `$( @color | (hash|hex|hexidecimal|#) | <r> | <g> | <b> | [<a>] )`  
**Result:** Converts its arguments into a hash (hexidecimal) color  
**Example:** `$( @color | hash | 255 | 64 | 128)` &rarr; `#ff4080`  

#### rgb
**Syntax:** `$( @color | rgb | <r> | <g> | <b> )` or `$( @color | rgb | <hash> )`  
**Result:** Outputs CSS color function `rgb(<r>, <g>, <b>)`  
**Example:** `$( @color | rgb | #f71a8e )` &rarr; `rgb(247, 26, 142)`  

#### rgba
**Syntax:** `$( @color | rgba | <r> | <g> | <b> | <a> )` or `$( @color | rgba | <hash> )`  
**Result:** Outputs CSS color function `rgba(<r>, <g>, <b>, <a>)`  
**Example:** `$( @color | rgba | 0xff | 0 | 128 | 80 )` &rarr; `rgba(255, 0, 128, 80)`  

#### hsl
**Syntax:** `$( @color | hsl | <h> | <s> | <l> )`  
**Result:** Outputs CSS color function `hsl(<h>, <s>, <l>)`  

#### hsla
**Syntax:** `$( @color | <hsla> | <h> | <s> | <l> | <a> )`  
**Result:** Outputs CSS color function `hsla(<h>,<s>,<l>,<a>)`  

#### *custom*
**Syntax:** `$( @color | <type> | <x> | <y> | <z> | [<a>] )`  
**Result:** Outputs CSS level-4 color function `<type>(<x> <y> <z>)` or `<type>(<x> <y> <z> / <a>)`  

### @colorpart
**Syntax:** `$( @colorpart | <part> | <color> )` (alternatively, `$( @colourpart | ... )`)  
**Result:** Outputs CSS color segment `part` from outputted color function `color`<br>  
Accepted values for `part`: `red`, `green`, `blue`, or `alpha` for hex or RGB(A) colors; `hue`, `saturation`, `lightness`, or `alpha` from HSL(A) colors; all are case insensitive and allow truncated forms (e.g., `r` or `rd` for "red").

### @luma
**Syntax:** `$( @luma | <color> )`  
**Result:** Outputs the relative luminance (between 0 and 1) of a color  
**Example:** `$(@luma | #f05 )` &rarr; `0.21915877154744204`  