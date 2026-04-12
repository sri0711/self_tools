export default function detectLanguage(code) {
	const text = (code || '').trim();
	if (!text) return 'javascript';

	const firstLine = text.split('\n', 1)[0].trim();
	if ((text.startsWith('{') || text.startsWith('[')) && text.endsWith('}')) {
		try {
			JSON.parse(text);
			return 'json';
		} catch {
			// ignore invalid JSON
		}
	}

	if (/^---/.test(text) && /:\s*\w+|^\s*-\s+\w+/m.test(text)) return 'yml';
	if (/^\[\w+\]|^\w+\s*=\s*[\w"[]/m.test(text)) return 'toml';
	if (
		/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|TRUNCATE|MERGE|DECLARE)\b/i.test(
			text
		)
	)
		return 'sql';
	if (/^<\?php/.test(text)) return 'php';
	if (
		/^<!DOCTYPE/i.test(text) ||
		(/<\/?\\w+[^>]*>/m.test(text) && !/<\?/.test(text))
	)
		return 'html';
	if (/^<\/?[a-zA-Z]/.test(text)) return 'xml';
	if (
		/@(import|mixin|extend|include|media)\b|&\s*[:{}]|\$\w+\s*:|%\w+/m.test(
			text
		)
	)
		return 'scss';
	if (
		/^\s*package\s+\w+/.test(text) ||
		/public\s+(class|interface|static|enum)\b/.test(text)
	)
		return 'java';
	if (
		/\bfunc\s+main\b/.test(text) ||
		(/\bpackage\s+\w+\b/.test(text) && /import\s+"/.test(text))
	)
		return 'go';
	if (
		/\bfn\s+main\b/.test(text) ||
		/let\s+mut\b/.test(text) ||
		/println!\(/.test(text)
	)
		return 'rust';
	if (
		/^\s*#!\/(usr\/bin|bin)\/(env\s+)?(bash|sh)/.test(firstLine) ||
		/\becho\s+/.test(text)
	)
		return 'shell';
	if (/^\s*#include\s+<|^\s*using\s+namespace\s+std|std::\w+\b/.test(text))
		return 'cpp';
	if (/\busing\s+System\b|namespace\s+\w+\b|class\s+\w+\s*\{/.test(text))
		return 'csharp';
	if (/\bdef\s+\w+\(|\bimport\s+\w+\b|\bfrom\s+\w+\s+import\b/.test(text))
		return 'python';
	if (/^\s*\w+\s*\{/.test(text) && /:\s*\w+;/.test(text)) return 'css';
	if (
		/\bmodule\s+\w+\b/.test(text) ||
		/import\s+Swift\b/.test(text) ||
		/func\s+\w+\(/.test(text)
	)
		return 'swift';
	if (/\bdef\s+\w+\b/.test(text) && /\bend\b/.test(text)) return 'ruby';
	if (/\bconsole\.log\b/.test(text) || /\bfunction\s+\w+\b/.test(text))
		return 'javascript';
	return 'javascript';
}
