# Changelog for NovaSheets
- [1.0.0](#100)
  - [1.0.0-pre1](#100-pre1) • [1.0.0-pre2](#100-pre2) • [1.0.0-pre3](#100-pre3) • [1.0.0-pre4](#100-pre4)
  • [1.0.0-rc1](#100-rc1) • [1.0.0-rc2](#100-rc2) • [1.0.0-rc3](#100-rc3) • [1.0.0-rc4](#100-rc4) • [1.0.0-rc5](#100-rc5) • [1.0.0-rc6](#100-rc6)
- [0.6.0](#060) • [0.6.1](#061) • [0.6.2](#062) • [0.6.3](#063) • [0.6.4](#064) • [0.6.5](#065) • [0.6.6](#066) • [0.6.7](#067)
- [0.5.0](#050) • [0.5.1](#051) • [0.5.2](#052)
- [0.4.0](#040) • [0.4.1](#041) • [0.4.2](#042) • [0.4.3](#043) • [0.4.4](#044) • [0.4.5](#045) • [0.4.6](#046) • [0.4.7](#047)
- [0.3.0](#030) • [0.3.1](#031) • [0.3.2](#032) • [0.3.3](#033) • [0.3.4](#034) • [0.3.5](#035)
- [0.2.0](#020) • [0.2.1](#021)
- [0.1.0](#010) • [0.1.1](#011) • [0.1.2](#012)

## 1.0.0
*Upcoming*

### 1.0.0-rc7
- **Fixes**
  - [Syntax] Fixed parent selectors substituted using `&` not being trimmed.
  - [Syntax] Fixed nested selectors being outputted out of order.
  - [Functions] Fixed `@breakpoint` outputting invalid selectors when nested.
  - [Functions] Fixed `@boolean` not having its output value coerced into `true`/`false`.

### 1.0.0-rc6
*2021-06-12*
- **Additions**
  - [CLI] Added `[<command>]` option to `novasheets --help` to display help for a given command.
- **Changes**
  - [Syntax] Changed selectors to no longer distribute comma-separated segments over children.
- **Removals**
  - [Syntax] Removed parser constants `MAX_MATH_RECURSION` and `KEEP_NAN`.
- **Fixes**
  - [Syntax] Fixed variables containing braces/blocks breaking the parser.
- **Internal**
  - [Source] Replaced math parsing code with package `math-and-unit-parser`.
  - [Source] Replaced nesting compilation code using package `balanced-match`.
  - [Source] Replaced browser building code with package `webpack`.

### 1.0.0-rc5
*2021-05-29*
- **Changes**
  - [Syntax] Changed function names to be case insensitive.
  - [Syntax] Changed media query output to not condense duplicated queries as it sometimes broke output.
- **Fixes**
  - [Syntax] Fixed vanilla CSS functions being incorrectly parsed.
  - [Syntax] Fixed simple breakpoints not being a valid sole child selector.

### 1.0.0-rc4
*2021-05-29*
- **Changes**
  - [Syntax] Changed simple breakpoints to not output `only screen`.
- **Fixes**
  - [Syntax] Fixed vanilla CSS functions not being parsed when containing NovaSheets content.
  - [Syntax] Fixed CSS `calc()` functions not being parsed properly.
  - [Syntax] Fixed comments being duplicated over child selectors.
  - [Functions] Fixed `@breakpoint` function not being able to be used in a child selector by making it use simple breakpoints.

### 1.0.0-rc3
*2021-05-22*
- **Changes**
  - [Syntax] Changed comma-separated parent selectors to have each selector part distributed over its children.
- **Fixes**
  - [Syntax] Fixed CSS `calc()` functions incorrectly having brackets removed.
  - [Syntax] Fixed the `/` separator in vanilla CSS color functions being treated as a division operator.
  - [Syntax] Fixed constructs like `0 -1em` being treated as subtraction.
  - [Syntax] Fixed spaced double negatives not being parsed as math.

### 1.0.0-rc2
*2021-05-18*
- **Changes**
  - [Syntax] Changed CSS `calc()` functions to be static with math operations unparsed.
- **Fixes**
  - [Syntax] Fixed nested selectors sometimes not having their parent selectors parsed.
  - [Syntax] Fixed block substitution not working on nested selectors.

### 1.0.0-rc1
*2021-05-16*
- **Changes**
  - [Syntax] Changed simple breakpoint output to remove duplicate media queries.
- **Fixes**
  - [Syntax] Fixed nested selectors having only a maximum of two selectors when flattened.
  - [Syntax] Fixed regular at-rules being malformed in the output.
  - [Syntax] Fixed simple breakpoints not working for blocks containing line breaks.

### 1.0.0-pre4
*2021-04-04*
- **Additions**
  - [Syntax] Added CSS nesting, using `&` to refer to the parent selector explicitly.
  - [Scripting] Added type definitions for exported functions.
  - [CLI] Added support for reading syntax from piped stdin.
- **Removals**
  - [Syntax] Removed previous and parent selectors, `%` an `&`, as this usage is now accomplished by nesting.
  - [Syntax] Removed item slicer `<`.
  - [Scripting] Removed option `nonest`.
- **Changes**
  - [Scripting] Renamed option `notrim` to `trim` (inverting its usage) and `allargs` to `allArgs`.
  - [Functions] Changed math functions to return just their argument when invalid.
- **Fixes**
  - [Syntax] Fixed small numbers receiving incorrect decimal places.
  - [Functions] Fixed various errors relating to incorrect type assumptions in built-in functions.
  - [Functions] Fixed built-in function `$(@boolean)` treating pipes as argument separators.
  - [Functions] Fixed built-in functions not checking `NaN` properly.
  - [Security] Fixes a code injection issue using built-in boolean functions.

### 1.0.0-pre3
*2021-03-06*
- **Fixes**
  - [CLI] Fixed command-line usage not working.
  - [General] Fixed conflicting files being published to npm.

### 1.0.0-pre2
*2021-03-06*
- **Fixes**
  - [Syntax] Fixed negative exponents not being parsed.
  - [Syntax] Fixed hexadecimal colours not being coerced.
  - [Syntax] Fixed various errors relating to incorrect type assumptions.
- **Internal**
  - [Source] Rewrote source code in TypeScript.

### 1.0.0-pre1
*2021-01-25*
- **Additions**
  - [Scripting] Added an API for adding custom NovaSheets functions using class `NovaSheets` with method `addFunction(name, function)`, where the first argument of `function` is the matched content and the remainder are variable arguments.
  - [Scripting] Added a second parameter to `parse` for passing through a class with custom functions.
  - [Scripting] Added a third parameter to `compile` for passing through a class with custom functions.
  - [Syntax] Added parser constant `BUILTIN_FUNCTIONS` for controlling whether or not to implement built-in functions.
- **Changes:**
  - [CLI] **Breaking:** Compiling NovaSheets files must now be done explicitly using the `--compile`/`-c` flag.
  - [Syntax] **Breaking:** Changed parser constant keyword from `@const` to `@option`.
  - [Syntax] Changed built-in color functions to no longer output console warnings for invalid colors.
- **Fixes**
  - [Syntax] Fixed unparsed content not being removed from the output even when `KEEP_UNPARSED` is true.

## 0.6.7
*2021-01-17*
- **Additions**
  - Added glob support to the `--compile` command.
  - Added console messages for successfully compiled files.
- **Changes**
  - Changed simple breakpoint maximums to be exclusive, allowing the same number to be used in two separate selectors without clashes.
  - Changed built-in function `@breakpoint` to offset the maximum size by &minus;1 instead of the minimum size by +1.
- **Fixes**
  - Fixed `--compile` usage throwing an error when given an extensionless input filename, an implicit output filename, or a nonexistent directory in its output file path.
  - Fixed command-line usage throwing an error because of browser-only code.
  - Fixed parser constant `KEEP_UNPARSED` not working.

## 0.6.6
*2021-01-03*
- **Additions**
  - Added parser constant `KEEP_UNPARSED` which controls whether or not to keep unparsed variables in the output (defaults to `false`).
- **Changes**
  - Changed simple breakpoints to only allow spaces and ellipsis as delimiters due to interference with CSS selectors.
  - Changed simple breakpoints to work with previous element selectors.
  - Changed math unit simplifications to shorten sets of 100cm and 1000mm to 1m.
- **Fixes**
  - Fixed the parser crashing when built-in function `@repeat` was missing its `delimiter` parameter.

## 0.6.5
*2021-01-02*
- **Additions**
  - Added simple breakpoints, done by placing `@[<min>][..][<max>]` directly after a CSS selector but before the block content.
  - Added built-in function `@uncapitalize` to set the initial letter of a string to lowercase.
  - Added aliases `@darken`, `@lighten`, and `@desaturate` for built-in functions `@shade`, `@tint`, and `@tone` respectively.
- **Removals**
  - Removed built-in function `@camelcase` due to its unintuitive behavior and its use case being superceded by `@titlecase` combined with `@uncapitalize`.
- **Changes**
  - Changed built-in function `@repeat` to allow a `delimiter` parameter. New syntax: `$( @repeat | <amount> | [<delimiter>] | <content> )`.

## 0.6.4
*2020-11-14*
- **Additions**
  - Added object content substitution, which substituted all property-value pairs, done by placing an exclamation point (`!`) after an object: `{attr: val;}!`.
- **Changes**
  - Changed the object item substitution notation to use angle brackets instead of square brackets to avoid interfering with CSS attribute selectors, changing the format from `{attr:val}[attr]` to `{attr:val}<attr>`.
- **Fixes**
  - Fixed exponent notation applying to hexadecimal colors.

## 0.6.3
*2020-09-12*
- **Additions**
  - Added declaration substitution, which outputs the contents of a CSS block declaration, using the format `$<selector>`.
  - Added object notation, used by placing square brackets after a set of attribute-value pairs (which is the same as a CSS block) surrounded by curly brackets: `{attr1: val1; attr2: val2;}[attr1]`.
- **Changes**
  - Refactored code to avoid possible clashes with other scripts.

## 0.6.2
*2020-08-15*
- **Additions**
  - Added parser constant `DECIMAL_PLACES` for controlling how many decimal places numbers are outputted with.
  - Added built-in function `@lowercase` to change a string to lowercase.
  - Added built-in function `@uppercase` to change a string to uppercase.
  - Added built-in function `@titlecase` to capitalize the first letter of each word in a string.
  - Added built-in function `@camelcase` to capitalize the first letter of each word in a string except for the first one.
  - Added built-in function `@capitalize`/`@capitalise` to capitalize the first letter of a string.
- **Changes**
  - Changed `@var` declarations to allow the variable content to be modified later in the document.
  - Changed `@const` declarations to make the parser constant name case insensitive.
  - Changed parsing order to resolve previous element selectors before they are used in built-in functions.
  - Changed built-in function `@each` to remove the need to explicitly declare the splitting and joining delimiters. The joiner now defaults to the splitter, which in turn defaults to a comma (`,`). New syntax: `$( @each | <items> [| <splitter = ","> [| <joiner = splitter>]] | <content> )`.
  - Changed built-in function `@extract` to remove the need to explicitly declare the delimiter. New syntax: `$( @extract | <list> [| <delimiter = ",">] | <index> )`.
- **Fixes**
  - Fixed previous element selectors being too greedy in what they copy.
  - Fixed built-in function `@each` treating an empty string and a space as the same character in its delimiter arguments.
  - Fixed built-in function `@replace` ignoring whitespace in its finder and replacer arguments.

## 0.6.1
*2020-07-29*
- **Changes**
  - Changed the syntax of built-in function `@breakpoint` to allow declaration blocks in its second and third arguments and to suppress the output of the "min-width" segment if its respective argument is not set.
- **Fixes**
  - Fixed erroneous console errors occurring in Node.
  - Fixed empty arguments nullifying the following ones.
  - Fixed built-in function `@grayscale` outputting an HSLA color when passed an HSL color.
  - Fixed built-in function `@contrast` outputting "undefined" when missing its arguments.

## 0.6.0
*2020-07-26*
- **New features**
  - Added command-line support using `node novasheets <args>` (or, after installing using `npm install -g novasheets`: `novasheets <args>`).
    - Arguments: `[--compile] <input file> <output file>` to compile a NovaSheets file into CSS; `--parse` to parse raw NovaSheets   content and log the output CSS to the console; `--help` to display help; and `--version` to display the current version.
  - Added previous element selectors, used to copy the contents of the previous CSS selector.
    - Ampersands (`&`) take the previous *raw* selector (i.e., the last selector that does not contain an ampersand), while percent signs (`%`) take the previous selector.
    - Add less-than signs (`<`) to slice the last item off the selector (for example, if `&<` becomes `div+pre<`, the output is `div`); characters treated as delimiters are `>`, `+`, `~`, and whitespace.
  - Added a warning for when HSL values are passed into the luma function as it only works for RGB values.
- **New functions**
  - Added built-in function `@breakpoint` to make media queries easier. Syntax: `$(@breakpoint | <pixels>[px] | <selector> | <smaller> | <larger> )`.
  - Added built-in function `@prefix` to add all vendor prefixes to a CSS property. Syntax: `$(@prefix | <property> | <value> )`.
  - Added built-in function `@spin` which cycles the hue of a color. Syntax: `$(@spin | <color> | <amount> )`.
  - Added built-in function `@blend` which blends two colors together. Syntax: `$(@blend | <color1> | <color2> | [<amount>] )`.
  - Added built-in function `@shade` which blends a color with black. Syntax: `$(@shade | <color> | [<amount>] )`.
  - Added built-in function `@tint` which blends a color with white. Syntax: `$(@tint | <color> | [<amount>] )`.
  - Added built-in function `@tone` which blends a color with gray. Syntax: `$(@tone | <color> | [<amount>] )`.
  - Added built-in function `@contrast` which controls a value dependent on the contrast of a color. Syntax: `$(@contrast | <color> | <light> | <dark> )`.
  - Added built-in function `@grayscale` (alias `@greyscale`) which removes the hue of a color. Syntax: `$(@grayscale| <color> )`.
- **Changes**
  - Changed built-in function `@color` to coerce single- and double-character hash values and allow uppercase type values.
  - Changed length math to always output the cleanest unit.
  - Changed console warnings.
- **Fixes**
  - Fixed built-in function `@if` outputting `undefined` when missing its second argument.
  - Fixed built-in color functions not outputting alpha values as percents.
  - Fixed length units not being converted properly.
  - Fixed more floating-point artifacts not being fully removed.

## 0.5.2
*2020-07-14*
- Fixed order of operations not being applied properly.
- Fixed double negatives sometimes not being treated as addition.
- Fixed spaced math operations inside brackets not being parsed properly.
- Fixed some floating-point artifacts not being fully removed.
- Refactored internal code to simplify math parsing and improve performance of math operations.

## 0.5.1
*2020-07-09*
- Added console warnings for when the parser detects a recursive variable.
- Changed built-in function `@each` to add an output delimiter parameter. New syntax: `$(@each | <list> | <list delimiter> | <output delimiter> | <content> )`.
- Changed built-in function `@repeat` to allow using pipes and using `$i` to refer to the current index in its content.
- Changed in-built math functions to type check its input to prevent invalid math operations.
- Changed CSS output to keep the same indentation and newline formatting as the input.
- Fixed missing `@endvar` declarations causing infinite recursion.
- Fixed built-in function `@each` not allowing nested variables containing instances of `$i`, `$v`, etc.
- Fixed built-in function `@clamp` not clamping properly to its maximum value.
- Fixed built-in function `@replace` not parsing regular expressions properly.
- Fixed math operations inside built-in functions not being parsed before the function is applied.
- Fixed default argument substitutions requiring the pipe to be prefixed with a space.
- Fixed arguments being skipped if they are placed after an empty anonymous argument.
- Fixed unary negative operators being treated as subtraction.
- Fixed floating-point artifacts not being removed.
- Fixed slashes inside of CSS color functions being treated as division signs.
- Fixed URLs being treated as comments.
- Fixed inaccessible stylesheets having their 404 pages returned as stylesheet contents.
- Refactored internal code to check for math operations only when necessary, improving performance by up to 95%.

## 0.5.0
*2020-07-04*
- Added different categories of block comments, each with a different purpose:
  - Regular comments (`/*content*/`): output the raw content inside of them as a CSS comment; i.e, itself.
  - Static comments (`/*/content/*/`): output the raw content inside of them as raw CSS or NovaSheets syntax; i.e., itself but without the "`/*/`"s.
  - Parsed comments (`/*[content]*/`): output the parsed content inside of them as a CSS comment.
- Added support for default argument content, declared by adding a pipe (`|`) followed by the default content into the argument substitutor (e.g., `$[text|default]`).
- Added built-in function `@extract` for extracting the nth item from a delimited string. Syntax: `$(@extract | <list> | <delimiter> | <index> )`.
- Added built-in function `@each` for applying an operation to each item in a delimited string, referring to the index with `$i` and value with `$v`, `$v[1]`, `$v[$i+1]`, etc. Syntax: `$(@each | <list> | <delimiter> | <replacement> )`.
- Added built-in function `@luma` for calculating the relative luminance (between 0 and 1) of a color. Syntax: `$(@luma | <color> )`.
- Added `colour` and `colourpart` as aliases of built-in functions `@color` and `colorpart` respectively.
- Added console warnings for when variables are not parsed.
- Removed the need to explicitly initialize variables in variable declarations.
- Fixed built-in function `@color` not working when passed a CSS color function with a hash color output.
- Fixed built-in function `@replace` not allowing full regular expression syntax such as grouping and boolean 'or'.
- Fixed built-in functions `@degrees` and `gradians` having incorrect conversions between each other.
- Fixed built-in functions `@e` and `pi` not being parsed when they have leading or trailing whitespace.
- Fixed small decimal values being truncated incorrectly (e.g., `0.000000001234` turning into `0234` instead of just `0`).
- Fixed equals signs in the contents of a single-line variable declaration (e.g., `@var x = y = z`) causing the content that follows to not show up in the output CSS.
- Refactored internal parsing of variables to bracket-match completely, allowing for nested parentheses.

## 0.4.7
*2020-06-27*
- Added parser constant `MAX_MATH_RECURSION` for controlling how many times to perform each part of the order of operations before continuing on to the next operator.
- Added parser constant `KEEP_NAN` for deciding whether or not to parse malformed numbers to `NaN`.
- Changed built-in function `@color` to output a generic CSS level-4 color function when given a `type` other than `rgb`, `rgba`, `hsl`, `hsla`, or `hash`, and to allow inputting any value as a percentage (which can be either implicit, i.e. below 1, or explicit using `%`).
- Changed parsing of units to once again allow having a space before the unit.
- Fixed the parser crashing when it comes across invalid unit math, regular expressions in built-in function `@replace`, empty arguments in built-in function `@color`, or certain values in built-in functions `@min` and `max`.
- Fixed built-in functions incorrectly parsing negative numeric arguments.
- Fixed inline variable declarations including the content after the `@endvar` keyword.
- Fixed single zero-padded numbers being truncated.
- Fixed spaced `+` and `-` math operators not being parsed.
- Fixed units with millimetres being incorrectly converted.
- Fixed hexadecimal values containing letters not being treated as numbers.

## 0.4.6
*2020-06-25*
- Changed parsing of numbers to always convert from base 2, 8, and 16 to base 10.
- Changed parsing of units to disallow having a space before the unit.
- Fixed built-in function `@replace` not replacing all instances of the specified string.
- Fixed `e` characters in hexadecimal values being parsed as order-of-magnitude exponentation.
- Fixed newlines and spaced units being truncated completely in the output CSS.
- Fixed pseudo-classes being malformed in the output CSS.

## 0.4.5
*2020-06-23*
- Changed built-in function `@color` to default missing hex values to `0` and allow more flexibility in its arguments.
- Changed built-in function `@colorpart` allowing `hex`/`hexadecimal` as aliases for `hash`.
- Fixed built-in function `@bitwise` outputting its name as well as its parsed content.
- Fixed built-in function `@color` not allowing percentages and not parsing its arguments properly.
- Fixed built-in function `@colorpart` not parsing parts properly, not allowing `rgb`/`rgba` CSS functions when using type `hash`/`#`, and not outputting the raw hash value if passed with type `hash`/`#`.
- Fixed built-in function `@round` outputting `NaN` when the "decimal places" argument is missing.
- Fixed floating-point math outputting strings of zeroes or nines.

## 0.4.4
*2020-06-21*
- Changed variable declarations using the existing `=` notation to be strictly single-line declarations.
- Changed unit parsing to be more intuitive, allowing more units in any permutation (`1/2em`, `1em/2`, `1em/2em`, etc).
- Changed syntax of built-in function `@log` to allow a base as its first argument.
- Changed built-in function `@replace` to allow regular expressions.
- Changed built-in functions `@degrees`, `@radians`, and `@gradians` to default to radians, degrees and degrees respectively.
- Changed built-in function `@color` to allow colors being created from hash values.
- Changed built-in function `@colorpart` to allow more aliases for its first parameter, such as `GREEN`/`grn`/etc for "green", etc.
- Fixed bracketed numbers not having math operations applied to them.
- Fixed boolean values outputting incorrect results when containing leading and/or trailing whitespace.
- Fixed built-in function `@if` outputting `undefined` when falsey and the "if false" argument is missing.
- Fixed conversions to radians in built-in functions `@degrees` and `@gradians`.
- Fixed built-in function `@ceil` not working.
- Fixed leading and/or trailing whitespace affecting the output of built-in functions.
- Fixed built-in function `@colorpart` breaking when being passed a raw CSS color function.

## 0.4.3
*2020-06-18*
- Added support for scientific notation using `E`/`e` for values below `1e21`.
- Fixed declarators in the middle of a line not being parsed.
- Fixed anonymous arguments not adapting to the maximum argument parser constant.
- Fixed parsing of multiple order of operations.

## 0.4.2
*2020-06-16*
- Added support for anonymous variable arguments.
- Changed math parsing to allow a space between the last number and its unit to improve readability.
- Fixed inline comments breaking variable declarations.
- Fixed URLs in variable contents being treated as comments.
- Fixed order of operations not being properly applied.

## 0.4.1
*2020-06-14*
- Added built-in function `@degrees` for converting a value to degrees.
- Changed syntax of built-in functions `@degrees`, `@radians`, and `@gradians` to mandate the keywords `deg`, `rad`, or `grad` in its first argument.
- Fixed ampersands not working when using an HTML element as input.
- Fixed chained logical statements not being parsed correctly.
- Fixed bitwise `or` not working properly.
- Fixed math inside the contents CSS `calc` function being incorrectly parsed.

## 0.4.0
*2020-06-13*
- Added support for declaring variables anywhere in the document.
- Added support for placing variable content on the same line as the variable declaration by seperating the two with "`=`".
- Added the `@endvar` keyword for declaring the end of the contents of a variable.
- Added built-in functions `@radians`/`@gradians` and `@bitwise`/`@boolean` for converting from degrees and performing bitwise/logical operations, respectively.
- Added support for operators `not`/`!`/`~`, `and`/`&&`/`&`, `or`/`||`/`|`, `nand`, `nor`, `xor`, and `xnor` in the first argument of built-in funcion `if`.
- Removed the `---` separator keyword as it is superceded by `@endvar`.
- Removed the `deg` and `grad` keywords as they interfere with raw CSS.
- Fixed unparsed or invalid variables and arguments appearing in the output CSS.

## 0.3.5
*2020-06-11*
- Changed output to put each CSS declaration on its own line.
- Fixed empty variables being truncated completely to an empty string instead of one space.

## 0.3.4
*2020-06-09*
- Added `deg` and `grad` keywords which change the preceeding number to radians and gradians, respectively.
- Added support for length conversions between `cm`, `mm`, `ft`, and `in` to metres using math operators.
- Added in-built function `percent` for converting a value to a percentage.
- Changed the `source` data attribute of the output style element to use a relative link.
- Removed support for using math operators on the right side of values with units.
- Fixed variables not being substituted when they contain trailing whitespace.
- Fixed `@const` declarations that appear after `@var` declarations being part of that variables content.

## 0.3.3
*2020-06-09*
- Added support for using math operators on the right side of values with units.
- Fixed multiple calls of the same variable with different arguments outputting the same result each time.
- Fixed nested variables with arguments still sometimes not being parsed correctly.
- Fixed the parentheses in math operations not being removed when it contains leading or trailing whitespace.

## 0.3.2
*2020-06-08*
- Changed output style element to use the file path of the external stylesheet as the `source` data attribute.
- Fixed nested variables with arguments sometimes not being parsed correctly.

## 0.3.1
*2020-06-07*
- Changed output element to include the source of the stylesheet in the element's dataset.
- Fixed external stylesheet imports not working in older browsers.
- Fixed bracketed numbers having their brackets removed.
- Fixed parsing of numbers with many prefixed plus or minus signs.

## 0.3.0
*2020-06-06*
- Added a plethora of built-in variables, all prefixed with `@`.
  - Math functions and variables: `mod`, `min`, `max`, `clamp`, `sin`, `asin`, `cos`, `acos`, `tan`, `atan`, `abs`, `floor`, `ceil`, `round`, `log`, `root`, and `pi`.
  - Logical functions: `if`.
  - Text functions: `encode`, `replace`, and `length`.
  - Color functions: `color` and `colorpart`.
- Added support for math conversions using exponents (`^` or `**`), multiplication (`*`), division (`/`), addition (`+`), and subtraction (`-`); order of operations applies in that order.
  - Supports base 10 (no prefix), base 2 (prefix `0b`), base 8 (prefix `0o`), and base 16 (prefix `0x`).
- Added `@const` declarator to modify parser constants `MAX_RECURSION` and `MAX_ARGUMENTS`.
- Changed NovaSheets `type` and `rel` declarations to be case insensitive and to allow the word "NovaSheet" being pluralised.
- Changed NovaSheets `type` declarations to apply to any element instead of applying only to `template` elements.

## 0.2.1
*2020-05-31*
- Changed output to prevent multiple duplicate stylesheets being outputted when running the parsing command multiple times.
- Fixed parameters sometimes not being fully parsed.

## 0.2.0
*2020-05-31*
- Added support for variable parameters.

## 0.1.2
*2020-05-31*
- Fixed tabs not being treated as spaces when parsing input.
- Fixed CRLF character breaking variable substitution.
- Fixed infinite recursion on variable substitution.

## 0.1.1
*2020-05-29*
- Added support for nesting variables inside other variables.
- Fixed inaccessible stylesheets crashing the parser.

## 0.1.0
*2020-05-28*
- Supports variable declaration in the front matter and substitution in the CSS content.
- Supports both internal and external stylesheets.
- Supports single-line comments.
