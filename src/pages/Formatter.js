import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { Button, Form, Dropdown } from 'react-bootstrap';
import Editor from '@monaco-editor/react';
import detectLanguage from '../Tools/detectLanguage';
import { formatCodeWithPrettier } from '../Tools/formatCode';

const availableLanguages = [
	'javascript',
	'typescript',
	'python',
	'java',
	'json',
	'xml',
	'html',
	'css',
	'scss',
	'shell',
	'sql',
	'yml',
	'toml',
	'cpp',
	'c',
	'csharp',
	'go',
	'ruby',
	'rust',
	'swift',
	'php'
];

function Formatter() {
	const [code, setCode] = useState('');
	const [language, setLanguage] = useState('javascript');
	const [autoDetect, setAutoDetect] = useState(true);
	const [detectedLanguage, setDetectedLanguage] = useState('javascript');
	const editorRef = useRef(null);
	const autoDetectRef = useRef(autoDetect);

	useEffect(() => {
		autoDetectRef.current = autoDetect;
	}, [autoDetect]);

	const handleLanguageSelect = useCallback((selectedLanguage) => {
		setLanguage(selectedLanguage);
		setDetectedLanguage(selectedLanguage);
		setAutoDetect(false);
	}, []);

	const handleEditorMount = useCallback((editor) => {
		editorRef.current = editor;
	}, []);

	const handleCodeChange = useCallback((value) => {
		const nextValue = value || '';
		setCode(nextValue);
		if (autoDetectRef.current) {
			const detected = detectLanguage(nextValue);
			setDetectedLanguage(detected);
			setLanguage(detected);
		}
	}, []);

	const handleFormat = useCallback(async () => {
		if (!editorRef.current || !code.trim()) return;

		try {
			const formatted = await formatCodeWithPrettier(
				code,
				language,
				editorRef.current
			);
			editorRef.current.setValue(formatted);
		} catch (error) {
			console.error('Format error:', error);
			alert('Formatting failed. Please check your code syntax.');
		}
	}, [code, language]);

	const editorOptions = useMemo(
		() => ({
			automaticLayout: true,
			wordWrap: 'on',
			minimap: { enabled: false },
			fontSize: 14,
			formatOnPaste: true,
			formatOnType: true,
			scrollBeyondLastLine: false,
			renderWhitespace: 'none',
			cursorBlinking: 'smooth'
		}),
		[]
	);

	return (
		<div className="p-3 min-vh-100 bg-dark text-light">
			<div className="mb-3">
				<h2 className="mb-2">Code Formatter</h2>
				<p className="mb-0">
					Auto detect language as you type or paste, with syntax
					highlighting, completion, and dark theme.
				</p>
			</div>

			<div className="d-flex flex-wrap align-items-center gap-3 mb-3">
				<div className="d-flex flex-column">
					<Form.Label className="small mb-1">Language</Form.Label>
					<Dropdown>
						<Dropdown.Toggle
							variant="outline-secondary"
							className="text-light text-capitalize"
							style={{ minWidth: '120px' }}
						>
							{language}
						</Dropdown.Toggle>

						<Dropdown.Menu
							variant="dark"
							style={{ maxHeight: '250px', overflowY: 'auto' }}
						>
							{availableLanguages.map((lang) => (
								<Dropdown.Item
									key={lang}
									active={lang === language}
									className="text-capitalize"
									onClick={() => handleLanguageSelect(lang)}
								>
									{lang}
								</Dropdown.Item>
							))}
						</Dropdown.Menu>
					</Dropdown>
				</div>

				<div className="d-flex align-items-center gap-2">
					<Form.Check
						type="checkbox"
						id="autoDetect"
						label="Auto detect"
						checked={autoDetect}
						onChange={(e) => setAutoDetect(e.target.checked)}
						className="text-light mb-0"
					/>
				</div>

				<Button variant="primary" onClick={handleFormat}>
					Format code
				</Button>

				<div className="small">
					Detected: <strong>{detectedLanguage}</strong>
				</div>
			</div>

			<div className="rounded overflow-hidden border border-secondary">
				<Editor
					height="72vh"
					language={language}
					value={code}
					onChange={handleCodeChange}
					beforeMount={(monaco) => {
						monaco.editor.defineTheme('myDarkTheme', {
							base: 'vs-dark',
							inherit: true,
							rules: [],
							colors: {
								'editor.background': '#0b1220',
								'editor.foreground': '#f8fafc'
							}
						});
					}}
					theme="myDarkTheme"
					options={editorOptions}
					onMount={(editor) => {
						handleEditorMount(editor);
						if (editor.onDidPaste) {
							editor.onDidPaste(() => {
								if (autoDetectRef.current) {
									const nextValue = editor.getValue();
									const detected = detectLanguage(nextValue);
									setDetectedLanguage(detected);
									setLanguage(detected);
								}
							});
						}
					}}
				/>
			</div>
		</div>
	);
}

export default Formatter;
