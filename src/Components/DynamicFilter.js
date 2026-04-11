import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

const MAX_TOGGLE_OPTIONS = 7;
const MAX_DROPDOWN_OPTIONS = 15;

// ---------------- META ----------------
function getFieldMeta(data) {
	const meta = {};
	if (!data || !data.length) return meta;

	const fields = Object.keys(data[0]);

	fields.forEach((field) => {
		const uniqueSet = new Set();
		let allNumbers = true;
		let allDates = true;

		for (let i = 0; i < data.length; i++) {
			const value = data[i][field];
			if (value == null) continue;

			const str = String(value);
			uniqueSet.add(str);

			if (allNumbers) {
				const num = parseFloat(value);
				if (
					value === '' ||
					Number.isNaN(num) ||
					!Number.isFinite(num)
				) {
					allNumbers = false;
				}
			}

			if (allDates) {
				if (Number.isNaN(Date.parse(str))) {
					allDates = false;
				}
			}

			if (
				!allNumbers &&
				!allDates &&
				uniqueSet.size > MAX_DROPDOWN_OPTIONS
			) {
				break; // early exit
			}
		}

		const uniqueValues = Array.from(uniqueSet);

		let type = 'text';
		if (allNumbers) type = 'number';
		else if (allDates) type = 'date';
		else if (uniqueValues.length <= MAX_TOGGLE_OPTIONS) type = 'toggle';
		else if (uniqueValues.length <= MAX_DROPDOWN_OPTIONS) type = 'dropdown';
		else type = 'dropdown-unsupported';

		meta[field] = {
			values: uniqueValues,
			count: uniqueValues.length,
			type
		};
	});

	return meta;
}

// ---------------- FILTER FACTORY ----------------
function createFilter() {
	return {
		id: Date.now() + Math.random(),
		field: '',
		type: 'text',
		operator: 'and',
		text: '',
		numberMin: '',
		numberMax: '',
		dateFrom: '',
		dateTo: '',
		dropdown: '',
		toggleValues: []
	};
}

