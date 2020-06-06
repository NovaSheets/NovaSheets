# NovaSheets

A simple to use, lightweight CSS preprocessor.

## Why NovaSheets?

Unlike other CSS prepocessors which compile stylesheets when the site is built, NovaSheets is purely JavaScript and stylesheets are converted in the browser. NovaSheets has very simple syntax that is easy to pick up and use as it builds largely off of CSS itself. NovaSheets parses in plain text which means you do not have to worry about type conversions or escaping.

## Overview
NovaSheets styles can be loaded from both external and internal stylesheets.

External stylesheets are imported similarly to regular CSS stylesheets but with the `rel` attribute set to `novasheet` or `novasheets` (case insensitive) instead of `stylesheet`:
```html
<link rel="novasheet" href="style.nss">
```

Internal stylesheets are declared by setting the `type` attribute of any tag to `novasheet` or `novasheets` (case insensitive):
```html
<template type="novasheet">
/* ... */
</template>
```

For a demonstration of NovaSheets in a live context, see [this demo page](https://nixinova.github.io/NovaSheets/test/).

## Syntax
NovaSheets variables are created by starting a line in the front matter (content above `---`) with `@var ` followed by the variable name (for example, `@var variable name`), with the variable contents found on the lines beneath. Variables are subtituted using the format `$(variable name | argument1 | argument2 | ...)`. A variety of build-in variables and functions are available, many of with are mathematical functions.