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

    private collectCur(): string {
        const cur = this.cur;
        this.forward();
        return cur ?? '';
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
        switch (this.cur) {
            case null:
                return new Token(TokenType.EOF);
            case String(/\d/.test(this.cur!):
                return new Token(TokenType.NUMBER, this.collectNum());
            case '{': case '}':
                return new Token(TokenType.PUNCTUATION, this.collectCur());
            case '+': case '-': case '*': case '/':
               return new Token(TokenType.OPERATION, this.collectCur());
            default:
                return new Token(TokenType.PASSTHROUGH, this.collectCss());
        }
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