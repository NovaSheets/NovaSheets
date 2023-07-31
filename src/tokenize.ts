enum TokenType {
    SUBTOKENS,
    PASSTHROUGH,
    DECLARATION,
    SUBSTITUTION,
    PUNCTUATION,
    OPERATION,
    NUMBER,
    EOF,
}

class Token {
    constructor(public type: TokenType, public value: string | number | null, public tokens?: Token[]) { }
}

class Lexer {
    private input: string;
    private pos = 0;
    private cur: string | null = null;

    constructor(input: string) {
        this.input = input;
        this.cur = input[0] || null;
    }

    private forward(): void {
        this.pos++;
        this.cur = this.input[this.pos] || null;
    }

    private peek(amount: number, includeCur: boolean = false): string {
        let pos = this.pos;
        if (includeCur)
            pos--;
        return this.input.slice(pos, pos + amount);
    }

    private collectOne(): string | null {
        const res = this.cur;
        this.forward();
        return res;
    }

    private collectChars(chars: RegExp, positive: boolean = true): string {
        let out = '';
        while (this.cur && chars.test(this.cur) === positive) {
            out += this.collectOne();
        }
        return out;
    }

    private collectBracketMatched(a: string, b: string): string {
        let level = 0;
        let out = '';
        let cur;
        while ((cur = this.collectOne())) {
            out += cur;
            if (this.peek(a.length, true) === a) {
                level++;
            }
            else if (this.peek(b.length, true) === b) {
                level--;
                if (level === 0)
                    break;
            }
        }
        return out;
    }

    private getToken(): Token {
        const cur = this.cur;
        console.debug(cur);
        // End of file
        if (cur === null) {
            return new Token(TokenType.EOF, null);
        }
        // Numbers
        else if (/\d/.test(cur)) {
            return new Token(TokenType.NUMBER, this.collectChars(/[\d]/));
        }
        // Punctuation
        else if (/[{}]/.test(cur)) {
            return new Token(TokenType.PUNCTUATION, this.collectOne());
        }
        // Math operations
        else if (/[-+*/]/.test(cur)) {
            return new Token(TokenType.OPERATION, this.collectOne());
        }
        // Variable declaration
        else if (/@/.test(cur) && this.peek(4) === '@var') {
            return new Token(TokenType.DECLARATION, this.collectChars(/[\n]/, false));
        }
        // Variable substitution
        else if (this.peek(2) === '$(') {
            const content = this.collectBracketMatched('$(', ')');
            const inner = content.replace(/^\$\(/, '').replace(/\)$/, '');
            if (inner.includes('$(')) {
                const subTokens = new Lexer(inner).tokenize();
                return new Token(TokenType.SUBTOKENS, null, subTokens);
            }
            else {
                return new Token(TokenType.PASSTHROUGH, content);
            }
        }
        // Group words
        else if (/\w/.test(cur)) {
            return new Token(TokenType.PASSTHROUGH, this.collectChars(/[\w]/));
        }
        // CSS/unparsed content
        return new Token(TokenType.PASSTHROUGH, this.collectOne());
        return new Token(TokenType.PASSTHROUGH, this.collectChars(/[$@\d]/, false));

    }

    tokenize(): Token[] {
        const tokens: Token[] = [];
        let token;
        while ((token = this.getToken()).type !== TokenType.EOF) {
            tokens.push(token);
        }
        return tokens;
    }
}

// Example
const code = '@var x = 1 @endvar\n .foo {bar: 1+2; quix: $(@a|1=$(@pi));}';
const lexer = new Lexer(code);
const tokens = lexer.tokenize();
for (const token of tokens) console.log(token);
