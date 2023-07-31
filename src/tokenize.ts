enum TokenType {
    PASSTHROUGH,
    DECLARATION,
    SUBSTITUTION,
    PUNCTUATION,
    OPERATION,
    NUMBER,
    EOF,
}

class Token {
    constructor(public type: TokenType, public value: string | number | null) { }
}

class Lexer {
    private input: string;
    private pos = 0;
    private cur: string | null = null;

    constructor(input: string) {
        this.input = input;
        this.cur = input[0] ?? null;
    }

    private forward(): void {
        this.pos++;
        this.cur = this.input[this.pos] ?? null;
    }

    private peek(amount: number): string {
        return this.input.slice(this.pos, this.pos + amount);
    }

    private collectOne(): string | null {
        const res = this.cur;
        this.forward();
        return res;
    }

    private collectChars(chars: RegExp, positive: boolean): string {
        let out = '';
        while (this.cur && chars.test(this.cur) === positive) {
            out += this.collectOne();
        }
        return out;
    }

    private getToken(): Token {
        const cur = this.cur;
        // End of file
        if (cur === null) {
            return new Token(TokenType.EOF, null);
        }
        // Numbers
        else if (/\d/.test(cur)) {
            return new Token(TokenType.NUMBER, this.collectChars(/[\d]/, true));
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
        else if (this.peek(4) === '@var') {
            return new Token(TokenType.DECLARATION, this.collectChars(/[\n]/, false));
        }
        // Variable substitution
        else if (this.peek(2) === '$(') {
            return new Token(TokenType.PASSTHROUGH, this.collectChars(/[)]/, false) + this.collectOne());
        }
        // CSS/unparsed content
        else {
            return new Token(TokenType.PASSTHROUGH, this.collectChars(/[$@\d]/, false));
        }

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

const code = '@var x = 1 @endvar\n .foo {bar: 1+2; quix: $(@a);}'
const lexer = new Lexer(code);
const tokens = lexer.tokenize();
console.log(tokens);
