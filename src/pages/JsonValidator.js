import React, { useState, useRef, useEffect } from 'react';
import { Button, Row, Col, Modal } from 'react-bootstrap';
import Editor from '@monaco-editor/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCurrentScreen } from '../redux/userSettings';
import { setJsonData } from '../redux/JsonHandler';
import '../Styles/JsonValidator.css';

function JsonValidator({ onMenuClick }) {
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [jsonInput, setJsonInput] = useState(
		location.state?.jsonInput ||
			'{\n  unquotedKey: \'single quoted value\',\n  "validKey": true,\n "number" 2 \n "trailingComma": "error",\n}'
	);
	const [markers, setMarkers] = useState([]);
	const [alertMsg, setAlertMsg] = useState('');
	const editorRef = useRef(null);

	useEffect(() => {
		if (location.state?.jsonInput) {
			setJsonInput(location.state.jsonInput);
		}
	}, [location.state]);

	const handleEditorValidation = (editorMarkers) => {
		setMarkers(editorMarkers);
	};

	const fixBasicJson = () => {
		if (!editorRef.current) return;
		let currentVal = editorRef.current.getValue();

		// 1. Replace single quotes in string values with double quotes
		let newVal = currentVal.replace(/:\s*'([^']*)'/g, ': "$1"');
		// 2. Replace single quotes in keys
		newVal = newVal.replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":');
		// 3. Quote unquoted keys (basic alphanumeric)
		newVal = newVal.replace(/(^|[{,\s])([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
		// 4. Remove trailing commas
		newVal = newVal.replace(/,\s*([}\]])/g, '$1');

		try {
			const parsed = JSON.parse(newVal);
			const formatted = JSON.stringify(parsed, null, 4);
			editorRef.current.setValue(formatted);
			setAlertMsg('Successfully fixed and formatted JSON!');
		} catch (e) {
			editorRef.current.setValue(newVal);
			setAlertMsg(
				'Applied basic fixes, but the JSON is still invalid. Please check the error log.'
			);
		}
	};

	const formatJson = () => {
		if (!editorRef.current) return;
		try {
			const parsed = JSON.parse(editorRef.current.getValue());
			const formatted = JSON.stringify(parsed, null, 4);
			editorRef.current.setValue(formatted);
		} catch (e) {
			setAlertMsg('Cannot format. JSON contains syntax errors.');
		}
	};

	const handleToEditor = () => {
		try {
			const parsed = JSON.parse(editorRef.current.getValue());
			dispatch(setJsonData(parsed));
			dispatch(setCurrentScreen('/viewer'));
			navigate('/viewer');
		} catch {
			setAlertMsg(
				'JSON is invalid. Please fix errors before sending to the Editor.'
			);
		}
	};

	return (
		<div className="p-4 tool-page-bg theme-blue d-flex flex-column vh-100 overflow-hidden">
			<div className="glass-panel py-2 px-3 mb-3 d-flex flex-wrap align-items-center justify-content-between border-0 flex-shrink-0">
				<div className="d-flex align-items-center">
					<span className="font-monospace text-secondary small">
						INPUT_STREAM // JSON_VALIDATOR
					</span>
				</div>
				<div className="d-flex align-items-center gap-3">
					<Button
						variant="none"
						className="hud-btn-secondary fw-bold px-4 py-2"
						onClick={onMenuClick}
					>
						[ ☰ MENU ]
					</Button>
				</div>
			</div>

			<Row
				className="flex-grow-1 m-0 p-0 overflow-hidden"
				style={{ minHeight: 0 }}
			>
				<Col
					lg={8}
					className="d-flex flex-column p-0 pe-lg-2 gap-3 h-100"
				>
					<div
						className="glass-panel p-0 overflow-hidden d-flex flex-column border-0"
						style={{ flex: 1, minHeight: 0 }}
					>
						<div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center validator-panel-header">
							<span
								className="font-monospace small"
								style={{ color: '#60a5fa' }}
							>
								EDITOR // VALIDATION_LAYER
							</span>
							<div className="d-flex gap-2">
								<Button
									variant="none"
									className="hud-btn-secondary fw-bold py-0 px-3"
									style={{ fontSize: '0.8rem' }}
									onClick={formatJson}
								>
									[ FORMAT ]
								</Button>
								<Button
									variant="none"
									className="hud-btn-secondary fw-bold py-0 px-3 validator-action-btn"
									onClick={fixBasicJson}
								>
									[ AUTO-FIX ERRORS ]
								</Button>
							</div>
						</div>
						<div className="flex-grow-1 w-100 position-relative overflow-hidden">
							<Editor
								height="100%"
								language="json"
								value={jsonInput}
								onChange={(val) => setJsonInput(val || '')}
								onValidate={handleEditorValidation}
								theme="myDarkTheme"
								options={{
									minimap: { enabled: false },
									fontSize: 14,
									padding: { top: 16, bottom: 16 },
									scrollBeyondLastLine: false,
									automaticLayout: true,
									formatOnPaste: true
								}}
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
								onMount={(editor) => {
									editorRef.current = editor;
								}}
							/>
						</div>
					</div>
				</Col>

				<Col
					lg={4}
					className="d-flex flex-column p-0 ps-lg-2 gap-3 h-100"
				>
					<div className="glass-panel p-0 overflow-hidden d-flex flex-column border-0 h-100">
						<div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center validator-panel-header">
							<span className="font-monospace text-secondary small">
								SYSTEM_LOG // ERROR_REPORT
							</span>
							<Button
								variant="none"
								className="hud-btn-secondary fw-bold py-0 px-2"
								style={{ fontSize: '0.75rem' }}
								onClick={handleToEditor}
							>
								↗ JSON EDITOR
							</Button>
						</div>

						<div className="flex-grow-1 p-3 overflow-auto validator-log-container">
							{markers.length === 0 ? (
								<div className="d-flex flex-column align-items-center justify-content-center h-100 opacity-50">
									<div className="fs-1 mb-3 validator-shield">
										🛡️
									</div>
									<div className="font-monospace fw-bold validator-passed-text">
										[ VALIDATION_PASSED ]
									</div>
									<div className="font-monospace text-secondary small mt-2 text-center">
										No syntax errors detected in JSON.
									</div>
								</div>
							) : (
								<div className="d-flex flex-column gap-2">
									<div className="font-monospace text-danger small mb-2 fw-bold">
										{markers.length} ERROR(S) DETECTED:
									</div>
									{markers.map((m, i) => (
										<div
											key={i}
											className={`p-2 rounded fade-in d-flex justify-content-between align-items-center validator-error-card ${m.severity === 8 ? 'error-severe' : 'error-warning'}`}
										>
											<div>
												<span
													className={`font-monospace small validator-line-text ${m.severity === 8 ? 'error-severe' : 'error-warning'}`}
												>
													[ LINE {m.startLineNumber} ]
												</span>
												<span
													className="text-light ms-2"
													style={{
														fontSize: '0.85rem'
													}}
												>
													{m.message}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</Col>
			</Row>

			<Modal
				show={!!alertMsg}
				onHide={() => setAlertMsg('')}
				centered
				contentClassName="bg-transparent border-0"
			>
				<div className="glass-panel system-alert-panel theme-blue-alert">
					<div className="p-3 d-flex justify-content-between align-items-center system-alert-header">
						<span className="font-monospace small fw-bold alert-text">
							SYSTEM_ALERT // NOTICE
						</span>
						<Button
							variant="none"
							className="p-0 m-0 fs-5 lh-1 alert-text border-0"
							onClick={() => setAlertMsg('')}
						>
							&times;
						</Button>
					</div>
					<div className="p-4 text-light font-monospace fs-6">
						{alertMsg}
					</div>
					<div className="p-3 text-end system-alert-footer">
						<Button
							variant="none"
							className="hud-btn-secondary fw-bold"
							onClick={() => setAlertMsg('')}
						>
							[ ACKNOWLEDGE ]
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}

export default JsonValidator;
