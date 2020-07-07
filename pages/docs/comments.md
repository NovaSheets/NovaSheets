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

NovaSheets implements single-line comments using double slashes (`//`) alongside CSS's block comments `/* */`. Single-line comments are removed by the parser while CSS block comments remain in the output. For instance, `body {text-align: left;} /* default */ // change if needed`, compiles to `body {text-align: left;} /* default */` in the output CSS. The contents of block comments is not parsed.

Static comments (`/*/ /*/`) will output the content inside of them as raw NovaSheets syntax without having any parsing applied to them. Example: `/*/ $(@pi) /*/` &rarr; `$(@pi)`.

Parsed comments (`/*[ ]*/`) will parse the content inside of them and output that content as a comment, as opposed to regular multi-line comments which do not parse their content. Example: `/*[ $(@log | 100 ) ]*/` &rarr; `/* 10 */`.