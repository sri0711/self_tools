import { useMemo, useState, useEffect } from 'react';
import Table from 'react-bootstrap/Table';

function JsonTable({
	data,
	serverPagination,
	totalServerRows,
	currentServerPage,
	onServerPageChange
}) {
	const [sortField, setSortField] = useState(null);
	const [sortDirection, setSortDirection] = useState('asc');
	const [localPage, setLocalPage] = useState(1);
	const rowsPerPage = 100;

	useEffect(() => {
		setLocalPage(1);
	}, [data, serverPagination]);

	const currentPage = serverPagination ? currentServerPage : localPage;
	const totalEntries = serverPagination ? totalServerRows : data?.length || 0;
	const totalPages = Math.ceil(totalEntries / rowsPerPage);

	const handlePageChange = (newPage) => {
		if (serverPagination && onServerPageChange) {
			onServerPageChange(newPage);
		} else {
			setLocalPage(newPage);
		}
	};

	const columns = useMemo(() => {
		return data && data.length > 0 ? Object.keys(data[0]) : [];
	}, [data]);

	// Slice first to prevent browser memory crash on massive data
	const paginatedChunk = useMemo(() => {
		if (!data || data.length === 0) return [];
		if (serverPagination) return data;
		const startIndex = (currentPage - 1) * rowsPerPage;
		return data.slice(startIndex, startIndex + rowsPerPage);
	}, [data, currentPage, serverPagination]);

	const sortedData = useMemo(() => {
		if (!paginatedChunk || paginatedChunk.length === 0 || !sortField)
			return paginatedChunk || [];

		return [...paginatedChunk].sort((a, b) => {
			const aValue = a[sortField] ?? '';
			const bValue = b[sortField] ?? '';
			const aString = String(aValue);
			const bString = String(bValue);
			const aNumber = parseFloat(aString);
			const bNumber = parseFloat(bString);
			let result = 0;

			if (!Number.isNaN(aNumber) && !Number.isNaN(bNumber)) {
				result = aNumber - bNumber;
			} else {
				result = aString.localeCompare(bString, undefined, {
					sensitivity: 'base'
				});
			}

			return sortDirection === 'asc' ? result : -result;
		});
	}, [paginatedChunk, sortField, sortDirection]);

	const handleSort = (column) => {
		if (sortField === column) {
			setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortField(column);
			setSortDirection('asc');
		}
		handlePageChange(1); // Reset to first page on sort
	};

	return (
		<div className="w-100">
			<div className="d-flex justify-content-between align-items-center mb-2">
				<span className="text-light">
					Showing{' '}
					{totalEntries > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}{' '}
					to {Math.min(currentPage * rowsPerPage, totalEntries)} of{' '}
					{totalEntries} entries
				</span>
				<div>
					<button
						className="btn btn-sm btn-secondary mx-1"
						disabled={currentPage === 1}
						onClick={() => handlePageChange(currentPage - 1)}
					>
						Previous
					</button>
					<span className="text-light mx-2">
						Page {currentPage} of {totalPages || 1}
					</span>
					<button
						className="btn btn-sm btn-secondary mx-1"
						disabled={
							currentPage === totalPages || totalPages === 0
						}
						onClick={() => handlePageChange(currentPage + 1)}
					>
						Next
					</button>
				</div>
			</div>
			<div className="table-responsive">
				<Table striped bordered hover variant="dark" className="mb-0">
					<thead>
						<tr>
							{columns.map((col) => (
								<th key={col}>
									<div className="table-header-cell d-flex align-items-center justify-content-center">
										<span>{col}</span>
										<button
											className={`sort-btn btn btn-sm mx-1 ${sortField === col ? 'active' : ''}`}
											onClick={() => handleSort(col)}
										>
											{sortField === col
												? sortDirection === 'asc'
													? '▲'
													: '▼'
												: '.'}
										</button>
									</div>
								</th>
							))}
						</tr>
					</thead>

					<tbody>
						{sortedData.map((row, i) => (
							<tr key={i}>
								{columns.map((col) => (
									<td key={col}>{String(row[col])}</td>
								))}
							</tr>
						))}
					</tbody>
				</Table>
			</div>
		</div>
	);
}

export default JsonTable;
