@var theme color = $(@color | hsl | 220 | 25% | $[1] )
@var body color = $(theme color | 20%)
@var header color = $(theme color | 15%)
@var header height = 70px
@var main height = calc(100vh - $(header height))
:root {--main-height: $(main height); --header-height: $(header height);}

// Base elements //
* {box-sizing: border-box;}
body {font: normal 16px Roboto, sans-serif; background: $(body color); margin: 0; color: #eee; line-height: 1.8;}
main {min-height: $(main height); padding: $(header height) 10% 0 10%;}
h1, h2, h3, h4 {margin-left: -0.5em; letter-spacing: 1px;}
h1, h2, h3, h4, p {margin-top: 1em;}
strong {letter-spacing: 1px;}

@media (max-width: 800px) {
    main {padding: $(header height) 2em 0;}
}

// Header //
@var line height = line-height: $(header height)
header {display: flex; position: fixed; width: 100%; height: $(header height); background: $(header color); z-index: 9;}
header div {margin: 0 auto; height: $(header height); display: flex;}
header span {transition: 0.5s;}
header span a[href] {display: block; padding: $(header height)/4; $(line height)/2; color: white;}
header span a.active {background: $(theme color | 10%);}
header span:hover {background: $(theme color | 12%);}

@media (max-width: 800px) {
    header ul {padding: 0;}
}

// Footer //
footer {width: 100%; height: $(header height); $(line height); background: $(header color); text-align: center;}

// Links //
a {text-decoration: none; cursor: pointer;}
a[href] {color: #fff; transition: 0.2s;}
main a[href] {text-decoration: underline;}
main a[href]:hover {text-decoration: none;}
[id] {scroll-margin-top: $(header height);}

// Tables //
table {margin: 2em auto; border-collapse: collapse;}
table th, table td {padding: 0.2em 0.5em; border: 1px solid #aaa8; text-align: center;}

// Lists //
.flatlist, .plainlist {margin: 0;}
.flatlist li {display: inline;}
.plainlist li {display: inline-block;}
.flatlist:not(.plainlist) li:not(:empty):not(:first-child)::before {content: ' • ';}

// Changelog //
h2[id] + p em {display: block; margin-top: -3.4em; margin-left: 4em;}

// Code blocks //
@var code color = color: hsl($[1], 90%, $[2|40%]);
pre {margin: 1em 0; border: 1px solid #fff; padding: 10px; background: #181818; text-align: left; white-space: pre-wrap; word-break: break-word;}
.code .comment {$(code color | 130 | 33%)}
.code .css-query {$(code color | 60)}
.code .css-selector {$(code color | 40)}
.code .css-property {$(code color | 180)}
.code .css-value {$(code color | 20)}
.code .html-tag {$(code color | 200)}
.code .html-attr-name {$(code color | 180)}
.code .html-attr-val {$(code color | 35)}
.code .nss-char {$(code color | 200)}
.code .nss-var {$(code color | 160)}
.code .nss-var-param {$(code color | 280 | 60%)}
.code .nss-var-arg {color: #fff;}
.code .nss-arg {$(code color | 280 | 60%)}
.code .nss-arg-default {$(code color | 330)}

// Hiding //
.hide {display: none !important;}

// Responsive //
@media (min-width: 801px) {
    .mobileonly {display: none;}
    ::-webkit-scrollbar {width: 1em;}
    ::-webkit-scrollbar-track {background: #112d;}
    ::-webkit-scrollbar-thumb {background: #eef; box-shadow: inset 0 0 6px #0114;}
}
@media (max-width: 800px) {
    .desktoponly {display: none;}
}

/* Copyright © Nixinova 2020 */
