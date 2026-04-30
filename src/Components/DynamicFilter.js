import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Row, ProgressBar, Dropdown } from 'react-bootstrap';
import {
	getDatabaseMeta,
	getDbChunk,
	writeDbChunk,
	writeDbMeta
} from '../Tools/clientDatabase';
import { processCsvExport } from '../Tools/exportUtils';

const MAX_TOGGLE_OPTIONS = 7;
const MAX_DROPDOWN_OPTIONS = 15;
const MAX_SEARCHABLE_OPTIONS = 1000;

function getFieldMeta(data) {
	const meta = {};
	if (!data || !data.length) return meta;

	const fields = Object.keys(data[0]);

	const sampleSize = Math.min(data.length, 5000);

	fields.forEach((field) => {
		const uniqueSet = new Set();
		let allNumbers = true;
		let allDates = true;

		for (let i = 0; i < sampleSize; i++) {
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
				uniqueSet.size > MAX_SEARCHABLE_OPTIONS
			) {
				break;
			}
		}

		const uniqueValues = Array.from(uniqueSet);

		let type = 'text';
		if (allNumbers) type = 'number';
		else if (allDates) type = 'date';
		else if (uniqueValues.length <= MAX_TOGGLE_OPTIONS) type = 'toggle';
		else if (uniqueValues.length <= MAX_SEARCHABLE_OPTIONS)
			type = 'dropdown';
		else type = 'dropdown-unsupported';

		meta[field] = {
			values: uniqueValues,
			count: uniqueValues.length,
			type
		};
	});

	return meta;
}

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
		dropdownSearch: '',
		toggleValues: []
	};
}

