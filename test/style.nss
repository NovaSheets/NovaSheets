@var transition
    -webkit-transition: all 1s; /* chromium */
    -o-transition: all 1s; /* opera */
    transition: all 1s; /* fallback */
@var grid
    display: -ms-grid; /* edge */
    display: grid; /* fallback */
@var base-font-size = 2em
@var theme color = #7f5d4a
@var gradient = background: linear-gradient(90deg, #fff, #000);
@var url = url("https://example.com")
@var border | size | type
    $[size] $[type] $(theme color)
@endvar

@media only screen and (max-width: 800px) {
    .body {background: blue;}
}
body {$(grid); border: $(border | size=$(base-font-size) | type=solid); padding: 4/2em;}
.title {margin-left: 1em; font-size: $(base-font-size); border-bottom: $(border|type=dotted|size=1px); $(transition);}
.title:hover {font-size: $(base-font-size) * 125e-2 + 0.3 / 1.2 - 0.4;}
.content {padding: 1/2em 1em;}
.content p {font-family: "sans-serif";}
.content .p-styled {color: $(theme color);}