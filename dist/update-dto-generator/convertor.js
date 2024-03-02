"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaConvertor = void 0;
const class_component_1 = require("./components/class.component");
const decorator_component_1 = require("./components/decorator.component");
const field_component_1 = require("./components/field.component");
const util_1 = require("./util");
const primitiveMapType = {
    Int: 'number',
    String: 'string',
    DateTime: 'Date',
    Boolean: 'boolean',
    Json: 'object',
    BigInt: 'BigInt',
    Float: 'number',
    Decimal: 'number',
    Bytes: 'Buffer',
};
const primitiveMapToClassValidator = {
    Int: 'IsInt',
    String: 'IsString',
    DateTime: 'IsDate',
    Boolean: 'IsBoolean',
    Json: 'IsJSON',
    BigInt: 'IsNumber',
    Float: 'IsNumber',
    Decimal: 'IsNumber',
    Bytes: 'IsString',
};
class PrismaConvertor {
    constructor() {
        this.getPrimitiveMapTypeFromDMMF = (dmmfField) => {
            if (typeof dmmfField.type !== 'string') {
                return 'unknown';
            }
            return primitiveMapType[dmmfField.type];
        };
        this.getValidatorFromDMMF = (dmmfField) => {
            if (typeof dmmfField.type !== 'string') {
                return 'unknown';
            }
            return primitiveMapToClassValidator[dmmfField.type] || 'IsDefined';
        };
        this.extractTypeGraphQLDecoratorFromField = (dmmfField) => {
            const options = {};
            const decorator = new decorator_component_1.DecoratorComponent({
                name: 'Field',
                importFrom: '@nestjs/graphql',
            });
            if (dmmfField.isId) {
                decorator.params.push(`(type) => ID`);
                return decorator;
            }
            const isJson = dmmfField.type === 'Json';
            if (isJson) {
                decorator.params.push(`(type) => GraphQLJSONObject`);
            }
            let type = this.getPrimitiveMapTypeFromDMMF(dmmfField);
            if (type && type !== 'any' && !isJson) {
                let grahQLType = (0, util_1.capitalizeFirst)(type);
                if (grahQLType === 'Number') {
                    grahQLType = 'Int';
                }
                if (dmmfField.isList) {
                    grahQLType = `[${grahQLType}]`;
                }
                decorator.params.push(`(type) => ${grahQLType}`);
            }
            if (dmmfField.relationName) {
                let type = dmmfField.type;
                if (dmmfField.isList) {
                    type = `[${type}]`;
                }
                decorator.params.push(`(type) => ${type}`);
            }
            if (dmmfField.kind === 'enum') {
                let type = dmmfField.type;
                if (dmmfField.isList) {
                    type = (0, util_1.arrayify)(type);
                }
                decorator.params.push(`(type) => ${type}`);
            }
            if (dmmfField.isRequired === false) {
                decorator.params.push(`{nullable : true}`);
            }
            return decorator;
        };
        this.extractSwaggerDecoratorFromField = (dmmfField) => {
            const options = {};
            const name = dmmfField.isRequired === true
                ? 'ApiProperty'
                : 'ApiPropertyOptional';
            const decorator = new decorator_component_1.DecoratorComponent({
                name: name,
                importFrom: '@nestjs/swagger',
            });
            if (dmmfField.isList) {
                options.isArray = true;
            }
            if (dmmfField.default) {
                if (dmmfField.type == 'Int' ||
                    dmmfField.type == 'Float' ||
                    dmmfField.type == 'Decimal' ||
                    dmmfField.type == 'BigInt') {
                    if (!isNaN(+dmmfField.default)) {
                        options.default = dmmfField.default;
                    }
                }
                else if (dmmfField.type == 'String') {
                    options.default = `'${dmmfField.default}'`;
                }
                else if (dmmfField.type == 'DateTime') {
                    if (!isNaN(+dmmfField.default)) {
                        options.default = dmmfField.default;
                    }
                }
            }
            let type = this.getPrimitiveMapTypeFromDMMF(dmmfField);
            if (type && type !== 'any') {
                options.type = (0, util_1.capitalizeFirst)(type);
                decorator.params.push(options);
                return decorator;
            }
            type = dmmfField.type.toString();
            if (dmmfField.relationName) {
                options.type = (0, util_1.wrapArrowFunction)(dmmfField);
                decorator.params.push(options);
                return decorator;
            }
            if (dmmfField.kind === 'enum') {
                options.enum = dmmfField.type;
                options.enumName = (0, util_1.wrapQuote)(dmmfField);
            }
            decorator.params.push(options);
            return decorator;
        };
        this.extractClassValidatorDecoratorFromField = (dmmfField) => {
            let name = this.getValidatorFromDMMF(dmmfField);
            if (dmmfField.kind === 'enum') {
                name = 'IsString';
            }
            let result = [];
            const optionalDecorator = new decorator_component_1.DecoratorComponent({
                name: 'IsOptional',
                importFrom: 'class-validator',
            });
            result.push(optionalDecorator);
            const decorator = new decorator_component_1.DecoratorComponent({
                name: name,
                importFrom: 'class-validator',
            });
            if (dmmfField.kind === 'enum') {
                const enumDecorator = new decorator_component_1.DecoratorComponent({
                    name: 'IsEnum',
                    importFrom: 'class-validator',
                });
                enumDecorator.params.push(dmmfField.type);
                result.push(enumDecorator);
            }
            result.push(decorator);
            return result;
        };
        this.getClass = (input) => {
            const options = Object.assign({
                extractRelationFields: null,
                useGraphQL: false,
            }, input);
            const { model, extractRelationFields = null, postfix, useGraphQL, } = options;
            let className = 'Update' + model.name + 'Dto';
            if (postfix) {
                className += postfix;
            }
            const classComponent = new class_component_1.ClassComponent({ name: className });
            const typesTypes = (0, util_1.uniquify)(model.fields
                .filter((field) => field.kind == 'object' &&
                model.name !== field.type &&
                !field.relationName)
                .map((v) => v.type));
            const enums = model.fields.filter((field) => field.kind === 'enum');
            classComponent.fields = model.fields
                .filter((field) => {
                return !field.relationName;
            })
                .filter((field) => {
                return field.name != 'id';
            })
                .filter((field) => {
                return field.name != 'createdAt';
            })
                .filter((field) => {
                return field.name != 'updatedAt';
            })
                .map((field) => this.convertField(field));
            classComponent.relationTypes = [];
            classComponent.enumTypes =
                extractRelationFields === true
                    ? []
                    : enums.map((field) => field.type.toString());
            classComponent.types = typesTypes;
            if (useGraphQL) {
                const deco = new decorator_component_1.DecoratorComponent({
                    name: 'ObjectType',
                    importFrom: '@nestjs/graphql',
                });
                deco.params.push(JSON.stringify({
                    description: 'generated by [prisma-class-generator](https://github.com/kimjbstar/prisma-class-generator)',
                }));
                classComponent.decorators.push(deco);
                if (classComponent.enumTypes.length > 0) {
                    const extra = classComponent.enumTypes
                        .map((enumType) => `registerEnumType(${enumType}, {
	name: "${enumType}"
})`)
                        .join('\r\n\r\n');
                    classComponent.extra = extra;
                }
            }
            return classComponent;
        };
        this.getClasses = () => {
            const models = this.dmmf.datamodel.models;
            if (this.config.separateRelationFields === true) {
                return [
                    ...models.map((model) => this.getClass({
                        model,
                        extractRelationFields: true,
                        postfix: 'Relations',
                        useGraphQL: this.config.useGraphQL,
                    })),
                    ...models.map((model) => this.getClass({
                        model,
                        extractRelationFields: false,
                        useGraphQL: this.config.useGraphQL,
                    })),
                    ...this.dmmf.datamodel.types.map((model) => this.getClass({
                        model,
                        extractRelationFields: true,
                        useGraphQL: this.config.useGraphQL,
                    })),
                ];
            }
            return [
                ...models.map((model) => this.getClass({ model, useGraphQL: this.config.useGraphQL })),
                ...this.dmmf.datamodel.types.map((model) => this.getClass({
                    model,
                    useGraphQL: this.config.useGraphQL,
                })),
            ];
        };
        this.convertField = (dmmfField) => {
            var _a;
            const field = new field_component_1.FieldComponent({
                name: dmmfField.name,
                useUndefinedDefault: this._config.useUndefinedDefault,
            });
            let type = this.getPrimitiveMapTypeFromDMMF(dmmfField);
            if (this.config.useClassValidator) {
                const decorator = this.extractClassValidatorDecoratorFromField(dmmfField);
                field.decorators.push(...decorator);
            }
            if (this.config.useGraphQL) {
                const decorator = this.extractTypeGraphQLDecoratorFromField(dmmfField);
                if (decorator) {
                    field.decorators.push(decorator);
                }
            }
            field.nullable = true;
            if (this.config.useNonNullableAssertions) {
                field.nonNullableAssertion = true;
            }
            if (this.config.preserveDefaultNullable) {
                field.preserveDefaultNullable = true;
            }
            if (dmmfField.default) {
                if (typeof dmmfField.default !== 'object') {
                    field.default = (_a = dmmfField.default) === null || _a === void 0 ? void 0 : _a.toString();
                    if (dmmfField.kind === 'enum') {
                        field.default = `${dmmfField.type}.${dmmfField.default}`;
                    }
                    else if (dmmfField.type === 'BigInt') {
                        field.default = `BigInt(${field.default})`;
                    }
                    else if (dmmfField.type === 'String') {
                        field.default = `'${field.default}'`;
                    }
                }
                else if (Array.isArray(dmmfField.default)) {
                    if (dmmfField.type === 'String') {
                        field.default = `[${dmmfField.default
                            .map((d) => `'${d}'`)
                            .toString()}]`;
                    }
                    else {
                        field.default = `[${dmmfField.default.toString()}]`;
                    }
                }
            }
            if (type) {
                field.type = type;
            }
            else {
                field.type = dmmfField.type;
            }
            if (dmmfField.isList) {
                field.type = (0, util_1.arrayify)(field.type);
            }
            return field;
        };
    }
    get dmmf() {
        return this._dmmf;
    }
    set dmmf(value) {
        this._dmmf = value;
    }
    get config() {
        return this._config;
    }
    set config(value) {
        this._config = value;
    }
    static getInstance() {
        if (PrismaConvertor.instance) {
            return PrismaConvertor.instance;
        }
        PrismaConvertor.instance = new PrismaConvertor();
        return PrismaConvertor.instance;
    }
}
exports.PrismaConvertor = PrismaConvertor;
//# sourceMappingURL=convertor.js.map