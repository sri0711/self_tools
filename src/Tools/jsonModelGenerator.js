const sanitizeName = (str) => {
	const sanitized = str.replace(/[^a-zA-Z0-9_]/g, '');
	return sanitized.charAt(0).match(/[0-9]/) ? 'N' + sanitized : sanitized;
};

const capitalize = (str) => {
	if (!str) return 'Unknown';
	return str.charAt(0).toUpperCase() + str.slice(1);
};

const generateTypeScript = (interfaces, useGetters, allOptional, optionalFields) => {
	let output = '';
	for (const [structName, props] of Object.entries(interfaces)) {
		if (useGetters) {
			output += `export interface I${structName} {\n`;
			for (const [key, typeInfo] of Object.entries(props)) {
				const isOpt = allOptional || optionalFields.includes(key);
				const optMark = isOpt ? '?' : '';
				let tsType = typeInfo.type;
				if (tsType === 'any' && !typeInfo.isPrimitive) tsType = 'any';
				if (typeInfo.isArray) tsType += '[]';
				const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
					? key
					: `'${key}'`;
				output += `  ${safeKey}${optMark}: ${tsType};\n`;
			}
			output += `}\n\n`;

			output += `export class ${structName} implements I${structName} {\n`;

			for (const [key, typeInfo] of Object.entries(props)) {
				const isOpt = allOptional || optionalFields.includes(key);
				let tsType = typeInfo.type;
				if (tsType === 'any' && !typeInfo.isPrimitive) tsType = 'any';
				if (typeInfo.isArray) tsType += '[]';
				const tsTypeOpt = isOpt ? `${tsType} | undefined` : tsType;
				output += `  private _${sanitizeName(key)}: ${tsTypeOpt};\n`;
			}

			output += `\n  constructor(\n`;
			for (const [key, typeInfo] of Object.entries(props)) {
				const isOpt = allOptional || optionalFields.includes(key);
				let tsType = typeInfo.type;
				if (tsType === 'any' && !typeInfo.isPrimitive) tsType = 'any';
				if (typeInfo.isArray) tsType += '[]';
				const tsTypeOpt = isOpt ? `${tsType} | undefined` : tsType;
				output += `    ${sanitizeName(key)}: ${tsTypeOpt},\n`;
			}
			output += `  ) {\n`;
			// eslint-disable-next-line
			for (const [key, typeInfo] of Object.entries(props)) {
				const safeKey = sanitizeName(key);
				output += `    this._${safeKey} = ${safeKey};\n`;
			}
			output += `  }\n\n`;

			for (const [key, typeInfo] of Object.entries(props)) {
				const isOpt = allOptional || optionalFields.includes(key);
				let tsType = typeInfo.type;
				if (tsType === 'any' && !typeInfo.isPrimitive) tsType = 'any';
				if (typeInfo.isArray) tsType += '[]';
				const tsTypeOpt = isOpt ? `${tsType} | undefined` : tsType;
				const safeKey = sanitizeName(key);
				output += `  get ${safeKey}(): ${tsTypeOpt} {\n    return this._${safeKey};\n  }\n`;
				output += `  set ${safeKey}(value: ${tsTypeOpt}) {\n    this._${safeKey} = value;\n  }\n\n`;
			}

			output += `}\n\n`;
		} else {
			output += `export interface ${structName} {\n`;
			for (const [key, typeInfo] of Object.entries(props)) {
				const isOpt = allOptional || optionalFields.includes(key);
				const optMark = isOpt ? '?' : '';
				let tsType = typeInfo.type;
				if (tsType === 'any' && !typeInfo.isPrimitive) tsType = 'any';
				if (typeInfo.isArray) tsType += '[]';
				const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
					? key
					: `'${key}'`;
				output += `  ${safeKey}${optMark}: ${tsType};\n`;
			}
			output += `}\n\n`;
		}
	}
	return output.trim();
};

