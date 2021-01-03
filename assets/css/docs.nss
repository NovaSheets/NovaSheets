// Elements //
main {padding-left: 5%; padding-right: 5%; margin-bottom: 2em; display: grid;}
aside>:first-child {margin-left: -1em;}
  %< ul {margin: 0; padding: 0;}

$(@breakpoint | 800px |
    main #content {margin: 0 1em;}
    aside {border: 1px solid; margin: auto;  padding: 1em 3em; margin-top: 2em;}
|
    main {grid-template-areas: "sidebar content"; grid-gap: 3em; grid-template-columns: 2fr 8fr;}
      % #content {grid-area: content; margin-top: 2em;}
    aside {grid-area: sidebar; margin: 15vh 1em;}
)

// Code blocks //
:not(pre)>code {border: 1px solid #8888; padding: 2px;}

// Headings //
h1, h2, h3, h4 {font-weight: 500;}
h2 + p, h3 + p, h4 + p {margin-top: -1.5em; margin-left: 1em; margin-bottom: 0em;}

// Links //
a {scroll-margin-top: 70px;}
  %:not([href]) {font-weight: bold; text-decoration: none;}

// TOC //
#toc + ul {display: inline-block; padding: 1em 1em 1em 2em; border: 1px solid #ddd; margin-top: -1em;}
& @ 930px {display: grid; grid-auto-flow: column;}
