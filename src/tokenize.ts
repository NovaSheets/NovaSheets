enum TokenType {
    SUBTOKENS,
    PASSTHROUGH,
    PUNCTUATION,
    OPERATION,
    NUMBER,
    DECLARATION_BLOCK,
    SUBSTITUTION_BLOCK,
    VARIABLE_NAME,
    VARIABLE_CONTENTS,
    ARGUMENT_NAME,
    ARGUMENT_CONTENT,
    EOF,
}

class Token {
    constructor(
        public type: TokenType,
        public value: string | null,
        public tokens?: Token[],
    ) { }
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
        tokens.push(new Token(TokenType.EOF, null));
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

    protected collectChars(chars: RegExp, endAt?: string): string {
        let out = '';
        while (this.cur && chars.test(this.cur)) {
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
            const declContent = this.collectChars(/[^\n]/, '@endvar');
            const [varDefnStr, ...varContentStrs] = declContent.split('=');
            const varName = varDefnStr.replace('@var ', '').trim();
            const varContent = varContentStrs.join('=');
            const tokens = [
                { type: TokenType.VARIABLE_NAME, value: varName },
                { type: TokenType.VARIABLE_CONTENTS, value: varContent },
            ]
            return new Token(TokenType.DECLARATION_BLOCK, null, tokens);
        }
        // Variable substitution
        else if (this.peek(2) === '$(') {
            const content = this.collectBracketMatched('$(', ')');
            const inner = content.replace(/^\$\(/, '').replace(/\)$/, '');
            const tokens = new SubstitutionLexer(inner).tokenize();
            return new Token(TokenType.SUBSTITUTION_BLOCK, null, tokens);
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
            const varName = this.collectChars(/[^|]/);
            this.varNameRead = true;
            return new Token(TokenType.VARIABLE_NAME, varName);
        }
        // Argument name
        else if (this.readingArgName) {
            const argName = this.collectChars(/[^|=]/);
            this.readingArgName = false;
            return new Token(TokenType.ARGUMENT_NAME, argName);
        }
        // Argument value
        else {
            // Pass through
            const argValue = this.collectChars(/[^|=]/);
            this.readingArgName = true;
            return new Token(TokenType.ARGUMENT_CONTENT, null, new MainLexer(argValue).tokenize());
        }
    }
}

class Compiler {

    private variables: Record<string, string> = {};

    constructor(private tokens: Token[] | undefined) { }

    private parseToken(token: Token): string {
        const { type, value, tokens: subtokens } = token;
        const getTokensOfType = (type: TokenType) => subtokens!.filter(token => token.type === type);
        const getTokenOfType = (type: TokenType) => getTokensOfType(type)[0];
        switch (type) {
            case TokenType.SUBTOKENS: {
                return '';
            }
            case TokenType.EOF: {
                return '';
            }
            case TokenType.DECLARATION_BLOCK: {
                const varName = getTokenOfType(TokenType.VARIABLE_NAME).value!;
                const varContent = getTokenOfType(TokenType.VARIABLE_CONTENTS).value!;
                this.variables[varName] = varContent;
                return '';
            }
            case TokenType.SUBSTITUTION_BLOCK: {
                const varName = getTokenOfType(TokenType.VARIABLE_NAME).value!;
                const argNames = getTokensOfType(TokenType.ARGUMENT_NAME).map(token => token.value!);
                const argValues = getTokensOfType(TokenType.ARGUMENT_CONTENT);
                let content = this.variables[varName];
                if (!content)
                    return '';
                // Parse given variables
                for (let i in argNames) {
                    const replacer = '$[' + argNames[i] + ']';
                    const replacement = argValues[i].tokens!.map(token => this.parseToken(token)).join('');
                    while (content.includes(replacer))
                        content = content.replace(replacer, replacement);
                }
                return content;
            }
            default: {
                return value ?? '';
            }
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
const code = '@var x = 1 $[1] $[2|sample] @endvar .foo {bar: 1+2; quix: $(x|1=true 1.3);}';
const lexer = new MainLexer(code);
const tokens = lexer.tokenize();
console.log(tokens)
const compiler = new Compiler(tokens);
console.log(compiler.compile());
