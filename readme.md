# NovaSheets

A simple to use, lightweight CSS preprocessor.

# Why NovaSheets?

Unlike other CSS prepocessors which compile stylesheets when the site is built, NovaSheets is purely JavaScript and stylesheets are converted in the browser.

# Installation

To install NovaSheets, just the following script tag to your HTML document:
```
<script src="https://github.com/Nixinova/NovaSheets/raw/master/src/novasheets.js">
```

# Loading
NovaSheets styles can be loaded from both external and internal stylesheets.

External stylesheets are imported similarly to regular CSS stylesheets but with a relation of "novasheet" instead of "stylesheet":
```
<link rel="novasheet" href="style.css">
```

Internal stylesheets are declared by setting the `type` attribute of a `template` tag to `novasheet`:
```
<template type="novasheet">
/* ... */
</template>
```

# Usage

NovaSheets lets you declare variables in the front matter of a CSS file and reuse these later in the document.

## Example

**NovaSheets file**:

```
@var style1
    text-align: center;
    background: lime;
    color: #eee;
@var style2
    text-align: left;
    background: aqua;
    color: #222;
---
div.lime {margin: 1em; $(test1)}
div.aqua {margin: 2em; $(test2)}
```

**Output**:
```
div.lime {margin: 1em; text-align: center; background: lime; color: #eee;}
div.aqua {margin: 2em; text-align: left; background: aqua; color: #222;}
</style>
```

## Syntax

### Declaring variables

NovaSheets variables are created by starting a line in the front matter with `@var `. Anything after that space will be the name of the variable. Variables can have any name; there are no character limitations. `myvar`, `my_var`, `my var`, and `my🦀var!` are all valid variable names.

Each variable houses the lines below it as its contents, all the way up until another variable declaration. The contents of each variable can be anything at all; the content is just substituted in to the CSS content by a simple replacement. `text-align: left`, `color: #222;`, `1px`, and `rgb(128, 64, 255)` are all valid contents.

### Using variables

Variables are referenced using a dollar sign (`$`) followed by the variable name in parentheses (`( )`). For example, variable `test1` would be called by writing `$(test1)`. Newlines and redundant spaces are removed by the preprocessor. Variables can not be used in the front matter of a stylesheet.

### Comments

NovaSheets implements single-line comments using double slashes (`//`). Note that the slashes must be prefaced with a space (` `) to prevent URLs being treated as comments. For instance, `@var themeColor1 // the main theme color` will compile to `@var themeColor1`.