const generateGo = (interfaces, useGetters, allOptional, optionalFields) => {
	let output = '';
	for (const [structName, props] of Object.entries(interfaces)) {
		output += `type ${structName} struct {\n`;
		for (const [key, typeInfo] of Object.entries(props)) {
			let goType = typeInfo.type;
			if (typeInfo.isPrimitive) {
				if (goType === 'number') goType = 'float64';
				if (goType === 'boolean') goType = 'bool';
				if (goType === 'any') goType = 'interface{}';
			}
			if (typeInfo.isArray) goType = `[]${goType}`;
			const isOpt = allOptional || optionalFields.includes(key);
			if (isOpt && typeInfo.isPrimitive && goType !== 'interface{}' && !typeInfo.isArray) {
				goType = '*' + goType;
			}
			const fieldName = capitalize(sanitizeName(key));
			const jsonTag = isOpt ? `${key},omitempty` : key;
			output += `\t${fieldName} ${goType} \`json:"${jsonTag}"\`\n`;
		}
		output += `}\n\n`;

		if (useGetters) {
			output += `func New${structName}(`;
			let params = [];
			for (const [key, typeInfo] of Object.entries(props)) {
				let goType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (goType === 'number') goType = 'float64';
					if (goType === 'boolean') goType = 'bool';
					if (goType === 'any') goType = 'interface{}';
				}
				if (typeInfo.isArray) goType = `[]${goType}`;
			const isOpt = allOptional || optionalFields.includes(key);
			if (isOpt && typeInfo.isPrimitive && goType !== 'interface{}' && !typeInfo.isArray) {
				goType = '*' + goType;
			}
				params.push(`${sanitizeName(key).toLowerCase()} ${goType}`);
			}
			output += params.join(', ') + `) *${structName} {\n`;
			output += `\treturn &${structName}{\n`;
			// eslint-disable-next-line
			for (const [key, typeInfo] of Object.entries(props)) {
				output += `\t\t${capitalize(sanitizeName(key))}: ${sanitizeName(key).toLowerCase()},\n`;
			}
			output += `\t}\n}\n\n`;

			for (const [key, typeInfo] of Object.entries(props)) {
				let goType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (goType === 'number') goType = 'float64';
					if (goType === 'boolean') goType = 'bool';
					if (goType === 'any') goType = 'interface{}';
				}
				if (typeInfo.isArray) goType = `[]${goType}`;
			const isOpt = allOptional || optionalFields.includes(key);
			if (isOpt && typeInfo.isPrimitive && goType !== 'interface{}' && !typeInfo.isArray) {
				goType = '*' + goType;
			}

				const fieldName = capitalize(sanitizeName(key));

				output += `func (s *${structName}) Get${fieldName}() ${goType} {\n`;
				output += `\treturn s.${fieldName}\n}\n\n`;

				output += `func (s *${structName}) Set${fieldName}(val ${goType}) {\n`;
				output += `\ts.${fieldName} = val\n}\n\n`;
			}
		}
	}
	return output.trim();
};

const generateCSharp = (interfaces, useGetters, allOptional, optionalFields) => {
	let output = `using System.Collections.Generic;\nusing System.Text.Json.Serialization;\n\n`;
	for (const [structName, props] of Object.entries(interfaces)) {
		output += `public class ${structName}\n{\n`;
		for (const [key, typeInfo] of Object.entries(props)) {
			let csType = typeInfo.type;
			if (typeInfo.isPrimitive) {
				if (csType === 'number') csType = 'double';
				if (csType === 'boolean') csType = 'bool';
				if (csType === 'any') csType = 'object';
			}
			if (typeInfo.isArray) csType = `List<${csType}>`;
			const isOpt = allOptional || optionalFields.includes(key);
			if (isOpt && !csType.endsWith('?')) csType += '?';
			const fieldName = capitalize(sanitizeName(key));
			output += `    [JsonPropertyName("${key}")]\n    public ${csType} ${fieldName} { get; set; }\n\n`;
		}

		if (useGetters) {
			output += `    public ${structName}() { }\n\n`;

			output += `    public ${structName}(`;
			let params = [];
			for (const [key, typeInfo] of Object.entries(props)) {
				let csType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (csType === 'number') csType = 'double';
					if (csType === 'boolean') csType = 'bool';
					if (csType === 'any') csType = 'object';
				}
				if (typeInfo.isArray) csType = `List<${csType}>`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt && !csType.endsWith('?')) csType += '?';
				params.push(`${csType} ${sanitizeName(key).toLowerCase()}`);
			}
			output += params.join(', ') + `)\n    {\n`;
			// eslint-disable-next-line
			for (const [key, typeInfo] of Object.entries(props)) {
				output += `        ${capitalize(sanitizeName(key))} = ${sanitizeName(key).toLowerCase()};\n`;
			}
			output += `    }\n`;
		}
		output += `}\n\n`;
	}
	return output.trim();
};

