import React, { useMemo, useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { setFileHandlerModal } from '../redux/userSettings';
import * as XLSX from 'xlsx';
import { setDashboardData } from '../redux/dashBoardHandler';

function FileHandlerModel() {
	const userSetting = useSelector((state) => state.user_settings.value);
	const Dispatch = useDispatch();

	const [file, setFile] = useState(null);
	const [parsedData, setParsedData] = useState(null);
	const [selectedSheet, setSelectedSheet] = useState('');
	const [previewOpen, setPreviewOpen] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const acceptedExtensions = '.xls,.xlsx,.csv,.ods';

	const resetState = () => {
		setFile(null);
		setParsedData(null);
		setSelectedSheet('');
		setPreviewOpen(false);
		setError('');
		setLoading(false);
	};

	const closeModal = () => {
		resetState();
		Dispatch(setFileHandlerModal());
	};

	const handleFileChange = async (event) => {
		setError('');
		setParsedData(null);
		setPreviewOpen(false);

		const selected = event.target.files?.[0];
		if (!selected) {
			setFile(null);
			return;
		}

		const normalizedName = selected.name.toLowerCase();
		if (
			!acceptedExtensions
				.split(',')
				.some((ext) => normalizedName.endsWith(ext))
		) {
			setError('Unsupported file type. Upload XLS, XLSX, CSV or ODS.');
			setFile(null);
			return;
		}

		setFile(selected);
		setLoading(true);

		try {
			const arrayBuffer = await selected.arrayBuffer();
			const workbook = XLSX.read(arrayBuffer, {
				type: 'array',
				cellDates: true
			});

			const sheets = workbook.SheetNames.reduce((acc, name) => {
				acc[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
					defval: null
				});
				return acc;
			}, {});

			setParsedData(sheets);
			setSelectedSheet(workbook.SheetNames[0] || '');
			console.log('Parsed file JSON', sheets);
		} catch (err) {
			console.error('File parse error:', err);
			setError(
				'Unable to parse the selected file. Please choose a valid spreadsheet or CSV file.'
			);
		} finally {
			setLoading(false);
		}
	};

	const previewJson = useMemo(() => {
		if (!parsedData || !selectedSheet) return '';
		return JSON.stringify(parsedData[selectedSheet], null, 2);
	}, [parsedData, selectedSheet]);

	const HandleDataImport = () => {
		if (!parsedData || !selectedSheet) return;
		const dataToImport = parsedData[selectedSheet];
		Dispatch(setDashboardData(dataToImport));
		closeModal();
	};

	const HandlePateData = async () => {
		if (!navigator.clipboard) {
			return;
		}
		const dataFromClipboard = await navigator.clipboard.readText();
		let writeData = null;
		try {
			writeData = JSON.parse(dataFromClipboard);
		} catch {
			writeData = dataFromClipboard;
		}
		if (typeof writeData !== 'object' && !Array.isArray(writeData)) {
			setError('Pasted data must be an array of objects.');
			return;
		}

		Dispatch(setDashboardData(writeData));
		closeModal();
	};

	return (
		<Modal
			show={userSetting.file_handler_modal}
			size="xl"
			onHide={closeModal}
		>
			<Modal.Header closeButton>
				<Modal.Title>Data upload For Dashboard</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<Form.Group controlId="fileUpload" className="mb-3">
					<Form.Label>Select a file</Form.Label>
					<Form.Control
						type="file"
						accept={acceptedExtensions}
						onChange={handleFileChange}
					/>
					<Form.Text className="text-muted">
						Allowed formats: XLS, XLSX, CSV, ODS.
					</Form.Text>
				</Form.Group>

				{error && <Alert variant="danger">{error}</Alert>}

				{file && (
					<Alert variant="info">Selected file: {file.name}</Alert>
				)}

				{loading && (
					<div className="mb-3 d-flex align-items-center gap-2">
						<Spinner animation="border" size="sm" />
						<span>Parsing file...</span>
					</div>
				)}

				{parsedData && (
					<>
						<div className="mb-3 d-flex flex-wrap align-items-center gap-2">
							<div>
								<strong>
									{Object.keys(parsedData).length}
								</strong>{' '}
								sheet(s) parsed.
							</div>
							<Form.Group
								controlId="sheetSelect"
								className="mb-0"
							>
								<Form.Label>Preview sheet</Form.Label>
								<Form.Select
									value={selectedSheet}
									onChange={(e) =>
										setSelectedSheet(e.target.value)
									}
								>
									{Object.keys(parsedData).map(
										(sheetName) => (
											<option
												key={sheetName}
												value={sheetName}
											>
												{sheetName}
											</option>
										)
									)}
								</Form.Select>
							</Form.Group>
							<Button
								variant="secondary"
								onClick={() =>
									setPreviewOpen((current) => !current)
								}
							>
								{previewOpen ? 'Hide preview' : 'Show preview'}
							</Button>
						</div>

						{previewOpen && selectedSheet && (
							<div
								style={{
									maxHeight: '420px',
									overflow: 'auto',
									padding: '1rem',
									background: '#121212',
									color: '#f8f9fa',
									borderRadius: '0.5rem',
									whiteSpace: 'pre-wrap'
								}}
							>
								<pre>{previewJson}</pre>
							</div>
						)}
					</>
				)}
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={closeModal}>
					Close
				</Button>
				{parsedData && selectedSheet && (
					<Button variant="primary" onClick={HandleDataImport}>
						Import to Dashboard
					</Button>
				)}{' '}
				{!parsedData && !selectedSheet && (
					<Button variant="primary" onClick={HandlePateData}>
						Paste to Dashboard
					</Button>
				)}
			</Modal.Footer>
		</Modal>
	);
}

export default FileHandlerModel;
