import parse from './parse';
import compileNovaSheets from './compile';
import { CustomFunction, CustomFunctionBody, CustomFunctionOptions } from './common';

class NovaSheets {
    #functions: CustomFunction[];
    constructor() {
        this.#functions = [];
    }
    static parse(rawInput = '', novasheets: NovaSheets = new NovaSheets()): string {
        return parse(rawInput, novasheets);
    }
    static compile(input: string, output: string = '', novasheets: NovaSheets = new NovaSheets()): void {
        return compileNovaSheets(input, output, novasheets);
    }
    addFunction(name: string, body: CustomFunctionBody, options: CustomFunctionOptions = {}): NovaSheets {
        this.#functions.push({ name, body, options });
        return this;
    }
    getFunctions(): CustomFunction[] {
        return this.#functions;
    }
}

export = NovaSheets;