const generateRust = (interfaces, useGetters, allOptional, optionalFields) => {
	let output = `use serde::{Serialize, Deserialize};\n\n`;
	for (const [structName, props] of Object.entries(interfaces)) {
		output += `#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]\n`;
		output += `#[serde(rename_all = "camelCase")]\n`;
		output += `pub struct ${structName} {\n`;
		for (const [key, typeInfo] of Object.entries(props)) {
			let rsType = typeInfo.type;
			if (typeInfo.isPrimitive) {
				if (rsType === 'string') rsType = 'String';
				if (rsType === 'number') rsType = 'f64';
				if (rsType === 'boolean') rsType = 'bool';
				if (rsType === 'any') rsType = 'serde_json::Value';
			}
			if (typeInfo.isArray) rsType = `Vec<${rsType}>`;
			const isOpt = allOptional || optionalFields.includes(key);
			if (isOpt) rsType = `Option<${rsType}>`;
			const fieldName = sanitizeName(key).toLowerCase();
			if (fieldName !== key) {
				output += `    #[serde(rename = "${key}")]\n`;
			}
			if (isOpt) {
				output += `    #[serde(skip_serializing_if = "Option::is_none")]\n`;
			}

			if (useGetters) {
				output += `    ${fieldName}: ${rsType},\n`;
			} else {
				output += `    pub ${fieldName}: ${rsType},\n`;
			}
		}
		output += `}\n\n`;

		if (useGetters) {
			output += `impl ${structName} {\n`;

			output += `    pub fn new(`;
			let params = [];
			for (const [key, typeInfo] of Object.entries(props)) {
				let rsType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (rsType === 'string') rsType = 'String';
					if (rsType === 'number') rsType = 'f64';
					if (rsType === 'boolean') rsType = 'bool';
					if (rsType === 'any') rsType = 'serde_json::Value';
				}
				if (typeInfo.isArray) rsType = `Vec<${rsType}>`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt) rsType = `Option<${rsType}>`;
				params.push(`${sanitizeName(key).toLowerCase()}: ${rsType}`);
			}
			output += params.join(', ') + `) -> Self {\n`;
			output += `        Self {\n`;
			// eslint-disable-next-line
			for (const [key, typeInfo] of Object.entries(props)) {
				output += `            ${sanitizeName(key).toLowerCase()},\n`;
			}
			output += `        }\n    }\n\n`;

			for (const [key, typeInfo] of Object.entries(props)) {
				let rsType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (rsType === 'string') rsType = 'String';
					if (rsType === 'number') rsType = 'f64';
					if (rsType === 'boolean') rsType = 'bool';
					if (rsType === 'any') rsType = 'serde_json::Value';
				}
				if (typeInfo.isArray) rsType = `Vec<${rsType}>`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt) rsType = `Option<${rsType}>`;
				const fieldName = sanitizeName(key).toLowerCase();

				output += `    pub fn get_${fieldName}(&self) -> &${rsType} {\n`;
				output += `        &self.${fieldName}\n    }\n\n`;

				output += `    pub fn set_${fieldName}(&mut self, value: ${rsType}) {\n`;
				output += `        self.${fieldName} = value;\n    }\n`;
			}
			output += `}\n\n`;
		}
	}
	return output.trim();
};

