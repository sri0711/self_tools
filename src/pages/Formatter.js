import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { Button, Form } from 'react-bootstrap';
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

function Formatter({ onMenuClick }) {
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
			cursorBlinking: 'smooth',
			padding: { top: 16, bottom: 16 }
		}),
		[]
	);

	return (
		<div className="p-4 tool-page-bg theme-purple d-flex flex-column min-vh-100">
			<div className="glass-panel p-3 mb-4 d-flex flex-wrap align-items-center gap-4 border-0">
				<div className="d-flex align-items-center gap-4">
					<div
						className="response-badge"
						style={{ padding: '0.25rem 1rem' }}
					>
						<label>LANG</label>
						<Form.Select
							value={language}
							onChange={(e) =>
								handleLanguageSelect(e.target.value)
							}
							className="bg-transparent border-0 text-light fw-bold font-monospace text-uppercase"
							style={{
								outline: 'none',
								boxShadow: 'none',
								cursor: 'pointer'
							}}
						>
							{availableLanguages.map((lang) => (
								<option
									key={lang}
									value={lang}
									style={{ background: '#0f172a' }}
								>
									{lang}
								</option>
							))}
						</Form.Select>
					</div>

					<Form.Check
						type="switch"
						id="autoDetect"
						label="AUTO DETECT"
						checked={autoDetect}
						onChange={(e) => setAutoDetect(e.target.checked)}
						className="hud-switch font-monospace mb-0"
						style={{ letterSpacing: '1px' }}
					/>
				</div>

				<div className="response-badge text-info ms-auto">
					<label>DETECTED</label>
					<span style={{ color: '#a78bfa' }}>
						{detectedLanguage.toUpperCase()}
					</span>
				</div>

				<Button
					variant="none"
					className="hud-btn-primary fw-bold px-4 py-2"
					onClick={handleFormat}
				>
					[ FORMAT CODE ]
				</Button>
				<Button
					variant="none"
					className="hud-btn-secondary fw-bold px-4 py-2"
					onClick={onMenuClick}
				>
					[ ☰ MENU ]
				</Button>
			</div>

			<div className="glass-panel flex-grow-1 p-0 overflow-hidden d-flex flex-column border-0">
				<div
					className="px-3 py-2 border-bottom"
					style={{
						borderColor: 'rgba(56, 189, 248, 0.1)',
						background: 'rgba(255, 255, 255, 0.02)'
					}}
				>
					<span className="font-monospace text-secondary small">
						INPUT_STREAM // {language.toUpperCase()}
					</span>
				</div>
				<div className="flex-grow-1 mt-2 w-100">
					<Editor
						height="calc(100vh - 230px)"
						language={language}
						value={code}
						onChange={handleCodeChange}
						beforeMount={(monaco) => {
							monaco.editor.defineTheme('myDarkTheme', {
								base: 'vs-dark',
								inherit: true,
								rules: [],
								colors: {
									'editor.background': '#0f172a',
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
										const detected =
											detectLanguage(nextValue);
										setDetectedLanguage(detected);
										setLanguage(detected);
									}
								});
							}
						}}
					/>
				</div>
			</div>
		</div>
	);
}

export default Formatter;
