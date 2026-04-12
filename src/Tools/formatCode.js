import * as prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import parserHtml from 'prettier/parser-html';
import parserCss from 'prettier/parser-postcss';
import parserYaml from 'prettier/parser-yaml';
import parserSql from 'prettier-plugin-sql';

/**
 * Format code using Prettier where possible, with Monaco fallback
 * @param {string} code - Code to format
 * @param {string} language - Programming language
 * @param {object} editorRef - Editor reference for Monaco fallback
 * @returns {Promise<string>} Formatted code
 */
export async function formatCodeWithPrettier(code, language, editorRef) {
	if (!code || !code.trim()) {
		return code;
	}

	const prettierConfig = {
		javascript: {
			parser: 'babel',
			plugins: [parserBabel]
		},
		typescript: {
			parser: 'typescript',
			plugins: [parserBabel]
		},
		json: {
			parser: 'json',
			plugins: [parserBabel]
		},
		html: {
			parser: 'html',
			plugins: [parserHtml]
		},
		xml: {
			parser: 'html',
			plugins: [parserHtml]
		},
		css: {
			parser: 'css',
			plugins: [parserCss]
		},
		scss: {
			parser: 'scss',
			plugins: [parserCss]
		},
		sql: {
			parser: 'sql',
			plugins: [parserSql]
		},
		yml: {
			parser: 'yaml',
			plugins: [parserYaml]
		},
		yaml: {
			parser: 'yaml',
			plugins: [parserYaml]
		}
	};

	const config = prettierConfig[language];
	if (!config) {
		// Fallback to Monaco for unsupported languages
		return formatCodeWithMonaco(code, editorRef);
	}

	try {
		const formatted = await prettier.format(code, {
			parser: config.parser,
			plugins: config.plugins,
			useTabs: false,
			tabWidth: 4,
			semi: true,
			singleQuote: true,
			trailingComma: 'es5',
			printWidth: 100,
			arrowParens: 'always',
			bracketSpacing: true,
			jsxBracketSameLine: false,
			endOfLine: 'lf'
		});
		return formatted;
	} catch (error) {
		console.error(`Prettier format error for ${language}:`, error);
		return formatCodeWithMonaco(code, editorRef);
	}
}

/**
 * Format code using Monaco Editor's built-in formatting
 * @param {string} code - Code to format
 * @param {object} editorRef - Editor reference
 * @returns {string} Code (Monaco modifies in place)
 */
function formatCodeWithMonaco(code, editorRef) {
	if (!editorRef || !code.trim()) {
		return code;
	}

	try {
		const action = editorRef.getAction('editor.action.formatDocument');
		if (action) {
			action.run().catch((err) => {
				console.warn('Monaco format fallback failed:', err);
			});
		}
		return editorRef.getValue();
	} catch (error) {
		console.error('Monaco format error:', error);
		return code;
	}
}

/**
 * Get format support info for a language
 * @param {string} language - Programming language
 * @returns {object} Support info
 */
export function getFormatSupport(language) {
	const prettierSupported = [
		'javascript',
		'typescript',
		'json',
		'html',
		'css',
		'scss',
		'yml',
		'yaml'
	];

	const monacoSupported = [
		'javascript',
		'typescript',
		'json',
		'html',
		'css',
		'scss',
		'xml',
		'python',
		'java',
		'cpp',
		'c',
		'csharp',
		'go',
		'rust'
	];

	return {
		language,
		prettierSupported: prettierSupported.includes(language),
		monacoSupported: monacoSupported.includes(language),
		hasFallback: monacoSupported.includes(language),
		formatType: prettierSupported.includes(language)
			? 'prettier'
			: monacoSupported.includes(language)
				? 'monaco'
				: 'none'
	};
}