const generatePython = (interfaces, useGetters, allOptional, optionalFields) => {
	let output = '';
	if (useGetters) {
		output += `from typing import Any, List, Optional\n\n`;
		for (const [structName, props] of Object.entries(interfaces)) {
			output += `class ${structName}:\n`;
			let initParams = ['self'];
			let initBody = '';
			let properties = '';

			for (const [key, typeInfo] of Object.entries(props)) {
				let pyType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (pyType === 'string') pyType = 'str';
					if (pyType === 'number') pyType = 'float';
					if (pyType === 'boolean') pyType = 'bool';
					if (pyType === 'any') pyType = 'Any';
				}
				if (typeInfo.isArray) pyType = `List[${pyType}]`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt) pyType = `Optional[${pyType}]`;
				const fieldName = sanitizeName(key);

				initParams.push(`${fieldName}: ${pyType} = None`);
				initBody += `        self._${fieldName} = ${fieldName}\n`;

				properties += `    @property\n`;
				properties += `    def ${fieldName}(self) -> ${pyType}:\n`;
				properties += `        return self._${fieldName}\n\n`;
				properties += `    @${fieldName}.setter\n`;
				properties += `    def ${fieldName}(self, value: ${pyType}):\n`;
				properties += `        self._${fieldName} = value\n\n`;
			}

			if (initBody === '') initBody = `        pass\n`;

			output += `    def __init__(${initParams.join(', ')}):\n${initBody}\n${properties}`;
		}
	} else {
		output += `from typing import Any, List, Optional\nfrom dataclasses import dataclass\n\n`;
		for (const [structName, props] of Object.entries(interfaces)) {
			output += `@dataclass\nclass ${structName}:\n`;
			let hasProps = false;
			// Sort to ensure optional properties (with defaults) come last to prevent syntax errors
			const sortedProps = Object.entries(props).sort(([k1], [k2]) => {
				const o1 = allOptional || optionalFields.includes(k1);
				const o2 = allOptional || optionalFields.includes(k2);
				if (o1 === o2) return 0;
				return o1 ? 1 : -1;
			});
			for (const [key, typeInfo] of sortedProps) {
				hasProps = true;
				let pyType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (pyType === 'string') pyType = 'str';
					if (pyType === 'number') pyType = 'float';
					if (pyType === 'boolean') pyType = 'bool';
					if (pyType === 'any') pyType = 'Any';
				}
				if (typeInfo.isArray) pyType = `List[${pyType}]`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt) pyType = `Optional[${pyType}]`;
				const fieldName = sanitizeName(key);
				output += `    ${fieldName}: ${pyType}${isOpt ? ' = None' : ''}\n`;
			}
			if (!hasProps) output += `    pass\n\n`;
		}
	}
	return output.trim();
};

const generateSwift = (interfaces, useGetters, allOptional, optionalFields) => {
	let output = '';
	for (const [structName, props] of Object.entries(interfaces)) {
		output += `struct ${structName}: Codable {\n`;
		for (const [key, typeInfo] of Object.entries(props)) {
			let swType = typeInfo.type;
			if (typeInfo.isPrimitive) {
				if (swType === 'string') swType = 'String';
				if (swType === 'number') swType = 'Double';
				if (swType === 'boolean') swType = 'Bool';
				if (swType === 'any') swType = 'Any';
			}
			if (typeInfo.isArray) swType = `[${swType}]`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt && !swType.endsWith('?')) swType += '?';
			const fieldName = sanitizeName(key);
			if (useGetters) {
					output += `    private var _${fieldName}: ${swType}\n`;
			} else {
					output += `    var ${fieldName}: ${swType}\n`;
			}
		}

		if (useGetters) {
			output += `\n    enum CodingKeys: String, CodingKey {\n`;
			// eslint-disable-next-line
			for (const [key, typeInfo] of Object.entries(props)) {
				output += `        case _${sanitizeName(key)} = "${key}"\n`;
			}
			output += `    }\n\n`;

			output += `    init(`;
			let params = [];
			for (const [key, typeInfo] of Object.entries(props)) {
				let swType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (swType === 'string') swType = 'String';
					if (swType === 'number') swType = 'Double';
					if (swType === 'boolean') swType = 'Bool';
					if (swType === 'any') swType = 'Any';
				}
				if (typeInfo.isArray) swType = `[${swType}]`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt && !swType.endsWith('?')) swType += '?';
				params.push(`${sanitizeName(key)}: ${swType}${isOpt ? ' = nil' : ''}`);
			}
			output += params.join(', ') + `) {\n`;
			// eslint-disable-next-line
			for (const [key, typeInfo] of Object.entries(props)) {
				output += `        self._${sanitizeName(key)} = ${sanitizeName(key)}\n`;
			}
			output += `    }\n\n`;

			for (const [key, typeInfo] of Object.entries(props)) {
				let swType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (swType === 'string') swType = 'String';
					if (swType === 'number') swType = 'Double';
					if (swType === 'boolean') swType = 'Bool';
					if (swType === 'any') swType = 'Any';
				}
				if (typeInfo.isArray) swType = `[${swType}]`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt && !swType.endsWith('?')) swType += '?';
				const fieldName = sanitizeName(key);
				output += `    var ${fieldName}: ${swType} {\n`;
				output += `        get { return _${fieldName} }\n`;
				output += `        set { _${fieldName} = newValue }\n`;
				output += `    }\n\n`;
			}
		}
		output += `}\n\n`;
	}
	return output.trim();
};

