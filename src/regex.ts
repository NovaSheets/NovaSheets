const fs = require('fs');
const yaml = require('js-yaml');

const YAML_FILE = __dirname + '/regex.yaml';

const re = (regex: string, flags: string = ''): RegExp => RegExp(regex.replace(/( |^)#.+$|\s+/gm, ''), flags);

const yamlFile: string = fs.readFileSync(YAML_FILE, { encoding: 'utf8' });
const parsedYaml = yaml.load(yamlFile) as Record<string, string>;
const outputObj: Record<string, (flags?: string) => RegExp> = {};
for (const entry in parsedYaml) {
    const content = parsedYaml[entry].replace(/\{\{(.+?)\}\}/g, (_, name) => '(?:' + parsedYaml[name] + ')');
    outputObj[entry] = (flags = '') => re(content, flags);
}

export const regexes = outputObj;
