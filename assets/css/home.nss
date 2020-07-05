@const MAX_MATH_RECURSION 20

main {padding: 30px 0 0;}

.section-container {display: flex; height: var(--main-height);}
.item-container {margin: auto; display: grid; grid-template-areas: ". desc . aside ."; grid-template-columns: 2fr 6fr 1fr 5fr 2fr;}
.main-container {display: flex;}
.item-container .item {align-self: center;}
.item-container .item:first-child {grid-area: desc;}
.item-container .item:last-child {grid-area: aside;}
.item-container .item pre {white-space: inherit;}

@var start = 185
@var step = 20
@var before
content: ""; display: block; position: absolute; height: 100px; width: 100%; clip-path: polygon(0 0, 100% 0, 100% 40%, 0% 100%);
@endvar
$(@each | 1,2,3,4,5,6,7,8,9 | , | 
    #showcase > :nth-child(($i+1)) > .item-container {padding-top: 100px;}
    #showcase > :nth-child(($i-1)) {background: hsl($(start)+$i*$(step), 60%, 30%);}
    #showcase > :nth-child(($i+1))::before {$(before); background: hsl($(start)+$(step)+$i*$(step), 60%, 30%);}
)

#showcase h1 {margin: 0; text-align: center; font-size: 4em; letter-spacing: 4px;}
#showcase h2 {margin: 0; font-size: 3em; letter-spacing: 2px;}
#showcase p {margin: 0; font-size: 1.5em;}