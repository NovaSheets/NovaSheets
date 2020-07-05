---
layout: layouts/docs.njk
permalink: /docs/operators/
title: Operators
description: "NovaSheets operators"
keywords: "nixinova,novasheets,novasheets operators"
---
# NovaSheets Operators

NovaSheets supports manipulating numerals using raw mathematical operators. These operators are:
- Orders of magnitude (`e`). Example: `1.2e4` &rarr; `1200`.
- Exponentation (`^` or `**`). Example: `2^6` &rarr; `64`.
- Multiplication (`*`). Example: `5 * 2.5` &rarr; `12.5`.
- Division (`/`). Example: `64/16` &rarr; `4`.
- Addition (`+`). Example: `2 + 2` &rarr; `4`.
- Subtraction (`-`). Example: `10 - 8` &rarr; `2`.

Operations apply in that order.
Parentheses (`( )`) can be used to force a change in the order of operations. Example: `1+(2^3-4)/5` &rarr; `1.8`.

NovaSheets supports declaring numbers in binary (prefix `0b`), octal (prefix `0o`), decimal (no prefix), and hexadecimal (prefix `0x`). Example: `0xff * 0b10` &rarr; `510`.