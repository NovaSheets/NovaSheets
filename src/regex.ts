import fs from 'fs';
const yaml = require('js-yaml');

const YAML_FILE = __dirname + '/../data/regexes.yaml';

const re = (regex: string, flags: string = ''): RegExp => RegExp(regex.replace(/( |^)#.+$|\s+?/gm, ''), flags);
const parseVars = (val: string): string => {
    return val.replace(/\{\{(.+?)\}\}/g, (_, name) => {
        const newContent = parsedYaml[name];
        if (!newContent) throw new Error(`YAML variable '${name}' is undefined`);
        return '(?:' + parseVars(newContent) + ')';
    });
}

const yamlFile: string = fs.readFileSync(YAML_FILE, { encoding: 'utf8' });
const parsedYaml = yaml.load(yamlFile) as Record<string, string>;
const outputObj: Record<string, (flags?: string) => RegExp> = {};
for (const entry in parsedYaml) {
    const content = parseVars(parsedYaml[entry]);
    outputObj[entry] = (flags = '') => re(content, flags);
}

export const regexes = outputObj;
