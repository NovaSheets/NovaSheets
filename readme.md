[![Latest version](https://img.shields.io/github/v/release/Nixinova/NovaSheets?label=latest%20version&style=flat-square)](https://github.com/Nixinova/NovaSheets/releases)
[![Last updated](https://img.shields.io/github/release-date/Nixinova/NovaSheets?label=updated&style=flat-square)](https://github.com/Nixinova/NovaSheets/releases)
[![npm downloads](https://img.shields.io/npm/dt/novasheets?logo=npm)](https://www.npmjs.com/package/novasheets)

# NovaSheets

A simple but powerful CSS preprocessor.

**[View documentation](https://novasheets.nixinova.com)**

NovaSheets is a powerful CSS preprocessor with the ability to easily create intricate CSS files.
NovaSheets has very simple, versatile syntax that is easy to pick up and use as it builds largely off of CSS itself, with the addition of custom variables which act as functions, templates, and mixins all in one.
With many built-in variables for you to use, you can take your stylesheets to the next level.
NovaSheets parses in plain text which means you do not have to worry about type conversions or escaping, giving you complete power over your stylesheets.

## Installation

### Node usage

Download [NovaSheets on npm](https://www.npmjs.com/package/novasheets) or `npm install novasheets` to install NovaSheets as a dependency in your project.

This package gives you two methods, `parse` and `compile`:

- `parse` takes in NovaSheets syntax as its input parameter and returns the compiled CSS as a string.
- `compile` takes two input parameters, input and output. The input may be a glob (file path pattern) and the output may be a folder (with the output filename being automatically generated).

```js
const { parse, compile } = require('novasheets');
parse('@var color = #a1f @endvar $(@shade | $(color) | 50% )'); // "#55087f"
compile('styles.nvss', 'output.css'); // parses `styles.nvss` and saves it to `output.css`
```

### Browser usage

See the [releases](https://github.com/Nixinova/NovaSheets/releases) page of this repository to choose a version to use.
Simply import the script into your HTML document and any embedded NovaSheets stylesheets will be parsed.
NovaSheets styles can be written inline or imported from external files.

Inline usage:
```html
<script type="novasheets">`
    // novasheets code
`</script>
```

Import usage:
```html
<link rel="novasheet" href="stylesheet.nvss">
```

Import the latest version of 0.6.x by placing the following in your document:
```html
<script src="https://novasheets.netlify.com/src/0.6.x/min"></script>
```

## Syntax

NovaSheets lets you declare [variables](https://novasheets.nixinova.com/docs/variables/) (with optional parameters) and reuse these elsewhere in the document.
NovaSheets comes with a large variety of [built-in functions](https://novasheets.nixinova.com/docs/default-variables/) for you to make use of, making your CSS development a lot easier.
For full documentation, see [the NovaSheets website](https://novasheets.nixinova.com/docs/).
For testing NovaSheets syntax, see [the demo page](https://novasheets.nixinova.com/demo/).

### Example

**Input**:

```
@var margin = 1em // declares variable 'margin' containing '1em'
@var shaded // begins a block declaration of variable 'shaded'
    background: $[bgcolor]; // uses the value of the 'bgcolor' parameter passed in later
    color: $(@color | hex | 50% | 20% | 30%); // uses an in-built function, '@color', to generate a hexadecimal color
@endvar // ends the block variable declaration of 'shaded'
.default { text-align: center; color: #eee; }
div.main {
    margin: $(margin); // substitutes the content of variable 'margin' ('1em')
    $<.default>!; // copies the CSS block attached to selector '.default' and substitutes it ('!' removes the '{' & '}')
}
div.shaded {
    margin: $<div.main><margin> + 1em; // copies the CSS block attached to selector 'div.main' and returns the value of property 'margin' ('$(margin)', which returns '1em'), then adds '1em' (becoming '2em')
    $(shaded | bgcolor=blue) // substitutes variable 'shaded' with the 'bgcolor' parameter set to 'blue'
}
```

**Output**:

```css
 .default { text-align: center; color: #eee; }
 div.main { margin: 1em; text-align: center; color: #eee; }
 div.shaded { margin: 2em; background: blue; color: #80334d; }
```

## VSCode extension
A VSCode extension for NovaSheets syntax highlighting is available in the [VSCode Marketplace](https://marketplace.visualstudio.com/items/Nixinova.novasheets) via repository [NovaSheets/vscode](https://github.com/NovaSheets/vscode).
