import { DMMF } from '@prisma/generator-helper'
import { ClassComponent } from './components/class.component'
import { DecoratorComponent } from './components/decorator.component'
import { FieldComponent } from './components/field.component'
import { PrismaUpdateDtoGeneratorConfig } from './generator'
import {
	arrayify,
	capitalizeFirst,
	uniquify,
	wrapArrowFunction,
	wrapQuote,
} from './util'

/** BigInt, Boolean, Bytes, DateTime, Decimal, Float, Int, JSON, String, $ModelName */
type DefaultPrismaFieldType =
	| 'BigInt'
	| 'Boolean'
	| 'Bytes'
	| 'DateTime'
	| 'Decimal'
	| 'Float'
	| 'Int'
	| 'Json'
	| 'String'

const primitiveMapType: Record<DefaultPrismaFieldType, string> = {
	Int: 'number',
	String: 'string',
	DateTime: 'Date',
	Boolean: 'boolean',
	Json: 'object',
	BigInt: 'BigInt',
	Float: 'number',
	Decimal: 'number',
	Bytes: 'Buffer',
} as const

const primitiveMapToClassValidator: Record<DefaultPrismaFieldType, string> = {
	Int: 'IsInt',
	String: 'IsString',
	DateTime: 'IsDate',
	Boolean: 'IsBoolean',
	Json: 'IsJSON',
	BigInt: 'IsNumber',
	Float: 'IsNumber',
	Decimal: 'IsNumber',
	Bytes: 'IsString',
} as const

export type PrimitiveMapTypeKeys = keyof typeof primitiveMapType
export type PrimitiveMapTypeValues =
	typeof primitiveMapType[PrimitiveMapTypeKeys]
export type PrimitiveMapClassValidator =
	typeof primitiveMapToClassValidator[PrimitiveMapTypeKeys]
export interface SwaggerDecoratorParams {
	isArray?: boolean
	type?: string
	enum?: string
	enumName?: string
	default?: any
}

export interface ConvertModelInput {
	model: DMMF.Model
	extractRelationFields?: boolean
	postfix?: string
	useGraphQL?: boolean
}

export class PrismaConvertor {
	static instance: PrismaConvertor
	private _config: PrismaUpdateDtoGeneratorConfig
	private _dmmf: DMMF.Document

	public get dmmf() {
		return this._dmmf
	}

	public set dmmf(value) {
		this._dmmf = value
	}

	public get config() {
		return this._config
	}

	public set config(value) {
		this._config = value
	}

	static getInstance() {
		if (PrismaConvertor.instance) {
			return PrismaConvertor.instance
		}
		PrismaConvertor.instance = new PrismaConvertor()
		return PrismaConvertor.instance
	}

	getPrimitiveMapTypeFromDMMF = (
		dmmfField: DMMF.Field,
	): PrimitiveMapTypeValues => {
		if (typeof dmmfField.type !== 'string') {
			return 'unknown'
		}
		return primitiveMapType[dmmfField.type]
	}

	getValidatorFromDMMF = (
		dmmfField: DMMF.Field,
	): PrimitiveMapClassValidator => {
		if (typeof dmmfField.type !== 'string') {
			return 'unknown'
		}
		return primitiveMapToClassValidator[dmmfField.type] || 'IsDefined'
	}

	extractTypeGraphQLDecoratorFromField = (
		dmmfField: DMMF.Field,
	): DecoratorComponent => {
		const options: SwaggerDecoratorParams = {}
		const decorator = new DecoratorComponent({
			name: 'Field',
			importFrom: '@nestjs/graphql',
		})
		if (dmmfField.isId) {
			decorator.params.push(`(type) => ID`)
			return decorator
		}
		const isJson = dmmfField.type === 'Json'

		if (isJson) {
			decorator.params.push(`(type) => GraphQLJSONObject`)
		}

		let type = this.getPrimitiveMapTypeFromDMMF(dmmfField)

		if (type && type !== 'any' && !isJson) {
			let grahQLType = capitalizeFirst(type)
			if (grahQLType === 'Number') {
				grahQLType = 'Int'
			}
			if (dmmfField.isList) {
				grahQLType = `[${grahQLType}]`
			}
			decorator.params.push(`(type) => ${grahQLType}`)
		}

		if (dmmfField.relationName) {
			let type = dmmfField.type
			if (dmmfField.isList) {
				type = `[${type}]`
			}
			decorator.params.push(`(type) => ${type}`)
		}

		if (dmmfField.kind === 'enum') {
			let type = dmmfField.type
			if (dmmfField.isList) {
				type = arrayify(type)
			}
			decorator.params.push(`(type) => ${type}`)
		}

		if (dmmfField.isRequired === false) {
			decorator.params.push(`{nullable : true}`)
		}

		return decorator
	}