const generateJava = (interfaces, useGetters, allOptional, optionalFields) => {
	let output = `import java.util.List;\n\n`;
	for (const [structName, props] of Object.entries(interfaces)) {
		output += `public class ${structName} {\n`;
		for (const [key, typeInfo] of Object.entries(props)) {
			let javaType = typeInfo.type;
			if (typeInfo.isPrimitive) {
				if (javaType === 'string') javaType = 'String';
				if (javaType === 'number') javaType = 'double';
				if (javaType === 'boolean') javaType = 'boolean';
				if (javaType === 'any') javaType = 'Object';
			}
			if (typeInfo.isArray) javaType = `List<${javaType}>`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt && typeInfo.isPrimitive) {
					if (javaType === 'double') javaType = 'Double';
					if (javaType === 'boolean') javaType = 'Boolean';
				}
			if (useGetters) {
				output += `    private ${javaType} ${sanitizeName(key)};\n`;
			} else {
				output += `    public ${javaType} ${sanitizeName(key)};\n`;
			}
		}
		output += `\n`;

		if (useGetters) {
			output += `    public ${structName}() {}\n\n`;

			output += `    public ${structName}(`;
			let params = [];
			for (const [key, typeInfo] of Object.entries(props)) {
				let javaType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (javaType === 'string') javaType = 'String';
					if (javaType === 'number') javaType = 'double';
					if (javaType === 'boolean') javaType = 'boolean';
					if (javaType === 'any') javaType = 'Object';
				}
				if (typeInfo.isArray) javaType = `List<${javaType}>`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt && typeInfo.isPrimitive) {
					if (javaType === 'double') javaType = 'Double';
					if (javaType === 'boolean') javaType = 'Boolean';
				}
				params.push(`${javaType} ${sanitizeName(key)}`);
			}
			output += params.join(', ') + `) {\n`;
			// eslint-disable-next-line
			for (const [key, typeInfo] of Object.entries(props)) {
				const safeKey = sanitizeName(key);
				output += `        this.${safeKey} = ${safeKey};\n`;
			}
			output += `    }\n\n`;

			for (const [key, typeInfo] of Object.entries(props)) {
				let javaType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (javaType === 'string') javaType = 'String';
					if (javaType === 'number') javaType = 'double';
					if (javaType === 'boolean') javaType = 'boolean';
					if (javaType === 'any') javaType = 'Object';
				}
				if (typeInfo.isArray) javaType = `List<${javaType}>`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt && typeInfo.isPrimitive) {
					if (javaType === 'double') javaType = 'Double';
					if (javaType === 'boolean') javaType = 'Boolean';
				}
				const safeKey = sanitizeName(key);
				const capKey = capitalize(safeKey);

				output += `    public ${javaType} get${capKey}() {\n        return ${safeKey};\n    }\n`;
				output += `    public void set${capKey}(${javaType} ${safeKey}) {\n        this.${safeKey} = ${safeKey};\n    }\n\n`;
			}
		}

		output += `}\n\n`;
	}
	return output.trim();
};

