import { Dictionary } from '@prisma/internals'
import { PrismaUpdateDtoGeneratorOptions } from './generator'
import { log } from './util'

export class GeneratorFormatNotValidError extends Error {
	config: Dictionary<string>
	constructor(config: any) {
		super()
		this.config = config
	}
}

export class GeneratorPathNotExists extends Error {}

export const handleGenerateError = (e: Error) => {
	if (e instanceof GeneratorFormatNotValidError) {
		const options = Object.keys(PrismaUpdateDtoGeneratorOptions).map(
			(key) => {
				const value = PrismaUpdateDtoGeneratorOptions[key]
				return `\t${key} = (${value.defaultValue}) <- [${value.desc}]`
			},
		)
		log(
			[
				'\nUsage : ',
				'generator prismaUpdateDtoGenerator {',
				'\tprovider = "prisma-class-generator"',
				'\toutput = (string)',
				...options,
				'}',
			].join('\n'),
		)
		log(`Your Input : ${JSON.stringify(e.config)}`)
		return
	}
	if (e instanceof GeneratorPathNotExists) {
		log('path not valid in generator')
		return
	}
	console.log('unexpected error occured')
	console.log(e)
}