// ---------------- COMPONENT ----------------
function DynamicFilter({ data, onFiltered, filteredData }) {
	const [filters, setFilters] = useState([createFilter()]);

	const fieldMeta = useMemo(() => getFieldMeta(data), [data]);

	useEffect(() => {
		if (!onFiltered) return;

		// ✅ preprocess filters ONCE
		const preparedFilters = filters.map((f) => ({
			...f,
			textLower: f.text.trim().toLowerCase(),
			numberMinNum: f.numberMin !== '' ? Number(f.numberMin) : null,
			numberMaxNum: f.numberMax !== '' ? Number(f.numberMax) : null,
			dateFromNum: f.dateFrom ? Date.parse(f.dateFrom) : null,
			dateToNum: f.dateTo ? Date.parse(f.dateTo) : null
		}));

		const evaluateFilter = (filter, row) => {
			if (!filter.field) return true;

			const meta = fieldMeta[filter.field];
			if (!meta) return true;

			const rawValue = row[filter.field];
			const value = rawValue != null ? rawValue : '';

			// NUMBER
			if (filter.type === 'number') {
				const num = parseFloat(value);
				if (Number.isNaN(num)) return false;

				if (filter.numberMinNum !== null && num < filter.numberMinNum)
					return false;
				if (filter.numberMaxNum !== null && num > filter.numberMaxNum)
					return false;

				return true;
			}

			// DATE
			if (filter.type === 'date') {
				const dateValue = Date.parse(String(value));
				if (Number.isNaN(dateValue)) return false;

				if (filter.dateFromNum && dateValue < filter.dateFromNum)
					return false;
				if (filter.dateToNum && dateValue > filter.dateToNum)
					return false;

				return true;
			}

			// DROPDOWN
			if (filter.type === 'dropdown') {
				if (meta.count > MAX_DROPDOWN_OPTIONS) {
					if (!filter.textLower) return true;

					return String(value)
						.toLowerCase()
						.includes(filter.textLower);
				}

				if (!filter.dropdown) return true;
				return String(value) === String(filter.dropdown);
			}

			// TOGGLE
			if (filter.type === 'toggle') {
				if (meta.count > MAX_TOGGLE_OPTIONS) {
					if (!filter.textLower) return true;

					return String(value)
						.toLowerCase()
						.includes(filter.textLower);
				}

				if (!filter.toggleValues.length) return true;

				if (Array.isArray(value)) {
					return value.some((item) =>
						filter.toggleValues.includes(String(item))
					);
				}

				return filter.toggleValues.includes(String(value));
			}

			// TEXT
			if (!filter.textLower) return true;

			return String(value).toLowerCase().includes(filter.textLower);
		};

		const filtered = data.filter((row) => {
			if (!preparedFilters.length) return true;

			let result = evaluateFilter(preparedFilters[0], row);

			for (let i = 1; i < preparedFilters.length; i++) {
				const f = preparedFilters[i];
				const next = evaluateFilter(f, row);

				result = f.operator === 'or' ? result || next : result && next;
			}

			return result;
		});

		onFiltered(filtered);
	}, [data, filters, fieldMeta, onFiltered]);

	const addFilter = () => {
		setFilters((current) => [...current, createFilter()]);
	};

	const updateFilter = (id, changes) => {
		setFilters((current) =>
			current.map((filter) =>
				filter.id === id ? { ...filter, ...changes } : filter
			)
		);
	};

	const removeFilter = (id) => {
		setFilters((current) => current.filter((filter) => filter.id !== id));
	};

	const renderFilterInput = (filter) => {
		const meta = filter.field ? fieldMeta[filter.field] : null;
		if (!filter.field) return <></>;

		if (!meta) {
			return (
				<div className="text-danger">
					No metadata available for this field.
				</div>
			);
		}

		if (filter.type === 'number') {
			return (
				<Row className="g-2">
					<Col xs={6}>
						<Form.Control
							type="number"
							placeholder="Min"
							value={filter.numberMin}
							onChange={(e) =>
								updateFilter(filter.id, {
									numberMin: e.target.value
								})
							}
						/>
					</Col>
					<Col xs={6}>
						<Form.Control
							type="number"
							placeholder="Max"
							value={filter.numberMax}
							onChange={(e) =>
								updateFilter(filter.id, {
									numberMax: e.target.value
								})
							}
						/>
					</Col>
				</Row>
			);
		}

		if (filter.type === 'date') {
			return (
				<Row className="g-2">
					<Col xs={6}>
						<Form.Control
							type="date"
							value={filter.dateFrom}
							onChange={(e) =>
								updateFilter(filter.id, {
									dateFrom: e.target.value
								})
							}
						/>
					</Col>
					<Col xs={6}>
						<Form.Control
							type="date"
							value={filter.dateTo}
							onChange={(e) =>
								updateFilter(filter.id, {
									dateTo: e.target.value
								})
							}
						/>
					</Col>
				</Row>
			);
		}

		if (filter.type === 'dropdown') {
			if (meta.count > MAX_DROPDOWN_OPTIONS) {
				return (
					<div>
						<div className="text-warning mb-2">
							Dropdown is not supported for fields with more than{' '}
							{MAX_DROPDOWN_OPTIONS} unique values.
						</div>
						<Form.Control
							type="text"
							placeholder="Search value"
							value={filter.text}
							onChange={(e) =>
								updateFilter(filter.id, {
									text: e.target.value
								})
							}
						/>
					</div>
				);
			}

			return (
				<Form.Select
					value={filter.dropdown}
					onChange={(e) =>
						updateFilter(filter.id, { dropdown: e.target.value })
					}
				>
					<option value="">Select value</option>
					{meta.values.map((value) => (
						<option key={value} value={value}>
							{value}
						</option>
					))}
				</Form.Select>
			);
		}

		if (filter.type === 'toggle') {
			if (meta.count > MAX_TOGGLE_OPTIONS) {
				return (
					<div>
						<div className="text-warning mb-2">
							Toggle is not supported for fields with more than{' '}
							{MAX_TOGGLE_OPTIONS} unique values.
						</div>
						<Form.Control
							type="text"
							placeholder="Search value"
							value={filter.text}
							onChange={(e) =>
								updateFilter(filter.id, {
									text: e.target.value
								})
							}
						/>
					</div>
				);
			}

			return (
				<div className="d-flex flex-wrap gap-2">
					{meta.values.map((value) => (
						<Button
							key={value}
							variant={
								filter.toggleValues.includes(value)
									? 'light'
									: 'outline-light'
							}
							size="sm"
							onClick={() => {
								const nextValues = filter.toggleValues.includes(
									value
								)
									? filter.toggleValues.filter(
											(item) => item !== value
										)
									: [...filter.toggleValues, value];

								updateFilter(filter.id, {
									toggleValues: nextValues
								});
							}}
						>
							{value}
						</Button>
					))}
				</div>
			);
		}

		return (
			<Form.Control
				type="text"
				placeholder="Search text"
				value={filter.text}
				onChange={(e) =>
					updateFilter(filter.id, { text: e.target.value })
				}
			/>
		);
	};

	const ExportHandle = () => {
		const data = filteredData;
		if (!data || !data.length) {
			return;
		}
		let headers = Object.keys(data[0]);
		headers = headers.map((header) => `"${header}"`);
		let csvString = headers.join(',') + '\n';

		data.forEach((row) => {
			const values = headers.map((header) => {
				const key = header.replace(/"/g, '');
				const value = row[key] != null ? String(row[key]) : '';
				return `"${value.replace(/"/g, '""')}"`;
			});
			csvString += values.join(',') + '\n';
		});
		const link = document.createElement('a');
		link.href =
			'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString);
		link.download = 'filtered_data.csv';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="dynamic-filter mb-4 p-3 rounded bg-secondary bg-opacity-10">
			<div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-start gap-2 mb-3">
				<div>
					<h5 className="mb-1">Dynamic Filters</h5>
				</div>
				<Button size="sm" onClick={addFilter} variant="success">
					Add filter
				</Button>
				<Button size="sm" onClick={ExportHandle} variant="success">
					Export
				</Button>
			</div>

			{filters.map((filter, index) => (
				<div
					key={filter.id}
					className="filter-row p-3 mb-3 rounded bg-dark bg-opacity-10"
				>
					<Row className="g-3 align-items-end">
						<Col md={3}>
							<Form.Group>
								<Form.Label>Field</Form.Label>
								<Form.Select
									value={filter.field}
									onChange={(e) =>
										updateFilter(filter.id, {
											field: e.target.value,
											text: '',
											numberMin: '',
											numberMax: '',
											dateFrom: '',
											dateTo: '',
											dropdown: '',
											toggleValues: []
										})
									}
								>
									<option value="">Select field</option>
									{Object.keys(fieldMeta).map((field) => (
										<option key={field} value={field}>
											{field}
										</option>
									))}
								</Form.Select>
							</Form.Group>
						</Col>

						<Col md={2}>
							<Form.Group>
								<Form.Label>Type</Form.Label>
								<Form.Select
									value={filter.type}
									onChange={(e) =>
										updateFilter(filter.id, {
											type: e.target.value,
											text: '',
											numberMin: '',
											numberMax: '',
											dateFrom: '',
											dateTo: '',
											dropdown: '',
											toggleValues: []
										})
									}
								>
									<option value="text">Fuzzy Search</option>
									<option value="number">Number Range</option>
									<option value="date">Date Between</option>
									<option value="dropdown">
										Pick Option
									</option>
									<option value="toggle">Toggle</option>
								</Form.Select>
							</Form.Group>
						</Col>

						<Col md={4}>{renderFilterInput(filter)}</Col>

						<Col md={3} className="d-flex flex-column gap-2">
							{index > 0 && (
								<Form.Group>
									<Form.Label>Join With</Form.Label>
									<Form.Select
										value={filter.operator}
										onChange={(e) =>
											updateFilter(filter.id, {
												operator: e.target.value
											})
										}
									>
										<option value="and">AND</option>
										<option value="or">OR</option>
									</Form.Select>
								</Form.Group>
							)}

							<Button
								variant="danger"
								size="sm"
								onClick={() => removeFilter(filter.id)}
							>
								Remove
							</Button>
						</Col>
					</Row>
				</div>
			))}
		</div>
	);
}

export default DynamicFilter;
