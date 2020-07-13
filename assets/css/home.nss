main {padding: 30px 0 0;}

#showcase h1 {margin: 0; font-size: 4em; letter-spacing: 4px;}
#showcase h2 {margin: 0; font-size: 3em; letter-spacing: 2px;}
#showcase p {margin: 0; font-size: 1.5em;}
#showcase #welcome-install {font-size: 1.5em;}

.section-container {display: flex; height: var(--main-height);}
.item-container {margin: auto;}
.main-container {display: flex; text-align: center;}
.item-container .item {text-align: center; align-self: center;}
.item-container .item:first-child {grid-area: desc;}
.item-container .item:last-child {grid-area: aside;}
.item-container .item pre {display: inline-block; padding: 0.5em 1em; white-space: inherit;}

@media (max-width: 800px) {
    #showcase h1 {font-size: 3.5em;}
    .item-container .item {padding: 1em;}
    .item-container .item pre {margin: auto; max-width: 80%;}
    .main-container .item {margin: auto; max-width: 90%;}
}
@media (min-width: 801px) {
    #showcase h2 {margin-bottom: 0.5em;}
    .two-container {display: grid; grid-template-areas: ". desc . aside ."; grid-template-columns: 2fr 6fr 1fr 5fr 2fr;}
    .item-container .item {margin: 1em 0;}
    .item-container .item p {padding-bottom: 1em;}
    .item-container:not(.two-container) {width: 50vw;}
}

@var start = 185
@var step = 20
@var before
content: ""; display: block; position: absolute; height: 100px; width: 100%; clip-path: polygon(0 0, 100% 0, 100% 40%, 0% 100%);
@endvar
#showcase > :not(:first-child) > .item-container {padding-top: 100px;}
$(@each | 1,2,3,4,5,6,7,8,9 | , | | 
    #showcase > :nth-child(($i-1)) {background: hsl($(start)+$i*$(step), 60%, 30%);}
    #showcase > :nth-child(($i+1))::before {$(before); background: hsl($(start)+$(step)+($i*$(step)), 60%, 30%);}
)