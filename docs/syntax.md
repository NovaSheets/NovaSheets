# NovaSheets syntax

## Contents
- [Layout](#layout)
- [Variables](#variables)
  - [Declaring variables](#declaring-variables)
  - [Using variables](#using-variables)
    - [Arguments](#arguments)
    - [Built-in variables](#built-in-variables)
- [Mathematical operators](#mathematical-operators)
- [Parser constants](#parser-constants)
- [Comments](#comments)
- [Whitespace](#whitespace)

## Layout
There are two main sections to a NovaSheets document: the front matter and the contents, which are separated in the code by three hyphens (`---`) on its own line. The front matter is where variables are declared, while the contents is what is outputted with NovaSheets code parsed into CSS.
```
<FRONT MATTER>
---
<CONTENTS>
```

## Variables

### Declaring variables

NovaSheets variables are created by starting a line in the front matter with `@var `. Anything after that space will be the name of the variable. For example, `@var test` creates a new variable called "test". Variables can have any name; the only limitations are that using parentheses may not work correctly due to how NovaSheets are parsed. `myvar`, `my_var`, `my var`, and `my♦var!` are all valid variable names.

Variables can have up to 10 arguments attached to them (*added in 0.2.0*). Arguments are declared in the front matter by appending a pipe (`|`) followed by the argument name. For example, `@var border | type` declares a variable named `border` with an argument named `type`. By default, there is a maximum of 10 arguments per variable; this can be changed by modifying [parser constants](#parser-constants).

Each variable houses the lines below it as its contents, all the way up until another variable declaration. The contents of each variable can be anything at all; the content is just substituted in to the CSS content by a simple replacement. Arguments are referenced similar to variables but using square brackets instead of parentheses (`$[ ]`); for example, `2px $[type]` references declared argument `type`. Valid contents of a variable include `text-align: left`, `$(previous-variable) center`, `$[width] $[height]`, and `rgb(128, 64, 255)`.

In the following example, a variable called `border` is declared, with its first parameter called `color`, and its contents being `1px solid` followed by whatever the `color` parameter is set to (see the section below):
```
@var border | color
  1px solid $[color]
```

### Using variables

Variables are referenced using a dollar sign (`$`) followed by the variable name in parentheses (`( )`). For example, variable `test1` would be called by writing `$(test1)`. Variables can be used anywhere in the document, including in the front matter.

Arguments (*added in 0.2.0*) are specified by appending a pipe (`|`) to the variable name and then writing the parameter name followed by an equals sign (`=`) and then the argument contents. For example, if variable `border` has parameter `color` specified in the front matter, this can be set to `blue` by writing `$(border|color=blue)`, which, when using the code at the end of the above section, outputs `1px solid blue`.

#### Built-in variables
*(Added in 0.3.0)*

NovaSheets includes many built-in variables which take the form of a variety of functions. The following is a list of these and their syntax.

**Mathematical variables and functions:**
- `$( @abs | a )`: Outputs the absolute value of `a`. Example: `$( @abs | -2 )` -> `2`.
- `$( @acos | a )`: Outputs the arccosine of `a`. Example: `$( @acos | 0 )` -> `1.5707963267948966`.
- `$( @asin | a )`: Outputs the arcsine of `a`. Example: `$( @asin | 0.5 )` -> `0.5235987755982989`.
- `$( @atan | a )`: Outputs the arctangent of `a`. Example: `$( @atan | 10 )` -> `1.4711276743037347`.
- `$( @e )`: Outputs e (2.71828...). Example: `$( @e )` -> `2.718281828459045`.
- `$( @ceil | a )`: Rounds `a` up to the nearest integer. Example: `$( @ceil | 4.2 )` -> `5`.
- `$( @clamp | val | min | max)`: Outputs `val` only if it is between `min` and `max`, otherwise outputs either `min` or `max`, whichever is closer to `val`.`$( @clamp | 1.4 | 2 | 5 )` -> `2`.
- `$( @cos | a )`: Outputs the cosine of `a` in radians. Example: `$( @cos | 0 )` -> `1`.
- `$( @floor | a )`: Rounds `a` down to the nearest integer. Example: `$( @floor | 3.8 )` -> `3`.
- `$( @log | val )`: Outputs the logarithm (base 10) of `val`. Example: `$( @log | 100 )` -> `2`.
- `$( @max | a | b | ...)`: Outputs the maximum value of its arguments. Example: `$( @max | 2 | 7 | 5 )` -> `7`;
- `$( @min | a | b | ...)`: Outputs the minimum value of its arguments. Example: `$( @min | 1 | 2 | 3 )` -> `1`;
- `$( @mod | a | b )`: Outputs `a` modulo `b`. Example: `$( @mod | 10 | 6 )` -> `4`.
- `$( @pi)`: Outputs pi (3.14159...). Example: `$( @pi )` -> `3.141592653589793`.
- `$( @root | n | val )`: Outputs the `n`th root of `val`. Example: `$( @root | 3 | 27 )` -> `3`.
- `$( @round | val | num )`: Rounds `val` to `num` decimal places. Example: `$( @round | $(@pi) | 5 )` -> `3.14159`.
- `$( @sin | a )`: Outputs the sine of `a` in radians. Example: `$( @sin | 0.5*$(@pi) )` -> `1`.
- `$( @tan | a )`: Outputs the tangent of `a` in radians. Example: `$( @tan | 12 )` -> `-0.6358599286615808`.

**Logical functions:**
- `$( @if | test | iftrue | iffalse)`: Outputs the either content of `iftrue` if `test` resolves to boolean "true" or `iffalse` if it resolves to false. Allowed values for `test` are `false`, `null` (*0.3.1+*), `undefined`, `NaN`, or an empty string for "false"; everything else resolves to "true". Allowed operators for `test` include `==`, `<`, and `>`.

**Text functions:**
- `$( @encode | string )`: Encodes `string` as a URL segment. Example: `$( @encode | <text>=true )` -> `%3Ctext%3E%3Dtrue`.
- `$( @length | string )`: Outputs the length of `string`. Example: `$( @length | 123456 )` -> `6`.
- `$( @replace | string | find | replace )`: Replaces all instances of `find` in `string` with `replace`. Example: `$( @replace | t3xt | 3 | e )` -> `text`.

**Color functions:**
- `$( @color | type | ... )`: Outputs a CSS color.
  - `$( @color | hash | val )`: Converts `val` into a hash (hexidecimal) color.
  - `$( @color | rgb | r | g | b )`: Outputs CSS color function `rgb(r,g,b)`.
  - `$( @color | rgba | r | g | b | a)`: Outputs CSS color function `rgba(r,g,b,a)`.
  - `$( @color | hsl | h | s | l)`: Outputs CSS color function `hsl(h,s,l)`.
  - `$( @color | hsla | h | s | l | a)`: Outputs CSS color function `hsla(h,s,l)`.
- `$( @colorpart | part | color )`: Outputs CSS color segment `part` from outputted color function `color`.
  - Accepted values for `part`: `red` (`r`), `green` (`g`), `blue` (`b`), or `alpha` (`a`) for hex or RGB(A) colors; `hue` (`h`), `saturation` (`s`), `lightness` (`l`), or `alpha` (`a`) from HSL(A) colors.

## Mathematical operators
*(Added in 0.3.0)*

NovaSheets supports manipulating numerals using raw mathematical operators. These operators are exponentation (`^` or `**`), multiplication (`*`), division (`/`), addition (`+`), and subtraction (`-`). Order of operations applies in that order; parentheses (`( )`) can be used to force a change in the order of operations. Example: `1+(2**3-4)/5` -> `1.8`.

## Parser constants
*(Added in 0.3.0)*

The parser contains two constants, `MAX_RECURSION` and `MAX_ARGUMENTS`, which affect how NovaSheets code is parsed. Either one of these constants can be modified by using the `@const` keyword in the front matter of the document.
- `@const MAX_RECURSION <number>` controls how many times variable nesting, math, etc, will be iterated over; defaults to `50`.
- `@const MAX_ARGUMENTS <number>` controls the maximum number of arguments a variable can have; defaults to `10`.

## Comments

NovaSheets implements single-line comments using double slashes (`//`) alongside CSS's block comments `/* */`. Single-line comments are removed by the parser while CSS block comments remain in the output. Note that the slashes must be prefaced with a space (` `) to prevent URLs being treated as comments. For instance, `@var themeColor1 // the main theme color`, will compile to `@var themeColor1`, and `body {text-align: left;} // change if needed`, compiles to `body {text-align: left;}` in the output CSS.

## Whitespace

Newlines in the front matter and redundant spaces anywhere in the document are removed by the preprocessor in the output CSS.