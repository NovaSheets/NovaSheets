---
layout: layouts/docs.njk
permalink: /docs/objects/
title: Objects
js: colouring
---
# NovaSheets Objects

## Object notation

NovaSheets objects take the same format as CSS declaration blocks: `{attr: val;}`, and as such each declaration block is treated as an object. Specific values of an object can be accessed by following the object with the property name in square brackets (`<>`), taking the format `{attr: val;}<attr>` (returning `val`) or `{attr1: val1; attr2: val2;}<attr1>` (returning `val1`), etc. The entire object contents can be substituted by placing an exclamation mark (`!`) after the block: `{attr: val;}!` (returning `attr: val;`). NovaSheets treats all CSS declaration blocks as objects, and as such property names are treated as object keys, and property values as object values. As such, any CSS declaration block can have its property value accessed by calling that declaration block using the syntax described below.

## Declaration block substitution

CSS declaration blocks can be sustituted using the format `$<selector>`. This will substitute the entire declaration block, including the opening and closing curly brackets (`{}`). This can be combined with the object notation above to access specific values in the declaration block, such as getting one property value using `$<selector><attr>` or all properties using `$<selector>!`.

## Examples

The following example declares a block of CSS content on its first line, with the selector name of `.selector`, which is substituted on the second line. The third line gets the value of the `color` property of that declaration block, which outputs `red`. The last line removes the curly brackets of the declaration block, returning raw CSS declarations.

```css
.selector {color: red; background: lightblue;}
$<.selector> // '{color: red; background: lightblue;}'
$<.selector><color> // 'red'
$<.selector>! // 'color: red; background: lightblue;'
```