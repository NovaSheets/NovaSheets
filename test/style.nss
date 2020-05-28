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
    lch(64% 24 128)
@var base-font-size
    2em
---
body {$(grid); border: $(border-size) solid $(theme-color); padding: 2em;}
.title {margin-left: 1em; font-size: $(base-font-size); border-bottom: $(border-size) dotted $(theme-color); $(transition);}
.title:hover {font-size: calc( $(base-font-size) * 2 );}
.content {padding: 2em;}
.p-styled {color: $(theme-color);}