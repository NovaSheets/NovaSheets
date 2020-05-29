# NovaSheets

A simple to use, lightweight CSS preprocessor.

# Why NovaSheets?

Unlike other CSS prepocessors which compile stylesheets when the site is built, NovaSheets is purely JavaScript and stylesheets are converted in the browser.

# Installation

To install NovaSheets, just the following script tag to your HTML document:
```
<script src="https://github.com/Nixinova/NovaSheets/raw/master/src/novasheets.js">
```

Note that the above code is subject to change at any time. Check the releases section for a static code URL or a downloadable file; the current version is **0.1.1**.

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

NovaSheets lets you declare variables in the front matter (the contents above the `---` line) of a CSS file, and reuse these later in the document.

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
```

## Syntax

### Declaring variables

NovaSheets variables are created by starting a line in the front matter with `@var `. Anything after that space will be the name of the variable. Variables can have any name; the only limitations are that using parentheses may not work correctly due to how NovaSheets are parsed. `myvar`, `my_var`, `my var`, and `my🦀var!` are all valid variable names.

Each variable houses the lines below it as its contents, all the way up until another variable declaration. The contents of each variable can be anything at all; the content is just substituted in to the CSS content by a simple replacement. Valid contents include `text-align: left`, `$(previous-variable) center`, `1px 2em`, and `rgb(128, 64, 255)`.

### Using variables

Variables are referenced using a dollar sign (`$`) followed by the variable name in parentheses (`( )`). For example, variable `test1` would be called by writing `$(test1)`. Variables can be used anywhere in the document, including in the front matter.

### Comments

NovaSheets implements single-line comments using double slashes (`//`). Note that the slashes must be prefaced with a space (` `) to prevent URLs being treated as comments. For instance, `@var themeColor1 // the main theme color` will compile to `@var themeColor1` and `body {text-align: left;} // change if needed` compiles to `body {text-align: left;}` in the output CSS.

### Whitespace

Newlines in the front matter and redundant spaces anywhere in the document are removed by the preprocessor in the output CSS.