import React, { useMemo, useState } from 'react';
import Table from 'react-bootstrap/Table';

function JsonTable({ data }) {
	const [sortField, setSortField] = useState(null);
	const [sortDirection, setSortDirection] = useState('asc');

	const columns = useMemo(() => {
		return data && data.length > 0 ? Object.keys(data[0]) : [];
	}, [data]);

	const sortedData = useMemo(() => {
		if (!data || data.length === 0 || !sortField) return data || [];

		return [...data].sort((a, b) => {
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
	}, [data, sortField, sortDirection]);

	const handleSort = (column) => {
		if (sortField === column) {
			setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortField(column);
			setSortDirection('asc');
		}
	};

	return (
		<div className="table-responsive w-100">
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
	);
}

export default JsonTable;
