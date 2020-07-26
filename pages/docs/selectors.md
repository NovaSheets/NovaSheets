---
layout: layouts/docs.njk
permalink: /docs/selectors/
title: Selectors
js: colouring
---
# NovaSheets Selectors

## Previous element selectors

```css
a {} & b {} & c {} & d {} // a {} a b {} a c {} a d {}
a {} % b {} % c {} % d {} // a {} a b {} a b c {} a b c d {}
a {} & b {} % c {} & d {} // a {} a b {} a b c {} a d {}
a {} % b {} & c {} & d {} // a {} a b {} a b c {} a b d {}
```

NovaSheets adds previous element selectors, which copy the content of a previous CSS selector. There are two types: ampersands (`&`) and percents (`%`).
Ampersands copy the last *raw* selector, while percents copy the selector directly before the current one. A 'raw' selector is one that does not contain any ampersands; it may contain percents if they resolve to a raw selector. Ampersands in adjacent selectors all refer to the same element.

## Item slicing

```css
a b {} &< c {} // a b {} a c {}
a {} % b {} %< c {} // a {} a b {} a c {}
.item .child < {} // .item {}
```

Less-than signs (`<`) can be used to slice the last item off of a selector. Characters treated as item delimiters are `>`, `+`, `~`, and whitespace (CSS combinators). This can be used along with previous element selectors to fine tune similar selectors.