export interface ParsingInput {
    rawInput: string,
    stylesheetContents: string[],
    sources: string[]
}

export interface NVSSFunction {
    name: string,
    body: Function,
    options?: Record<string, boolean>
}

export type ParsingReturn = string | void;

export type Constants = Record<string, boolean | number>;
