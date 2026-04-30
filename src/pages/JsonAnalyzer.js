import React, {
	useState,
	useMemo,
	useEffect,
	useCallback,
	useRef
} from 'react';
import { Button, Row, Col, Form, Dropdown, Modal } from 'react-bootstrap';
import Editor from '@monaco-editor/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCurrentScreen } from '../redux/userSettings';
import { setDashboardData } from '../redux/dashBoardHandler';
import { setJsonData } from '../redux/JsonHandler';
import { ReactComponent as FilterIcon } from '../images/blocks/filter.svg';
import { ReactComponent as MapIcon } from '../images/blocks/map.svg';
import { ReactComponent as ReduceIcon } from '../images/blocks/reduce.svg';
import { ReactComponent as GroupByIcon } from '../images/blocks/group-by.svg';
import { ReactComponent as SortIcon } from '../images/blocks/sort.svg';
import { ReactComponent as GetCountIcon } from '../images/blocks/get-count.svg';
import { ReactComponent as InsertIcon } from '../images/blocks/insert.svg';
import { ReactComponent as ExtractKeysIcon } from '../images/blocks/extract-keys.svg';
import { ReactComponent as IfConditionIcon } from '../images/blocks/if-condition.svg';
import { ReactComponent as OmitKeysIcon } from '../images/blocks/omit-keys.svg';
import { ReactComponent as UniqueIcon } from '../images/blocks/unique.svg';
import { ReactComponent as LimitIcon } from '../images/blocks/limit.svg';
import { ReactComponent as SkipIcon } from '../images/blocks/skip.svg';
import { ReactComponent as ReverseIcon } from '../images/blocks/reverse.svg';
import { ReactComponent as FlattenIcon } from '../images/blocks/flatten.svg';
import { ReactComponent as ReplaceValueIcon } from '../images/blocks/replace-value.svg';

