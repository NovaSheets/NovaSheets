---
layout: layouts/docs.njk
permalink: /docs/comments/
title: Comments
js: colouring
---
# NovaSheets Comments

```nss
// Single-line comment
/* Multi-line comment */
/*/ Static comment /*/
/*[ Parsed comment ]*/
```

NovaSheets implements single-line comments using double slashes (`//`) alongside CSS's block comments `/* */`, as well as static comments (`/*/ /*/`) and parsed comments (`/*[ ]*/`). Each comment type has its own purpose and different use cases.

## Single-line comments
**Parsed:** No<br>
**Shown in output:** No

Single-line comments hide the remainder of a line from both the parser and the output. They are used by placing two slashes (`//`) followed by the comment content. Example: `body {border: 1px solid;} // change if needed` compiles to just `body {border: 1px solid;}`, hiding the comment from the output.

## Block comments
**Parsed:** No<br>
**Shown in output:** Yes<br>
**Commented in output:** Yes

Block comments are the default CSS comment type, and act no different. The contents of block comments is not parsed but is outputted to the final stylesheet.

## Static comments
**Parsed:** No<br>
**Shown in output:** Yes<br>
**Commented in output:** No

Static comments (`/*/ /*/`) will output the content inside of them as raw NovaSheets syntax without having any parsing applied to them. Example: `/*/ $(@pi) /*/` &rarr; `$(@pi)`, with no further interpolation.

## Parsed comments
**Parsed:** Yes<br>
**Shown in output:** Yes<br>
**Commented in output:** Yes

Parsed comments (`/*[ ]*/`) will parse the content inside of them and output that content as a comment, as opposed to regular multi-line comments which do not parse their content. Example: `/*[ $(@log | 100 ) ]*/` &rarr; `/* 10 */`.