import React, { useMemo, useState } from 'react';
import {
	Modal,
	Button,
	Form,
	Alert,
	Spinner,
	ProgressBar
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { setFileHandlerModal } from '../redux/userSettings';
import { setDashboardData } from '../redux/dashBoardHandler';
import { storeLargeData, storeChunkedData } from '../Tools/clientDatabase';
import { parseFile } from '../Tools/fileParser';

function FileHandlerModel() {
	const userSetting = useSelector((state) => state.user_settings.value);
	const dispatch = useDispatch();

	const [file, setFile] = useState(null);
	const [parsedData, setParsedData] = useState(null);
	const [selectedSheet, setSelectedSheet] = useState('');
	const [previewOpen, setPreviewOpen] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState('');

	const acceptedExtensions = '.xls,.xlsx,.csv,.ods';

	const resetState = () => {
		setFile(null);
		setParsedData(null);
		setSelectedSheet('');
		setPreviewOpen(false);
		setError('');
		setLoading(false);
		setProgress(0);
		setStatusText('');
	};

	const closeModal = () => {
		resetState();
		dispatch(setFileHandlerModal());
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
		setProgress(0);
		setStatusText('Parsing file...');

		await new Promise((resolve) => setTimeout(resolve, 50));

		try {
			const { sheets, defaultSheetName } = await parseFile(
				selected,
				setProgress,
				setStatusText
			);

			setParsedData(sheets);
			setSelectedSheet(defaultSheetName);
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

		const data = parsedData[selectedSheet];
		const isArray = Array.isArray(data);
		const previewLimit = 100;

		const previewData = isArray ? data.slice(0, previewLimit) : data;
		const jsonString = JSON.stringify(previewData, null, 2);

		return isArray && data.length > previewLimit
			? `${jsonString}\n\n... and ${data.length - previewLimit} more rows (truncated for preview to prevent browser crash)`
			: jsonString;
	}, [parsedData, selectedSheet]);

	const handleDataImport = async () => {
		if (!parsedData || !selectedSheet) return;

		setLoading(true);
		setStatusText('Storing data to browser database...');
		setProgress(0);
		await new Promise((resolve) => setTimeout(resolve, 50));

		const dataToImport = parsedData[selectedSheet];
		const isArray = Array.isArray(dataToImport);

		if (isArray) {
			await storeChunkedData(
				'dashboard_active_sheet',
				dataToImport,
				setProgress
			);
		} else {
			await storeLargeData('dashboard_active_sheet', dataToImport);
		}

		dispatch(
			setDashboardData({
				isLarge: true,
				totalRows: isArray ? dataToImport.length : 1,
				timestamp: Date.now()
			})
		);
		closeModal();
	};

	const handlePasteData = async () => {
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

		const dataArr = Array.isArray(writeData) ? writeData : [writeData];
		setLoading(true);
		setStatusText('Pasting to database...');
		setProgress(0);
		await storeChunkedData('dashboard_active_sheet', dataArr, setProgress);
		dispatch(
			setDashboardData({
				isLarge: true,
				totalRows: dataArr.length,
				timestamp: Date.now()
			})
		);
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
					<div className="mb-3">
						<div className="d-flex align-items-center gap-2 mb-2">
							<Spinner animation="border" size="sm" />
							<span>{statusText || 'Processing...'}</span>
						</div>
						{progress > 0 && (
							<ProgressBar
								variant="success"
								striped
								animated
								now={progress}
								label={`${progress}%`}
								style={{
									height: '24px',
									borderRadius: '12px',
									fontWeight: 'bold',
									fontSize: '14px'
								}}
							/>
						)}
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
					<Button variant="primary" onClick={handleDataImport}>
						Import to Dashboard
					</Button>
				)}{' '}
				{!parsedData && !selectedSheet && (
					<Button variant="primary" onClick={handlePasteData}>
						Paste to Dashboard
					</Button>
				)}
			</Modal.Footer>
		</Modal>
	);
}

export default FileHandlerModel;