function JsonAnalyzer({ onMenuClick }) {
	const location = useLocation();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [alertMsg, setAlertMsg] = useState('');

	const [jsonInput, setJsonInput] = useState(
		location.state?.jsonInput ||
			'[\n  {\n    "id": 1,\n    "name": "Item 1"\n  }\n]'
	);

	useEffect(() => {
		if (location.state?.jsonInput) setJsonInput(location.state.jsonInput);
	}, [location.state]);

	const [outputJson, setOutputJson] = useState(
		'// Result will appear here after execution...'
	);

	const [finalOutputJson, setFinalOutputJson] = useState(
		'// Result will appear here after execution...'
	);
	const [selectedBlockId, setSelectedBlockId] = useState(null);

	const [searchQueries, setSearchQueries] = useState({});

	const availableKeys = useMemo(() => {
		try {
			const parsed = JSON.parse(jsonInput);
			const keys = new Set();
			const extract = (obj) => {
				if (typeof obj === 'object' && obj !== null) {
					if (Array.isArray(obj)) {
						obj.forEach(extract);
					} else {
						Object.keys(obj).forEach((k) => {
							keys.add(k);
						});
					}
				}
			};
			extract(parsed);
			return Array.from(keys).sort();
		} catch {
			return [];
		}
	}, [jsonInput]);

	const blockIcons = {
		FILTER: <FilterIcon width="16" height="16" />,
		MAP: <MapIcon width="16" height="16" />,
		REDUCE: <ReduceIcon width="16" height="16" />,
		GROUP_BY: <GroupByIcon width="16" height="16" />,
		SORT: <SortIcon width="16" height="16" />,
		GET_COUNT: <GetCountIcon width="16" height="16" />,
		INSERT: <InsertIcon width="16" height="16" />,
		EXTRACT_KEYS: <ExtractKeysIcon width="16" height="16" />,
		IF_CONDITION: <IfConditionIcon width="16" height="16" />,
		OMIT_KEYS: <OmitKeysIcon width="16" height="16" />,
		UNIQUE: <UniqueIcon width="16" height="16" />,
		LIMIT: <LimitIcon width="16" height="16" />,
		SKIP: <SkipIcon width="16" height="16" />,
		REVERSE: <ReverseIcon width="16" height="16" />,
		FLATTEN: <FlattenIcon width="16" height="16" />,
		REPLACE_VALUE: <ReplaceValueIcon width="16" height="16" />
	};

	const [stepResults, setStepResults] = useState({});

	const [blocks, setBlocks] = useState([]);
	const [connections, setConnections] = useState([]);
	const [drawingConnection, setDrawingConnection] = useState(null);
	const [draggingNode, setDraggingNode] = useState(null);

	const canvasRef = useRef(null);

	const availableBlocks = [
		'FILTER',
		'MAP',
		'REDUCE',
		'GROUP_BY',
		'SORT',
		'GET_COUNT',
		'INSERT',
		'EXTRACT_KEYS',
		'OMIT_KEYS',
		'IF_CONDITION',
		'UNIQUE',
		'LIMIT',
		'SKIP',
		'REVERSE',
		'FLATTEN',
		'REPLACE_VALUE'
	];

	const addBlock = (type, x = 50, y = 50) => {
		setBlocks((prev) => [
			...prev,
			{ id: Date.now() + Math.random(), type, config: {}, x, y }
		]);
	};

	const removeBlock = (id) => {
		setBlocks((prev) => prev.filter((b) => b.id !== id));
		setConnections((prev) =>
			prev.filter((c) => c.from !== id && c.to !== id)
		);
		if (selectedBlockId === id) {
			setSelectedBlockId(null);
		}
	};

	const updateBlockConfig = (id, field, value) => {
		setBlocks((prev) =>
			prev.map((b) =>
				b.id === id
					? { ...b, config: { ...b.config, [field]: value } }
					: b
			)
		);
	};

	const handleDragStart = (e, type) => {
		e.dataTransfer.setData('blockType', type);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		const type = e.dataTransfer.getData('blockType');
		if (type && canvasRef.current) {
			const rect = canvasRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			addBlock(type, x, y);
		}
	};

	const handleDragOver = (e) => {
		e.preventDefault();
	};

	const handleCanvasMouseMove = (e) => {
		if (drawingConnection && canvasRef.current) {
			const rect = canvasRef.current.getBoundingClientRect();
			setDrawingConnection({
				...drawingConnection,
				x: e.clientX - rect.left,
				y: e.clientY - rect.top
			});
		}
		if (draggingNode && canvasRef.current) {
			const rect = canvasRef.current.getBoundingClientRect();
			const newX = e.clientX - rect.left - draggingNode.offsetX;
			const newY = e.clientY - rect.top - draggingNode.offsetY;
			setBlocks((prev) =>
				prev.map((b) =>
					b.id === draggingNode.id ? { ...b, x: newX, y: newY } : b
				)
			);
		}
	};

	const handleCanvasMouseUp = () => {
		if (drawingConnection) setDrawingConnection(null);
		if (draggingNode) setDraggingNode(null);
	};

	const drawCurve = (x1, y1, x2, y2) => {
		const dx = Math.abs(x2 - x1);
		const offset = Math.max(dx * 0.5, 50);
		return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
	};

	const handlePortMouseUp = (e, blockId) => {
		e.stopPropagation();
		if (drawingConnection && drawingConnection.from !== blockId) {
			setConnections((prev) => {
				const filtered = prev.filter((c) => c.to !== blockId);
				return [
					...filtered,
					{ from: drawingConnection.from, to: blockId }
				];
			});
			setDrawingConnection(null);
		}
	};

	const handleToDashboard = () => {
		try {
			const parsed = JSON.parse(outputJson);
			if (Array.isArray(parsed)) {
				dispatch(setDashboardData(parsed));
				dispatch(setCurrentScreen('/dashboard'));
				navigate('/dashboard');
			} else {
				setAlertMsg(
					'Output must be an array of objects to be viewed in the Dashboard.'
				);
			}
		} catch {
			setAlertMsg('Invalid JSON output or execution incomplete.');
		}
	};

	const handleToModelGen = () => {
		if (outputJson && !outputJson.startsWith('//')) {
			dispatch(setCurrentScreen('/json-model-generator'));
			navigate('/json-model-generator', {
				state: { jsonInput: outputJson }
			});
		}
	};

	const handleToEditor = () => {
		try {
			const parsed = JSON.parse(outputJson);
			dispatch(setJsonData(parsed));
			dispatch(setCurrentScreen('/viewer'));
			navigate('/viewer');
		} catch {
			setAlertMsg('Invalid JSON output or execution incomplete.');
		}
	};

	const executePipeline = useCallback(() => {
		try {
			let parsedInput = null;
			try {
				parsedInput = JSON.parse(jsonInput);
			} catch (e) {
				throw new Error('Invalid initial JSON Input');
			}

			let newStepResults = {};

			if (blocks.length === 0) {
				setFinalOutputJson(JSON.stringify(parsedInput, null, 2));
				setStepResults({});
				return;
			}

			let sorted = [];
			let visited = new Set();
			let visiting = new Set();

			const visit = (nodeId) => {
				if (visited.has(nodeId)) return;
				if (visiting.has(nodeId))
					throw new Error('Cyclic dependency detected in graph');
				visiting.add(nodeId);
				const parents = connections
					.filter((c) => c.to === nodeId)
					.map((c) => c.from);
				parents.forEach(visit);
				visiting.delete(nodeId);
				visited.add(nodeId);
				sorted.push(nodeId);
			};

			blocks.forEach((b) => visit(b.id));

			let leafOutputs = [];

			for (let i = 0; i < sorted.length; i++) {
				const blockId = sorted[i];
				const block = blocks.find((b) => b.id === blockId);
				if (!block) continue;

				const parents = connections
					.filter((c) => c.to === blockId)
					.map((c) => c.from);
				let currentData = null;

				if (
					parents.length > 0 &&
					newStepResults[parents[0]] !== undefined
				) {
					currentData = JSON.parse(
						JSON.stringify(newStepResults[parents[0]])
					);
				} else {
					currentData = JSON.parse(JSON.stringify(parsedInput));
				}

				const { type, config } = block;

				if (type === 'FILTER' || type === 'IF_CONDITION') {
					const { field, operator, value } = config;
					if (!field) continue;

					const checkCond = (itemVal) => {
						if (itemVal === undefined) return false;
						if (operator === '==')
							return String(itemVal) === String(value);
						if (operator === '!=')
							return String(itemVal) !== String(value);
						if (operator === '>')
							return Number(itemVal) > Number(value);
						if (operator === '<')
							return Number(itemVal) < Number(value);
						if (operator === 'contains')
							return String(itemVal)
								.toLowerCase()
								.includes(String(value).toLowerCase());
						return true;
					};

					if (Array.isArray(currentData)) {
						currentData = currentData.filter((item) =>
							checkCond(item[field])
						);
					} else if (
						typeof currentData === 'object' &&
						currentData !== null
					) {
						if (!checkCond(currentData[field])) currentData = null;
					}
				} else if (type === 'MAP') {
					if (!Array.isArray(currentData))
						throw new Error(`[MAP] Node Input is not an array`);
					const { source, target } = config;
					if (!source || !target) continue;
					currentData = currentData.map((item) => ({
						...item,
						[target]: item[source]
					}));
				} else if (type === 'REDUCE') {
					if (!Array.isArray(currentData))
						throw new Error(`[REDUCE] Node Input is not an array`);
					const { operation, key } = config;
					if (!key) continue;

					let result = 0;
					if (operation === 'sum')
						result = currentData.reduce(
							(acc, item) => acc + (Number(item[key]) || 0),
							0
						);
					else if (operation === 'avg')
						result =
							currentData.reduce(
								(acc, item) => acc + (Number(item[key]) || 0),
								0
							) / (currentData.length || 1);
					else if (operation === 'min')
						result = Math.min(
							...currentData.map((i) => Number(i[key]) || 0)
						);
					else if (operation === 'max')
						result = Math.max(
							...currentData.map((i) => Number(i[key]) || 0)
						);

					currentData = result;
				} else if (type === 'GROUP_BY') {
					if (!Array.isArray(currentData))
						throw new Error(
							`[GROUP_BY] Node Input is not an array`
						);
					const { key } = config;
					if (!key) continue;
					const grouped = {};
					currentData.forEach((item) => {
						const kv = item[key];
						if (!grouped[kv]) grouped[kv] = [];
						grouped[kv].push(item);
					});
					currentData = grouped;
				} else if (type === 'SORT') {
					if (!Array.isArray(currentData))
						throw new Error(`[SORT] Node Input is not an array`);
					const { key, order } = config;
					if (!key) continue;
					currentData = [...currentData].sort((a, b) => {
						const valA = a[key];
						const valB = b[key];
						if (order === 'asc') return valA > valB ? 1 : -1;
						return valA < valB ? 1 : -1;
					});
				} else if (type === 'GET_COUNT') {
					if (!Array.isArray(currentData))
						throw new Error(
							`[GET_COUNT] Node Input is not an array`
						);
					currentData = currentData.length;
				} else if (type === 'INSERT') {
					const { key, value } = config;
					if (!key) continue;

					let parsedVal = value;
					if (!isNaN(value) && value.trim() !== '')
						parsedVal = Number(value);
					else if (value === 'true') parsedVal = true;
					else if (value === 'false') parsedVal = false;

					if (Array.isArray(currentData)) {
						currentData = currentData.map((item) => ({
							...item,
							[key]: parsedVal
						}));
					} else if (
						typeof currentData === 'object' &&
						currentData !== null
					) {
						currentData = { ...currentData, [key]: parsedVal };
					}
				} else if (type === 'EXTRACT_KEYS') {
					const { keys } = config;
					if (!keys) continue;
					const keyList = keys.split(',').map((k) => k.trim());

					if (Array.isArray(currentData)) {
						currentData = currentData.map((item) => {
							const obj = {};
							keyList.forEach((k) => (obj[k] = item[k]));
							return obj;
						});
					} else if (
						typeof currentData === 'object' &&
						currentData !== null
					) {
						const obj = {};
						keyList.forEach((k) => (obj[k] = currentData[k]));
						currentData = obj;
					}
				} else if (type === 'OMIT_KEYS') {
					const { keys } = config;
					if (!keys) continue;
					const keyList = keys.split(',').map((k) => k.trim());

					if (Array.isArray(currentData)) {
						currentData = currentData.map((item) => {
							const obj = { ...item };
							keyList.forEach((k) => delete obj[k]);
							return obj;
						});
					} else if (
						typeof currentData === 'object' &&
						currentData !== null
					) {
						const obj = { ...currentData };
						keyList.forEach((k) => delete obj[k]);
						currentData = obj;
					}
				} else if (type === 'UNIQUE') {
					if (!Array.isArray(currentData))
						throw new Error(`[UNIQUE] Node Input is not an array`);
					const { key } = config;
					if (key) {
						currentData = [
							...new Map(
								currentData.map((item) => [item[key], item])
							).values()
						];
					} else {
						currentData = [
							...new Set(
								currentData.map((x) =>
									typeof x === 'object'
										? JSON.stringify(x)
										: x
								)
							)
						].map((x) => {
							try {
								return JSON.parse(x);
							} catch {
								return x;
							}
						});
					}
				} else if (type === 'LIMIT') {
					if (!Array.isArray(currentData))
						throw new Error(`[LIMIT] Node Input is not an array`);
					const count = parseInt(config.count, 10);
					if (!isNaN(count))
						currentData = currentData.slice(0, count);
				} else if (type === 'SKIP') {
					if (!Array.isArray(currentData))
						throw new Error(`[SKIP] Node Input is not an array`);
					const count = parseInt(config.count, 10);
					if (!isNaN(count)) currentData = currentData.slice(count);
				} else if (type === 'REVERSE') {
					if (!Array.isArray(currentData))
						throw new Error(`[REVERSE] Node Input is not an array`);
					currentData = [...currentData].reverse();
				} else if (type === 'FLATTEN') {
					if (!Array.isArray(currentData))
						throw new Error(`[FLATTEN] Node Input is not an array`);
					const depth = parseInt(config.depth, 10) || 1;
					currentData = currentData.flat(depth);
				} else if (type === 'REPLACE_VALUE') {
					const { key, oldValue, newValue } = config;
					if (!key) continue;
					let parsedNewVal = newValue;
					if (newValue !== undefined && newValue !== '') {
						if (!isNaN(newValue) && newValue.trim() !== '')
							parsedNewVal = Number(newValue);
						else if (newValue === 'true') parsedNewVal = true;
						else if (newValue === 'false') parsedNewVal = false;
					}
					const replacer = (item) =>
						String(item[key]) === String(oldValue)
							? { ...item, [key]: parsedNewVal }
							: item;
					if (Array.isArray(currentData)) {
						currentData = currentData.map(replacer);
					} else if (
						typeof currentData === 'object' &&
						currentData !== null
					) {
						currentData = replacer(currentData);
					}
				}

				newStepResults[blockId] = currentData;

				const children = connections.filter((c) => c.from === blockId);
				if (children.length === 0) {
					leafOutputs.push(currentData);
				}
			}

			setStepResults(newStepResults);
			if (leafOutputs.length > 0) {
				setFinalOutputJson(
					JSON.stringify(
						leafOutputs.length === 1 ? leafOutputs[0] : leafOutputs,
						null,
						2
					)
				);
			} else {
				setFinalOutputJson(JSON.stringify(parsedInput, null, 2));
			}
		} catch (err) {
			setFinalOutputJson(
				JSON.stringify({ 'Execution Error': err.message }, null, 2)
			);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [jsonInput, blocks]);

	useEffect(() => {
		executePipeline();
	}, [executePipeline]);

	useEffect(() => {
		if (selectedBlockId && stepResults[selectedBlockId] !== undefined) {
			setOutputJson(
				JSON.stringify(stepResults[selectedBlockId], null, 2)
			);
		} else {
			setOutputJson(finalOutputJson);
		}
	}, [selectedBlockId, stepResults, finalOutputJson]);

	const renderBlockConfig = (block) => {
		const { type, config } = block;
		const handleChange = (field, val) =>
			updateBlockConfig(block.id, field, val);

		const inputStyle = {
			background: 'rgba(0, 0, 0, 0.3)',
			border: '1px solid rgba(249, 115, 22, 0.3)',
			color: '#f8fafc'
		};

		const renderKeySelector = (blockId, field, value, placeholder) => {
			const handleKeyChange = (val) =>
				updateBlockConfig(blockId, field, val);

			if (availableKeys.length <= 10) {
				return (
					<Form.Select
						size="sm"
						value={value || ''}
						onChange={(e) => handleKeyChange(e.target.value)}
						style={inputStyle}
					>
						<option value="" disabled>
							{placeholder}
						</option>
						{availableKeys.map((k) => (
							<option key={k} value={k}>
								{k}
							</option>
						))}
					</Form.Select>
				);
			}

			const searchKey = `${blockId}_${field}`;
			const query = searchQueries[searchKey] || '';
			const filteredKeys = availableKeys.filter((k) =>
				k.toLowerCase().includes(query.toLowerCase())
			);

			return (
				<Dropdown className="w-100">
					<Dropdown.Toggle
						size="sm"
						variant="none"
						className="w-100 text-start d-flex justify-content-between align-items-center"
						style={inputStyle}
					>
						<span className="text-truncate me-2">
							{value || placeholder}
						</span>
					</Dropdown.Toggle>
					<Dropdown.Menu
						className="w-100 bg-dark border-secondary p-2"
						style={{
							maxHeight: '200px',
							overflowY: 'auto',
							zIndex: 9999
						}}
					>
						<Form.Control
							size="sm"
							type="text"
							placeholder="Search field..."
							className="mb-2 bg-secondary text-light border-dark"
							value={query}
							onChange={(e) =>
								setSearchQueries((prev) => ({
									...prev,
									[searchKey]: e.target.value
								}))
							}
							onClick={(e) => e.stopPropagation()}
							autoFocus
						/>
						{filteredKeys.map((k) => (
							<Dropdown.Item
								key={k}
								className="text-light"
								onClick={() => {
									handleKeyChange(k);
									setSearchQueries((prev) => ({
										...prev,
										[searchKey]: ''
									}));
								}}
								style={{
									borderBottom:
										'1px solid rgba(255,255,255,0.05)',
									fontSize: '0.85rem'
								}}
							>
								{k}
							</Dropdown.Item>
						))}
						{filteredKeys.length === 0 && (
							<div className="text-muted small p-2">
								No matches found
							</div>
						)}
					</Dropdown.Menu>
				</Dropdown>
			);
		};

		switch (type) {
			case 'FILTER':
			case 'IF_CONDITION':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={4}>
							{renderKeySelector(
								block.id,
								'field',
								config.field,
								'Field Key'
							)}
						</Col>
						<Col xs={4}>
							<Form.Select
								size="sm"
								value={config.operator || '=='}
								onChange={(e) =>
									handleChange('operator', e.target.value)
								}
								style={inputStyle}
							>
								<option value="==">==</option>
								<option value="!=">!=</option>
								<option value=">">&gt;</option>
								<option value="<">&lt;</option>
								<option value="contains">~</option>
							</Form.Select>
						</Col>
						<Col xs={4}>
							<Form.Control
								size="sm"
								placeholder="Compare Value"
								value={config.value || ''}
								onChange={(e) =>
									handleChange('value', e.target.value)
								}
								style={inputStyle}
							/>
						</Col>
					</Row>
				);
			case 'MAP':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={6}>
							{renderKeySelector(
								block.id,
								'source',
								config.source,
								'Source Key'
							)}
						</Col>
						<Col xs={6}>
							<Form.Control
								size="sm"
								placeholder="Target Key (Rename to)"
								value={config.target || ''}
								onChange={(e) =>
									handleChange('target', e.target.value)
								}
								style={inputStyle}
							/>
						</Col>
					</Row>
				);
			case 'GROUP_BY':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={12}>
							{renderKeySelector(
								block.id,
								'key',
								config.key,
								'Group By Key'
							)}
						</Col>
					</Row>
				);
			case 'EXTRACT_KEYS':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={12}>
							<Form.Control
								size="sm"
								placeholder="Target Key(s) comma separated"
								value={config.keys || ''}
								onChange={(e) =>
									handleChange('keys', e.target.value)
								}
								style={inputStyle}
							/>
						</Col>
					</Row>
				);
			case 'UNIQUE':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={12}>
							{renderKeySelector(
								block.id,
								'key',
								config.key,
								'Unique By Key (optional)'
							)}
						</Col>
					</Row>
				);
			case 'LIMIT':
			case 'SKIP':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={12}>
							<Form.Control
								size="sm"
								type="number"
								placeholder="Count"
								value={config.count || ''}
								onChange={(e) =>
									handleChange('count', e.target.value)
								}
								style={inputStyle}
							/>
						</Col>
					</Row>
				);
			case 'FLATTEN':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={12}>
							<Form.Control
								size="sm"
								type="number"
								placeholder="Depth (default 1)"
								value={config.depth || ''}
								onChange={(e) =>
									handleChange('depth', e.target.value)
								}
								style={inputStyle}
							/>
						</Col>
					</Row>
				);
			case 'REPLACE_VALUE':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={4}>
							{renderKeySelector(
								block.id,
								'key',
								config.key,
								'Target Key'
							)}
						</Col>
						<Col xs={4}>
							<Form.Control
								size="sm"
								placeholder="Old Value"
								value={config.oldValue || ''}
								onChange={(e) =>
									handleChange('oldValue', e.target.value)
								}
								style={inputStyle}
							/>
						</Col>
						<Col xs={4}>
							<Form.Control
								size="sm"
								placeholder="New Value"
								value={config.newValue || ''}
								onChange={(e) =>
									handleChange('newValue', e.target.value)
								}
								style={inputStyle}
							/>
						</Col>
					</Row>
				);
			case 'OMIT_KEYS':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={12}>
							<Form.Control
								size="sm"
								placeholder="Keys to omit (comma separated)"
								value={config.keys || ''}
								onChange={(e) =>
									handleChange('keys', e.target.value)
								}
								style={inputStyle}
							/>
						</Col>
					</Row>
				);
			case 'REVERSE':
				return (
					<div className="text-secondary mt-2 font-monospace small">
						↳ Reverses the array order. No configuration needed.
					</div>
				);
			case 'SORT':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={8}>
							{renderKeySelector(
								block.id,
								'key',
								config.key,
								'Sort Key'
							)}
						</Col>
						<Col xs={4}>
							<Form.Select
								size="sm"
								value={config.order || 'asc'}
								onChange={(e) =>
									handleChange('order', e.target.value)
								}
								style={inputStyle}
							>
								<option value="asc">ASCENDING</option>
								<option value="desc">DESCENDING</option>
							</Form.Select>
						</Col>
					</Row>
				);
			case 'INSERT':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={6}>
							<Form.Control
								size="sm"
								placeholder="New Key"
								value={config.key || ''}
								onChange={(e) =>
									handleChange('key', e.target.value)
								}
								style={inputStyle}
							/>
						</Col>
						<Col xs={6}>
							<Form.Control
								size="sm"
								placeholder="Static Value"
								value={config.value || ''}
								onChange={(e) =>
									handleChange('value', e.target.value)
								}
								style={inputStyle}
							/>
						</Col>
					</Row>
				);
			case 'REDUCE':
				return (
					<Row className="g-2 mt-2 font-monospace small">
						<Col xs={6}>
							<Form.Select
								size="sm"
								value={config.operation || 'sum'}
								onChange={(e) =>
									handleChange('operation', e.target.value)
								}
								style={inputStyle}
							>
								<option value="sum">SUM</option>
								<option value="avg">AVERAGE</option>
								<option value="min">MIN</option>
								<option value="max">MAX</option>
							</Form.Select>
						</Col>
						<Col xs={6}>
							{renderKeySelector(
								block.id,
								'key',
								config.key,
								'Numeric Target Key'
							)}
						</Col>
					</Row>
				);
			case 'GET_COUNT':
				return (
					<div className="text-secondary mt-2 font-monospace small">
						↳ Returns the total item count. No configuration needed.
					</div>
				);
			default:
				return null;
		}
	};

	const editorOptions = {
		minimap: { enabled: false },
		fontSize: 14,
		padding: { top: 16, bottom: 16 },
		scrollBeyondLastLine: false,
		automaticLayout: true
	};

	return (
		<div className="p-4 tool-page-bg theme-orange d-flex flex-column vh-100 overflow-hidden">
			{/* Header Container */}
			<div className="glass-panel py-2 px-3 mb-3 d-flex flex-wrap align-items-center justify-content-between border-0 flex-shrink-0">
				<div className="d-flex align-items-center">
					{/* Standard theme matching title for top bar */}
					<span className="font-monospace text-secondary small">
						INPUT_STREAM // JSON_ANALYSER
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

			{/* 3-Section Workspace Layout */}
			<Row
				className="flex-grow-1 m-0 p-0 overflow-hidden"
				style={{ minHeight: 0 }}
			>
				{/* LEFT SECTION: JSON Data Viewer / Editor */}
				<Col
					lg={4}
					className="d-flex flex-column p-0 pe-lg-2 gap-3 h-100"
				>
					<div
						className="glass-panel p-0 overflow-hidden d-flex flex-column border-0"
						style={{ flex: 1, minHeight: 0 }}
					>
						<div
							className="px-3 py-2 border-bottom"
							style={{
								borderColor: 'rgba(249, 115, 22, 0.2)',
								background: 'rgba(255, 255, 255, 0.02)'
							}}
						>
							<span
								className="font-monospace small"
								style={{ color: '#f97316' }}
							>
								DATA_SOURCE // JSON
							</span>
						</div>
						<div className="flex-grow-1 w-100 position-relative overflow-hidden">
							<Editor
								height="100%"
								language="json"
								value={jsonInput}
								onChange={(val) => setJsonInput(val || '')}
								theme="myDarkTheme"
								options={{
									minimap: { enabled: false },
									fontSize: 14,
									padding: { top: 16, bottom: 16 },
									scrollBeyondLastLine: false,
									automaticLayout: true
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
							/>
						</div>
					</div>

					{/* Bottom Left: Output Stream */}
					<div
						className="glass-panel p-0 overflow-hidden d-flex flex-column border-0"
						style={{ flex: 1, minHeight: 0 }}
					>
						<div
							className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center"
							style={{
								borderColor: 'rgba(249, 115, 22, 0.2)',
								background: 'rgba(255, 255, 255, 0.02)'
							}}
						>
							<span
								className="font-monospace small"
								style={{ color: '#f97316' }}
							>
								OUTPUT_STREAM //{' '}
								{selectedBlockId
									? 'STEP_PREVIEW'
									: 'FINAL_RESULT'}
							</span>
							<div className="d-flex gap-2">
								<Button
									variant="none"
									className="hud-btn-secondary fw-bold py-0 px-2"
									style={{ fontSize: '0.75rem' }}
									onClick={handleToEditor}
								>
									↗ EDITOR
								</Button>
								<Button
									variant="none"
									className="hud-btn-secondary fw-bold py-0 px-2"
									style={{ fontSize: '0.75rem' }}
									onClick={handleToModelGen}
								>
									↗ MODEL GEN
								</Button>
								<Button
									variant="none"
									className="hud-btn-secondary fw-bold py-0 px-2"
									style={{ fontSize: '0.75rem' }}
									onClick={handleToDashboard}
								>
									↗ DASHBOARD
								</Button>
							</div>
						</div>
						<div className="flex-grow-1 w-100 position-relative overflow-hidden">
							<Editor
								height="100%"
								language="json"
								value={outputJson}
								theme="myDarkTheme"
								options={{ ...editorOptions, readOnly: true }}
							/>
						</div>
					</div>
				</Col>

				{/* RIGHT SECTION: Tools and Scratchpad */}
				<Col
					lg={8}
					className="d-flex flex-column p-0 ps-lg-2 gap-3 h-100"
				>
					{/* Top Right: Elements / Blocks List */}
					<div className="glass-panel p-0 overflow-hidden d-flex flex-column border-0 flex-shrink-0">
						<div
							className="px-3 py-2 border-bottom"
							style={{
								borderColor: 'rgba(249, 115, 22, 0.2)',
								background: 'rgba(255, 255, 255, 0.02)'
							}}
						>
							<span className="font-monospace text-secondary small">
								TOOL_PALETTE // BLOCKS
							</span>
						</div>
						<div
							className="p-3 d-flex flex-wrap gap-2 overflow-auto"
							style={{ maxHeight: '200px' }}
						>
							{availableBlocks.map((block) => (
								<Button
									key={block}
									variant="none"
									className="hud-btn-secondary fw-bold px-3 py-1"
									style={{
										fontSize: '0.85rem',
										cursor: 'grab'
									}}
									onClick={() => addBlock(block)}
									draggable
									onDragStart={(e) =>
										handleDragStart(e, block)
									}
								>
									[{' '}
									<span className="mb-1 me-1">
										{blockIcons[block]}
									</span>{' '}
									{block} ]
								</Button>
							))}
						</div>
					</div>

					{/* Bottom Right: Scratchpad Development Panel */}
					<div
						className="glass-panel p-0 overflow-hidden d-flex flex-column border-0"
						style={{ flex: 1, minHeight: 0 }}
					>
						<div
							className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center"
							style={{
								borderColor: 'rgba(249, 115, 22, 0.2)',
								background: 'rgba(255, 255, 255, 0.02)'
							}}
						>
							<span
								className="font-monospace small"
								style={{ color: '#f97316' }}
							>
								EXECUTION_CANVAS // SCRATCHPAD
							</span>
							<Button
								variant="none"
								className="hud-btn-secondary fw-bold btn-sm py-0 px-3"
								style={{
									fontSize: '0.8rem',
									pointerEvents: 'none',
									borderColor: '#34d399',
									color: '#34d399'
								}}
							>
								[ ⚡ LIVE EXECUTION ]
							</Button>
						</div>
						<div
							className="flex-grow-1 p-0 position-relative overflow-hidden"
							ref={canvasRef}
							onMouseMove={handleCanvasMouseMove}
							onMouseUp={handleCanvasMouseUp}
							onMouseLeave={handleCanvasMouseUp}
							style={{
								backgroundColor: '#0a0f1c',
								backgroundImage:
									'radial-gradient(rgba(249, 115, 22, 0.15) 1.5px, transparent 1.5px)',
								backgroundSize: '24px 24px',
								overflowY: 'auto',
								boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
							}}
							onDrop={handleDrop}
							onDragOver={handleDragOver}
							onClick={() => setSelectedBlockId(null)}
						>
							{/* Connection Wires SVG Layer */}
							<svg
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: '100%',
									pointerEvents: 'none',
									zIndex: 1
								}}
							>
								{connections.map((conn, idx) => {
									const fromBlock = blocks.find(
										(b) => b.id === conn.from
									);
									const toBlock = blocks.find(
										(b) => b.id === conn.to
									);
									if (!fromBlock || !toBlock) return null;
									const x1 = fromBlock.x + 280;
									const y1 = fromBlock.y + 24;
									const x2 = toBlock.x;
									const y2 = toBlock.y + 24;
									const path = drawCurve(x1, y1, x2, y2);
									return (
										<path
											key={idx}
											d={path}
											stroke="#f97316"
											strokeWidth="3"
											fill="none"
											style={{
												pointerEvents: 'stroke',
												cursor: 'pointer'
											}}
											onDoubleClick={() =>
												setConnections(
													connections.filter(
														(c) => c !== conn
													)
												)
											}
										/>
									);
								})}
								{drawingConnection && (
									<path
										d={drawCurve(
											blocks.find(
												(b) =>
													b.id ===
													drawingConnection.from
											).x + 280,
											blocks.find(
												(b) =>
													b.id ===
													drawingConnection.from
											).y + 24,
											drawingConnection.x,
											drawingConnection.y
										)}
										stroke="#f97316"
										strokeWidth="3"
										strokeDasharray="5,5"
										fill="none"
									/>
								)}
							</svg>

							{blocks.length === 0 ? (
								<div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center opacity-50">
									<div
										className="fs-1 mb-3"
										style={{
											filter: 'drop-shadow(0 0 10px rgba(249, 115, 22, 0.5))'
										}}
									>
										<svg
											width="64"
											height="64"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="1"
											strokeLinecap="round"
											strokeLinejoin="round"
											style={{ color: '#f97316' }}
										>
											<rect
												x="2"
												y="9"
												width="6"
												height="6"
												rx="1"
											></rect>
											<rect
												x="16"
												y="3"
												width="6"
												height="6"
												rx="1"
											></rect>
											<rect
												x="16"
												y="15"
												width="6"
												height="6"
												rx="1"
											></rect>
											<path d="M8 12h2a2 2 0 0 0 2-2V8a2 2 0 0 1 2-2h2"></path>
											<path d="M8 12h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2"></path>
										</svg>
									</div>
									<div
										className="font-monospace text-warning text-center p-2 rounded"
										style={{
											letterSpacing: '1px',
											background: 'rgba(0,0,0,0.5)'
										}}
									>
										ADD_BLOCKS_TO_BUILD_LOGIC
									</div>
									<div
										className="text-secondary small mt-2 text-center p-2 rounded"
										style={{
											background: 'rgba(0,0,0,0.5)'
										}}
									>
										Drag blocks here. Click output nodes
										(right) and drag <br />
										to input nodes (left) to connect stages.
									</div>
								</div>
							) : (
								<>
									{blocks.map((block, index) => (
										<div
											key={block.id}
											className="p-3 fade-in position-absolute"
											onMouseDown={(e) => {
												e.stopPropagation();
												const rect =
													canvasRef.current.getBoundingClientRect();
												setDraggingNode({
													id: block.id,
													offsetX:
														e.clientX -
														rect.left -
														block.x,
													offsetY:
														e.clientY -
														rect.top -
														block.y
												});
												setSelectedBlockId(block.id);
											}}
											onClick={(e) => {
												e.stopPropagation();
												setSelectedBlockId(block.id);
											}}
											style={{
												left: block.x,
												top: block.y,
												width: '280px',
												zIndex:
													selectedBlockId === block.id
														? 10
														: 2,
												borderRadius: '1.25rem',
												border:
													selectedBlockId === block.id
														? '2px solid #f97316'
														: '1px solid rgba(249, 115, 22, 0.3)',
												background:
													selectedBlockId === block.id
														? 'rgba(249, 115, 22, 0.15)'
														: 'rgba(15, 23, 42, 0.95)',
												backdropFilter: 'blur(4px)',
												boxShadow:
													selectedBlockId === block.id
														? '0 0 20px rgba(249, 115, 22, 0.4)'
														: '0 4px 12px rgba(0,0,0,0.4)',
												cursor: 'move',
												transition:
													'box-shadow 0.2s, border 0.2s'
											}}
										>
											{/* Input Connection Port */}
											<div
												style={{
													position: 'absolute',
													left: '-7px',
													top: '18px',
													width: '14px',
													height: '14px',
													borderRadius: '50%',
													background: '#f97316',
													cursor: 'crosshair',
													zIndex: 11
												}}
												onMouseUp={(e) =>
													handlePortMouseUp(
														e,
														block.id
													)
												}
											/>
											{/* Output Connection Port */}
											<div
												style={{
													position: 'absolute',
													right: '-7px',
													top: '18px',
													width: '14px',
													height: '14px',
													borderRadius: '50%',
													background: '#f97316',
													cursor: 'crosshair',
													zIndex: 11
												}}
												onMouseDown={(e) => {
													e.stopPropagation();
													const rect =
														canvasRef.current.getBoundingClientRect();
													setDrawingConnection({
														from: block.id,
														x:
															e.clientX -
															rect.left,
														y: e.clientY - rect.top
													});
												}}
											/>

											<div className="d-flex justify-content-between align-items-center">
												<span
													className="font-monospace fw-bold d-flex align-items-center"
													style={{
														color: '#f8fafc'
													}}
												>
													<span className="me-2 mb-1">
														{blockIcons[block.type]}
													</span>
													{block.type}
												</span>
												<Button
													variant="none"
													className="text-danger fw-bold p-0 m-0 fs-5 lh-1"
													style={{
														outline: 'none',
														border: 'none'
													}}
													onClick={() =>
														removeBlock(block.id)
													}
													title="Remove Block"
												>
													&times;
												</Button>
											</div>
											{/* Render Block-Specific Configuration Forms */}
											{renderBlockConfig(block)}
										</div>
									))}
								</>
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
				<div
					className="glass-panel"
					style={{ border: '1px solid rgba(249, 115, 22, 0.5)' }}
				>
					<div
						className="p-3 border-bottom d-flex justify-content-between align-items-center"
						style={{ borderColor: 'rgba(249, 115, 22, 0.2)' }}
					>
						<span
							className="font-monospace small fw-bold"
							style={{ color: '#f97316' }}
						>
							SYSTEM_ALERT // NOTICE
						</span>
						<Button
							variant="none"
							className="p-0 m-0 fs-5 lh-1"
							onClick={() => setAlertMsg('')}
							style={{ border: 'none', color: '#f97316' }}
						>
							&times;
						</Button>
					</div>
					<div className="p-4 text-light font-monospace fs-6">
						{alertMsg}
					</div>
					<div
						className="p-3 border-top text-end"
						style={{ borderColor: 'rgba(249, 115, 22, 0.2)' }}
					>
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

export default JsonAnalyzer;