function DynamicFilter({
	data,
	onFiltered,
	filteredData,
	dbBaseId,
	isDbPaginated
}) {
	const [filters, setFilters] = useState([createFilter()]);
	const [isFiltering, setIsFiltering] = useState(false);
	const [filterProgress, setFilterProgress] = useState(0);
	const [exportProgress, setExportProgress] = useState(0);

	const fieldMeta = useMemo(() => getFieldMeta(data), [data]);

	useEffect(() => {
		if (!onFiltered || !data) return;

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

			if (filter.type === 'number') {
				const num = parseFloat(value);
				if (Number.isNaN(num)) return false;

				if (filter.numberMinNum !== null && num < filter.numberMinNum)
					return false;
				if (filter.numberMaxNum !== null && num > filter.numberMaxNum)
					return false;

				return true;
			}

			if (filter.type === 'date') {
				const dateValue = Date.parse(String(value));
				if (Number.isNaN(dateValue)) return false;

				if (filter.dateFromNum && dateValue < filter.dateFromNum)
					return false;
				if (filter.dateToNum && dateValue > filter.dateToNum)
					return false;

				return true;
			}

			if (filter.type === 'dropdown') {
				if (meta.count > MAX_SEARCHABLE_OPTIONS) {
					if (!filter.textLower) return true;

					return String(value)
						.toLowerCase()
						.includes(filter.textLower);
				}

				if (!filter.dropdown) return true;
				return String(value) === String(filter.dropdown);
			}

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

			if (!filter.textLower) return true;

			return String(value).toLowerCase().includes(filter.textLower);
		};

		const hasActiveFilters = preparedFilters.some((f) => f.field);

		if (!hasActiveFilters) {
			onFiltered(data, false);
			setIsFiltering(false);
			setFilterProgress(0);
			return;
		}

		setIsFiltering(true);
		let isCancelled = false;

		const processFiltering = async () => {
			const CHUNK_SIZE = 10000;

			if (isDbPaginated && dbBaseId) {
				const FILTER_BASE_ID = 'dashboard_filtered_sheet';
				let chunkIndex = 0;
				let buffer = [];
				let totalFiltered = 0;

				const flushBuffer = async (force = false) => {
					while (buffer.length >= 20000) {
						const chunkData = buffer.slice(0, 20000);
						buffer = buffer.slice(20000);
						await writeDbChunk(
							FILTER_BASE_ID,
							chunkIndex,
							chunkData
						);
						chunkIndex++;
					}
					if (force && buffer.length > 0) {
						await writeDbChunk(FILTER_BASE_ID, chunkIndex, buffer);
						chunkIndex++;
						buffer = [];
					}
				};

				const meta = await getDatabaseMeta(dbBaseId);
				if (meta && meta.chunks) {
					for (let i = 0; i < meta.chunks; i++) {
						if (isCancelled) return;
						const chunk = await getDbChunk(dbBaseId, i);
						const filteredChunk = chunk.filter((row) => {
							let result = evaluateFilter(
								preparedFilters[0],
								row
							);
							for (let j = 1; j < preparedFilters.length; j++) {
								const f = preparedFilters[j];
								const next = evaluateFilter(f, row);
								result =
									f.operator === 'or'
										? result || next
										: result && next;
							}
							return result;
						});

						buffer.push(...filteredChunk);
						totalFiltered += filteredChunk.length;
						await flushBuffer();

						await new Promise((resolve) => setTimeout(resolve, 0));
						setFilterProgress(
							Math.round(((i + 1) / meta.chunks) * 100)
						);
					}

					if (isCancelled) return;
					await flushBuffer(true);
					await writeDbMeta(
						FILTER_BASE_ID,
						chunkIndex,
						totalFiltered
					);

					if (!isCancelled) {
						onFiltered(
							{
								isDb: true,
								baseId: FILTER_BASE_ID,
								totalRows: totalFiltered
							},
							true
						);
						setIsFiltering(false);
						setFilterProgress(0);
					}
				}
			} else {
				let resultArr = [];
				for (let i = 0; i < data.length; i += CHUNK_SIZE) {
					if (isCancelled) return;

					const chunk = data.slice(i, i + CHUNK_SIZE);
					const filteredChunk = chunk.filter((row) => {
						let result = evaluateFilter(preparedFilters[0], row);

						for (let j = 1; j < preparedFilters.length; j++) {
							const f = preparedFilters[j];
							const next = evaluateFilter(f, row);
							result =
								f.operator === 'or'
									? result || next
									: result && next;
						}
						return result;
					});

					resultArr.push(...filteredChunk);
					await new Promise((resolve) => setTimeout(resolve, 0));
					setFilterProgress(
						Math.round(
							(Math.min(i + CHUNK_SIZE, data.length) /
								data.length) *
								100
						)
					);
				}

				if (!isCancelled) {
					onFiltered(resultArr, true);
					setIsFiltering(false);
					setFilterProgress(0);
				}
			}
		};

		processFiltering();

		return () => {
			isCancelled = true;
			setFilterProgress(0);
		};
	}, [data, filters, fieldMeta, onFiltered, dbBaseId, isDbPaginated]);

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
			if (meta.count > MAX_SEARCHABLE_OPTIONS) {
				return (
					<div>
						<div className="text-warning mb-2">
							Searchable Pick Option is not supported for fields
							with more than {MAX_SEARCHABLE_OPTIONS} unique
							values.
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

			const searchTerm = (filter.dropdownSearch || '').toLowerCase();
			const filteredOptions = meta.values.filter((v) =>
				String(v).toLowerCase().includes(searchTerm)
			);
			const displayOptions = searchTerm
				? filteredOptions.slice(0, 100)
				: filteredOptions.slice(0, MAX_DROPDOWN_OPTIONS);

			return (
				<Dropdown>
					<Dropdown.Toggle
						variant="outline-light"
						className="w-100 text-start d-flex justify-content-between align-items-center"
					>
						<span className="text-truncate me-2">
							{filter.dropdown || 'Select option...'}
						</span>
					</Dropdown.Toggle>
					<Dropdown.Menu
						className="w-100 bg-dark border-secondary p-2"
						style={{ maxHeight: '300px', overflowY: 'auto' }}
					>
						<Form.Control
							type="text"
							placeholder="Search options..."
							className="mb-2 bg-secondary text-light border-dark"
							value={filter.dropdownSearch || ''}
							onChange={(e) =>
								updateFilter(filter.id, {
									dropdownSearch: e.target.value
								})
							}
							onClick={(e) => e.stopPropagation()}
							autoFocus
						/>
						{filter.dropdown && (
							<Dropdown.Item
								className="text-warning mb-1"
								onClick={() =>
									updateFilter(filter.id, {
										dropdown: '',
										dropdownSearch: ''
									})
								}
							>
								Clear Selection
							</Dropdown.Item>
						)}

						{displayOptions.length > 0 ? (
							displayOptions.map((value) => (
								<Dropdown.Item
									key={value}
									className="text-light"
									onClick={() =>
										updateFilter(filter.id, {
											dropdown: value,
											dropdownSearch: ''
										})
									}
									style={{
										borderBottom:
											'1px solid rgba(255,255,255,0.05)'
									}}
								>
									{value}
								</Dropdown.Item>
							))
						) : (
							<div className="text-muted small p-2">
								No matches found
							</div>
						)}

						{!searchTerm &&
							filteredOptions.length > MAX_DROPDOWN_OPTIONS && (
								<div
									className="text-muted small p-2 text-center"
									style={{ cursor: 'pointer' }}
									onClick={(e) => {
										e.stopPropagation();
										document
											.querySelector(
												`input[placeholder="Search options..."]`
											)
											.focus();
									}}
								>
									Search to see{' '}
									{filteredOptions.length -
										MAX_DROPDOWN_OPTIONS}{' '}
									more options
								</div>
							)}
					</Dropdown.Menu>
				</Dropdown>
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

	const handleExport = async () => {
		const hasActiveFilters = filters.some((f) => f.field);

		await processCsvExport({
			isDbPaginated,
			dbBaseId,
			hasActiveFilters,
			filteredData,
			setExportProgress
		});

		setExportProgress(0);
	};

	return (
		<div className="dynamic-filter mb-4 p-3 rounded bg-secondary bg-opacity-10">
			<div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-start gap-2 mb-3">
				<div>
					<h5 className="mb-1 d-flex align-items-center">
						Dynamic Filters
					</h5>
				</div>
				<Button size="sm" onClick={addFilter} variant="success">
					Add filter
				</Button>
				<Button
					size="sm"
					onClick={handleExport}
					variant="success"
					disabled={isFiltering || exportProgress > 0}
				>
					Export
				</Button>

				{isFiltering && filterProgress > 0 && (
					<div
						className="flex-grow-1 d-flex align-items-center"
						style={{ minWidth: '100px' }}
					>
						<ProgressBar
							variant="success"
							striped
							animated
							now={filterProgress}
							label={`Filtering: ${filterProgress}%`}
							style={{
								height: '24px',
								width: '50%',
								borderRadius: '12px',
								fontWeight: 'bold',
								fontSize: '14px'
							}}
							className="custom-progress-bar w-50"
						/>

						{isFiltering && (
							<span
								className="ms-3 spinner-border spinner-border-sm text-info"
								role="status"
								aria-hidden="true"
							></span>
						)}
					</div>
				)}

				{exportProgress > 0 && (
					<div
						className="flex-grow-1 ms-md-3 mt-2 mt-md-0"
						style={{ minWidth: '200px' }}
					>
						<ProgressBar
							variant="success"
							striped
							animated
							now={exportProgress}
							label={`Exporting: ${exportProgress}%`}
							style={{
								height: '24px',
								borderRadius: '12px',
								fontWeight: 'bold',
								fontSize: '14px'
							}}
							className="custom-progress-bar"
						/>
					</div>
				)}
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
											dropdownSearch: '',
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
											dropdownSearch: '',
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
