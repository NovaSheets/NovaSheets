---
layout: layouts/docs.njk
permalink: /docs/constants/
title: Parser Constants
js: colouring
---
# NovaSheets Parser Constants

```nss
@const <name> <value>
```

The parser contains a few constants which affect how NovaSheets code is parsed. These constants can be modified by using the `@const` keyword anywhere in the document. The following parser constants are available:

- `@const MAX_RECURSION <integer>`
  - Controls how many times variable nesting, math, etc, will be iterated over; defaults to `50`.
- `@const MAX_MATH_RECURSION <integer>`
  - Controls how many times math operations will be iterated over; defaults to `5`.
- `@const MAX_ARGUMENTS <integer>`
  - Controls the maximum number of arguments a variable can have; defaults to `10`.
- `@const DECIMAL_PLACES {<integer>|false}`
  - Controls how many decimal places numbers are outputted with. Has no effect when set to `false` (default).
- `@const KEEP_NAN <boolean>`
  - Controls whether or not `NaN` should be outputted when parsing invalid numbers; defaults to `false`.