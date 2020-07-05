---
layout: layouts/docs.njk
permalink: /docs/constants/
title: Parser Constants
description: "Documentation for NovaSheets parser constants"
keywords: "nixinova,novasheets,novasheets syntax"
---
# NovaSheets Parser Constants

```nss
@const <name> <value>
```

The parser contains a few constants which affect how NovaSheets code is parsed. These constants can be modified by using the `@const` keyword in the front matter of the document. The following parser constants are available:

- `@const MAX_RECURSION <integer>`
  - Controls how many times variable nesting, math, etc, will be iterated over; defaults to `50`.
- `@const MAX_MATH_RECURSION <integer>`
  - Controls how many times math operations will be iterated over; defaults to `5`.
- `@const MAX_ARGUMENTS <integer>`
  - Controls the maximum number of arguments a variable can have; defaults to `10`.
- `@const KEEP_NAN <boolean>`
  - Controls whether or not `NaN` should be outputted when parsing invalid numbers instead of an empty string; defaults to `false`.