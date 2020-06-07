# NovaSheets

A simple to use, lightweight CSS preprocessor.

**[View documentation here](https://github.com/Nixinova/NovaSheets/wiki)**

## Why NovaSheets?

Unlike other CSS prepocessors which compile stylesheets when the site is built, NovaSheets is purely JavaScript and stylesheets are converted in the browser. NovaSheets has very simple syntax that is easy to pick up and use as it builds largely off of CSS itself.

## Installation

See the [releases](https://github.com/Nixinova/NovaSheets/releases) page of this repository to choose a version to use.

## Usage

NovaSheets lets you declare [variables](https://github.com/Nixinova/NovaSheets/wiki/Syntax#Variables) in the front matter (the contents above the `---` line) of a CSS file, and reuse these later in the document. For more information, see the [wiki](https://github.com/Nixinova/NovaSheets/wiki).

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

## VSCode extension
A VSCode extension for NovaSheets syntax highlighting is available in the [VSCode Marketplace](https://marketplace.visualstudio.com/items/Nixinova.novasheets) via repository [NovaSheets-vscode](https://github.com/Nixinova/NovaSheets-vscode). The extension only works for files with extensions `.nss` and `.nss.txt`.