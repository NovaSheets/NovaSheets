[![Latest version](https://img.shields.io/github/v/release/Nixinova/NovaSheets?label=latest%20version&style=flat-square)](https://github.com/Nixinova/NovaSheets/releases)
[![Last updated](https://img.shields.io/github/release-date/Nixinova/NovaSheets?label=updated&style=flat-square)](https://github.com/Nixinova/NovaSheets/releases)
[![npm downloads](https://img.shields.io/npm/dt/novasheets?logo=npm)](https://www.npmjs.com/package/novasheets)

# NovaSheets

Take your stylesheets to the next level with NovaSheets, the simple, powerful and versatile CSS preprocessor.

**[View full documentation](https://novasheets.js.org)**

NovaSheets is a powerful CSS preprocessor with the ability to easily create intricate CSS files.<br>
NovaSheets has very simple syntax that is easy to pick up and use as it builds largely off of CSS itself.<br>
Extend your stylesheets with variables and functions to keep code duplication to a minimum.<br>
Make use of the many built-in functions offered to you, or create your own with an easy API.

- **Contents**
  - [Installation](#installation)
    - [Node usage](#node-usage)
    - [Command-line usage](#command-line-usage)
    - [Browser usage](#browser-usage)
  - [Syntax](#syntax)
  - [VSCode extension](#vscode-extension)

## Installation

### Node usage

Download [NovaSheets on npm](https://www.npmjs.com/package/novasheets) using `npm install novasheets` to install NovaSheets as a dependency in your project.

This package gives you two methods, `parse` and `compile`:

- `parse(<input>, [<class>]`:
  - Takes in NovaSheets syntax as `input` and returns the compiled CSS as a string.
- `compile(<input>, [<output>], [<class>]`
  - `input` may be a glob (file path pattern) and `output` may be a folder (with the output filename being automatically generated).

In both cases, the optional `class` parameter is an instance of the NovaSheets class, containing the following non-static methods:
- `addFunction(name, func)`
  - Adds a new built-in function named `name`. The first parameter of `func` is the entire function match (`$(name|...)`) while the rest are the individual arguments of the function.

**Basic usage:**
```js
const { parse, compile } = require('novasheets');
parse('@var color = #a1f @endvar $(@shade | $(color) | 50% )'); // "#55087f"
compile('styles.nvss', 'output.css'); // parses `styles.nvss` and saves it to `output.css`
```

**With custom functions:**
```js
const NovaSheets = require('novasheets');
const sheet = new NovaSheets();
sheet.addFunction('@invert boolean', (match, val) => val === 'false');
NovaSheets.parse('$(@invert boolean | true)', novasheets); // 'false'
```

### Command-line usage

Download NovaSheets for the command line globally using `npm install -g novasheets` then get started by typing `novasheets --help`.
The command-line tool uses the same functions as the Node usage, giving you two commands: `--parse` and `--compile`.

- `novasheets {-p, --parse} "<input">`
  - Parses NovaSheets input and outputs it back in the command line.
- `novasheets [{-c, --compile}] <input> [<output>]`
  - Compiles the file(s) set as the input (which may be a glob) into the output (which, if unset or set to a folder, uses the original filename but with an extension of `.css`).
  
### Browser usage

See the [releases](https://github.com/NovaSheets/NovaSheets/releases) page of this repository to choose a version to use.

Simply import the script into your HTML document and any embedded NovaSheets stylesheets will be parsed:
```html
<script src="https://novasheets.js.org/src/0.6.x/min"></script> // latest stable release
<script src="https://novasheets.js.org/src/1.0.0-pre/min"></script> // latest pre-release
```

NovaSheets styles can be written inline or imported from external files:
```html
<script type="novasheets">`
    // inline usage
`</script>
<link rel="novasheet" href="stylesheet.nvss"> // import usage
```

If you are using a static site generator that supports npm packages (such as [eleventy](https://github.com/11ty/eleventy)), it is recommended to use the command-line usage to compile NovaSheets during the site's build process instead of client-side.
This can be done by adding `novasheets --compile **/*.nvss` to your build command after installing NovaSheets using `novasheets install --save-dev novasheets`.

The NovaSheets class is available to use in the browser, allowing you to add custom functions. Example:
```js
const novasheets = new NovaSheets();
novasheets.addFunction('@invert boolean', (match, val) => val === 'false');
NovaSheets.parse('$(@invert boolean | true)', novasheets); // 'false'
```

## Syntax

NovaSheets lets you declare [variables](https://novasheets.js.org/docs/variables/) (with optional parameters) and reuse these elsewhere in the document.
NovaSheets comes with a large variety of [built-in functions](https://novasheets.js.org/docs/default-variables/) for you to make use of, making your CSS development a lot easier.
For full documentation, see [the NovaSheets website](https://novasheets.js.org/docs/).
For testing NovaSheets syntax, see [the demo page](https://novasheets.js.org/demo/).

### Example

**Input**:

```js
@var margin = 1em                           // declare variable 'margin' as '1em'
@var shaded                                 // begin block declaration of variable 'shaded'
    background: $[bgcolor];                 // uses the value of the 'bgcolor' parameter passed in later
    color: $(@color|hex|50%|20%|30%);       // use in-built function '@color' to generate a hexadecimal color
@endvar                                     // end block declaration of variable 'shaded'
.base { text-align: center; color: #eee; }  // regular CSS block
div.main {
    margin: $(margin);                      // substitute content of variable 'margin' (->'1em')
    $<.base>!;                              // copy block attached to selector '.default' and substitute it ('!' removes '{' & '}')
}
div.shaded {
    margin: $<div.main><margin> + 1em;      // copy block attached to selector 'div.main', return value of property 'margin' ('$(margin)'->'1em'), add '1em' (->'2em')
    $(shaded|bgcolor=blue)                  // substitute variable 'shaded' with 'bgcolor' parameter set to 'blue'
}
```

**Output**:

```css
 .default { text-align: center; color: #eee; }
 div.main { margin: 1em; text-align: center; color: #eee; }
 div.shaded { margin: 2em; background: blue; color: #80334d; }
```

Play around with NovaSheets syntax using the [demo](https://novasheets.js.org/demo/)

## VSCode extension
A VSCode extension for NovaSheets formatting and syntax highlighting is available in the [VSCode Marketplace](https://marketplace.visualstudio.com/items/Nixinova.novasheets) via repository [NovaSheets/vscode](https://github.com/NovaSheets/vscode).
