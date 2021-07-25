// Internal //

export interface CustomFunction {
    name: string,
    body: CustomFunctionBody,
    options?: CustomFunctionOptions,
}

export interface CustomFunctionBody {
    (match: string, ...args: string[]): string | number;
}

export interface CustomFunctionOptions {
    trim?: boolean,
    allArgs?: boolean,
}

export type Constants = Record<string, boolean | number>;
