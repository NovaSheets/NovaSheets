[![Latest version](https://img.shields.io/github/v/release/Nixinova/NovaSheets?label=latest%20version&style=flat-square)](https://github.com/Nixinova/NovaSheets/releases)
[![Last updated](https://img.shields.io/github/release-date/Nixinova/NovaSheets?label=updated&style=flat-square)](https://github.com/Nixinova/NovaSheets/releases)
[![npm downloads](https://img.shields.io/npm/dt/novasheets?logo=npm)](https://www.npmjs.com/package/novasheets)

# NovaSheets

A lightweight CSS preprocessor that is simple but powerful.

**[View documentation](https://novasheets.netlify.app/docs/)**

NovaSheets is a powerful CSS preprocessor with the ability to easily create intricate CSS files with simple syntax. NovaSheets has very simple, versatile syntax that is easy to pick up and use as it builds largely off of CSS itself, with the addition of custom variables which act as functions, templates, and mixins all in one. With many built-in variables for you to use, you can take your stylesheets to the next level. NovaSheets parses in plain text which means you do not have to worry about type conversions or escaping, giving you complete power over your stylesheets.

## Installation

Download [NovaSheets on npm](https://www.npmjs.com/package/novasheets) using `npm install -g novasheets` for command-line usage or `npm install novasheets` for local usage.

For browser usage, see the [releases](https://github.com/Nixinova/NovaSheets/releases) page of this repository to choose a version to use. Simply import the script into your HTML document and any embedded NovaSheets stylesheets will be parsed.

## Node usage
```js
const { parse, compile } = require('novasheets');
parse('@var color = #a1f @endvar $(@shade | $(color) | 50% )'); // "#55087f"
compile('stylesheet.nss', 'output.css');
```

## Syntax

NovaSheets lets you declare [variables](https://novasheets.netlify.app/docs/variables/) (with optional parameters) and reuse these elsewhere in the document. NovaSheets comes with a large variety of [built-in variables](https://novasheets.netlify.app/docs/default-variables/) for you to make use of, making your CSS development a lot easier. For full documentation, see [the NovaSheets website](https://novasheets.netlify.app/docs/). For testing NovaSheets syntax, see [the demo page](https://novasheets.netlify.app/demo/).

### Example

**Input**:

```
@var normal
    text-align: center;
    color: #eee;
@var margin = 1em
@var shaded
    text-align: left;
    background: $[bgcolor];
    color: $(@color | hex | 50% | 20% | 30%);
@endvar
div.default {$(normal); margin: $(margin);}
div.shaded {$(shaded | bgcolor=blue)}
```

**Output**:

```css
div.default {text-align: center; color: #eee; margin: 1em;}
div.shaded {text-align: left; background: blue; color: #80334d;}
```

## VSCode extension
A VSCode extension for NovaSheets syntax highlighting is available in the [VSCode Marketplace](https://marketplace.visualstudio.com/items/Nixinova.novasheets) via repository [NovaSheets-vscode](https://github.com/Nixinova/NovaSheets-vscode). This extension works for files with extensions `.nss` and `.nss.txt`.