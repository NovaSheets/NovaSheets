# NovaSheets

A simple to use, lightweight CSS preprocessor.

## Contents
- [Why NovaSheets?](#why-novasheets)
- [Installation](#installation)
- [Importing stylesheets](#inporting-stylesheets)
- [Usage](#usage)
  - [Example](#example)
- [Syntax](#syntax)
  - [Declaring variables](#declaring-variables)
  - [Using variables](#using-variables)
  - [Comments](#comments)
  - [Whitespace](#whitespace)
 - [VSCode extension](#vscode-extension)

## Why NovaSheets?

Unlike other CSS prepocessors which compile stylesheets when the site is built, NovaSheets is purely JavaScript and stylesheets are converted in the browser. NovaSheets has very simple syntax that is easy to pick up and use as it builds largely off of CSS itself.

## Installation

For information on installing NovaSheets, see the [releases](https://github.com/Nixinova/NovaSheets/releases) page of this repository.

## Importing stylesheets
NovaSheets styles can be loaded from both external and internal stylesheets.

External stylesheets are imported similarly to regular CSS stylesheets but with a relation of "novasheet" instead of "stylesheet":
```
<link rel="novasheet" href="style.nss">
```

Internal stylesheets are declared by setting the `type` attribute of a `template` tag to `novasheet`:
```
<template type="novasheet">
/* ... */
</template>
```

## Usage

NovaSheets lets you declare variables in the front matter (the contents above the `---` line) of a CSS file, and reuse these later in the document.

### Example

**NovaSheets file**:

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

## Syntax

### Declaring variables

NovaSheets variables are created by starting a line in the front matter with `@var `. Anything after that space will be the name of the variable. Variables can have any name; the only limitations are that using parentheses may not work correctly due to how NovaSheets are parsed. `myvar`, `my_var`, `my var`, and `my🦀var!` are all valid variable names.

Variables can have up to 10 arguments attached to them. Arguments are declared in the front matter by appending a pipe (`|`) followed by the argument name. For example, `@var border | type` declares a variable named `border` with an argument named `type`.

Each variable houses the lines below it as its contents, all the way up until another variable declaration. The contents of each variable can be anything at all; the content is just substituted in to the CSS content by a simple replacement. Arguments are referenced similar to variables but using square brackets instead of parentheses (`$[ ]`); for example, `2px $[type]` references declared argument `type`. Valid contents of a variable include `text-align: left`, `$(previous-variable) center`, `$[width] $[height]`, and `rgb(128, 64, 255)`.

### Using variables

Variables are referenced using a dollar sign (`$`) followed by the variable name in parentheses (`( )`). For example, variable `test1` would be called by writing `$(test1)`. Variables can be used anywhere in the document, including in the front matter. Arguments are specified by appending a pipe (`|`) to the variable name and then writing the argument name followed by an equals sign (`=`) and then the argument contents. For example, if variable `border` has argument `color` specified, this argument can be set by writing `$(border|color=blue)`.

### Comments

NovaSheets implements single-line comments using double slashes (`//`). Note that the slashes must be prefaced with a space (` `) to prevent URLs being treated as comments. For instance, `@var themeColor1 // the main theme color`, will compile to `@var themeColor1`, and `body {text-align: left;} // change if needed`, compiles to `body {text-align: left;}` in the output CSS.

### Whitespace

Newlines in the front matter and redundant spaces anywhere in the document are removed by the preprocessor in the output CSS.

## VSCode extension
A VSCode extension for NovaSheets is available at repository (NovaSheets-vscode)[https://github.com/Nixinova/NovaSheets-vscode]. The extension only works for extensions `.nss` and `.nss.txt`.