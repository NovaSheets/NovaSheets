# Changelog for NovaSheets

## UPCOMING
- Added a plethora of built-in variables, all prefixed with `@`.
 - Math functions and variables: `min`, `max`, `clamp`, `sin`, `asin`, `cos`, `acos`, `tan`, `atan`, `abs`, `floor`, `ceil`, `round`, `log`, `root`, and `pi`.
 - Text functions: `encode`, `replace`, and `length`.
 - Color functions: `color` and `colorpart`.
- Added support for math conversions using exponents (`^` or `**`), modulo (`%`), multiplication (`*`), division (`/`), addition (`+`), and subtraction (`-`); order of operations applies in that order.
- Changed NovaSheets `type` and `rel` declarations to be case insensitive and to allow the word "NovaSheet" being pluralised.
- Changed NovaSheets `type` declarations to apply to any element instead of applying only to `template` elements.

## 0.2.1
- Duplicate stylesheets are no longer outputted when running the parsing command again.
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