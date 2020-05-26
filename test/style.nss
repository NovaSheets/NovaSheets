@var test1
    text-align: center;
    color: #eee;
    background: green;
@var test2
    text-align: left;
    color: #222;
    background: blue;
---
div.a {margin: 1em; $(test1)}
div.b {margin: 2em; $(test2)}