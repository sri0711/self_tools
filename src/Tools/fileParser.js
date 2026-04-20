import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const parseFile = async (file, setProgress, setStatusText) => {
	const normalizedName = file.name.toLowerCase();
	let sheets = {};
	let defaultSheetName = '';

	if (normalizedName.endsWith('.csv')) {
		setStatusText('Parsing CSV in background worker...');
		sheets = await new Promise((resolve, reject) => {
			let accumulatedData = [];
			Papa.parse(file, {
				header: true,
				skipEmptyLines: true,
				worker: true,
				chunk: (results) => {
					accumulatedData.push(...results.data);
					if (file.size > 0) {
						setProgress(
							Math.round((results.meta.cursor / file.size) * 100)
						);
					}
				},
				error: reject,
				complete: () => {
					setProgress(100);
					resolve({ [file.name]: accumulatedData });
				}
			});
		});
		defaultSheetName = file.name;
	} else {
		setStatusText('Reading Spreadsheet File...');
		const arrayBuffer = await new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onprogress = (event) => {
				if (event.lengthComputable) {
					setProgress(Math.round((event.loaded / event.total) * 50));
				}
			};
			reader.onload = (e) => resolve(e.target.result);
			reader.onerror = reject;
			reader.readAsArrayBuffer(file);
		});

		setStatusText('Parsing Spreadsheet Data...');
		setProgress(75);
		await new Promise((resolve) => setTimeout(resolve, 50));

		const data = new Uint8Array(arrayBuffer);
		const workbook = XLSX.read(data, { type: 'array', cellDates: true });

		sheets = workbook.SheetNames.reduce((acc, name) => {
			acc[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
				defval: null
			});
			return acc;
		}, {});
		setProgress(100);
		defaultSheetName = workbook.SheetNames[0] || '';
	}

	return { sheets, defaultSheetName };
};
