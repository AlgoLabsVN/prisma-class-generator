"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generator_helper_1 = require("@prisma/generator-helper");
const generator_1 = require("./entity-generator/generator");
const util_1 = require("./entity-generator/util");
const error_handler_1 = require("./entity-generator/error-handler");
const generator_2 = require("./create-dto-generator/generator");
const generator_3 = require("./update-dto-generator/generator");
(0, generator_helper_1.generatorHandler)({
    onManifest: () => ({
        defaultOutput: '../src/_gen/prisma-class',
        prettyName: generator_1.GENERATOR_NAME,
        requiresGenerators: ['prisma-client-js'],
    }),
    onGenerate: async (options) => {
        try {
            await generator_1.PrismaEntityGenerator.getInstance(options).run();
            await generator_2.PrismaCreateDtoGenerator.getInstance(options).run();
            await generator_3.PrismaUpdateDtoGenerator.getInstance(options).run();
        }
        catch (e) {
            (0, error_handler_1.handleGenerateError)(e);
            return;
        }
    },
});
(0, util_1.log)('Handler Registered.');
//# sourceMappingURL=index.js.map