# Changelog for NovaSheets

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