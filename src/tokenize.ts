enum TokenType {
    SUBTOKENS,
    PASSTHROUGH,
    PUNCTUATION,
    OPERATION,
    NUMBER,
    DECLARATION_BLOCK,
    SUBSTITUTION_BLOCK,
    VARIABLE_NAME,
    ARGUMENT_NAME,
    ARGUMENT_CONTENT,
    EOF,
}

class Token {
    constructor(public type: TokenType, public value: string | number | null, public tokens?: Token[]) { }
}

abstract class Lexer {
    protected input: string;
    protected pos = 0;
    protected cur: string | null = null;

    constructor(input: string) {
        this.input = input;
        this.cur = input[0] || null;
    }

    abstract getToken(): Token;

    tokenize(): Token[] {
        const tokens: Token[] = [];
        let token;
        while ((token = this.getToken()).type !== TokenType.EOF) {
            tokens.push(token);
        }
        return tokens;
    }

    protected forward(): void {
        this.pos++;
        this.cur = this.input[this.pos] || null;
    }

    protected peek(amount: number, includeCur: boolean = false): string {
        let pos = this.pos;
        if (includeCur)
            pos--;
        return this.input.slice(pos, pos + amount);
    }

    protected nextIs(str: string): boolean {
        return this.peek(str.length) === str;
    }

    protected discard(amount: number): void {
        for (let i = 0; i < amount; i++)
            this.collectOne();
    }

    protected collectOne(): string | null {
        const res = this.cur;
        this.forward();
        return res;
    }

    protected collectChars(chars: RegExp, positive: boolean = true, endAt?: string): string {
        let out = '';
        while (this.cur && chars.test(this.cur) === positive) {
            out += this.collectOne();
            if (endAt && this.nextIs(endAt)) {
                break;
            }
        }
        return out;
    }

    protected collectBracketMatched(a: string, b: string): string {
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
}

class MainLexer extends Lexer {
    protected getTokenMain(): Token {
        const cur = this.cur;
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
        // End of variable declaration
        else if (this.nextIs('@endvar')) {
            this.discard('@endvar'.length);
            return new Token(TokenType.PASSTHROUGH, '');
        }
        // Variable declaration
        else if (this.nextIs('@var')) {
            return new Token(TokenType.DECLARATION_BLOCK, this.collectChars(/[\n]/, false, '@endvar'));
        }
        // Variable substitution
        else if (this.peek(2) === '$(') {
            const content = this.collectBracketMatched('$(', ')');
            const inner = content.replace(/^\$\(/, '').replace(/\)$/, '');
            const tokens = new SubstitutionLexer(inner).tokenize();
            return new Token(TokenType.SUBTOKENS, null, tokens);
        }
        // Group words
        else if (/\w/.test(cur)) {
            return new Token(TokenType.PASSTHROUGH, this.collectChars(/[\w]/));
        }
        // CSS/unparsed content
        return new Token(TokenType.PASSTHROUGH, this.collectOne());
    }

    getToken(): Token {
        return this.getTokenMain();
    }
}

class SubstitutionLexer extends MainLexer {

    private varNameRead = false;
    private readingArgName = true;

    getToken(): Token {
        const cur = this.cur;
        // End of block
        if (cur === null) {
            return new Token(TokenType.EOF, null);
        }
        // Punctuation
        else if (/[|=]/.test(cur)) {
            return new Token(TokenType.PUNCTUATION, this.collectOne());
        }
        // Variable name
        else if (!this.varNameRead) {
            const varName = this.collectChars(/[|]/, false);
            this.varNameRead = true;
            return new Token(TokenType.VARIABLE_NAME, varName);
        }
        // Argument name
        else if (this.readingArgName) {
            const argName = this.collectChars(/[|=]/, false);
            this.readingArgName = false;
            return new Token(TokenType.ARGUMENT_NAME, argName);
        }
        // Pass through
        return this.getTokenMain();
    }
}

class Compiler {

    private variables: Record<string, string> = {};

    constructor(private tokens: Token[] | undefined) { }

    private parseToken(token: Token): string {
        const { type, value, tokens: subtokens } = token;
        switch (type) {
            case TokenType.SUBTOKENS:
                return '';
            case TokenType.EOF:
                return '';
            case TokenType.VARIABLE_NAME:
                
            default:
                return value ? value + '' : '';
        }
    }

    compile(): string {
        let out = '';
        for (const token of tokens) {
            out += this.parseToken(token);
        }
        return out;
    }
}

// Example
const code = '@var x = 1 @endvar .foo {bar: 1+2; quix: $(@a|1=$(@pi));}';
const lexer = new MainLexer(code);
const tokens = lexer.tokenize();
console.log(tokens)
const compiler = new Compiler(tokens);
console.log(compiler.compile());
