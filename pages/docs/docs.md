---
layout: layouts/docs.njk
permalink: /docs/
title: Documentation
description: "Documentation for NovaSheets syntax"
js: colouring
js2: headings
---
# NovaSheets Documentation
- [Node usage](#node-usage)
- [Command-line usage](#command-line-usage)
- [Browser usage](#browser-usage)
- [Syntax](#syntax)

## Node usage

<pre class="code-styles">
<span class="js-keyword">const</span> { <span class="js-function">parse</span>, <span class="js-function">compile</span> } = <span class="js-function">require</span>(<span class="js-string">'novasheets'</span>);
<span class="js-function">parse</span>(<span class="js-string">'@var color = #fff @endvar $(@shade | $(color) | 50% )'</span>); <span class="comment">// "#7f7f7f"</span>
<span class="js-function">compile</span>(<span class="js-string">'stylesheet.nss'</span>, <span class="js-string">'output.css'</span>);
</pre>

NovaSheets contains two functions, `parse` and `compile`. After installing NovaSheets using `npm install novasheets`, import these using `const { parse, compile } = require('novasheets');`.

The `parse` function returns the parsed NovaSheets content, given via its first argument.
The `compile` function compiles a NovaSheets file into CSS. It takes two arguments, the input file and the output file. If the output file is not set, it defaults to the input file but with a file extension of `.css`.

## Command-line usage

After installing globally using `npm install -g novasheets`:

```
novasheets <input file> [<output file>]   Compile a NovaSheets file into CSS
novasheets --parse "<input>"              Parse raw NovaSheets input from the command line
novasheets --help                         Display the help message
novasheets --version                      Display the current version of NovaSheets
```

## Browser usage

After the NovaSheets source code is added to the web page, stylesheets can be either be imported from external files or embedded locally.

### Importing

Simply link to external NovaSheets files in the header of the page using `<link>` tags with the `rel` attribute set to `"novasheet"` (or `"novasheets"`).

```
<link rel="novasheet" href="example.nss">
```

### Embedding

Inline stylesheets can be created by simply setting the `type` attribute of an element to `"novasheet"` (or `"novasheets"`) and putting NovaSheets content inside. Note that HTML may interfere with NovaSheet styles if they are placed inside regular block elements, so `<style>` or `<script>` tags are recommended. When using `<script>` tags, surround the entire stylesheet content in backticks (\`) to avoid JavaScript errors in the console.

```
<style type="novasheets">
    .element {display: inline-block;}
    % .child {font-size: 2/3em;}
</style>
```
```
<script type="novasheets">`
    div {background-color: brown;}
    & p, & img {border: 2px solid;}
`</script>
```

## Syntax

### Variables
*More info: [Variables](/docs/variables)*

NovaSheets variables are created by starting a line with `@var`. Anything after that space will be the name of the variable. The contents of a variable are found either on the lines beneath it, all the way up until either another variable declaration or the keyword `@endvar`, or as the content to the right of the first equals sign on the declaration line.

Variables are referenced using a dollar sign (`$`) followed by the variable name in parentheses (`(...)`). Arguments are passed by listing parameter names followed by the argument contents, with each one prefixed with a pipe.
Parameters of a variable are referenced similar to variables but using square brackets instead of parentheses (`$[...]`). The default contents of an argument can be set by adding a pipe following by the default argument content to its name.

### Operators
*More info: [Operators](/docs/operators)*

NovaSheets supports manipulating numerals using raw mathematical operators. These operators are orders of magnitude (`e`), exponentation (`^` or `**`), multiplication (`*`), division (`/`), addition (`+`), and subtraction (`-`). Order of operations applies in that order; parentheses (`( )`) can be used to force a change in the order of operations.

### Selectors
*More info: [Selectors](/docs/selectors)*

NovaSheets adds previous element selectors, which copy the content of a previous CSS selector. Ampersands (`&`) take the previous *raw* selector (i.e., the last selector that does not contain an ampersand), while percent signs (`%`) take the previous selector.
Less-than signs (`<`) can be used to slice the last item off the selector; characters treated as item delimiters are `:`, `>`, `+`, `~`, and whitespace. For example, `.item>div {} &< p {} %~img {}` outputs `.item>div {} .item p {} .item p~img {}`.

### Objects
*More info: [Objects](/docs/objects)*

NovaSheets treats all CSS declaration blocks as objects, and the values of each CSS property can be accessed using the format `{attr: val;}<attr>`. Declaration blocks can be substituted using the format `$<selector>`, where the content inside refers to the full selector identifier attached to that declaration block. These two can be combined, forming `$<selector><attr>`. All of the block's content can be dumped using `$<selector>!`.

### Comments
*More info: [Comments](/docs/comments)*

NovaSheets implements single-line comments (`// ...`), multi-line unparsed comments (`/* ... */`), static comments (`/*/ ... /*/`), and parsed comments (`/*[ ... ]*/`).

### Parser constants
*More info: [Parser constants](/docs/constants)*

The parser contains a few constants which affect how NovaSheets code is parsed. These constants can be modified by using the `@const` keyword on its own line anywhere in the document.