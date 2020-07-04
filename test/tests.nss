// The following must work correctly in order for a new version to be published:

/**Vars*/}
@var var1 // void
@var var2 = inline content // void
@var var3 // void
    block content // void
@var var4 = content // void
@endvar // void

"$(var1)" /* void */}
"$(var2)" /* "inline content" */}
"$(var3)" /* "block content" */}

:root :not([attribute]) elem .class #id {$(var4) /*content*/}

}/**Comments*/}
/* regular comment */ /*regular block comment, $(@e)*/}
/* /static comment/ */ /*/static comment, $(@e)/*/}
/* [parsed comment] */ /*[parsed comment, $(@e)]*/}

}/**Math*/}
/*e*/ $(@e) /*2.718281828459045*/}
/*pi*/ $(@pi) /*3.14159265359*/}
/*abs*/ $(@abs | -2) /*2*/}
/*cos*/ $(@cos | 0 ) /*1*/}
/*acos*/ $(@acos | 0) /*1.5707963267948966*/}
/*asin*/ $(@asin | 0.5 ) /*0.5235987755982989*/}
/*atan*/ $(@atan | 10 ) /*1.4711276743037347*/}
/*clamp*/ $(@clamp | 64 | 0 | 10) /*10*/}
/*ceil*/ $(@ceil | 1.28 ) /*2*/}
/*floor*/ $(@floor | -1.2 ) /*-2*/}
/*degrees*/ $(@degrees | 100grad ) /*90*/}
/*gradians*/ $(@gradians | $(@pi)rad) /*200*/}
/*log*/ $(@log | 2 | 64 ) /*6*/}
/*root*/ $(@root | 2 | 64 ) /*8*/}
/*min*/ $(@min | 1 | -5 | 100 ) /*-5*/}
/*max*/ $(@max | 1 | -5 | 100 ) /*100*/}
/*mod*/ $(@mod | 10 | 6 ) /*4*/}
/*percent*/ $(@percent | 0.5) /*50%*/}

}/**Logic*/}
/*bitwise*/ $(@bitwise | ~2 & 3) /*1*/}
/*boolean*/ $(@boolean | true && false ) /*false*/}
/*if*/ $(@if | 1 == 1 | 1=1 | 1!=1) /*1=1*/}

}/**Text*/}
/*encode*/ $(@encode | [text]="true") /*%5Btext%5D%3D%22true%22*/}
/*length*/ $(@length | 123456) /*6*/}
/*replace*/ $(@replace | text | /te(.)t/ | !$1! ) /*!x!*/}

}/**Color*/}
/*color*/ $(@color | hash | rgb(128, 255, 0) ) /*#80ff00*/}
/*colourpart*/ $(@colourpart | red | #fff) /*255*/}