const generateDart = (interfaces, useGetters, allOptional, optionalFields) => {
	let output = '';
	for (const [structName, props] of Object.entries(interfaces)) {
		output += `class ${structName} {\n`;
		for (const [key, typeInfo] of Object.entries(props)) {
			let dartType = typeInfo.type;
			if (typeInfo.isPrimitive) {
				if (dartType === 'string') dartType = 'String';
				if (dartType === 'number') dartType = 'double';
				if (dartType === 'boolean') dartType = 'bool';
				if (dartType === 'any') dartType = 'dynamic';
			}
			if (typeInfo.isArray) dartType = `List<${dartType}>`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt && !dartType.endsWith('?')) dartType += '?';
			if (useGetters) {
				output += `  ${dartType}? _${sanitizeName(key)};\n`;
			} else {
				output += `  ${dartType}? ${sanitizeName(key)};\n`;
			}
		}
		output += `\n`;

		if (!useGetters) {
			output += `  ${structName}({`;
			let params = [];
			for (const [key, typeInfo] of Object.entries(props)) {
				let dartType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (dartType === 'string') dartType = 'String';
					if (dartType === 'number') dartType = 'double';
					if (dartType === 'boolean') dartType = 'bool';
					if (dartType === 'any') dartType = 'dynamic';
				}
				if (typeInfo.isArray) dartType = `List<${dartType}>`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt && !dartType.endsWith('?')) dartType += '?';
				params.push(`${isOpt ? '' : 'required '}this.${sanitizeName(key)}`);
			}
			output += params.join(', ') + `});\n\n`;
		}

		if (useGetters) {
			output += `  ${structName}({`;
			let params = [];
			for (const [key, typeInfo] of Object.entries(props)) {
				let dartType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (dartType === 'string') dartType = 'String';
					if (dartType === 'number') dartType = 'double';
					if (dartType === 'boolean') dartType = 'bool';
					if (dartType === 'any') dartType = 'dynamic';
				}
				if (typeInfo.isArray) dartType = `List<${dartType}>`;
				const isOpt = allOptional || optionalFields.includes(key);
				if (isOpt && !dartType.endsWith('?')) dartType += '?';
				params.push(`${isOpt ? '' : 'required '}${dartType} ${sanitizeName(key)}`);
			}
			output += params.join(', ') + `}) {\n`;
			// eslint-disable-next-line
			for (const [key, typeInfo] of Object.entries(props)) {
				const safeKey = sanitizeName(key);
				output += `    this._${safeKey} = ${safeKey};\n`;
			}
			output += `  }\n\n`;

			for (const [key, typeInfo] of Object.entries(props)) {
				let dartType = typeInfo.type;
				if (typeInfo.isPrimitive) {
					if (dartType === 'string') dartType = 'String';
					if (dartType === 'number') dartType = 'double';
					if (dartType === 'boolean') dartType = 'bool';
					if (dartType === 'any') dartType = 'dynamic';
				}
				if (typeInfo.isArray) dartType = `List<${dartType}>`;
				const safeKey = sanitizeName(key);

				output += `  ${dartType}? get ${safeKey} => _${safeKey};\n`;
				output += `  set ${safeKey}(${dartType}? value) => _${safeKey} = value;\n\n`;
			}
		}

		output += `}\n\n`;
	}
	return output.trim();
};

export const generateModels = (jsonString, language, rootName = 'Root', useGetters = true, allOptional = false, optionalFields = []) => {
	let obj;
	try {
		obj = JSON.parse(jsonString);
	} catch {
		throw new Error('Invalid JSON');
	}

	const interfaces = {};

	const getType = (value, name) => {
		if (value === null) return { type: 'any', isPrimitive: true };
		if (Array.isArray(value)) {
			if (value.length === 0)
				return { type: 'any', isArray: true, isPrimitive: true };
			const inner = getType(value[0], name);
			return {
				type: inner.type,
				isArray: true,
				isPrimitive: inner.isPrimitive
			};
		}
		if (typeof value === 'object') {
			const structName = capitalize(sanitizeName(name));
			parseObject(value, structName);
			return { type: structName, isPrimitive: false };
		}
		return { type: typeof value, isPrimitive: true };
	};

	const parseObject = (objToParse, name) => {
		if (!interfaces[name]) interfaces[name] = {};
		for (const key in objToParse) {
			interfaces[name][key] = getType(objToParse[key], key);
		}
	};

	if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
		parseObject(obj, capitalize(sanitizeName(rootName)));
	} else if (
		Array.isArray(obj) &&
		obj.length > 0 &&
		typeof obj[0] === 'object'
	) {
		parseObject(obj[0], capitalize(sanitizeName(rootName)));
	} else {
		return '// JSON must be an object or an array of objects to generate models.';
	}

	switch (language) {
		case 'typescript':
			return generateTypeScript(interfaces, useGetters, allOptional, optionalFields);
		case 'go':
			return generateGo(interfaces, useGetters, allOptional, optionalFields);
		case 'csharp':
			return generateCSharp(interfaces, useGetters, allOptional, optionalFields);
		case 'rust':
			return generateRust(interfaces, useGetters, allOptional, optionalFields);
		case 'python':
			return generatePython(interfaces, useGetters, allOptional, optionalFields);
		case 'swift':
			return generateSwift(interfaces, useGetters, allOptional, optionalFields);
		case 'java':
			return generateJava(interfaces, useGetters, allOptional, optionalFields);
		case 'dart':
			return generateDart(interfaces, useGetters, allOptional, optionalFields);
		default:
			return '';
	}
};
