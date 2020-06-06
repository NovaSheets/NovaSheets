# NovaSheets

A simple to use, lightweight CSS preprocessor.

## Contents
- [Why NovaSheets?](#why-novasheets)
- [Installation](#installation)
- [Importing stylesheets](#inporting-stylesheets)
- [Usage](#usage)
- [Syntax](#syntax)
- [VSCode extension](#vscode-extension)

## Why NovaSheets?

Unlike other CSS prepocessors which compile stylesheets when the site is built, NovaSheets is purely JavaScript and stylesheets are converted in the browser. NovaSheets has very simple syntax that is easy to pick up and use as it builds largely off of CSS itself.

## Installation

See the [releases](https://github.com/Nixinova/NovaSheets/releases) page of this repository to choose a version to download.

The latest version is **0.3.0** and can be imported using the code below:
```
<script src="https://nixinova.github.io/NovaSheets/src/vers/novasheets-0.3.0.min.js"></script>
```

Alternatively, you can choose to import the main live source code directly, but be warned it is continually updated and may contain incomplete or buggy features:
```
<script src="https://nixinova.github.io/NovaSheets/src/novasheets.js"></script>
```

## Importing stylesheets
NovaSheets styles can be loaded from both external and internal stylesheets.

External stylesheets are imported similarly to regular CSS stylesheets but with the `rel` attribute set to `novasheet` or `novasheets` (case insensitive) instead of `stylesheet`:
```
<link rel="novasheet" href="style.nss">
```

Internal stylesheets are declared by setting the `type` attribute of any tag to `novasheet` or `novasheets` (case insensitive):
```
<template type="novasheet">
/* ... */
</template>
```

## Usage

NovaSheets lets you declare variables in the front matter (the contents above the `---` line) of a CSS file, and reuse these later in the document.

### Example

**Input**:

```
@var default
    text-align: center;
    color: #eee;
@var shaded | color
    text-align: left;
    background: $[color];
    color: #222;
@var margin
    1em
---
div.default {margin: $(margin); $(default)}
div.shaded {$(shaded | color=blue)}
```

**Output**:
```
div.default {margin: 1em; text-align: center; color: #eee;}
div.shaded {text-align: left; background: blue; color: #222;}
```

For a demonstration of NovaSheets in a live context, see [this demo page](https://nixinova.github.io/NovaSheets/test/).

## Syntax
NovaSheets variables are created by starting a line in the front matter (content above `---`) with `@var ` followed by the variable name (for example, `@var variable name`), with the variable contents found on the lines beneath. Variables are subtituted using the format `$(variable name | argument1 | argument2 | ...)`. A variety of build-in variables and functions are available, many of with are mathematical functions.

**See [syntax.md]() for detailed information on NovaSheets syntax.**

## VSCode extension
A VSCode extension for NovaSheets syntax highlighting is available in the [VSCode Marketplace](https://marketplace.visualstudio.com/items/Nixinova.novasheets) via repository [NovaSheets-vscode](https://github.com/Nixinova/NovaSheets-vscode). The extension only works for files with extensions `.nss` and `.nss.txt`.