	extractSwaggerDecoratorFromField = (
		dmmfField: DMMF.Field,
	): DecoratorComponent => {
		const options: SwaggerDecoratorParams = {}
		const name =
			dmmfField.isRequired === true
				? 'ApiProperty'
				: 'ApiPropertyOptional'
		const decorator = new DecoratorComponent({
			name: name,
			importFrom: '@nestjs/swagger',
		})

		if (dmmfField.isList) {
			options.isArray = true
		}
		if (dmmfField.default) {
			if (
				dmmfField.type == 'Int' ||
				dmmfField.type == 'Float' ||
				dmmfField.type == 'Decimal' ||
				dmmfField.type == 'BigInt'
			) {
				if (!isNaN(+dmmfField.default)) {
					options.default = dmmfField.default
				}
			} else if (dmmfField.type == 'String') {
				options.default = `'${dmmfField.default}'`
			} else if (dmmfField.type == 'DateTime') {
				if (!isNaN(+dmmfField.default)) {
					options.default = dmmfField.default
				}
			}
		}
		let type = this.getPrimitiveMapTypeFromDMMF(dmmfField)
		if (type && type !== 'any') {
			options.type = capitalizeFirst(type)
			decorator.params.push(options)
			return decorator
		}
		type = dmmfField.type.toString()
		if (dmmfField.relationName) {
			options.type = wrapArrowFunction(dmmfField)
			decorator.params.push(options)
			return decorator
		}

		if (dmmfField.kind === 'enum') {
			options.enum = dmmfField.type
			options.enumName = wrapQuote(dmmfField)
		}

		decorator.params.push(options)
		return decorator
	}

	extractClassValidatorDecoratorFromField = (
		dmmfField: DMMF.Field,
	): DecoratorComponent[] => {
		let name = this.getValidatorFromDMMF(dmmfField)

		if (dmmfField.kind === 'enum') {
			name = 'IsString'
		}
		let result = []

		const optionalDecorator = new DecoratorComponent({
			name: 'IsOptional',
			importFrom: 'class-validator',
		})
		result.push(optionalDecorator)

		const decorator = new DecoratorComponent({
			name: name,
			importFrom: 'class-validator',
		})

		if (dmmfField.kind === 'enum') {
			const enumDecorator = new DecoratorComponent({
				name: 'IsEnum',
				importFrom: 'class-validator',
			})
			enumDecorator.params.push(dmmfField.type)
			result.push(enumDecorator)
		}

		result.push(decorator)
		return result
	}
	getClass = (input: ConvertModelInput): ClassComponent => {
		/** options */
		const options = Object.assign(
			{
				extractRelationFields: null,
				useGraphQL: false,
			},
			input,
		)
		const {
			model,
			extractRelationFields = null,
			postfix,
			useGraphQL,
		} = options

		/** set class name */
		let className = 'Update' + model.name + 'Dto'
		if (postfix) {
			className += postfix
		}
		const classComponent = new ClassComponent({ name: className })

		const typesTypes = uniquify(
			model.fields
				.filter(
					(field) =>
						field.kind == 'object' &&
						model.name !== field.type &&
						!field.relationName,
				)
				.map((v) => v.type),
		)

		const enums = model.fields.filter((field) => field.kind === 'enum')

		classComponent.fields = model.fields
			.filter((field) => {
				return !field.relationName
			})
			.filter((field) => {
				return field.name != 'id'
			})
			.filter((field) => {
				return field.name != 'createdAt'
			})
			.filter((field) => {
				return field.name != 'updatedAt'
			})
			.map((field) => this.convertField(field))
		classComponent.relationTypes = []

		classComponent.enumTypes =
			extractRelationFields === true
				? []
				: enums.map((field) => field.type.toString())

		classComponent.types = typesTypes

		if (useGraphQL) {
			const deco = new DecoratorComponent({
				name: 'ObjectType',
				importFrom: '@nestjs/graphql',
			})
			deco.params.push(
				JSON.stringify({
					description:
						'generated by [prisma-class-generator](https://github.com/kimjbstar/prisma-class-generator)',
				}),
			)
			classComponent.decorators.push(deco)

			if (classComponent.enumTypes.length > 0) {
				const extra = classComponent.enumTypes
					.map(
						(enumType) => `registerEnumType(${enumType}, {
	name: "${enumType}"
})`,
					)
					.join('\r\n\r\n')

				classComponent.extra = extra
			}
		}

		return classComponent
	}

