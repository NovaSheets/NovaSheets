[![Latest version](https://img.shields.io/github/v/release/Nixinova/NovaSheets?label=latest%20version&style=flat-square)](https://github.com/Nixinova/NovaSheets/releases)
[![Last updated](https://img.shields.io/github/release-date/Nixinova/NovaSheets?label=updated&style=flat-square)](https://github.com/Nixinova/NovaSheets/releases)

# NovaSheets

A lightweight CSS preprocessor that is simple but powerful.

**[View full documentation](https://github.com/Nixinova/NovaSheets/wiki)**

## Why NovaSheets?

Unlike other CSS prepocessors which compile stylesheets when the site is built, NovaSheets is purely JavaScript and stylesheets are converted in the browser. NovaSheets has very simple, versatile syntax that is easy to pick up and use, as it builds largely off of CSS itself, with the addition of custom variables, which act as functions, templates, and mixins all in one. NovaSheets parses in plain text which means you do not have to worry about type conversions or escaping, giving you complete power over your stylesheets.

## Installation

See the [releases](https://github.com/Nixinova/NovaSheets/releases) page of this repository to choose a version to use. Simply import the script into your HTML document and any embedded NovaSheets stylesheets will be parsed.

## Usage

NovaSheets lets you declare [variables](https://github.com/Nixinova/NovaSheets/wiki/Syntax#Variables) (with optional parameters) and reuse these elsewhere in the document. For more information, see the [wiki](https://github.com/Nixinova/NovaSheets/wiki). For testing NovaSheets syntax, see [this demo page](https://nixinova.github.io/NovaSheets/test/).

### Example

**Input**:

```
@var normal
    text-align: center;
    color: #eee;
@var margin = 1em
@var shaded | bgcolor
    text-align: left;
    background: $[bgcolor];
    color: #222;
@endvar
div.default {$(normal); margin: $(margin);}
div.shaded {$(shaded | bgcolor=blue)}
```

**Output**:
```
div.default {text-align: center; color: #eee; margin: 1em;}
div.shaded {text-align: left; background: blue; color: #222;}
```

## VSCode extension
A VSCode extension for NovaSheets syntax highlighting is available in the [VSCode Marketplace](https://marketplace.visualstudio.com/items/Nixinova.novasheets) via repository [NovaSheets-vscode](https://github.com/Nixinova/NovaSheets-vscode). This extension works for files with extensions `.nss` and `.nss.txt`.