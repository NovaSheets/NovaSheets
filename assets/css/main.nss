@var theme color = $(@color | hsl | 220 | 25% | $[1] )
@var body color = $(theme color | 20%)
@var header color = $(theme color | 15%)
@var header color hover = $(theme color | 10%)
@var header height = 70px
@var main height = calc(100vh - $(header height))
:root {--main-height: $(main height); --header-height: $(header height);}

// Base elements //
* {box-sizing: border-box;}
body {font: normal 16px Roboto, sans-serif; background: $(body color); margin: 0; color: #eee; line-height: 1.8;}
main {min-height: $(main height); padding: $(header height) 10% 0 10%;}
pre {margin: 1em 0; border: 1px solid; padding: 10px; white-space: inherit;}
h1, h2, h3, h4 {margin-left: -0.5em; letter-spacing: 1px;}
h1, h2, h3, h4, p {margin-top: 1em;}

// Header //
@var line height = line-height: $(header height)
header {width: 100%; position: fixed; height: $(header height); background: $(header color); z-index: 9;}
header ul {height: $(header height); display: flex;}
header li {transition: 0.5s;}
header li a[href] {display: block; padding: $(header height) / 4; $(line height) / 2; color: white;}
header li:hover {background: $(header color hover );}

// Footer //
footer {width: 100%; height: $(header height); $(line height); background: $(header color); text-align: center;}

// Links //
a {text-decoration: none; cursor: pointer;}
a[href] {color: #fff; transition: 0.2s;}

main a {text-decoration: underline;}
main a[href]:not(.hover-underline):hover {text-decoration: none;}

a.hover-underline {display: block; text-decoration: none; color: #fff;}
a.hover-underline::after {content: ""; display: block; width: 0; height: 2px; background: #fff; color: #fff; transition: 0.4s;}
:hover>a.hover-underline::after {width: 5em;}

// Tables //
table {margin: 2em auto; border-collapse: collapse;}
table th, table td {padding: 0.2em 0.5em; border: 1px solid #aaa8; text-align: center;}

// Lists //
.flatlist, .plainlist {margin: 0;}
.flatlist li {display: inline;}
.plainlist li {display: inline-block;}
.flatlist:not(.plainlist) li:not(:empty):not(:first-child)::before {content: ' • ';}

// Hiding //
.hide {display: none !important;}

// Responsive //
@media (min-width: 800px) {
    ::-webkit-scrollbar {width: 1em;}
    ::-webkit-scrollbar-track {background: #112d;}
    ::-webkit-scrollbar-thumb {background: #eef; box-shadow: inset 0 0 6px #0114;}
}

/* Copyright © Nixinova 2020 */
