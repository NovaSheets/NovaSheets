import parseNovaSheets from './parse';
import compileNovaSheets from './compile';
import { NVSSFunction } from './types';

//@export
class NovaSheets {
    functions: NVSSFunction[]
    constructor() {
        this.functions = [];
    }
    static parse(rawInput = '', novasheets?: NovaSheets): string | void {
        return parseNovaSheets(rawInput, novasheets);
    }
    static compile(input: string, output: string = '', novasheets: NovaSheets = new NovaSheets()): void {
        return compileNovaSheets(input, output, novasheets);
    }
    addFunction(name: string, body: Function, options?: Record<string, boolean>): NovaSheets {
        this.functions.push({ name, body, options });
        return this;
    }
    getFunctions(): NVSSFunction[] {
        return this.functions;
    }
}
//@end
;
export = NovaSheets;
