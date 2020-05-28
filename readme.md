# NovaSheets

A simple to use, lightweight CSS preprocessor.

# Why NovaSheets?

Unlike other CSS prepocessors which compile stylesheets when the site is built, NovaSheets is purely JavaScript and stylesheets are converted in the browser.

# Installation

Add the following script tag to your page:
```
<script src="https://github.com/Nixinova/NovaSheets/raw/master/src/novasheets.js">
```

Then create stylesheets, importing them normally but with a relation of "novasheet" instead of "stylesheet":
```
<link rel="novasheet" href="style.css">
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