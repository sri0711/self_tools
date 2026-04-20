import { getDatabaseMeta, getDbChunk } from './clientDatabase';

const formatRow = (row, cols) => {
	return (
		cols
			.map(
				(col) =>
					`"${(row[col] != null ? String(row[col]) : '').replace(/"/g, '""')}"`
			)
			.join(',') + '\n'
	);
};

export const processCsvExport = async ({
	isDbPaginated,
	dbBaseId,
	hasActiveFilters,
	filteredData,
	setExportProgress
}) => {
	let headers = [];

	const downloadCsv = (chunks) => {
		const blob = new Blob(chunks, { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'filtered_data.csv';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	if (isDbPaginated && dbBaseId) {
		const targetBaseId = hasActiveFilters
			? 'dashboard_filtered_sheet'
			: dbBaseId;
		const meta = await getDatabaseMeta(targetBaseId);
		if (!meta || meta.chunks === 0) return;

		const firstChunk = await getDbChunk(targetBaseId, 0);
		if (!firstChunk || firstChunk.length === 0) return;
		headers = Object.keys(firstChunk[0]);

		const csvHeaders =
			headers.map((header) => `"${header}"`).join(',') + '\n';
		const chunks = [csvHeaders];

		for (let i = 0; i < meta.chunks; i++) {
			const chunk = await getDbChunk(targetBaseId, i);
			let chunkString = '';
			for (const row of chunk) {
				chunkString += formatRow(row, headers);
			}
			chunks.push(chunkString);
			await new Promise((resolve) => setTimeout(resolve, 0));
			setExportProgress(Math.round(((i + 1) / meta.chunks) * 100));
		}
		downloadCsv(chunks);
	} else {
		const exportData = filteredData;
		if (!exportData || !exportData.length) return;
		headers = Object.keys(exportData[0]);
		const csvHeaders =
			headers.map((header) => `"${header}"`).join(',') + '\n';
		const chunks = [csvHeaders];

		for (let i = 0; i < exportData.length; i += 5000) {
			const chunk = exportData.slice(i, i + 5000);
			let chunkString = '';
			for (const row of chunk) {
				chunkString += formatRow(row, headers);
			}
			chunks.push(chunkString);
			await new Promise((resolve) => setTimeout(resolve, 0));
			setExportProgress(
				Math.round(
					(Math.min(i + 5000, exportData.length) /
						exportData.length) *
						100
				)
			);
		}
		downloadCsv(chunks);
	}
};
