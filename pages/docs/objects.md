---
layout: layouts/docs.njk
permalink: /docs/objects/
title: Objects
js: colouring
---
# NovaSheets Objects

## Declaration substitution

CSS declaration blocks can be sustituted using the format `$<selector>`. This will substitute the entire declaration block, including the opening and closing curly brackets (`{}`). This can be combined with the object notation below to access specific values in the declaration block.

## Object notation

Specific values of an object can be accessed by following the object or CSS declaration block (which are treated as the same thing) with the property name in square brackets (`[]`), taking the format `{attr: val;}[attr]` or `{attr1: val1; attr2: val2;}[attr1]`. NovaSheets treats all CSS declaration blocks as objects, and as such property names are treated as object keys, and property values as object values. As such, any CSS declaration block can have its property value accessed by calling that declaration block using the syntax described above.

## Example

The following example declares a block of CSS content on its first line, with the selector name of `.selector`. The following line substitutes the value of the `color` property of the declaration block attached to `.selector`, which is `red`.

```css
.selector {color: red; background: lightblue;}
$<.selector>[color] // 'red'
```