main {padding-left: 5%; padding-right: 5%; margin-bottom: 2em; display: grid; grid-template-areas: "sidebar content"; grid-gap: 3em; grid-template-columns: 2fr 8fr;}

main>div {margin-top: 2em;}

aside {margin: 15vh 1em;}
aside>:first-child {margin-left: -1em;}
aside ul {margin: 0; padding :0;}

pre {white-space: pre-wrap;}
:not(pre)>code {border: 1px solid #8888; padding: 2px;}

h2 + p, h3 + p, h4 + p {margin-top: -1em; margin-left: 1em; margin-bottom: -1em;}

#toc + ul {display: inline-block; padding: 1em 1em 1em 2em; border: 1px solid #ddd; margin-top: -1em;}

a {scroll-margin-top: 70px;}
a:not([href]) {font-weight: bold; text-decoration: none;}