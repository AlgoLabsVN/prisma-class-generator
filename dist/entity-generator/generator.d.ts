import { GeneratorOptions } from '@prisma/generator-helper';
import * as prettier from 'prettier';
export declare const GENERATOR_NAME = "Prisma Class Generator";
export declare const PrismaEntityGeneratorOptions: {
    readonly makeIndexFile: {
        readonly desc: "make index file";
        readonly defaultValue: false;
    };
    readonly dryRun: {
        readonly desc: "dry run";
        readonly defaultValue: true;
    };
    readonly separateRelationFields: {
        readonly desc: "separate relation fields";
        readonly defaultValue: false;
    };
    readonly useSwagger: {
        readonly desc: "use swagger decorator";
        readonly defaultValue: true;
    };
    readonly useClassValidator: {
        readonly desc: "use class-validator decorator";
        readonly defaultValue: false;
    };
    readonly useGraphQL: {
        readonly desc: "use graphql";
        readonly defaultValue: false;
    };
    readonly useUndefinedDefault: {
        readonly desc: "use undefined default";
        readonly defaultValue: false;
    };
    readonly clientImportPath: {
        readonly desc: "set prisma import path instead @prisma/client";
        readonly defaultValue: any;
    };
    readonly useNonNullableAssertions: {
        readonly desc: "applies non-nullable assertions (!) to class properties";
        readonly defaultValue: false;
    };
    readonly preserveDefaultNullable: {
        readonly defaultValue: false;
        readonly desc: "preserve default nullable behavior";
    };
};
export type PrismaEntityGeneratorOptionsKeys = keyof typeof PrismaEntityGeneratorOptions;
export type PrismaEntityGeneratorConfig = Partial<Record<PrismaEntityGeneratorOptionsKeys, any>>;
export declare class PrismaEntityGenerator {
    static instance: PrismaEntityGenerator;
    _options: GeneratorOptions;
    _prettierOptions: prettier.Options;
    rootPath: string;
    clientPath: string;
    constructor(options?: GeneratorOptions);
    get options(): GeneratorOptions;
    set options(value: GeneratorOptions);
    get prettierOptions(): prettier.Options;
    set prettierOptions(value: prettier.Options);
    static getInstance(options?: GeneratorOptions): PrismaEntityGenerator;
    getClientImportPath(): string;
    setPrismaClientPath(): void;
    run: () => Promise<void>;
    getConfig: () => PrismaEntityGeneratorConfig;
}
