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
    PARAMETER_NAME,
    PARAMETER_CONTENT,
    ARGUMENT_BLOCK,
    ARGUMENT_NAME,
    ARGUMENT_DEFAULT,
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

    protected collectChars(chars: RegExp, endAt: string[] = []): string {
        let out = '';
        while (this.cur && chars.test(this.cur)) {
            out += this.collectOne();
            if (endAt.filter(str => this.nextIs(str)).length) {
                break;
            }
        }
        return out;
    }

    protected collectBracketMatched(a: string, b: string, inner = false): string {
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
        if (inner)
            return out.slice(a.length, out.length - b.length);
        else
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
        else if (this.nextIs('@var ')) {
            this.discard('@var '.length);
            const firstLine = this.collectChars(/[^\n]/, ['@endvar', '@var']);
            const isSingleLine = firstLine.includes('=');
            let varName, content;
            if (isSingleLine) {
                varName = firstLine.replace(/=.+/, '');
                content = firstLine.replace(/.+?=/, '');
            }
            else {
                varName = firstLine;
                content = this.collectChars(/./s, ['@endvar', '@var']);
            }
            const tokens = [
                new Token(TokenType.VARIABLE_NAME, varName.trim()),
                new Token(TokenType.VARIABLE_CONTENTS, null, new MainLexer(content).tokenize()),
            ]
            return new Token(TokenType.DECLARATION_BLOCK, null, tokens);
        }
        // Variable substitution
        else if (this.peek(2) === '$(') {
            const inner = this.collectBracketMatched('$(', ')', true);
            const tokens = new SubstitutionLexer(inner).tokenize();
            return new Token(TokenType.SUBSTITUTION_BLOCK, null, tokens);
        }
        // Argument substitution
        else if (this.peek(2) == '$[') {
            const inner = this.collectBracketMatched('$[', ']', true);
            const [argName, defaultVal] = inner.split('|');
            const tokens = [
                new Token(TokenType.ARGUMENT_NAME, argName.trim()),
                new Token(TokenType.ARGUMENT_DEFAULT, null, new MainLexer(defaultVal ?? '').tokenize()),
            ];
            return new Token(TokenType.ARGUMENT_BLOCK, null, tokens);
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
        // Parameter name
        else if (this.readingArgName) {
            const argName = this.collectChars(/[^|=]/);
            this.readingArgName = false;
            return new Token(TokenType.PARAMETER_NAME, argName);
        }
        // Parameter value
        else {
            const argValue = this.collectChars(/[^|=]/);
            this.readingArgName = true;
            return new Token(TokenType.PARAMETER_CONTENT, null, new MainLexer(argValue).tokenize());
        }
    }
}

class Compiler {

    private variables: Record<string, Token> = {};

    constructor(private tokens: Token[] = []) { }

    private parseToken(token: Token): string {
        const { type, value, tokens: subtokens } = token;
        const getTokensOfType = (type: TokenType) => subtokens?.filter(token => token.type === type) ?? [];
        const getTokenOfType = (type: TokenType) => getTokensOfType(type)[0];
        switch (type) {
            case TokenType.SUBTOKENS: {
                return '';
            }
            case TokenType.EOF: {
                return '';
            }
            case TokenType.DECLARATION_BLOCK: {
                const varName = getTokenOfType(TokenType.VARIABLE_NAME).value;
                const varContent = getTokenOfType(TokenType.VARIABLE_CONTENTS);
                if (varName)
                    this.variables[varName] = varContent;
                return '';
            }
            case TokenType.SUBSTITUTION_BLOCK: {
                const varName = getTokenOfType(TokenType.VARIABLE_NAME)?.value;
                if (!varName || !this.variables[varName])
                    // TODO check when implementing KEEP_UNPARSED
                    return '';

                const argNames = getTokensOfType(TokenType.PARAMETER_NAME).map(token => token.value);
                const argContents = getTokensOfType(TokenType.PARAMETER_CONTENT);
                let content = new Compiler(this.variables[varName].tokens).compile();
                return content ?? '';
            }
            case TokenType.ARGUMENT_BLOCK: {
                const varName = getTokenOfType(TokenType.ARGUMENT_NAME).value;
                if (!varName)
                    // TODO check when implementing KEEP_UNPARSED
                    return '';

                const defaultContent = getTokenOfType(TokenType.ARGUMENT_DEFAULT);
                const replacements = this.variables[varName] ?? defaultContent;
                // NOTE $[null] is equivalent $[null| ] currently
                // TODO check when implementing KEEP_UNPARSED
                return new Compiler(replacements.tokens).compile();
            }
            default: {
                return value ?? '';
            }
        }
    }

    compile(): string {
        let out = '';
        for (const token of this.tokens) {
            out += this.parseToken(token);
        }
        return out;
    }
}

// Example
const code = '@var x = 1 $[1] $[2|sample] \n @var y \n multiline @endvar .foo {bar: 1+2; quix: $(x|1=true 1.3); $(ERROR)}';
const lexer = new MainLexer(code);
const tokens = lexer.tokenize();
const compiler = new Compiler(tokens);
console.log(compiler.compile());
