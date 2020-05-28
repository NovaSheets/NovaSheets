@var transition // automatic vendor prefixes
    -webkit-transition: all .5s;
    -o-transition: all .5s;
    transition: all .5s; // default
@var grid // automatic vendor prefixes
    display: -ms-grid;
    display: grid; // default
@var border-size
    1px
@var theme-color
    #7f5d4a
@var base-font-size
    2em
---
body {$(grid); border: $(border-size) solid $(theme-color); padding: 2em;}
.title {margin-left: 1em; font-size: $(base-font-size); border-bottom: $(border-size) dotted $(theme-color); $(transition);}
.title:hover {font-size: calc( $(base-font-size) * 1.25 )}
.content {padding: 2em;}
.content p {font-family: sans-serif;}
.content .p-styled {color: $(theme-color);}