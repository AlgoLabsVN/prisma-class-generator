import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper'
import {
	GENERATOR_NAME,
	PrismaEntityGenerator,
} from './entity-generator/generator'
import { log } from './entity-generator/util'
import { handleGenerateError } from './entity-generator/error-handler'
import { PrismaCreateDtoGenerator } from './create-dto-generator/generator'
import { PrismaUpdateDtoGenerator } from './update-dto-generator/generator'

generatorHandler({
	onManifest: () => ({
		defaultOutput: '../src/_gen/prisma-class',
		prettyName: GENERATOR_NAME,
		requiresGenerators: ['prisma-client-js'],
	}),
	onGenerate: async (options: GeneratorOptions) => {
		try {
			await PrismaEntityGenerator.getInstance(options).run()
			await PrismaCreateDtoGenerator.getInstance(options).run()
			await PrismaUpdateDtoGenerator.getInstance(options).run()
		} catch (e) {
			handleGenerateError(e)
			return
		}
	},
})

log('Handler Registered.')
