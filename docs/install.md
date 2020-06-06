# Installing NovaSheets

See the [releases](https://github.com/Nixinova/NovaSheets/releases) page of the NovaSheets repository to choose a version to download. Once you have done this you can download one of the files given and add to your project or embed NovaSheets into your project directly using the code provided.

## Importing
The latest version is **0.3.0** and can be imported using the code below:
```html
<script src="https://nixinova.github.io/NovaSheets/src/vers/novasheets-0.3.0.min.js"></script>
```

While the minified version is recommended for general use, you can also choose to use the more verbose regular version:
```html
<script src="https://nixinova.github.io/NovaSheets/src/vers/novasheets-0.3.0.js"></script>
```

Alternatively, you can choose to import the main live source code directly, but be warned: it is continually updated and may contain incomplete or buggy features, so use it at your own risk:
```
<script src="https://nixinova.github.io/NovaSheets/src/novasheets.js"></script>
```

## Browser support
NovaSheets is supported in all major browsers, including Chrome, Edge (Chromium), Firefox, Opera, and Safari. NovaSheets does not work in Internet Explorer, as it is written using the following features from ECMAScript 2015:
- Arrow functions.
- `let` and `const` declarations.
Please create a [new issue](https://github.com/Nixinova/NovaSheets/issues/new) if you have a suggestion on ways to support older browsers.