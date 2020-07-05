---
layout: layouts/docs.njk
permalink: /docs/
title: Documentation
description: "Documentation for NovaSheets syntax"
keywords: "nixinova,novasheets,novasheets documentation,novasheets syntax"
---
# NovaSheets Syntax

## Variables
*Main page: [Variables](/docs/variables)*

NovaSheets variables are created by starting a line with `@var`. Anything after that space will be the name of the variable. Variables can have any name; the only limitations are that they cannot contain pipes and brackets may not work correctly due to how NovaSheets is parsed.

The contents of a variable are found either on the lines beneath it, all the way up until either another variable declaration or the keyword `@endvar`, or as the content to the right of the first equals sign on the declaration line.
Parameters of a variable are referenced similar to variables but using square brackets instead of parentheses (`$[...]`). The default contents of an argument can be set by adding a pipe following by the default argument content to its name.

Variables are referenced using a dollar sign (`$`) followed by the variable name in parentheses (`(...)`). Arguments are passed by listing parameter names followed by the argument contents, with each one prefixed with a pipe.

## Operators
*Main page: [Operators](/docs/operators)*

NovaSheets supports manipulating numerals using raw mathematical operators. These operators are orders of magnitude (`e`), exponentation (`^` or `**`), multiplication (`*`), division (`/`), addition (`+`), and subtraction (`-`). Order of operations applies in that order; parentheses (`( )`) can be used to force a change in the order of operations.

## Comments
*Main page: [Comments](/docs/comments)*

NovaSheets implements single-line comments (`// ...`), multi-line unparsed comments (`/* ... */`), static comments (`/*/ ... /*/`), and parsed comments (`/*[ ... ]*/`).

## Parser constants
*Main page: [Parser constants](/docs/constants)*

The parser contains a few constants which affect how NovaSheets code is parsed. These constants can be modified by using the `@const` keyword on its own line anywhere in the document.