# Changelog for NovaSheets
- [0.5.0](#050) • [0.5.1](#051)
- [0.4.0](#040) • [0.4.1](#041) • [0.4.2](#042) • [0.4.3](#043) • [0.4.4](#044) • [0.4.5](#045) • [0.4.6](#046) • [0.4.7](#047)
- [0.3.0](#030) • [0.3.1](#031) • [0.3.2](#032) • [0.3.3](#033) • [0.3.4](#034) • [0.3.5](#035)
- [0.2.0](#020) • [0.2.1](#021)
- [0.1.0](#010) • [0.1.1](#011) • [0.1.2](#012)

## 0.5.1
- Added console warnings for when the parser detects a recursive variable.
- Fixed missing `@endvar` declarations causing infinite recursion.
- Fixed argument substitutions requiring the pipe (`|`) to be prefixed with a space.
- Fixed arguments being skipped if they are placed after an empty anonymous argument.
- Fixed unary negative operator being treated as subtraction.

## 0.5.0
- Added different categories of block comments, each with a different purpose:
  - Regular comments (`/*content*/`): output the raw content inside of them as a CSS comment; i.e, itself.
  - Static comments (`/*/content/*/`): output the raw content inside of them as raw CSS or NovaSheets syntax; i.e., itself but without the "`/*/`"s.
  - Parsed comments (`/*[content]*/`): output the parsed content inside of them as a CSS comment.
- Added support for default argument content, declared by adding a pipe (`|`) followed by the default content into the argument substitutor (e.g., `$[text|default]`).
- Added built-in function `extract` for extracting the nth item from a delimited string. Syntax: `$(@extract | <list> | <delimiter> | <index> )`.
- Added built-in function `each` for applying an operation to each item in a delimited string, referring to the index with `$i` and value with `$v`, `$v[1]`, `$v[$i+1]`, etc. Syntax: `$(@each | <list> | <delimiter> | <replacement> )`.
- Added built-in function `luma` for calculating the relative luminance (between 0 and 1) of a color. Syntax: `$(@luma | <color> )`.
- Added `colour` and `colourpart` as aliases of built-in functions `color` and `colorpart` respectively.
- Added console warnings for when variables are not parsed.
- Removed the need to explicitly initialize variables in variable declarations.
- Fixed built-in function `color` not working when passed a CSS color function with a hash color output.
- Fixed built-in function `replace` not allowing full regular expression syntax such as grouping and boolean 'or'.
- Fixed built-in functions `degrees` and `gradians` having incorrect conversions between each other.
- Fixed built-in functions `e` and `pi` not being parsed when they have leading or trailing whitespace.
- Fixed small decimal values being truncated incorrectly (e.g., `0.000000001234` turning into `0234` instead of just `0`).
- Fixed equals signs in the contents of a single-line variable causing the content that follows to not show up in the output CSS.
- Refactored internal parsing of variables to bracket-match completely, allowing for nested parentheses.

## 0.4.7
- Added parser constant `MAX_MATH_RECURSION` for controlling how many times to perform each part of the order of operations before continuing on to the next operator.
- Added parser constant `KEEP_NAN` for deciding whether or not to parse malformed numbers to `NaN`.
- Changed built-in function `color` to output a generic CSS level-4 color function when given a `type` other than `rgb`, `rgba`, `hsl`, `hsla`, or `hash`, and to allow inputting any value as a percentage (which can be either implicit, i.e. below 1, or explicit using `%`).
- Changed parsing of units to once again allow having a space before the unit.
- Fixed the parser crashing when it comes across invalid unit math, regular expressions in built-in function `replace`, empty arguments in built-in function `color`, or certain values in built-in functions `min` and `max`.
- Fixed built-in functions incorrectly parsing negative numeric arguments.
- Fixed inline variable declarations including the content after the `@endvar` keyword.
- Fixed single zero-padded numbers being truncated.
- Fixed spaced `+` and `-` math operators not being parsed.
- Fixed units with millimetres being incorrectly converted.
- Fixed hexidecimal values containing letters not being treated as numbers.

## 0.4.6
- Changed parsing of numbers to always convert from base 2, 8, and 16 to base 10.
- Changed parsing of units to disallow having a space before the unit.
- Fixed built-in function `replace` not replacing all instances of the specified string.
- Fixed `e` characters in hexidecimal values being parsed as order-of-magnitude exponentation.
- Fixed newlines and spaced units being truncated completely in the output CSS.
- Fixed pseudo-classes being malformed in the output CSS.

## 0.4.5
- Changed built-in function `color` to default missing hex values to `0` and allow more flexibility in its arguments.
- Changed built-in function `colorpart` allowing `hex`/`hexadecimal` as aliases for `hash`.
- Fixed built-in function `bitwise` outputting its name as well as its parsed content.
- Fixed built-in function `color` not allowing percentages and not parsing its arguments properly.
- Fixed built-in function `colorpart` not parsing parts properly, not allowing `rgb`/`rgba` CSS functions when using type `hash`/`#`, and not outputting the raw hash value if passed with type `hash`/`#`.
- Fixed built-in function `round` outputting `NaN` when the "decimal places" argument is missing.
- Fixed floating-point math outputting strings of zeroes or nines.

## 0.4.4
- Changed variable declarations using the existing `=` notation to be strictly single-line declarations.
- Changed unit parsing to be more intuitive, allowing more units in any permutation (`1/2em`, `1em/2`, `1em/2em`, etc).
- Changed syntax of build-in function `log` to allow a base as its first argument.
- Changed built-in function `replace` to allow regular expressions.
- Changed built-in functions `degrees`, `radians`, and `gradians` to default to radians, degrees and degrees respectively.
- Changed built-in function `color` to allow colors being created from hash values.
- Changed built-in function `colorpart` to allow more aliases for its first parameter, such as `GREEN`/`grn`/etc for "green", etc.
- Fixed bracketed numbers not having math operations applied to them.
- Fixed boolean values outputting incorrect results when containing leading and/or trailing whitespace.
- Fixed built-in function `if` outputting `undefined` when falsey and the "if false" argument is missing.
- Fixed conversions to radians in built-in functions `degrees` and `gradians`.
- Fixed built-in function `ceil` not working.
- Fixed leading and/or trailing whitespace affecting the output of built-in functions.
- Fixed built-in function `colorpart` breaking when being passed a raw CSS color function.

## 0.4.3
- Added support for scientific notation using `E`/`e` for values below `1e21`.
- Fixed declarators in the middle of a line not being parsed.
- Fixed anonymous arguments not adapting to the maximum argument parser constant.
- Fixed parsing of multiple order of operations.

## 0.4.2
- Added support for anonymous variable arguments.
- Changed math parsing to allow a space between the last number and its unit to improve readability.
- Fixed inline comments breaking variable declarations.
- Fixed URLs in variable contents being treated as comments.
- Fixed order of operations not being properly applied.

## 0.4.1
- Added build-in function `degrees` for converting a value to degrees.
- Changed syntax of built-in functions `degrees`, `radians`, and `gradians` to mandate the keywords `deg`, `rad`, or `grad` in its first argument.
- Fixed ampersands not working when using an HTML element as input.
- Fixed chained logical statements not being parsed correctly.
- Fixed bitwise `or` not working properly.
- Fixed math inside the contents CSS `calc` function being incorrectly parsed.

## 0.4.0
- Added support for declaring variables anywhere in the document.
- Added support for placing variable content on the same line as the variable declaration by seperating the two with "`=`".
- Added the `@endvar` keyword for declaring the end of the contents of a variable.
- Added built-in functions `radians`/`gradians` and `bitwise`/`boolean` for converting from degrees and performing bitwise/logical operations, respectively.
- Added support for operators `not`/`!`/`~`, `and`/`&&`/`&`, `or`/`||`/`|`, `nand`, `nor`, `xor`, and `xnor` in the first argument of built-in funcion `if`.
- Removed the `---` separator keyword as it is superceded by `@endvar`.
- Removed the `deg` and `grad` keywords as they interfere with raw CSS.
- Fixed unparsed or invalid variables and arguments appearing in the output CSS.

## 0.3.5
- Changed output to put each CSS declaration on its own line.
- Fixed empty variables being truncated completely to an empty string instead of one space.

## 0.3.4
- Added `deg` and `grad` keywords which change the preceeding number to radians and gradians, respectively.
- Added support for length conversions between `cm`, `mm`, `ft`, and `in` to metres using math operators.
- Added in-built function `percent` for converting a value to a percentage.
- Changed the `source` data attribute of the output style element to use a relative link.
- Removed support for using math operators on the right side of values with units.
- Fixed variables not being substituted when they contain trailing whitespace.
- Fixed `@const` declarations that appear after `@var` declarations being part of that variables content.

## 0.3.3
- Added support for using math operators on the right side of values with units.
- Fixed multiple calls of the same variable with different arguments outputting the same result each time.
- Fixed nested variables with arguments still sometimes not being parsed correctly.
- Fixed the parentheses in math operations not being removed when it contains leading or trailing whitespace.

## 0.3.2
- Changed output style element to use the file path of the external stylesheet as the `source` data attribute.
- Fixed nested variables with arguments sometimes not being parsed correctly.

## 0.3.1
- Changed output element to include the source of the stylesheet in the element's dataset.
- Fixed NovaSheets declaration not working in older browsers.
- Fixed bracketed numbers having their brackets removed.
- Fixed parsing of numbers with many prefixed plus or minus signs.

## 0.3.0
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
- Changed output to prevent multiple duplicate stylesheets being outputted when running the parsing command multiple times.
- Fixed parameters sometimes not being fully parsed.

## 0.2.0
- Added support for variable parameters.

## 0.1.2
- Fixed treating tabs not being treated as spaces when parsing input.
- Fixed CRLF character breaking variable substitution.
- Fixed infinite recursion on variable substitution.

## 0.1.1
- Added support for nesting variables inside other variables.
- Fixed inaccessible stylesheets crashing the parser.

## 0.1.0
- Supports variable declaration in the front matter and substitution in the CSS content.
- Supports both internal and external stylesheets.
- Supports single-line comments.