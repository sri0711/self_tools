import React, { useState, useEffect, useMemo } from 'react';
import { Form, Row, Col, Button, Modal } from 'react-bootstrap';
import Editor from '@monaco-editor/react';
import { generateModels } from '../Tools/jsonModelGenerator';
import { useLocation } from 'react-router-dom';

function JSONModelGenerator({ onMenuClick }) {
	const location = useLocation();
	const [jsonInput, setJsonInput] = useState(
		location.state?.jsonInput ||
			'{\n  "id": 1,\n  "name": "Self Tools",\n  "isActive": true,\n  "tags": ["developer", "utility"]\n}'
	);
	const [language, setLanguage] = useState('typescript');
	const [rootName, setRootName] = useState('Root');
	const [generatedCode, setGeneratedCode] = useState('');
	const [copyStatus, setCopyStatus] = useState('Copy Models');
	const [useGetters, setUseGetters] = useState(false);
	const [allOptional, setAllOptional] = useState(false);
	const [optionalFields, setOptionalFields] = useState([]);
	const [showOptModal, setShowOptModal] = useState(false);

	const availableKeys = useMemo(() => {
		try {
			const parsed = JSON.parse(jsonInput);
			const keys = new Set();
			const extract = (obj) => {
				if (typeof obj === 'object' && obj !== null) {
					if (Array.isArray(obj)) {
						obj.forEach(extract);
					} else {
						Object.keys(obj).forEach((k) => {
							keys.add(k);
							extract(obj[k]);
						});
					}
				}
			};
			extract(parsed);
			return Array.from(keys).sort();
		} catch {
			return [];
		}
	}, [jsonInput]);

	useEffect(() => {
		if (!jsonInput.trim()) {
			setGeneratedCode('// Please enter JSON to generate models.');
			return;
		}
		try {
			const models = generateModels(
				jsonInput,
				language,
				rootName || 'Root',
				useGetters,
				allOptional,
				optionalFields
			);
			setGeneratedCode(models);
		} catch {
			setGeneratedCode(
				'// Error parsing JSON. Please check your syntax.'
			);
		}
	}, [
		jsonInput,
		language,
		rootName,
		useGetters,
		allOptional,
		optionalFields
	]);

	useEffect(() => {
		if (location.state?.jsonInput) {
			setJsonInput(location.state.jsonInput);
		}
	}, [location.state]);

	const handleCopy = () => {
		navigator.clipboard.writeText(generatedCode);
		setCopyStatus('Copied!');
		setTimeout(() => setCopyStatus('Copy Models'), 2000);
	};

	const editorOptions = useMemo(
		() => ({
			automaticLayout: true,
			minimap: { enabled: false },
			fontSize: 14,
			scrollBeyondLastLine: false,
			renderWhitespace: 'none',
			padding: { top: 16, bottom: 16 }
		}),
		[]
	);

	return (
		<div className="p-4 tool-page-bg theme-red d-flex flex-column min-vh-100">
			<div className="glass-panel p-3 mb-4 d-flex flex-wrap align-items-center gap-4 border-0">
				<div className="d-flex align-items-center gap-4 flex-grow-1">
					<div
						className="response-badge"
						style={{ padding: '0.25rem 1rem' }}
					>
						<label>LANGUAGE</label>
						<Form.Select
							value={language}
							onChange={(e) => setLanguage(e.target.value)}
							className="bg-transparent border-0 text-light fw-bold font-monospace text-uppercase"
							style={{
								outline: 'none',
								boxShadow: 'none',
								cursor: 'pointer'
							}}
						>
							<option
								value="typescript"
								style={{ background: '#0f172a' }}
							>
								TypeScript
							</option>
							<option
								value="go"
								style={{ background: '#0f172a' }}
							>
								Go (Structs)
							</option>
							<option
								value="csharp"
								style={{ background: '#0f172a' }}
							>
								C# (Classes)
							</option>
							<option
								value="rust"
								style={{ background: '#0f172a' }}
							>
								Rust (Serde)
							</option>
							<option
								value="python"
								style={{ background: '#0f172a' }}
							>
								Python (Dataclass)
							</option>
							<option
								value="swift"
								style={{ background: '#0f172a' }}
							>
								Swift (Codable)
							</option>
							<option
								value="java"
								style={{ background: '#0f172a' }}
							>
								Java (POJO)
							</option>
							<option
								value="dart"
								style={{ background: '#0f172a' }}
							>
								Dart (Classes)
							</option>
						</Form.Select>
					</div>

					<div className="response-badge">
						<label>ROOT NODE</label>
						<Form.Control
							type="text"
							value={rootName}
							onChange={(e) => setRootName(e.target.value)}
							placeholder="Root"
							className="bg-transparent border-0 text-light fw-bold font-monospace px-1 py-0 m-0"
							style={{
								outline: 'none',
								boxShadow: 'none',
								maxWidth: '150px'
							}}
						/>
					</div>

					<div className="d-flex align-items-center ms-2 gap-4">
						<Form.Check
							type="switch"
							id="useGettersSwitch"
							label="GETTERS & SETTERS"
							checked={useGetters}
							onChange={(e) => setUseGetters(e.target.checked)}
							className="hud-switch font-monospace mb-0"
							style={{ letterSpacing: '1px' }}
						/>
						<Form.Check
							type="switch"
							id="allOptionalSwitch"
							label="ALL OPTIONAL"
							checked={allOptional}
							onChange={(e) => setAllOptional(e.target.checked)}
							className="hud-switch font-monospace mb-0"
							style={{ letterSpacing: '1px' }}
						/>
					</div>

					<Button
						variant="none"
						onClick={() => setShowOptModal(true)}
						disabled={allOptional}
						className="hud-btn-secondary fw-bold px-4 py-2"
						style={{
							outline: 'none',
							boxShadow: 'none',
							minWidth: '120px'
						}}
					>
						{optionalFields.length > 0
							? `[ ${optionalFields.length} ]`
							: '[ SELECT ]'}
					</Button>

					<Button
						variant="none"
						className="hud-btn-secondary fw-bold px-4 py-2"
						onClick={handleCopy}
					>
						[ {copyStatus.toUpperCase()} ]
					</Button>
					<Button
						variant="none"
						className="hud-btn-secondary fw-bold px-4 py-2"
						onClick={onMenuClick}
					>
						[ ☰ MENU ]
					</Button>
				</div>

				<div className="d-flex gap-2"></div>
			</div>

			<Row className="flex-grow-1 g-4 m-0 p-0">
				<Col
					lg={6}
					className="d-flex flex-column p-0 pe-lg-2 mb-4 mb-lg-0"
				>
					<div className="glass-panel flex-grow-1 p-0 overflow-hidden d-flex flex-column border-0">
						<div
							className="px-3 py-2 border-bottom"
							style={{
								borderColor: 'rgba(56, 189, 248, 0.1)',
								background: 'rgba(255, 255, 255, 0.02)'
							}}
						>
							<span className="font-monospace text-secondary small">
								INPUT_STREAM // JSON
							</span>
						</div>
						<div
							className="flex-grow-1 mt-2 w-100"
							style={{ minHeight: '50vh' }}
						>
							<Editor
								height="calc(100vh - 230px)"
								language="json"
								value={jsonInput}
								onChange={(val) => setJsonInput(val || '')}
								theme="myDarkTheme"
								options={editorOptions}
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
							/>
						</div>
					</div>
				</Col>

				<Col lg={6} className="d-flex flex-column p-0 ps-lg-2">
					<div className="glass-panel flex-grow-1 p-0 overflow-hidden d-flex flex-column border-0">
						<div
							className="px-3 py-2 border-bottom"
							style={{
								borderColor: 'rgba(56, 189, 248, 0.1)',
								background: 'rgba(255, 255, 255, 0.02)'
							}}
						>
							<span
								className="font-monospace text-secondary small"
								style={{ color: '#d60101' }}
							>
								OUTPUT_MODELS // {language.toUpperCase()}
							</span>
						</div>
						<div
							className="flex-grow-1 mt-2 w-100"
							style={{ minHeight: '50vh' }}
						>
							<Editor
								height="calc(100vh - 230px)"
								language={
									language === 'csharp'
										? 'csharp'
										: language === 'rust'
											? 'rust'
											: language === 'swift'
												? 'swift'
												: language === 'go'
													? 'go'
													: language === 'python'
														? 'python'
														: language === 'java'
															? 'java'
															: language ===
																  'dart'
																? 'dart'
																: 'typescript'
								}
								value={generatedCode}
								theme="myDarkTheme"
								options={{ ...editorOptions, readOnly: true }}
							/>
						</div>
					</div>
				</Col>
			</Row>

			<Modal
				show={showOptModal}
				onHide={() => setShowOptModal(false)}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title
						className="font-monospace"
						style={{
							letterSpacing: '1px',
							color: 'var(--theme-color)'
						}}
					>
						SELECT OPTIONAL FIELDS
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{availableKeys.length === 0 ? (
						<div className="text-muted font-monospace">
							No fields found in JSON.
						</div>
					) : (
						<div
							className="d-flex flex-column gap-3"
							style={{ maxHeight: '400px', overflowY: 'auto' }}
						>
							{availableKeys.map((key) => (
								<Form.Check
									key={key}
									type="checkbox"
									id={`opt-key-${key}`}
									label={key}
									checked={optionalFields.includes(key)}
									onChange={(e) => {
										if (e.target.checked) {
											setOptionalFields([
												...optionalFields,
												key
											]);
										} else {
											setOptionalFields(
												optionalFields.filter(
													(k) => k !== key
												)
											);
										}
									}}
									className="hud-switch text-light font-monospace"
								/>
							))}
						</div>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="none"
						className="hud-btn-secondary fw-bold"
						onClick={() => setShowOptModal(false)}
					>
						[ DONE ]
					</Button>
				</Modal.Footer>
			</Modal>
		</div>
	);
}

export default JSONModelGenerator;
