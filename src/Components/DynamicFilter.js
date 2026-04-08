import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

const MAX_TOGGLE_OPTIONS = 5;
const MAX_DROPDOWN_OPTIONS = 10;

function getFieldMeta(data) {
	const meta = {};
	if (!data || !data.length) return meta;

	const fields = Object.keys(data[0]);
	fields.forEach((field) => {
		const values = data.map((row) => row[field]).filter((v) => v != null);
		const stringValues = values.map((value) => String(value));
		const uniqueValues = [...new Set(stringValues)];

		const allNumbers = values.every((value) => {
			const num = parseFloat(value);
			return value !== '' && !Number.isNaN(num) && Number.isFinite(num);
		});

		const allDates = values.every((value) => {
			const time = Date.parse(String(value));
			return !Number.isNaN(time);
		});

		let type = 'text';
		if (allNumbers) {
			type = 'number';
		} else if (allDates) {
			type = 'date';
		} else if (uniqueValues.length <= MAX_TOGGLE_OPTIONS) {
			type = 'toggle';
		} else if (uniqueValues.length <= MAX_DROPDOWN_OPTIONS) {
			type = 'dropdown';
		} else {
			type = 'dropdown-unsupported';
		}

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
		id: Date.now(),
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

function DynamicFilter({ data, onFiltered }) {
	const [filters, setFilters] = useState([createFilter()]);

	const fieldMeta = useMemo(() => getFieldMeta(data), [data]);

	useEffect(() => {
		const evaluateFilter = (filter, row) => {
			if (!filter.field) return true;
			const meta = fieldMeta[filter.field];
			if (!meta) return true;

			const rawValue = row[filter.field];
			const value = rawValue != null ? rawValue : '';

			if (filter.type === 'number') {
				const num = parseFloat(value);
				if (Number.isNaN(num)) return false;
				if (filter.numberMin !== '' && num < Number(filter.numberMin))
					return false;
				if (filter.numberMax !== '' && num > Number(filter.numberMax))
					return false;
				return true;
			}

			if (filter.type === 'date') {
				const dateValue = Date.parse(String(value));
				if (Number.isNaN(dateValue)) return false;
				if (filter.dateFrom) {
					const from = Date.parse(filter.dateFrom);
					if (dateValue < from) return false;
				}
				if (filter.dateTo) {
					const to = Date.parse(filter.dateTo);
					if (dateValue > to) return false;
				}
				return true;
			}

			if (filter.type === 'dropdown') {
				if (meta.count > MAX_DROPDOWN_OPTIONS) {
					if (filter.text.trim() === '') return true;
					return String(value)
						.toLowerCase()
						.includes(filter.text.trim().toLowerCase());
				}

				if (!filter.dropdown) return true;
				return String(value) === String(filter.dropdown);
			}

			if (filter.type === 'toggle') {
				if (meta.count > MAX_TOGGLE_OPTIONS) {
					if (filter.text.trim() === '') return true;
					return String(value)
						.toLowerCase()
						.includes(filter.text.trim().toLowerCase());
				}

				if (!filter.toggleValues.length) return true;
				if (Array.isArray(value)) {
					return value.some((item) =>
						filter.toggleValues.includes(String(item))
					);
				}
				return filter.toggleValues.includes(String(value));
			}

			if (filter.text.trim() === '') return true;
			return String(value)
				.toLowerCase()
				.includes(filter.text.trim().toLowerCase());
		};

		if (!onFiltered) return;

		const filtered = data.filter((row) => {
			if (!filters.length) return true;

			let result = evaluateFilter(filters[0], row);
			for (let index = 1; index < filters.length; index += 1) {
				const filter = filters[index];
				const nextResult = evaluateFilter(filter, row);
				result =
					filter.operator === 'or'
						? result || nextResult
						: result && nextResult;
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
		if (!filter.field) {
			return <></>;
		}

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

	return (
		<div className="dynamic-filter mb-4 p-3 rounded bg-secondary bg-opacity-10">
			<div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-start gap-2 mb-3">
				<div>
					<h5 className="mb-1">Dynamic Filters</h5>
				</div>
				<Button size="sm" onClick={addFilter} variant="success">
					Add filter
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
									<option value="text">Text</option>
									<option value="number">Number</option>
									<option value="date">Date</option>
									<option value="dropdown">Dropdown</option>
									<option value="toggle">Toggle</option>
								</Form.Select>
							</Form.Group>
						</Col>
						<Col md={4}>{renderFilterInput(filter)}</Col>
						<Col md={3} className="d-flex flex-column gap-2">
							{index > 0 && (
								<Form.Group>
									<Form.Label>Join</Form.Label>
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
