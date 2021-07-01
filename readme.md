[![Latest version](https://img.shields.io/github/v/release/Nixinova/NovaSheets?label=latest%20version&style=flat-square)](https://github.com/Nixinova/NovaSheets/releases)
[![Last updated](https://img.shields.io/github/release-date/Nixinova/NovaSheets?label=updated&style=flat-square)](https://github.com/Nixinova/NovaSheets/releases)
[![npm downloads](https://img.shields.io/npm/dt/novasheets?logo=npm)](https://www.npmjs.com/package/novasheets)

# NovaSheets

Take your stylesheets to the next level with NovaSheets, the simple, powerful and versatile CSS preprocessor.

**[View full documentation](https://novasheets.js.org)**

> NovaSheets is a powerful CSS preprocessor with the ability to easily create intricate CSS files.<br>
> NovaSheets has very simple syntax that is easy to pick up and use as it builds largely off of CSS itself.<br>
> Extend your stylesheets with variables and functions to keep code duplication to a minimum.<br>
> Make use of the many built-in functions offered to you, or create your own with an easy API.

- **Contents**
  - [Overview](#overview)
  - [Installation](#installation)
    - [Node usage](#node-usage)
    - [Command-line usage](#command-line-usage)
    - [Browser usage](#browser-usage)
  - [VSCode extension](#vscode-extension)

## Overview

For full documentation, see [the NovaSheets website](https://novasheets.js.org/docs/).
For testing NovaSheets syntax, see [the demo page](https://novasheets.js.org/demo/).

The canonical file extension for NovaSheets is `.nvss`.

→ [Skip overview](#installation)

Start with some normal CSS:

```css
body {background: #eee; color: #222; margin: 1em 2em;}
div {color: #444; font-size: 16px; padding-left: 1em; border-bottom: 2px solid #123;}
div h1 {color: #222; font-size: 2em; margin-top: 2em; border-bottom: 2px solid #123;}
```

See anything wrong with it?
Various properties are re-used, creating a headache when you want to update them.

Declare them once using [variables](https://novasheets.js.org/docs/variables/):

```less
@var text_color = #222
@var border
  border-bottom: 2px solid #123;
@endvar

body {background: #eee; color: $(text_color); margin: 1em 2em;}
div {color: #444; font-size: 16px; padding-left: 1em; $(border);}
div h1 {color: $(text_color); font-size: 2em; margin-top: 2em; $(border);}
```

Or, include properties straight from [other styling blocks](https://novasheets.js.org/docs/objects/):

```less
body {background: #eee; color: #222; margin: 1em 2em;}
div {color: #444; font-size: 16px; padding-left: 1em; border-bottom: 2px solid #123;}
div h1 {color: $<body><color>; font-size: 2em; margin-top: 2em; border-bottom: $<div><border-bottom>;}
```

Improve variables by providing arguments, making them into functions:

```less
@var border | color // or just `@var border`; arguments are automatically created
  border-bottom: 2px solid $[color];
@endvar
div {$(border | color = #111);}
```

Avoid duplicating selectors using nesting:

```less
div {
  color: #444; font-size: 16px; padding-left: 1em; border-bottom: 2px solid #123;
  h1 {
    color: $<body><color>; font-size: 2em; margin-top: 2em; border-bottom: $<div><border-bottom>;
    &.subtitle {font-style: italic;}
  }
  h2 {margin-top: 1em;}
}
```

Create [simple breakpoints](https://novasheets.js.org/docs/selectors/#simple-breakpoints) just by adding `@` followed by the breakpoint value after the selector:

```less
main @ ..800px {margin: 0 0.5em;} // up to 800px exclusive
main @ 800px.. {margin: 1em 4em;} // from 800px inclusive
```

Use [mathematical operations](https://novasheets.js.org/docs/operators/) without the use of `calc()`:

```less
body {font-size: 2em + 4em/2;} // 4em
p {font-size: $<body><font-size> * 2;} // 8em
```

And if all this isn't enough, there are dozens of [built-in functions](https://novasheets.js.org/docs/builtin-functions/) available to use:

```less
body {line-height: $(@floor | 2.6 );}
p {color: $(@color | hex | 50% | 20% | 30% );}
h1 {margin: $(@if | true | 1em 2em | 6em );}
```

You can even create your own with JavaScript!

## Installation

### Node usage

Download [NovaSheets on npm](https://www.npmjs.com/package/novasheets) using `npm install novasheets` to install NovaSheets as a dependency in your project.

This package gives you two methods, `parse` and `compile`:

- `parse(input: string, class?: NovaSheets): string`:
  - Takes in NovaSheets syntax as `input` and returns the compiled CSS as a string.
  - Option `class` parameter may be used to supply custom functions.
- `async compile(source: string, output?: string, class?: NovaSheets): Promise<void>`
  - Compiles a NovaSheets source file.
  - `source` may be a glob (file path pattern) and `output` may be a folder (with the output filename being automatically generated).

In both cases, the optional `class` parameter is an instance of the NovaSheets class, containing the following non-static methods:
- `addFunction(name: string, func: function (match: string, ...args: string[]), options?: object)`
  - Adds a new built-in function named `name`.
  - The first parameter of `func` is the entire function match (`$(name|...)`) while the rest are the individual arguments of the function.
  - The optional `options` object has the following options available:
    - `trim?: boolean` (default: `true`): Whether arguments are trimmed.
  <!-- - `allArgs?: boolean` (default: `false`): Whether all arguments should be loaded. -->

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
sheet.addFunction('@invert boolean', (_match, val) => val === 'false');
NovaSheets.parse('$(@invert boolean | true)', sheet); // 'false'
```

### Command-line usage

Download NovaSheets for the command line globally using `npm install -g novasheets` then get started by typing `novasheets --help`.
The command-line tool uses the same functions as the Node usage, giving you two commands: `--parse` and `--compile`.

- `novasheets {-p|--parse} "<input">`
  - Parses NovaSheets input and outputs it back in the command line.
- `novasheets [{-c|--compile}] <input> [<output>]`
  - Compiles the file(s) set as the input (which may be a glob) into the output (which, if unset or set to a folder, uses the original filename but with an extension of `.css`).

### Browser usage

See the [releases](https://github.com/NovaSheets/NovaSheets/releases) page of this repository to choose a version to use.

Simply import the script into your HTML document and any embedded NovaSheets stylesheets will be parsed:
```html
<script src="https://novasheets.js.org/src/stable/min"></script> // latest stable release
```

NovaSheets styles can be written inline or imported from external files:
```html
<script type="novasheets">`
  // inline usage
`</script>
<link rel="novasheet" href="stylesheet.nvss"> <!-- import usage -->
```

If you are using a static site generator that supports npm packages (such as [eleventy](https://github.com/11ty/eleventy)), it is recommended to use the command-line usage to compile NovaSheets during the site's build process instead of client-side.
This can be done by adding `novasheets --compile **/*.nvss` to your post-build command after installing NovaSheets using `novasheets install --save-dev novasheets`.

The NovaSheets class is available to use in the browser, allowing you to add custom functions. Example:
```js
const sheet = new NovaSheets();
sheet.addFunction('@invert boolean', (match, val) => val === 'false');
NovaSheets.parse('$(@invert boolean | true)', sheet); // 'false'
```

## VSCode extension
A VSCode extension for NovaSheets formatting and syntax highlighting is available in the [VSCode Marketplace](https://marketplace.visualstudio.com/items/Nixinova.novasheets) via repository [NovaSheets/vscode](https://github.com/NovaSheets/vscode).
