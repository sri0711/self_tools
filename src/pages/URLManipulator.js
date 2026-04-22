import React, { useState, useMemo, useRef } from 'react';
import {
	Form,
	Button,
	Row,
	Col,
	Card,
	Nav,
	Tab,
	Spinner
} from 'react-bootstrap';
import JsonView from '@microlink/react-json-view';
import { generateRequestCode } from '../Tools/requestCodeGenerator';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setJsonData } from '../redux/JsonHandler';
import { setDashboardData } from '../redux/dashBoardHandler';
import { setCurrentScreen } from '../redux/userSettings';

function URLManipulator({ onMenuClick }) {
	const [url, setUrl] = useState('');
	const [method, setMethod] = useState('GET');
	const [queryParams, setQueryParams] = useState([
		{ id: Date.now(), key: '', value: '' }
	]);
	const [paramsMode, setParamsMode] = useState('kv');
	const [paramsJson, setParamsJson] = useState('{\n  \n}');

	const [bodyType, setBodyType] = useState('raw');
	const [formDataParams, setFormDataParams] = useState([
		{ id: Date.now(), key: '', type: 'text', value: '', file: null }
	]);
	const [headers, setHeaders] = useState('');
	const [body, setBody] = useState('');

	const [authType, setAuthType] = useState('none');

	const [bearer, setBearer] = useState('');
	const [basicUser, setBasicUser] = useState('');
	const [basicPass, setBasicPass] = useState('');
	const [apiKey, setApiKey] = useState('');
	const [apiKeyName, setApiKeyName] = useState('');
	const [apiKeyIn, setApiKeyIn] = useState('header');

	const [cookieInput, setCookieInput] = useState('');

	const [response, setResponse] = useState(null);
	const [loading, setLoading] = useState(false);
	const [isStreaming, setIsStreaming] = useState(false);
	const abortControllerRef = useRef(null);

	const [language, setLanguage] = useState('curl');
	const [copyStatus, setCopyStatus] = useState('Copy');
	const [useProxy, setUseProxy] = useState(false);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const parsedHeaders = useMemo(() => {
		try {
			return headers ? JSON.parse(headers) : {};
		} catch {
			return {};
		}
	}, [headers]);

	const syncUrlToParams = (newUrl) => {
		const splitIndex = newUrl.indexOf('?');
		if (splitIndex !== -1) {
			const search = newUrl.substring(splitIndex);
			const params = new URLSearchParams(search);
			const newParams = [];
			params.forEach((v, k) => {
				newParams.push({
					id: Date.now() + Math.random(),
					key: k,
					value: v
				});
			});
			if (newParams.length === 0)
				newParams.push({ id: Date.now(), key: '', value: '' });
			setQueryParams(newParams);

			const obj = {};
			newParams.forEach((p) => {
				if (p.key) obj[p.key] = p.value;
			});
			setParamsJson(JSON.stringify(obj, null, 2));
		} else {
			setQueryParams([{ id: Date.now(), key: '', value: '' }]);
			setParamsJson('{\n  \n}');
		}
	};

	const syncParamsToUrl = (paramsArray) => {
		const searchParams = new URLSearchParams();
		paramsArray.forEach((p) => {
			if (p.key) searchParams.append(p.key, p.value);
		});
		const qs = searchParams.toString();

		setUrl((prevUrl) => {
			const splitIndex = prevUrl.indexOf('?');
			const base =
				splitIndex !== -1 ? prevUrl.substring(0, splitIndex) : prevUrl;
			return qs ? `${base}?${qs}` : base;
		});
	};

	const handleUrlChange = (e) => {
		const val = e.target.value;
		setUrl(val);
		syncUrlToParams(val);
	};

	const handleParamsJsonChange = (e) => {
		const val = e.target.value;
		setParamsJson(val);
		try {
			const obj = JSON.parse(val);
			const searchParams = new URLSearchParams();
			Object.keys(obj).forEach((k) => searchParams.append(k, obj[k]));
			const qs = searchParams.toString();
			setUrl((prevUrl) => {
				const splitIndex = prevUrl.indexOf('?');
				const base =
					splitIndex !== -1
						? prevUrl.substring(0, splitIndex)
						: prevUrl;
				return qs ? `${base}?${qs}` : base;
			});
		} catch (err) {}
	};

	const finalRequest = useMemo(() => {
		let finalUrl = url.trim();
		let finalHeaders = { ...parsedHeaders };

		if (authType === 'bearer' && bearer) {
			finalHeaders['Authorization'] = `Bearer ${bearer}`;
		}

		if (authType === 'basic' && basicUser) {
			const encoded = btoa(`${basicUser}:${basicPass}`);
			finalHeaders['Authorization'] = `Basic ${encoded}`;
		}

		if (authType === 'apikey' && apiKeyName && apiKey) {
			if (apiKeyIn === 'header') {
				finalHeaders[apiKeyName] = apiKey;
			} else {
				const sep = finalUrl.includes('?') ? '&' : '?';
				finalUrl += `${sep}${apiKeyName}=${apiKey}`;
			}
		}

		if (cookieInput) {
			finalHeaders['Cookie'] = cookieInput;
		}

		return { finalUrl, finalHeaders };
	}, [
		url,
		parsedHeaders,
		authType,
		bearer,
		basicUser,
		basicPass,
		apiKey,
		apiKeyName,
		apiKeyIn,
		cookieInput
	]);

	const generatedCode = useMemo(() => {
		const { finalUrl, finalHeaders } = finalRequest;
		if (!finalUrl) return 'Please enter a URL to generate code.';

		try {
			return generateRequestCode(
				language,
				method,
				finalUrl,
				finalHeaders,
				body,
				bodyType,
				formDataParams
			);
		} catch {
			return 'Code generation error';
		}
	}, [method, finalRequest, body, language, bodyType, formDataParams]);

	const handleCopy = () => {
		navigator.clipboard.writeText(generatedCode);
		setCopyStatus('Copied!');
		setTimeout(() => setCopyStatus('Copy'), 2000);
	};

	const handleImportCurl = async () => {
		try {
			const text = await navigator.clipboard.readText();
			if (!text || !text.trim().toLowerCase().startsWith('curl')) {
				alert('Clipboard does not contain a valid curl command');
				return;
			}

			let parsedMethod = 'GET';
			let parsedUrl = '';
			let parsedHeaders = {};
			let parsedBody = '';

			const urlMatch = text.match(/['"]?(https?:\/\/[^'"\s\\]+)['"]?/i);
			if (urlMatch) parsedUrl = urlMatch[1];

			const methodMatch = text.match(
				/(?:-X|--request)\s+['"]?([A-Z]+)['"]?/i
			);
			if (methodMatch) parsedMethod = methodMatch[1].toUpperCase();

			const headerRegex = /(?:-H|--header)\s+(['"])(.+?)\1/g;
			let match;
			while ((match = headerRegex.exec(text)) !== null) {
				const headerStr = match[2];
				const colonIdx = headerStr.indexOf(':');
				if (colonIdx > -1) {
					const key = headerStr.slice(0, colonIdx).trim();
					const val = headerStr.slice(colonIdx + 1).trim();
					parsedHeaders[key] = val;
				}
			}

			const bodyRegex =
				/(?:-d|--data|--data-raw|--data-binary)\s+(['"])([\s\S]*?)\1/;
			const bodyMatch = text.match(bodyRegex);
			if (bodyMatch) {
				parsedBody = bodyMatch[2];
				if (!methodMatch) parsedMethod = 'POST';
			}

			if (parsedUrl) {
				setUrl(parsedUrl);
				syncUrlToParams(parsedUrl);
			}
			setMethod(parsedMethod);
			if (Object.keys(parsedHeaders).length > 0)
				setHeaders(JSON.stringify(parsedHeaders, null, 2));
			if (parsedBody) setBody(parsedBody);
		} catch (err) {
			alert(
				'Failed to read clipboard or parse cURL. Make sure you have granted clipboard permissions.'
			);
		}
	};

	const sendRequest = async () => {
		setLoading(true);
		setIsStreaming(false);
		setResponse(null);
		const startTime = performance.now();

		const controller = new AbortController();
		abortControllerRef.current = controller;

		if (!finalRequest.finalUrl) {
			setLoading(false);
			return;
		}
		try {
			let finalFetchHeaders = { ...finalRequest.finalHeaders };
			let finalBody = undefined;

			if (method !== 'GET' && method !== 'HEAD') {
				if (bodyType === 'formdata') {
					finalBody = new FormData();
					formDataParams.forEach((p) => {
						if (p.key) {
							if (p.type === 'file' && p.file) {
								finalBody.append(p.key, p.file);
							} else {
								finalBody.append(p.key, p.value);
							}
						}
					});

					Object.keys(finalFetchHeaders).forEach((k) => {
						if (k.toLowerCase() === 'content-type') {
							delete finalFetchHeaders[k];
						}
					});
				} else if (body) {
					finalBody = body;
				}
			}

			const fetchOptions = {
				method,
				headers: finalFetchHeaders,
				signal: controller.signal
			};

			if (finalBody) {
				fetchOptions.body = finalBody;
			}

			let targetUrl = finalRequest.finalUrl;
			if (useProxy) {
				targetUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
			}

			const res = await fetch(targetUrl, fetchOptions);
			setLoading(false);
			setIsStreaming(true);

			const endTime = performance.now();
			const contentType = res.headers.get('content-type');

			const responseCookies = [];
			for (const [key, value] of res.headers.entries()) {
				if (key.toLowerCase() === 'set-cookie') {
					responseCookies.push(value);
				}
			}

			let responseState = {
				status: res.status,
				headers: Object.fromEntries(res.headers.entries()),
				cookies: responseCookies,
				duration: Math.round(endTime - startTime),
				size: 0,
				data: '',
				contentType
			};

			setResponse(responseState);

			if (contentType.match(/image|video|audio/i)) {
				const blob = await res.blob();
				const mediaUrl = URL.createObjectURL(blob);
				setResponse((prev) => ({
					...prev,
					mediaUrl,
					mediaType: contentType.split('/')[0],
					size: blob.size
				}));
				setIsStreaming(false);
			} else {
				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let textBuffer = '';
				let done = false;

				while (!done) {
					const { value, done: readerDone } = await reader.read();
					done = readerDone;
					if (value) {
						const chunk = decoder.decode(value, { stream: !done });
						textBuffer += chunk;
						// eslint-disable-next-line
						setResponse((prev) => ({
							...prev,
							data: textBuffer,
							size: textBuffer.length
						}));
					}
				}

				setResponse((prev) => {
					let finalData = prev.data;
					try {
						finalData = JSON.parse(finalData);
					} catch (e) {}
					return { ...prev, data: finalData };
				});
				setIsStreaming(false);
			}
		} catch (err) {
			const endTime = performance.now();
			if (err.name === 'AbortError') {
				setResponse((prev) => ({
					...prev,
					status: 'ABORTED',
					data: (prev?.data || '') + '\n\n[ STREAM ABORTED BY USER ]',
					duration: Math.round(endTime - startTime)
				}));
			} else {
				setResponse({
					error: true,
					status: 'ERR_FAILED',
					data: `Request failed.\n\nPossible reasons:\n1. CORS policy blocked the request (No 'Access-Control-Allow-Origin' header).\n2. The network is offline.\n3. The URL is invalid or unreachable.\n\nError details: ${err.message}`,
					headers: {},
					cookies: [],
					duration: Math.round(endTime - startTime),
					size: 0
				});
			}
			setLoading(false);
			setIsStreaming(false);
		}
	};

	const abortRequest = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
	};


	const handleToEditor = () => {
		if (response?.data) {
			dispatch(setJsonData(response.data));
			dispatch(setCurrentScreen('/viewer'));
			navigate('/viewer');
		}
	};

	const handleToModelGen = () => {
		if (response?.data) {
			const strData =
				typeof response.data === 'object'
					? JSON.stringify(response.data, null, 2)
					: response.data;
			dispatch(setCurrentScreen('/json-model-generator'));
			navigate('/json-model-generator', {
				state: { jsonInput: strData }
			});
		}
	};

	const handleToDashboard = () => {
		if (response?.data && Array.isArray(response.data)) {
			dispatch(setDashboardData(response.data));
			dispatch(setCurrentScreen('/dashboard'));
			navigate('/dashboard');
		} else {
			alert(
				'Response data must be an array of objects to be viewed in the Dashboard.'
			);
		}
	};


	const handleQueryParamChange = (id, field, value) => {
		setQueryParams((current) => {
			const newParams = current.map((p) =>
				p.id === id ? { ...p, [field]: value } : p
			);
			syncParamsToUrl(newParams);
			return newParams;
		});
	};

	const addQueryParam = () => {
		setQueryParams((current) => [
			...current,
			{ id: Date.now(), key: '', value: '' }
		]);
	};

	const removeQueryParam = (id) => {
		setQueryParams((current) => {
			const newParams = current.filter((p) => p.id !== id);
			syncParamsToUrl(newParams);
			return newParams;
		});
	};

	const toggleParamsMode = () => {
		if (paramsMode === 'kv') {
			const obj = {};
			queryParams.forEach((p) => {
				if (p.key) obj[p.key] = p.value;
			});
			setParamsJson(JSON.stringify(obj, null, 2));
			setParamsMode('json');
		} else {
			try {
				const obj = JSON.parse(paramsJson);
				const arr = Object.keys(obj).map((k) => ({
					id: Date.now() + Math.random(),
					key: k,
					value: String(obj[k])
				}));
				const newParams =
					arr.length > 0
						? arr
						: [{ id: Date.now(), key: '', value: '' }];
				setQueryParams(newParams);
				syncParamsToUrl(newParams);
				setParamsMode('kv');
			} catch (err) {
				alert(
					'Invalid JSON format. Please fix syntax errors before switching back to Key-Value mode.'
				);
			}
		}
	};


	const updateFormData = (id, field, val) => {
		setFormDataParams((current) =>
			current.map((p) => (p.id === id ? { ...p, [field]: val } : p))
		);
	};
	const addFormDataRow = () => {
		setFormDataParams((current) => [
			...current,
			{ id: Date.now(), key: '', type: 'text', value: '', file: null }
		]);
	};
	const removeFormDataRow = (id) => {
		setFormDataParams((current) => current.filter((p) => p.id !== id));
	};


	const renderAuth = () => {
		if (authType === 'bearer') {
			return (
				<Form.Control
					placeholder="Bearer Token"
					value={bearer}
					onChange={(e) => setBearer(e.target.value)}
					className="hud-input"
				/>
			);
		}

		if (authType === 'basic') {
			return (
				<>
					<Form.Control
						className="mb-3 hud-input"
						placeholder="Username"
						value={basicUser}
						onChange={(e) => setBasicUser(e.target.value)}
					/>
					<Form.Control
						placeholder="Password"
						type="password"
						value={basicPass}
						onChange={(e) => setBasicPass(e.target.value)}
						className="hud-input"
					/>
				</>
			);
		}

		if (authType === 'apikey') {
			return (
				<>
					<Form.Control
						className="mb-3 hud-input"
						placeholder="Key Name"
						value={apiKeyName}
						onChange={(e) => setApiKeyName(e.target.value)}
					/>
					<Form.Control
						className="mb-3 hud-input"
						placeholder="Key Value"
						value={apiKey}
						onChange={(e) => setApiKey(e.target.value)}
					/>
					<Form.Select
						value={apiKeyIn}
						onChange={(e) => setApiKeyIn(e.target.value)}
						className="hud-input"
					>
						<option value="header">Header</option>
						<option value="query">Query</option>
					</Form.Select>
				</>
			);
		}

		return null;
	};

	const getStatusClass = (status) => {
		if (status >= 200 && status < 300) return 'status-ok';
		if (status >= 400 && status < 500) return 'status-client-error';
		if (status >= 500) return 'status-server-error';
		return 'status-other';
	};

	return (
		<div className="p-4 tool-page-bg theme-pink d-flex flex-column min-vh-100">
			<Row className="flex-grow-1 g-4 m-0 p-0">
				{/* Request Pane */}
				<Col
					lg={6}
					className="d-flex flex-column p-0 pe-lg-2 mb-4 mb-lg-0"
				>
					<Card className="glass-panel h-100 border-0 d-flex flex-column overflow-hidden">
						<Card.Header
							className="p-0 border-bottom border-secondary"
							style={{
								borderColor: 'rgba(56, 189, 248, 0.1)',
								background: 'rgba(255, 255, 255, 0.02)'
							}}
						>
							<div className="d-flex justify-content-between align-items-center p-3">
								<span className="font-monospace text-secondary small text-truncate pe-2">
									INPUT_STREAM // REQUEST_CONSTRUCTOR
								</span>
								<div className="d-flex flex-nowrap">
									<Button
										variant="none"
										className={`hud-btn-secondary fw-bold btn-sm py-1 me-2 text-nowrap ${useProxy ? 'text-warning border-warning' : ''}`}
										onClick={() => setUseProxy(!useProxy)}
										title="Bypass CORS restrictions using a public proxy"
									>
										🌐 [ PROXY: {useProxy ? 'ON' : 'OFF'} ]
									</Button>
									<Button
										variant="none"
										className="hud-btn-secondary fw-bold btn-sm py-1 me-2 text-nowrap"
										onClick={handleImportCurl}
									>
										📋 [ IMPORT cURL ]
									</Button>
									<Button
										variant="none"
										className="hud-btn-secondary fw-bold btn-sm py-1 text-nowrap"
										onClick={onMenuClick}
									>
										[ ☰ MENU ]
									</Button>
								</div>
							</div>
						</Card.Header>

						<Card.Body className="p-4 overflow-auto d-flex flex-column">
							<div
								className="d-flex align-items-stretch mb-4 custom-url-bar flex-shrink-0"
								style={{ minHeight: '54px' }}
							>
								<Form.Select
									value={method}
									onChange={(e) => setMethod(e.target.value)}
									style={{ width: '130px', flexShrink: 0 }}
								>
									{[
										'GET',
										'POST',
										'PUT',
										'DELETE',
										'PATCH'
									].map((m) => (
										<option key={m}>{m}</option>
									))}
								</Form.Select>
								<Form.Control
									placeholder="https://api.example.com/v1/resource"
									value={url}
									onChange={handleUrlChange}
									className="mx-2 flex-grow-1"
								/>
								{loading || isStreaming ? (
									<Button
										onClick={abortRequest}
										variant="none"
										className="hud-btn-danger fw-bold px-4 d-flex align-items-center justify-content-center"
										style={{ whiteSpace: 'nowrap' }}
									>
										[ ABORT ]
									</Button>
								) : (
									<Button
										onClick={sendRequest}
										variant="none"
										className="hud-btn-primary fw-bold px-4 d-flex align-items-center justify-content-center"
										style={{ whiteSpace: 'nowrap' }}
									>
										[ SEND ]
									</Button>
								)}
							</div>

							<Tab.Container defaultActiveKey="params">
								<Nav className="hud-tabs flex-shrink-0">
									<Nav.Item>
										<Nav.Link eventKey="params">
											Params
										</Nav.Link>
									</Nav.Item>
									<Nav.Item>
										<Nav.Link eventKey="auth">
											Auth
										</Nav.Link>
									</Nav.Item>
									<Nav.Item>
										<Nav.Link eventKey="headers">
											Headers
										</Nav.Link>
									</Nav.Item>
									<Nav.Item>
										<Nav.Link eventKey="body">
											Body
										</Nav.Link>
									</Nav.Item>
									<Nav.Item>
										<Nav.Link eventKey="cookies">
											Cookies
										</Nav.Link>
									</Nav.Item>
								</Nav>
								<Tab.Content className="flex-grow-1">
									<Tab.Pane eventKey="params">
										<div className="d-flex justify-content-between align-items-center mb-3">
											<span className="text-secondary font-monospace small">
												QUERY PARAMETERS
											</span>
											<Button
												variant="none"
												size="sm"
												className="hud-btn-secondary py-1"
												onClick={toggleParamsMode}
											>
												[ MODE:{' '}
												{paramsMode.toUpperCase()} ]
											</Button>
										</div>
										{paramsMode === 'kv' ? (
											<div className="key-value-editor">
												{queryParams.map((p, i) => (
													<Row
														key={p.id}
														className="g-2 mb-2"
													>
														<Col>
															<Form.Control
																placeholder="Key"
																value={p.key}
																onChange={(e) =>
																	handleQueryParamChange(
																		p.id,
																		'key',
																		e.target
																			.value
																	)
																}
																className="hud-input"
															/>
														</Col>
														<Col>
															<Form.Control
																placeholder="Value"
																value={p.value}
																onChange={(e) =>
																	handleQueryParamChange(
																		p.id,
																		'value',
																		e.target
																			.value
																	)
																}
																className="hud-input"
															/>
														</Col>
														<Col xs="auto">
															<Button
																variant="none"
																className="hud-btn-danger"
																onClick={() =>
																	removeQueryParam(
																		p.id
																	)
																}
															>
																&times;
															</Button>
														</Col>
													</Row>
												))}
												<Button
													variant="none"
													size="sm"
													className="hud-btn-secondary mt-2"
													onClick={addQueryParam}
												>
													+ ADD PARAM
												</Button>
											</div>
										) : (
											<Form.Control
												as="textarea"
												rows={8}
												value={paramsJson}
												onChange={
													handleParamsJsonChange
												}
												className="hud-input font-monospace"
												placeholder='{\n  "key": "value"\n}'
											/>
										)}
									</Tab.Pane>
									<Tab.Pane eventKey="auth">
										<Form.Select
											value={authType}
											onChange={(e) =>
												setAuthType(e.target.value)
											}
											className="hud-input mb-3"
										>
											<option value="none">None</option>
											<option value="bearer">
												Bearer
											</option>
											<option value="basic">Basic</option>
											<option value="apikey">
												API Key
											</option>
										</Form.Select>
										<div className="mt-2">
											{renderAuth()}
										</div>
									</Tab.Pane>
									<Tab.Pane eventKey="headers">
										<Form.Control
											as="textarea"
											rows={5}
											placeholder='{ "Content-Type": "application/json" }'
											value={headers}
											onChange={(e) =>
												setHeaders(e.target.value)
											}
											className="hud-input"
											style={{ minHeight: '200px' }}
										/>
									</Tab.Pane>
									<Tab.Pane eventKey="body">
										<div className="d-flex justify-content-between align-items-center mb-3">
											<span className="text-secondary font-monospace small">
												REQUEST BODY
											</span>
											<div className="d-flex gap-2">
												<Button
													variant="none"
													size="sm"
													className={`hud-btn-secondary py-1 px-3 ${bodyType === 'raw' ? 'text-info border-info' : ''}`}
													onClick={() =>
														setBodyType('raw')
													}
												>
													[ RAW ]
												</Button>
												<Button
													variant="none"
													size="sm"
													className={`hud-btn-secondary py-1 px-3 ${bodyType === 'formdata' ? 'text-info border-info' : ''}`}
													onClick={() =>
														setBodyType('formdata')
													}
												>
													[ FORM DATA ]
												</Button>
											</div>
										</div>

										{bodyType === 'raw' ? (
											<Form.Control
												as="textarea"
												rows={6}
												placeholder="JSON or Text payload"
												value={body}
												onChange={(e) =>
													setBody(e.target.value)
												}
												className="hud-input font-monospace"
												style={{ minHeight: '200px' }}
											/>
										) : (
											<div className="key-value-editor">
												{formDataParams.map((p) => (
													<Row
														key={p.id}
														className="g-2 mb-2"
													>
														<Col xs={3}>
															<Form.Control
																placeholder="Key"
																value={p.key}
																onChange={(e) =>
																	updateFormData(
																		p.id,
																		'key',
																		e.target
																			.value
																	)
																}
																className="hud-input"
															/>
														</Col>
														<Col xs={3}>
															<Form.Select
																value={p.type}
																onChange={(e) =>
																	updateFormData(
																		p.id,
																		'type',
																		e.target
																			.value
																	)
																}
																className="hud-input"
															>
																<option value="text">
																	Text
																</option>
																<option value="file">
																	File
																</option>
															</Form.Select>
														</Col>
														<Col xs={5}>
															{p.type ===
															'text' ? (
																<Form.Control
																	placeholder="Value"
																	value={
																		p.value
																	}
																	onChange={(
																		e
																	) =>
																		updateFormData(
																			p.id,
																			'value',
																			e
																				.target
																				.value
																		)
																	}
																	className="hud-input"
																/>
															) : (
																<Form.Control
																	type="file"
																	onChange={(
																		e
																	) =>
																		updateFormData(
																			p.id,
																			'file',
																			e
																				.target
																				.files[0]
																		)
																	}
																	className="hud-input pt-2"
																	style={{
																		fontSize:
																			'0.8rem'
																	}}
																/>
															)}
														</Col>
														<Col xs="auto">
															<Button
																variant="none"
																className="hud-btn-danger"
																onClick={() =>
																	removeFormDataRow(
																		p.id
																	)
																}
															>
																&times;
															</Button>
														</Col>
													</Row>
												))}
												<Button
													variant="none"
													size="sm"
													className="hud-btn-secondary mt-2"
													onClick={addFormDataRow}
												>
													+ ADD FIELD
												</Button>
											</div>
										)}
									</Tab.Pane>
									<Tab.Pane eventKey="cookies">
										<Form.Control
											as="textarea"
											rows={5}
											placeholder="cookie1=value1; cookie2=value2"
											value={cookieInput}
											onChange={(e) =>
												setCookieInput(e.target.value)
											}
											className="hud-input"
											style={{ minHeight: '200px' }}
										/>
									</Tab.Pane>
								</Tab.Content>
							</Tab.Container>
						</Card.Body>
					</Card>
				</Col>

				{/* Response and Code Pane */}
				<Col lg={6} className="d-flex flex-column p-0 ps-lg-2">
					<Tab.Container defaultActiveKey="response">
						<Card className="glass-panel h-100 border-0 d-flex flex-column overflow-hidden">
							<Card.Header
								className="p-0 border-bottom border-secondary"
								style={{
									borderColor: 'rgba(56, 189, 248, 0.1)',
									background: 'rgba(255, 255, 255, 0.02)'
								}}
							>
								<div className="d-flex justify-content-between align-items-center">
									<div className="px-3">
										<span
											className="font-monospace text-secondary small"
											style={{ color: '#ec4899' }}
										>
											OUTPUT_STREAM // RESPONSE
										</span>
										{response && (
											<div className="d-flex gap-2 ms-3">
												<Button
													variant="none"
													className="hud-btn-secondary fw-bold py-0 px-2"
													style={{
														fontSize: '0.75rem'
													}}
													onClick={handleToEditor}
												>
													↗ EDITOR
												</Button>
												<Button
													variant="none"
													className="hud-btn-secondary fw-bold py-0 px-2"
													style={{
														fontSize: '0.75rem'
													}}
													onClick={handleToModelGen}
												>
													↗ MODEL GEN
												</Button>
												{Array.isArray(
													response.data
												) && (
													<Button
														variant="none"
														className="hud-btn-secondary fw-bold py-0 px-2"
														style={{
															fontSize: '0.75rem'
														}}
														onClick={
															handleToDashboard
														}
													>
														↗ DASHBOARD
													</Button>
												)}
											</div>
										)}
									</div>
									<Nav className="hud-tabs mb-0 border-0 pt-2 pe-2">
										<Nav.Item>
											<Nav.Link eventKey="response">
												Response
											</Nav.Link>
										</Nav.Item>
										<Nav.Item>
											<Nav.Link eventKey="code">
												Code
											</Nav.Link>
										</Nav.Item>
									</Nav>
								</div>
							</Card.Header>
							<Card.Body className="p-4 overflow-auto">
								<Tab.Content>
									<Tab.Pane eventKey="response">
										{response ? (
											<div>
												<div className="d-flex flex-wrap align-items-center mb-2 response-meta">
													<div
														className={`${getStatusClass(
															response.status
														)} response-badge`}
													>
														<label>STATUS</label>
														{response.status}
														{isStreaming && (
															<Spinner
																animation="grow"
																size="sm"
																className="ms-2 text-info"
															/>
														)}
													</div>
													<div className="response-badge text-info">
														<label>TIME</label>
														{response.duration}
														ms
													</div>
													<div className="response-badge text-info">
														<label>SIZE</label>
														{(
															response.size / 1024
														).toFixed(2)}{' '}
														KB
													</div>
												</div>
												<Tab.Container defaultActiveKey="res-body">
													<Nav className="hud-tabs mb-3">
														<Nav.Item>
															<Nav.Link eventKey="res-body">
																Body
															</Nav.Link>
														</Nav.Item>
														<Nav.Item>
															<Nav.Link eventKey="res-headers">
																Headers
															</Nav.Link>
														</Nav.Item>
														<Nav.Item>
															<Nav.Link eventKey="res-cookies">
																Cookies
															</Nav.Link>
														</Nav.Item>
													</Nav>
													<Tab.Content>
														<Tab.Pane eventKey="res-body">
															<div
																className="code-block"
																style={{
																	minHeight:
																		'400px',
																	overflow:
																		'auto'
																}}
															>
																{response.mediaType ===
																'image' ? (
																	<img
																		src={
																			response.mediaUrl
																		}
																		alt="response"
																		style={{
																			maxWidth:
																				'100%',
																			borderRadius:
																				'8px'
																		}}
																	/>
																) : response.mediaType ===
																  'video' ? (
																	<video
																		controls
																		src={
																			response.mediaUrl
																		}
																		style={{
																			maxWidth:
																				'100%',
																			borderRadius:
																				'8px'
																		}}
																	/>
																) : response.mediaType ===
																  'audio' ? (
																	<audio
																		controls
																		src={
																			response.mediaUrl
																		}
																		style={{
																			width: '100%'
																		}}
																	/>
																) : typeof response.data ===
																  'object' ? (
																	<JsonView
																		src={
																			response.data
																		}
																		theme="twilight"
																		style={{
																			background:
																				'transparent'
																		}}
																	/>
																) : (
																	<pre
																		style={{
																			fontFamily:
																				"'Courier New', Courier, monospace",
																			color: '#f8fafc'
																		}}
																	>
																		{
																			response.data
																		}
																	</pre>
																)}

																{/* Live HTML Sandboxed Preview */}
																{response.contentType?.includes(
																	'html'
																) &&
																	typeof response.data ===
																		'string' && (
																		<div className="mt-4 border-top border-info pt-3">
																			<label className="text-info font-monospace small mb-2 d-block">
																				LIVE
																				PREVIEW
																			</label>
																			<iframe
																				title="preview"
																				srcDoc={
																					response.data
																				}
																				style={{
																					width: '100%',
																					height: '400px',
																					backgroundColor:
																						'#fff',
																					border: 'none',
																					borderRadius:
																						'4px'
																				}}
																			/>
																		</div>
																	)}
															</div>
														</Tab.Pane>
														<Tab.Pane eventKey="res-headers">
															<pre
																className="code-block"
																style={{
																	minHeight:
																		'400px',
																	overflow:
																		'auto',
																	color: '#34d399'
																}}
															>
																{JSON.stringify(
																	response.headers,
																	null,
																	2
																)}
															</pre>
														</Tab.Pane>
														<Tab.Pane eventKey="res-cookies">
															<pre
																className="code-block"
																style={{
																	minHeight:
																		'400px',
																	overflow:
																		'auto',
																	color: '#fbbf24'
																}}
															>
																{response
																	.cookies
																	.length > 0
																	? response.cookies.join(
																			'\n'
																		)
																	: 'No cookies set in response.'}
															</pre>
														</Tab.Pane>
													</Tab.Content>
												</Tab.Container>
											</div>
										) : (
											<div className="d-flex flex-column align-items-center justify-content-center h-100 opacity-50 py-5">
												<div
													className="fs-1 mb-3"
													style={{
														filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.8))'
													}}
												>
													📡
												</div>
												<div
													className="font-monospace text-info"
													style={{
														letterSpacing: '2px'
													}}
												>
													AWAITING_CONNECTION...
												</div>
												<div className="font-monospace text-secondary small mt-2">
													Execute a request to
													initiate data transfer
												</div>
											</div>
										)}
									</Tab.Pane>
									<Tab.Pane eventKey="code">
										<Form.Select
											value={language}
											onChange={(e) =>
												setLanguage(e.target.value)
											}
											className="mb-3 hud-input"
										>
											<option value="curl">cURL</option>
											<option value="fetch">Fetch</option>
											<option value="axios">Axios</option>
											<option value="python">
												Python
											</option>
											<option value="java">
												Java (OkHttp)
											</option>
											<option value="rust">
												Rust (reqwest)
											</option>
											<option value="go">
												Go (Native)
											</option>
											<option value="csharp">
												C# (HttpClient)
											</option>
											<option value="php">
												PHP (cURL)
											</option>
											<option value="ruby">
												Ruby (Net::HTTP)
											</option>
											<option value="swift">
												Swift (URLSession)
											</option>
											<option value="powershell">
												PowerShell
											</option>
										</Form.Select>

										<div
											className="code-block"
											style={{
												minHeight: '400px',
												overflow: 'auto',
												color: '#f8fafc'
											}}
										>
											<Button
												size="sm"
												className="copy-btn"
												onClick={handleCopy}
											>
												{copyStatus}
											</Button>
											<pre>{generatedCode}</pre>
										</div>
									</Tab.Pane>
								</Tab.Content>
							</Card.Body>
						</Card>
					</Tab.Container>
				</Col>
			</Row>
		</div>
	);
}

export default URLManipulator;