	/**
	 * one prisma model could generate multiple classes!
	 *
	 * CASE 1: if you want separate model to normal class and relation class
	 */
	getClasses = (): ClassComponent[] => {
		const models = this.dmmf.datamodel.models

		/** separateRelationFields */
		if (this.config.separateRelationFields === true) {
			return [
				...models.map((model) =>
					this.getClass({
						model,
						extractRelationFields: true,
						postfix: 'Relations',
						useGraphQL: this.config.useGraphQL,
					}),
				),
				...models.map((model) =>
					this.getClass({
						model,
						extractRelationFields: false,
						useGraphQL: this.config.useGraphQL,
					}),
				),
				// mongodb Types support
				...this.dmmf.datamodel.types.map((model) =>
					this.getClass({
						model,
						extractRelationFields: true,
						useGraphQL: this.config.useGraphQL,
					}),
				),
			]
		}

		return [
			...models.map((model) =>
				this.getClass({ model, useGraphQL: this.config.useGraphQL }),
			),
			// mongodb Types support
			...this.dmmf.datamodel.types.map((model) =>
				this.getClass({
					model,
					useGraphQL: this.config.useGraphQL,
				}),
			),
		]
	}

	convertField = (dmmfField: DMMF.Field): FieldComponent => {
		const field = new FieldComponent({
			name: dmmfField.name,
			useUndefinedDefault: this._config.useUndefinedDefault,
		})
		let type = this.getPrimitiveMapTypeFromDMMF(dmmfField)

		// if (this.config.useSwagger) {
		// 	const decorator = this.extractSwaggerDecoratorFromField(dmmfField)
		// 	field.decorators.push(decorator)
		// }
		if (this.config.useClassValidator) {
			const decorator =
				this.extractClassValidatorDecoratorFromField(dmmfField)
			field.decorators.push(...decorator)
		}

		if (this.config.useGraphQL) {
			const decorator =
				this.extractTypeGraphQLDecoratorFromField(dmmfField)
			if (decorator) {
				field.decorators.push(decorator)
			}
		}

		field.nullable = true

		if (this.config.useNonNullableAssertions) {
			field.nonNullableAssertion = true
		}

		if (this.config.preserveDefaultNullable) {
			field.preserveDefaultNullable = true
		}

		if (dmmfField.default) {
			if (typeof dmmfField.default !== 'object') {
				field.default = dmmfField.default?.toString()
				if (dmmfField.kind === 'enum') {
					field.default = `${dmmfField.type}.${dmmfField.default}`
				} else if (dmmfField.type === 'BigInt') {
					field.default = `BigInt(${field.default})`
				} else if (dmmfField.type === 'String') {
					field.default = `'${field.default}'`
				}
			} else if (Array.isArray(dmmfField.default)) {
				if (dmmfField.type === 'String') {
					field.default = `[${dmmfField.default
						.map((d) => `'${d}'`)
						.toString()}]`
				} else {
					field.default = `[${dmmfField.default.toString()}]`
				}
			}
		}

		if (type) {
			field.type = type
		} else {
			field.type = dmmfField.type
		}

		if (dmmfField.isList) {
			field.type = arrayify(field.type)
		}

		return field
	}
}
