export const CLASS_TEMPLATE = `#!{IMPORTS}

#!{DECORATORS}
export class #!{NAME} extends PartialType(#!{CREATE_NAME}) {
#!{FIELDS}
}
#!{EXTRA}
`
