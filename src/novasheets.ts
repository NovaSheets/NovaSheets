import parse from './parse';
import compileNovaSheets from './compile';
import { CustomFunction, CustomFunctionBody, CustomFunctionOptions } from './common';

class NovaSheets {

    #functions: CustomFunction[];

    constructor() {
        this.#functions = [];
    }

    /**
     * Parse raw NovaSheets content.
     * @param rawInput Raw NovaSheets input.
     * @param novasheets An instance of the NovaSheets class, for registering custom functions.
     * @returns {string} Compiled CSS output.
     */
    static parse(rawInput = '', novasheets: NovaSheets = new NovaSheets()): string {
        return parse(rawInput, novasheets);
    }

    /**
     * Compile NovaSheets source files.
     * @async
     * @param source Source file or file glob.
     * @param outPath Output file or folder path.
     * @param novasheets An instance of the NovaSheets class, for registering custom functions.
     * @void
     */
    static async compile(source: string, outPath: string = '', novasheets: NovaSheets = new NovaSheets()): Promise<void> {
        return compileNovaSheets(source, outPath, novasheets);
    }

    /**
     * Registers a custom NovaSheets function for parsing.
     * @param name The name of the function (e.g., `@pi` for use as `$(@pi)`).
     * @param body The body content of the function. Signature: `(match: string, ...args: string[]): void`.
     * @param options Boolean options given to the function parser: `trim` (default `true`) and `allArgs` (default `false`).
     * @example addFunction('#is-true', (_match, val) => val === 'true') // NovaSheets: $(#is-true|true) // 'true'
     */
    addFunction(name: string, body: CustomFunctionBody, options: CustomFunctionOptions = {}): NovaSheets {
        this.#functions.push({ name, body, options });
        return this;
    }

    /**
     * Return a list of all registered custom functions.
     * @returns `[{name, body, options}, ...]`
     */
    getFunctions(): CustomFunction[] {
        return this.#functions;
    }

}

export = NovaSheets;
