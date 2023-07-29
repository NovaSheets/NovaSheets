enum TokenType {
    PASSTHROUGH,
    VARIABLE_DECLARATION,
    VARIABLE_SUBSTITUTION,
    PUNCTUATION,
    OPERATION,
    NUMBER,
    EOF,
}

class Token {
    constructor(public type: TokenType, public value?: string | number) { }
}

class Lexer {
    private input: string = '';
    private pos = 0;
    private cur: string | null = null;

    constructor(input: string) {
        this.input = input;
        this.cur = input[0] || null;
    }

    private forward(): void {
        this.pos++;
        this.cur = this.input[this.pos];
    }

    private collectNum(): string {
        let out = '';
        while (this.cur?.match(/\d/)) {
            out += this.cur;
            this.forward();
        }
        return out;
    }

    private collectCss(): string {
        let out = '';
        const nonSpecial = /[^$@\d]/;
        while (this.cur?.match(nonSpecial)) {
            out += this.cur;
            this.forward();
        }
        return out;
    }

    private getAToken(): Token {
        if (this.cur) {
            console.debug(this.cur)

            if (this.cur.match(/\d/)) {
                const token: Token = new Token(TokenType.NUMBER, this.collectNum());
                this.forward();
                return token;
            }

            switch (this.cur) {
                case '{': case '}': {
                    const token: Token = new Token(TokenType.PUNCTUATION, this.cur);
                    this.forward();
                    return token;
                }
                case '+': case '-': case '*': case '/': {
                    const token: Token = new Token(TokenType.OPERATION, this.cur);
                    this.forward();
                    return token;
                }
                default: {
                    const token: Token = new Token(TokenType.PASSTHROUGH, this.collectCss());
                    this.forward();
                    return token;
                }
            }
        }
        else
            return new Token(TokenType.EOF);
    }

    tokenize(): Token[] {
        const tokens: Token[] = [];
        let token;
        while ((token = this.getAToken()).type !== TokenType.EOF) {
            tokens.push(token);
        }
        return tokens;
    }
}

// Example
const code = '.foo {bar: 2+2;}'
const lexer = new Lexer(code);
const tokens = lexer.tokenize();
console.log(tokens);
