---
layout: layouts/docs.njk
permalink: /docs/variables/
title: Variables
description: "NovaSheets variables"
keywords: "nixinova,novasheets,novasheets variables"
---
# NovaSheets Variables

## Declaring
- Single-line:
  ```nss
  @var <variable name> = <variable contents>
  ```
- Multi-line:
  ```nss
  @var <variable name>
  <variable contents>
  [@endvar]
  ```

NovaSheets variables are created by starting a line with `@var`. Anything after that space will be the name of the variable.
Variables can have any name; the only limitations are that they cannot contain pipes and brackets may not work correctly due to how NovaSheets is parsed.

The contents of a variable are found either on the lines beneath it, all the way up until either another variable declaration or the keyword `@endvar`, or as the content to the right of the first equals sign on the declaration line.

Parameters of a variable are referenced similar to variables but by using square brackets instead of parentheses (`$[...]`). The default contents of an argument can be set by adding a pipe following by the default argument content to its name.

## Substitution
- Explicit arguments:
  ```nss
  $(variable name | parameter1 = argument1 | parameter2 = argument2 | ... )
  ```
- Anomymous arguments (where the parameter defaults to the index of the argument, i.e. `1`, `2`, ...):
  ```nss
  $(variable name | argument1 | argument2 | ...)
  ```

Variables are referenced using a dollar sign (`$`) followed by the variable name in parentheses (`(...)`).
Arguments are passed by listing parameter names followed by the argument contents, with each prefixed with a pipe.

## Example

```nss
/* Declare variables */
// declare variable 'color1' with contents '#123':
@var color1 = #123

// declare variable 'color2' containing parameter 'hue':
@var color2 = hsl($[hue], 50%, 75%)

// declare variable 'color3' containing parameter 'red' which defaults to '0':
@var color3 = rgb($[red|0], 128, 0)

// declare variable 'color4' containing an anonymous parameter:
@var color4 = #000$[1]

// declare variable 'color5' with contents 'background: blue;':
@var color5
    background: blue;
@endvar 

/* Substitute variables */

// substitute variable 'color1':
$(color1) // '#123'

// substitute variable 'color2' with argument 'hue' set to '100':
$(color2 | hue = 100 ) // 'hsl(100, 50%, 75%)'

// substitute variable 'color3' with argument 'red' defaults to '0':
$(color3 ) // 'rgb(0, 128, 0)'

// substitute variable 'color4' with argument '1' defaults to the first anonymous argument, which is set to 'f':
$(color3 | f ) // '#000f'

// substitute variable 'color5':
$(color5 ) // 'background: blue;'
```
