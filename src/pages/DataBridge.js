import React, { useRef, useState, useEffect } from 'react';
import {
	Button,
	Row,
	Col,
	Form,
	Badge,
	ProgressBar,
	Modal
} from 'react-bootstrap';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

const getDeviceName = () => {
	const savedName = localStorage.getItem('self_tools_username');
	if (savedName) return savedName;

	const ua = navigator.userAgent;
	let os = 'Unknown';
	if (ua.indexOf('Win') !== -1) os = 'Windows';
	else if (ua.indexOf('Mac') !== -1) os = 'Mac';
	else if (ua.indexOf('Linux') !== -1) os = 'Linux';
	else if (ua.indexOf('Android') !== -1) os = 'Android';
	else if (ua.indexOf('like Mac') !== -1) os = 'iOS';
	return os + '-User';
};

const formatFileSize = (bytes) => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatEta = (seconds) => {
	if (seconds === Infinity || isNaN(seconds)) return '--';
	if (seconds <= 0) return '0s';
	if (seconds < 1) return '< 1s';
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	if (h > 0) return `${h}h ${m}m ${s}s`;
	if (m > 0) return `${m}m ${s}s`;
	return `${s}s`;
};

function QRScanner({ onScanSuccess }) {
	const [isSecure, setIsSecure] = useState(true);

	useEffect(() => {
		if (
			!window.isSecureContext &&
			window.location.hostname !== 'localhost'
		) {
			setIsSecure(false);
		}
	}, []);

	useEffect(() => {
		if (!isSecure) return;
		const scanner = new Html5QrcodeScanner(
			'qr-reader',
			{ fps: 10, qrbox: { width: 250, height: 250 } },
			false
		);
		scanner.render(
			(text) => {
				scanner.clear();
				onScanSuccess(text);
			},
			() => {}
		);
		return () => {
			scanner.clear().catch(() => {});
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isSecure]);

	const handleFileUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		try {
			const html5QrCode = new Html5Qrcode('qr-reader-file');
			const text = await html5QrCode.scanFile(file, true);
			onScanSuccess(text);
		} catch (err) {
			alert(
				'Could not decode QR code from image. Please ensure the image is clear.'
			);
		}
	};

	if (!isSecure) {
		return (
			<div>
				<div className="p-2 mb-3 text-center border border-warning rounded bg-dark text-warning font-monospace small">
					⚠️ CAMERA BLOCKED (HTTP) ⚠️
					<br />
					<br />
					Browsers block camera access on non-HTTPS networks. Please
					take a photo/screenshot of the QR code and upload it below
					to scan it.
				</div>
				<div id="qr-reader-file" style={{ display: 'none' }}></div>
				<Form.Control
					type="file"
					accept="image/*"
					onChange={handleFileUpload}
					className="hud-input font-monospace"
				/>
			</div>
		);
	}

	return (
		<div
			id="qr-reader"
			className="bg-white rounded p-2 text-dark"
			style={{ width: '100%' }}
		></div>
	);
}

function DataBridge({ onMenuClick }) {
	const [mode, setMode] = useState(null); // 'host' or 'join'
	const [scanningConnId, setScanningConnId] = useState(null); // Track which connection is using the camera

	const [localUsername, setLocalUsername] = useState(() => getDeviceName());
	// Multi-peer state tracking
	const [connections, setConnections] = useState([]); // Stores UI state for handshakes
	const peersRef = useRef({}); // Stores actual RTCPeerConnection and DataChannels: { id: { pc, chat, file } }

	const [chatInput, setChatInput] = useState('');
	const [messages, setMessages] = useState(() => {
		const saved = localStorage.getItem('self_tools_chat_history');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				// Restore chat if less than 30 mins old
				if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
					return parsed.messages || [];
				} else {
					localStorage.removeItem('self_tools_chat_history');
				}
			} catch (e) {}
		}
		return [];
	});

	useEffect(() => {
		if (messages.length > 0) {
			localStorage.setItem(
				'self_tools_chat_history',
				JSON.stringify({
					timestamp: Date.now(),
					messages
				})
			);
		}
	}, [messages]);

	const [fileProgress, setFileProgress] = useState(0);
	const [receivingFile, setReceivingFile] = useState(null);

	const [transferStats, setTransferStats] = useState(null);
	const transferStartTime = useRef(0);
	const lastUiUpdateTime = useRef(0);

	// Buffers for file transfer
	const receiveBuffers = useRef({});
	const chatEndRef = useRef(null);

	const [showManager, setShowManager] = useState(false);
	const [showPeersModal, setShowPeersModal] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	useEffect(() => {
		return () => {
			// Cleanup all connections on unmount
			Object.values(peersRef.current).forEach((peer) => {
				if (peer.pc) peer.pc.close();
			});
		};
	}, []);

	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Warn user before closing tab if connected
	useEffect(() => {
		const handleBeforeUnload = (e) => {
			if (connections.some((c) => c.state === 'connected')) {
				e.preventDefault();
				e.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [connections]);

	const handleDragOver = (e) => {
		if (
			connections.some((c) => c.state === 'connected') &&
			connections.some((c) => c.chatOpen) &&
			!showManager
		) {
			e.preventDefault();
			if (!isDragging) setIsDragging(true);
		}
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		if (e.currentTarget.contains(e.relatedTarget)) return;
		setIsDragging(false);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragging(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			processFileTransfer(e.dataTransfer.files[0]);
		}
	};

	const createPeerConnection = (connId) => {
		const pc = new RTCPeerConnection({
			iceServers: [
				{ urls: 'stun:stun.l.google.com:19302' },
				{ urls: 'stun:stun1.l.google.com:19302' },
				{
					urls: 'turn:openrelay.metered.ca:80',
					username: 'openrelayproject',
					credential: 'openrelayproject'
				},
				{
					urls: 'turn:openrelay.metered.ca:443',
					username: 'openrelayproject',
					credential: 'openrelayproject'
				},
				{
					urls: 'turn:openrelay.metered.ca:443?transport=tcp',
					username: 'openrelayproject',
					credential: 'openrelayproject'
				}
			]
		});
		peersRef.current[connId] = { pc, chat: null, file: null };

		pc.oniceconnectionstatechange = () => {
			const state = pc.iceConnectionState;
			setConnections((prev) =>
				prev.map((c) => {
					if (c.id === connId) {
						const isConnected = state === 'connected' || state === 'completed';
						const newState = isConnected ? 'connected' : state;

						if (
							(newState === 'disconnected' || newState === 'failed') &&
							c.state !== 'disconnected' && c.state !== 'failed' &&
							c.chatOpen
						) {
							setMessages((m) => {
								const txt = `Peer ${connId.substring(0, 4)} disconnected.`;
								if (m.length > 0 && m[m.length - 1].text === txt) return m;
								return [...m, { sender: 'system', text: txt }];
							});
						}
						return { ...c, state: newState };
					}
					return c;
				})
			);
		};

		pc.ondatachannel = (event) => {
			if (event.channel.label === 'chat')
				setupChatChannel(connId, event.channel);
			else if (event.channel.label === 'file')
				setupFileChannel(connId, event.channel);
		};

		return pc;
	};

	const setupChatChannel = (connId, channel) => {
		peersRef.current[connId].chat = channel;

		const sendUsername = () => {
			if (channel.readyState === 'open') {
				channel.send(
					JSON.stringify({
						type: 'system_username',
						username: localUsername
					})
				);
			}
		};

		const handleOpen = () => {
			setConnections((prev) =>
				prev.map((c) =>
					c.id === connId ? { ...c, chatOpen: true } : c
				)
			);
			setMessages((prev) => {
				const msg = `Peer ${connId.substring(0, 4)} secure channel is ready.`;
				if (prev.length > 0 && prev[prev.length - 1].text === msg) return prev;
				return [...prev, { sender: 'system', text: msg }];
			});
			sendUsername();
		};

		channel.onopen = handleOpen;

		if (channel.readyState === 'open') {
			handleOpen();
		}

		channel.onclose = () => {
			setConnections((prev) =>
				prev.map((c) =>
					c.id === connId ? { ...c, chatOpen: false } : c
				)
			);
			setMessages((prev) => {
				const txt = `Peer ${connId.substring(0, 4)} disconnected.`;
				if (prev.length > 0 && prev[prev.length - 1].text === txt) return prev;
				return [...prev, { sender: 'system', text: txt }];
			});
		};

		channel.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data);
				if (data.type === 'system_username') {
					setConnections((prev) => {
						let finalName = data.username;
						// Deduplicate username if it matches another peer or our local name
						const nameExists =
							prev.some(
								(c) =>
									c.remoteUsername === finalName &&
									c.id !== connId
							) || finalName === localUsername;
						if (nameExists) {
							finalName =
								finalName +
								'_' +
								Math.random().toString(36).substring(2, 6);
						}
						return prev.map((c) =>
							c.id === connId
								? { ...c, remoteUsername: finalName }
								: c
						);
					});
				} else if (data.type === 'chat') {
					setMessages((prev) => [
						...prev,
						{ sender: connId, text: data.text }
					]);
				}
			} catch (err) {
				// Fallback for older plaintext versions
				setMessages((prev) => [
					...prev,
					{ sender: connId, text: e.data }
				]);
			}
		};
	};

	const setupFileChannel = (connId, channel) => {
		peersRef.current[connId].file = channel;
		channel.binaryType = 'arraybuffer';
		receiveBuffers.current[connId] = { buffer: [], size: 0, meta: null, startTime: 0 };

		channel.onmessage = (e) => {
			const state = receiveBuffers.current[connId];
			if (typeof e.data === 'string') {
				const msg = JSON.parse(e.data);
				if (msg.type === 'header') {
					state.meta = msg;
					state.buffer = [];
					state.size = 0;
					state.startTime = performance.now();
					setReceivingFile(msg);
					setFileProgress(0);
					setTransferStats({ bytesTransferred: 0, totalBytes: msg.size, speed: 0, eta: Infinity });
					lastUiUpdateTime.current = performance.now();
				} else if (msg.type === 'eof') {
					const blob = new Blob(state.buffer, {
						type: state.meta.mime
					});
					const url = URL.createObjectURL(blob);

					setMessages((prev) => [
						...prev,
						{
							sender: `Peer ${connId.substring(0, 4)}`,
							type: 'file',
							fileName: state.meta.name,
							fileMime: state.meta.mime,
							fileUrl: url,
							fileSize: state.meta.size
						}
					]);
					setReceivingFile(null);
					setFileProgress(0);
					setTransferStats(null);
				}
			} else {
				state.buffer.push(e.data);
				state.size += e.data.byteLength;
				
				const now = performance.now();
				if (now - lastUiUpdateTime.current > 100 || state.size >= state.meta.size) {
					const elapsed = Math.max((now - state.startTime) / 1000, 0.001);
					const speed = state.size / elapsed;
					const eta = speed > 0 ? (state.meta.size - state.size) / speed : Infinity;
					
					if (state.meta) {
						setFileProgress(Math.round((state.size / state.meta.size) * 100));
					}
					setTransferStats({ bytesTransferred: state.size, totalBytes: state.meta.size, speed, eta });
					lastUiUpdateTime.current = now;
				}
			}
		};
	};

	const handleHost = () => {
		setMode('host');
		setConnections([]);
		addNewHostConnection();
	};

	const addNewHostConnection = async () => {
		const connId = Math.random().toString(36).substring(2, 9);
		const pc = createPeerConnection(connId);

		setConnections((prev) => [
			...prev,
			{
				id: connId,
				type: 'host',
				state: 'gathering',
				localCode: '',
				remoteCode: '',
				remoteUsername: null,
				chatOpen: false
			}
		]);

		const chat = pc.createDataChannel('chat');
		const file = pc.createDataChannel('file');
		setupChatChannel(connId, chat);
		setupFileChannel(connId, file);

		let iceTimeout;
		const finalizeGathering = () => {
			clearTimeout(iceTimeout);
			if (pc.signalingState === 'closed') return;
			const encodedOffer = btoa(JSON.stringify(pc.localDescription));
			setConnections((prev) =>
				prev.map((c) => {
					if (c.id === connId) {
						return {
							...c,
							localCode: encodedOffer,
							state: c.state === 'connected' ? 'connected' : 'ready'
						};
					}
					return c;
				})
			);
		};

		pc.onicecandidate = (event) => {
			if (event.candidate === null) {
				finalizeGathering();
			}
		};

		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		// Fallback to force completion if STUN/TURN takes too long
		iceTimeout = setTimeout(finalizeGathering, 8000);
	};

	const handleJoin = () => {
		setMode('join');
		const connId = 'joiner_1';
		createPeerConnection(connId);
		setConnections([
			{
				id: connId,
				type: 'join',
				state: 'disconnected',
				localCode: '',
				remoteCode: '',
				remoteUsername: null,
				chatOpen: false
			}
		]);
	};

	const updateRemoteCode = (connId, code) => {
		setConnections((prev) =>
			prev.map((c) => (c.id === connId ? { ...c, remoteCode: code } : c))
		);
	};

	const processHostCode = async (connId) => {
		const conn = connections.find((c) => c.id === connId);
		if (!conn || !conn.remoteCode) return;

		setConnections((prev) =>
			prev.map((c) =>
				c.id === connId ? { ...c, state: 'gathering' } : c
			)
		);
		const pc = peersRef.current[connId].pc;

		try {
			const offerObj = JSON.parse(atob(conn.remoteCode));
			await pc.setRemoteDescription(offerObj);

			let iceTimeout;
			const finalizeGathering = () => {
				clearTimeout(iceTimeout);
				if (pc.signalingState === 'closed') return;
				const encodedAnswer = btoa(JSON.stringify(pc.localDescription));
				setConnections((prev) =>
					prev.map((c) => {
						if (c.id === connId) {
							return {
								...c,
								localCode: encodedAnswer,
								state: c.state === 'connected' ? 'connected' : 'ready'
							};
						}
						return c;
					})
				);
			};

			pc.onicecandidate = (event) => {
				if (event.candidate === null) {
					finalizeGathering();
				}
			};

			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			iceTimeout = setTimeout(finalizeGathering, 8000);
		} catch (err) {
			alert('Invalid Host Code');
			setConnections((prev) =>
				prev.map((c) =>
					c.id === connId ? { ...c, state: 'disconnected' } : c
				)
			);
		}
	};

	const finalizeConnection = async (connId) => {
		const conn = connections.find((c) => c.id === connId);
		if (!conn || !conn.remoteCode) return;

		const pc = peersRef.current[connId].pc;
		try {
			const answerObj = JSON.parse(atob(conn.remoteCode));
			await pc.setRemoteDescription(answerObj);
		} catch (err) {
			alert('Invalid Join Code');
		}
	};

	const sendChatMessage = (e) => {
		e.preventDefault();
		if (!chatInput.trim()) return;

		// Broadcast to all connected peers
		let sent = false;
		Object.values(peersRef.current).forEach((peer) => {
			if (peer.chat && peer.chat.readyState === 'open') {
				peer.chat.send(
					JSON.stringify({ type: 'chat', text: chatInput })
				);
				sent = true;
			}
		});

		if (sent) {
			setMessages((prev) => [...prev, { sender: 'me', text: chatInput }]);
			setChatInput('');
		} else {
			alert('Secure connection is still opening or peer is unreachable. Please wait a moment and try again.');
		}
	};

	const processFileTransfer = (file) => {
		if (!file) return;

		// Broadcast header to all open file channels
		const activeChannels = Object.values(peersRef.current)
			.map((p) => p.file)
			.filter((c) => c && c.readyState === 'open');

		if (activeChannels.length === 0) {
			alert('No active connections to send the file to.');
			return;
		}

		const headerMsg = JSON.stringify({
			type: 'header',
			name: file.name,
			size: file.size,
			mime: file.type
		});
		activeChannels.forEach((c) => c.send(headerMsg));

		const chunkSize = 16384; // 16KB chunks
		let offset = 0;
		const reader = new FileReader();

		transferStartTime.current = performance.now();
		lastUiUpdateTime.current = performance.now();
		setTransferStats({ bytesTransferred: 0, totalBytes: file.size, speed: 0, eta: Infinity });

		const fileUrl = URL.createObjectURL(file);
		setMessages((prev) => [
			...prev,
			{
				sender: 'me',
				type: 'file',
				fileName: file.name,
				fileMime: file.type,
				fileUrl: fileUrl,
				fileSize: file.size
			}
		]);

		reader.onload = (event) => {
			// Send chunk to all active channels
			activeChannels.forEach((c) => {
				if (c.readyState === 'open') c.send(event.target.result);
			});
			offset += event.target.result.byteLength;

			const now = performance.now();
			if (now - lastUiUpdateTime.current > 100 || offset >= file.size) {
				const elapsed = Math.max((now - transferStartTime.current) / 1000, 0.001);
				const speed = offset / elapsed;
				const eta = speed > 0 ? (file.size - offset) / speed : Infinity;
				
				setFileProgress(Math.round((offset / file.size) * 100));
				setTransferStats({ bytesTransferred: offset, totalBytes: file.size, speed, eta });
				lastUiUpdateTime.current = now;
			}

			if (offset < file.size) {
				readSlice();
			} else {
				activeChannels.forEach((c) => {
					if (c.readyState === 'open')
						c.send(JSON.stringify({ type: 'eof' }));
				});
				setTimeout(() => {
					setFileProgress(0);
					setTransferStats(null);
				}, 1000);
			}
		};

		const readSlice = () => {
			// Handle Backpressure across all channels
			const isBuffered = activeChannels.some(
				(c) => c.bufferedAmount > 1024 * 1024
			);
			if (isBuffered) {
				setTimeout(readSlice, 50);
				return;
			}
			const slice = file.slice(offset, offset + chunkSize);
			reader.readAsArrayBuffer(slice);
		};

		readSlice();
	};

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
	};

	// Helper to check if ANY connection is active to show Chat/File interface
	const isAnyConnected = connections.some((c) => c.chatOpen);
	const isChatReady = isAnyConnected;

	const getSenderName = (senderId) => {
		const conn = connections.find((c) => c.id === senderId);
		if (conn && conn.remoteUsername) return conn.remoteUsername;
		return `Peer ${senderId.substring(0, 4)}`;
	};

	const renderPeersList = () => (
		<div className="flex-grow-1 p-3 d-flex flex-column overflow-auto gap-2">
			{connections.length === 0 ? (
				<div className="text-secondary small font-monospace text-center mt-4">
					No peers registered.
				</div>
			) : (
				connections.map((conn, idx) => (
					<div
						key={conn.id}
						className="d-flex align-items-center justify-content-between p-3 rounded"
						style={{
							backgroundColor: 'rgba(0,0,0,0.3)',
							border: '1px solid rgba(255,255,255,0.05)'
						}}
					>
						<div className="d-flex align-items-center gap-3">
							<div
								style={{
									width: '10px',
									height: '10px',
									borderRadius: '50%',
									backgroundColor:
										conn.chatOpen
											? '#10b981'
											: conn.state === 'connected'
											? '#38bdf8'
											: conn.state === 'gathering' ||
											  conn.state === 'ready'
											? '#fbbf24'
											: '#ef4444',
									boxShadow:
										conn.chatOpen
											? '0 0 8px #10b981'
											: conn.state === 'connected'
											? '0 0 8px #38bdf8'
											: 'none'
								}}
							/>
							<div
								className="d-flex flex-column"
								style={{ minWidth: 0 }}
							>
								<span
									className="font-monospace text-light fw-bold d-flex align-items-center gap-2 text-truncate"
									style={{
										fontSize: '0.9rem'
									}}
								>
									{conn.remoteUsername
										? conn.remoteUsername
										: conn.type === 'host'
										? 'Peer Node'
										: 'Host Node'}
									{!conn.remoteUsername && ` #${idx + 1}`}

									{conn.type === 'join' && (
										<span title="Host">👑</span>
									)}
								</span>
								<span
									className="font-monospace text-secondary"
									style={{
										fontSize: '0.7rem'
									}}
								>
									ID:{' '}
									{conn.id.substring(0, 6).toUpperCase()}
								</span>
							</div>
						</div>
						<Badge
							bg={
								conn.chatOpen
									? 'success'
									: conn.state === 'connected'
									? 'info'
									: conn.state === 'disconnected'
									? 'danger'
									: 'warning'
							}
							className="font-monospace"
						>
							{conn.chatOpen ? 'SECURE' : conn.state.toUpperCase()}
						</Badge>
					</div>
				))
			)}
		</div>
	);

	return (
		<div
			className="p-2 p-md-4 tool-page-bg theme-teal d-flex flex-column position-relative data-bridge-container"
			style={{ '--theme-color': '#14b8a6' }}
			onDragOver={handleDragOver}
		>
			<style>
				{`
					.data-bridge-container { min-height: 100vh; min-height: 100dvh; overflow-x: hidden; }
					.chat-panel-container { flex-grow: 1; min-height: 60vh; }
					@media (min-width: 992px) {
						.data-bridge-container { height: 100vh; height: 100dvh; overflow: hidden; }
						.chat-panel-container, .peers-panel-container { height: 100% !important; min-height: 0; margin-bottom: 0; }
					}
				`}
			</style>
			{isDragging && isAnyConnected && isChatReady && !showManager && (
				<div
					className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
					style={{
						backgroundColor:
							'color-mix(in srgb, var(--theme-color) 15%, transparent)',
						backdropFilter: 'blur(8px)',
						zIndex: 9999,
						border: '4px dashed var(--theme-color)'
					}}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onDragOver={(e) => e.preventDefault()}
				>
					<div className="fs-1 mb-3" style={{ fontSize: '4rem' }}>
						📁
					</div>
					<h3
						className="font-monospace fw-bold text-light text-center px-3"
						style={{ textShadow: '0 0 15px var(--theme-color)' }}
					>
						DROP FILE TO SECURELY BEAM TO PEERS
					</h3>
				</div>
			)}
			<div className="glass-panel py-2 px-2 px-md-3 mb-3 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between border-0 flex-shrink-0 gap-2">
				<div className="d-flex align-items-center justify-content-between w-100 w-md-auto">
					<span className="font-monospace text-secondary small text-truncate pe-2">
						NETWORK // P2P_DATA_BRIDGE
					</span>
					<Badge
						bg={isAnyConnected ? 'success' : 'secondary'}
						className="ms-2 ms-md-3 font-monospace"
					>
						{isAnyConnected ? 'ACTIVE' : 'STANDBY'}
					</Badge>
				</div>
				<div className="d-flex align-items-center justify-content-end gap-2 gap-md-3 w-100 w-md-auto">
					{isAnyConnected && (
						<>
							<Button
								variant="none"
								className="hud-btn-secondary fw-bold px-3 py-2 text-nowrap d-lg-none"
								onClick={() => setShowPeersModal(true)}
								style={{
									borderColor: 'var(--theme-color)',
									color: 'var(--theme-color)'
								}}
								title="Network Nodes"
							>
								[ 👥 ]
							</Button>
							<Button
								variant="none"
								className="hud-btn-secondary fw-bold px-3 px-md-4 py-2 text-nowrap"
								onClick={() => setShowManager(!showManager)}
								style={{
									borderColor: 'var(--theme-color)',
									color: 'var(--theme-color)'
								}}
							>
								[ {showManager ? 'RETURN' : '🔗 MANAGE'}
								<span className="d-none d-sm-inline"> {showManager ? 'TO CHAT' : 'LINKS'}</span>{' '}
								]
							</Button>
						</>
					)}
					<Button
						variant="none"
						className="hud-btn-secondary fw-bold px-4 py-2"
						onClick={onMenuClick}
						style={{
							borderColor: 'var(--theme-color)',
							color: 'var(--theme-color)'
						}}
					>
						[ ☰ MENU ]
					</Button>
				</div>
			</div>

			{!isAnyConnected || showManager ? (
				<Row className="flex-grow-1 m-0 p-0 justify-content-center align-items-center">
					<Col lg={6} className="d-flex flex-column p-0">
						<div
							className="glass-panel p-4 overflow-hidden d-flex flex-column border-0"
							style={{
								borderTop: '2px solid var(--theme-color)'
							}}
						>
							{!mode ? (
								<div className="text-center py-5">
									<h4
										className="font-monospace fw-bold mb-4"
										style={{ color: 'var(--theme-color)' }}
									>
										ESTABLISH P2P LINK
									</h4>
									<p className="text-secondary small mb-4 px-3">
										Connect two devices securely across
										local or public networks. Uses free
										public STUN servers to discover internet
										routes.
									</p>
									<div className="d-flex justify-content-center align-items-center gap-3 mb-5">
										<span className="text-secondary font-monospace small fw-bold">
											DISPLAY NAME:
										</span>
										<Form.Control
											type="text"
											value={localUsername}
											onChange={(e) => {
												setLocalUsername(
													e.target.value
												);
												localStorage.setItem(
													'self_tools_username',
													e.target.value
												);
											}}
											className="hud-input font-monospace text-center fw-bold"
											style={{
												width: '220px',
												color: 'var(--theme-color)'
											}}
											maxLength={20}
										/>
									</div>
									<div className="d-flex justify-content-center gap-4">
										<Button
											variant="none"
											className="hud-btn-secondary fw-bold px-5 py-3"
											onClick={handleHost}
											style={{
												borderColor:
													'var(--theme-color)',
												color: 'var(--theme-color)'
											}}
										>
											[ HOST CONNECTION ]
										</Button>
										<Button
											variant="none"
											className="hud-btn-secondary fw-bold px-5 py-3"
											onClick={handleJoin}
										>
											[ JOIN CONNECTION ]
										</Button>
									</div>
								</div>
							) : (
								<div
									className="fade-in overflow-auto"
									style={{ maxHeight: '70vh' }}
								>
									<div className="d-flex justify-content-between align-items-center mb-4">
										<h5
											className="font-monospace fw-bold m-0"
											style={{
												color: 'var(--theme-color)'
											}}
										>
											{mode === 'host'
												? 'HOSTING SESSION'
												: 'JOINING SESSION'}
										</h5>
										<div className="d-flex gap-3 align-items-center">
											{isAnyConnected && (
												<Button
													variant="none"
													className="text-danger p-0 font-monospace fw-bold"
													onClick={() => {
														Object.values(
															peersRef.current
														).forEach((peer) => {
															if (peer.pc)
																peer.pc.close();
														});
														peersRef.current = {};
														setConnections([]);
														setMessages([]);
														localStorage.removeItem(
															'self_tools_chat_history'
														);
														setMode(null);
														setShowManager(false);
														setFileProgress(0);
														setReceivingFile(null);
													}}
												>
													[ END SESSION ]
												</Button>
											)}
											<Button
												variant="none"
												className="text-secondary p-0"
												onClick={() => {
													if (isAnyConnected) {
														setShowManager(false);
													} else {
														setMode(null);
														setConnections([]);
													}
												}}
											>
												&times;{' '}
												{isAnyConnected
													? 'Close'
													: 'Cancel'}
											</Button>
										</div>
									</div>

									{connections.map((conn, index) => (
										<div
											key={conn.id}
											className="p-3 mb-3 border rounded"
											style={{
												borderColor:
													'color-mix(in srgb, var(--theme-color) 30%, transparent)',
												backgroundColor:
													'rgba(0,0,0,0.2)'
											}}
										>
											<div className="d-flex justify-content-between mb-3">
												<span className="font-monospace small text-light fw-bold">
													DEVICE_SLOT // #{index + 1}
												</span>
												<Badge
													bg={
														conn.state ===
														'connected'
															? 'success'
															: 'secondary'
													}
													className="font-monospace"
												>
													{conn.state}
												</Badge>
											</div>

											{conn.state === 'gathering' && (
												<div className="text-center py-3">
													<span className="spinner-border spinner-border-sm text-info me-2" />{' '}
													Negotiating network
													routes...
												</div>
											)}

											{(conn.state === 'ready' ||
												conn.state === 'disconnected' ||
												conn.state === 'checking' ||
												conn.state === 'connected' ||
												conn.state === 'failed') && (
												<>
													{mode === 'host' ? (
														<Row className="g-4">
															<Col
																sm={12}
																md={6}
																className="d-flex flex-column align-items-center position-relative"
															>
																<div className="d-none d-md-block position-absolute end-0 top-0 bottom-0 border-end border-secondary border-opacity-25"></div>
																<div className="w-100 text-center mb-3">
																	<Badge
																		bg="info"
																		className="text-dark mb-2"
																	>
																		STEP 1
																	</Badge>
																	<div className="font-monospace text-light small fw-bold">
																		SHARE
																		YOUR
																		INVITE
																	</div>
																</div>
																{conn.localCode && (
																	<div
																		className="bg-white p-2 rounded mb-3"
																		style={{
																			boxShadow:
																				'0 0 20px rgba(56, 189, 248, 0.2)'
																		}}
																	>
																		<img
																			src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(conn.localCode)}`}
																			alt="Connection QR"
																			style={{
																				width: '140px',
																				height: '140px'
																			}}
																		/>
																	</div>
																)}
																<div className="d-flex gap-2 w-100 mt-auto">
																	<Form.Control
																		type="text"
																		readOnly
																		value={
																			conn.localCode
																		}
																		className="hud-input font-monospace text-truncate text-center"
																	/>
																	<Button
																		variant="none"
																		className="hud-btn-secondary fw-bold"
																		onClick={() =>
																			copyToClipboard(
																				conn.localCode
																			)
																		}
																		style={{
																			borderColor:
																				'var(--theme-color)',
																			color: 'var(--theme-color)'
																		}}
																	>
																		COPY
																	</Button>
																</div>
															</Col>
															<Col
																sm={12}
																md={6}
																className="d-flex flex-column"
															>
																<div className="w-100 text-center mb-3">
																	<Badge
																		bg="warning"
																		className="text-dark mb-2"
																	>
																		STEP 2
																	</Badge>
																	<div className="font-monospace text-light small fw-bold">
																		RECEIVE
																		PEER
																		ANSWER
																	</div>
																</div>
																<div className="d-flex flex-column gap-3 h-100 justify-content-center">
																	<Button
																		variant="none"
																		className="hud-btn-secondary w-100 py-3"
																		onClick={() =>
																			setScanningConnId(
																				conn.id
																			)
																		}
																	>
																		<span className="fs-3 d-block mb-1">
																			📷
																		</span>
																		SCAN
																		PEER'S
																		QR CODE
																	</Button>
																	<div className="text-center text-secondary font-monospace small position-relative">
																		<hr className="border-secondary opacity-25" />
																		<span
																			className="position-absolute top-50 start-50 translate-middle px-2"
																			style={{
																				backgroundColor:
																					'#020617'
																			}}
																		>
																			OR
																			PASTE
																		</span>
																	</div>
																	<Form.Control
																		type="text"
																		placeholder="Paste answer code manually..."
																		value={
																			conn.remoteCode
																		}
																		onChange={(
																			e
																		) =>
																			updateRemoteCode(
																				conn.id,
																				e
																					.target
																					.value
																			)
																		}
																		className="hud-input font-monospace text-center"
																	/>
																	<Button
																		variant="none"
																		className="hud-btn-secondary fw-bold w-100 mt-2 py-2"
																		onClick={() =>
																			finalizeConnection(
																				conn.id
																			)
																		}
																		disabled={
																			!conn.remoteCode
																		}
																		style={{
																			borderColor:
																				'var(--theme-color)',
																			color: 'var(--theme-color)'
																		}}
																	>
																		[
																		CONNECT
																		]
																	</Button>
																</div>
															</Col>
														</Row>
													) : (
														<Row className="g-4">
															<Col
																sm={12}
																md={6}
																className="d-flex flex-column position-relative"
															>
																<div className="d-none d-md-block position-absolute end-0 top-0 bottom-0 border-end border-secondary border-opacity-25"></div>
																<div className="w-100 text-center mb-3">
																	<Badge
																		bg="warning"
																		className="text-dark mb-2"
																	>
																		STEP 1
																	</Badge>
																	<div className="font-monospace text-light small fw-bold">
																		SCAN
																		HOST
																		INVITE
																	</div>
																</div>
																<div className="d-flex flex-column gap-3 h-100 justify-content-center">
																	<Button
																		variant="none"
																		className="hud-btn-secondary w-100 py-3"
																		onClick={() =>
																			setScanningConnId(
																				conn.id
																			)
																		}
																	>
																		<span className="fs-3 d-block mb-1">
																			📷
																		</span>
																		SCAN
																		HOST'S
																		QR CODE
																	</Button>
																	<div className="text-center text-secondary font-monospace small position-relative">
																		<hr className="border-secondary opacity-25" />
																		<span
																			className="position-absolute top-50 start-50 translate-middle px-2"
																			style={{
																				backgroundColor:
																					'#020617'
																			}}
																		>
																			OR
																			PASTE
																		</span>
																	</div>
																	<Form.Control
																		type="text"
																		placeholder="Paste host code manually..."
																		value={
																			conn.remoteCode
																		}
																		onChange={(
																			e
																		) =>
																			updateRemoteCode(
																				conn.id,
																				e
																					.target
																					.value
																			)
																		}
																		className="hud-input font-monospace text-center"
																	/>
																	<Button
																		variant="none"
																		className="hud-btn-secondary fw-bold w-100 mt-2 py-2"
																		onClick={() =>
																			processHostCode(
																				conn.id
																			)
																		}
																		disabled={
																			!conn.remoteCode ||
																			conn.state !==
																				'disconnected'
																		}
																		style={{
																			borderColor:
																				'var(--theme-color)',
																			color: 'var(--theme-color)'
																		}}
																	>
																		[
																		GENERATE
																		ANSWER ]
																	</Button>
																</div>
															</Col>
															<Col
																sm={12}
																md={6}
																className="d-flex flex-column align-items-center"
															>
																<div className="w-100 text-center mb-3">
																	<Badge
																		bg="info"
																		className="text-dark mb-2"
																	>
																		STEP 2
																	</Badge>
																	<div className="font-monospace text-light small fw-bold">
																		SHARE
																		YOUR
																		ANSWER
																	</div>
																</div>
																{conn.state ===
																'disconnected' ? (
																	<div
																		className="text-secondary text-center font-monospace small opacity-50 my-auto p-4 border border-secondary rounded w-100 d-flex flex-column align-items-center justify-content-center"
																		style={{
																			borderStyle:
																				'dashed',
																			minHeight:
																				'180px'
																		}}
																	>
																		<span className="fs-2 mb-2">
																			⏳
																		</span>
																		Waiting
																		for Host
																		Invite...
																	</div>
																) : (
																	<>
																		{conn.localCode && (
																			<div
																				className="bg-white p-2 rounded mb-3 fade-in"
																				style={{
																					boxShadow:
																						'0 0 20px rgba(56, 189, 248, 0.2)'
																				}}
																			>
																				<img
																					src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(conn.localCode)}`}
																					alt="Answer QR"
																					style={{
																						width: '140px',
																						height: '140px'
																					}}
																				/>
																			</div>
																		)}
																		<div className="d-flex gap-2 w-100 mt-auto fade-in">
																			<Form.Control
																				type="text"
																				readOnly
																				value={
																					conn.localCode
																				}
																				className="hud-input font-monospace text-truncate text-center"
																			/>
																			<Button
																				variant="none"
																				className="hud-btn-secondary fw-bold"
																				onClick={() =>
																					copyToClipboard(
																						conn.localCode
																					)
																				}
																				style={{
																					borderColor:
																						'var(--theme-color)',
																					color: 'var(--theme-color)'
																				}}
																			>
																				COPY
																			</Button>
																		</div>
																		{(conn.state === 'checking' || conn.state === 'connected') && !conn.chatOpen && (
																			<div className="text-info small font-monospace mt-3 text-center fade-in">
																				Host is connecting...
																			</div>
																		)}
																		{conn.state === 'failed' && (
																			<div className="text-danger small font-monospace mt-3 text-center fade-in">
																				Connection failed. Firewalls might be blocking the P2P tunnel.
																			</div>
																		)}
																	</>
																)}
															</Col>
														</Row>
													)}
												</>
											)}
										</div>
									))}

									{mode === 'host' && (
										<div className="text-center mt-3">
											<Button
												variant="none"
												className="hud-btn-secondary fw-bold"
												onClick={addNewHostConnection}
											>
												+ ADD ANOTHER DEVICE
											</Button>
										</div>
									)}
								</div>
							)}
						</div>
					</Col>
				</Row>
			) : (
				<Row
					className="flex-grow-1 m-0 p-0 overflow-hidden"
					style={{ minHeight: 0 }}
				>
					{/* Chat Panel */}
					<Col
						lg={8}
						className="d-flex flex-column p-0 pe-lg-2 h-100"
					>
						<div className="glass-panel p-0 overflow-hidden d-flex flex-column border-0 h-100">
							<div
								className="px-3 py-2 border-bottom d-flex align-items-center"
								style={{
									borderColor:
										'color-mix(in srgb, var(--theme-color) 20%, transparent)',
									background: 'rgba(255, 255, 255, 0.02)'
								}}
							>
								<span
									className="font-monospace small fw-bold"
									style={{ color: 'var(--theme-color)' }}
								>
									ENCRYPTED_COMMS // CHAT
								</span>
							</div>
							<div
								className="flex-grow-1 p-4 overflow-auto d-flex flex-column gap-3"
								style={{
									background:
										'linear-gradient(180deg, rgba(2, 6, 23, 0.4) 0%, color-mix(in srgb, var(--theme-color) 5%, transparent) 100%)',
									boxShadow:
										'inset 0 0 30px rgba(0, 0, 0, 0.6), inset 0 0 10px color-mix(in srgb, var(--theme-color) 10%, transparent)'
								}}
							>
								{messages.length === 0 ? (
									<div className="m-auto text-secondary font-monospace small opacity-50 text-center">
										P2P Connection Established.
										<br />
										Messages are direct and not stored on
										any server.
									</div>
								) : (
									messages.map((msg, idx) => (
										<div
											key={idx}
											className={`d-flex ${msg.sender === 'me' ? 'justify-content-end' : msg.sender === 'system' ? 'justify-content-center' : 'justify-content-start'}`}
										>
											{msg.sender === 'system' ? (
												<Badge
													bg="transparent"
													className="border font-monospace fw-normal px-3 py-2 my-2"
													style={{
														backgroundColor:
															'color-mix(in srgb, var(--theme-color) 10%, transparent)',
														borderColor:
															'color-mix(in srgb, var(--theme-color) 40%, transparent)',
														color: 'var(--theme-color)',
														backdropFilter:
															'blur(4px)',
														boxShadow:
															'0 0 15px color-mix(in srgb, var(--theme-color) 20%, transparent)',
														borderRadius: '20px'
													}}
												>
													{msg.text}
												</Badge>
											) : (
												<div
													className={`d-flex flex-column ${msg.sender === 'me' ? 'align-items-end' : 'align-items-start'}`}
													style={{ maxWidth: '85%' }}
												>
													{msg.sender !== 'me' && (
														<div
															className="text-secondary mb-1 px-2 font-monospace d-flex align-items-center gap-1"
															style={{
																fontSize:
																	'0.7rem',
																textTransform:
																	'uppercase',
																letterSpacing:
																	'1px'
															}}
														>
															{getSenderName(
																msg.sender
															)}
															{connections.find(
																(c) =>
																	c.id ===
																	msg.sender
															)?.type ===
																'join' && (
																<span title="Host">
																	👑
																</span>
															)}
														</div>
													)}
													<div
														className={`p-3 fade-in`}
														style={{
															borderRadius:
																msg.sender ===
																'me'
																	? '20px 20px 4px 20px'
																	: '20px 20px 20px 4px',
															background:
																msg.sender ===
																'me'
																	? 'linear-gradient(135deg, color-mix(in srgb, var(--theme-color) 30%, transparent) 0%, color-mix(in srgb, var(--theme-color) 15%, transparent) 100%)'
																	: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%)',
															backdropFilter:
																'blur(16px)',
															WebkitBackdropFilter:
																'blur(16px)',
															border: `1px solid ${msg.sender === 'me' ? 'color-mix(in srgb, var(--theme-color) 50%, transparent)' : 'rgba(255, 255, 255, 0.15)'}`,
															borderTop: `1px solid ${msg.sender === 'me' ? 'color-mix(in srgb, var(--theme-color) 80%, transparent)' : 'rgba(255, 255, 255, 0.3)'}`,
															boxShadow:
																msg.sender ===
																'me'
																	? '0 10px 25px -5px color-mix(in srgb, var(--theme-color) 40%, transparent), inset 0 2px 4px rgba(255, 255, 255, 0.2)'
																	: '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
															color: '#f8fafc',
															textShadow:
																'0 1px 2px rgba(0,0,0,0.5)',
															fontFamily:
																'system-ui, -apple-system, sans-serif',
															letterSpacing:
																'0.3px',
															lineHeight: '1.5',
															wordBreak:
																'break-word'
														}}
													>
														{msg.type === 'file' ? (
															<div className="d-flex flex-column align-items-start">
																{msg.fileMime &&
																	msg.fileMime.startsWith(
																		'image/'
																	) && (
																		<img
																			src={
																				msg.fileUrl
																			}
																			alt={
																				msg.fileName
																			}
																			style={{
																				maxWidth:
																					'100%',
																				maxHeight:
																					'200px',
																				borderRadius:
																					'4px',
																				marginBottom:
																					'8px',
																				border: '1px solid rgba(255,255,255,0.1)'
																			}}
																		/>
																	)}
																<div className="d-flex align-items-center gap-2">
																	<span
																		className="text-truncate text-info fw-bold"
																		style={{
																			maxWidth:
																				'200px'
																		}}
																		title={
																			msg.fileName
																		}
																	>
																		📄{' '}
																		{
																			msg.fileName
																		}
																	</span>
																	<span className="text-secondary small">
																		(
																		{formatFileSize(msg.fileSize)}
																		)
																	</span>
																</div>
																{msg.sender !==
																	'me' && (
																	<a
																		href={
																			msg.fileUrl
																		}
																		download={
																			msg.fileName
																		}
																		className="btn btn-sm hud-btn-secondary mt-2 py-1 px-3 font-monospace fw-bold w-100 text-decoration-none text-center"
																		style={{
																			fontSize:
																				'0.75rem',
																			borderColor:
																				'var(--theme-color)',
																			color: 'var(--theme-color)'
																		}}
																	>
																		[ SAVE
																		TO
																		DEVICE ]
																	</a>
																)}
															</div>
														) : (
															msg.text
														)}
													</div>
												</div>
											)}
										</div>
									))
								)}
								<div ref={chatEndRef} />
							</div>
							<div
								className="p-3 border-top"
								style={{
									borderColor:
										'color-mix(in srgb, var(--theme-color) 30%, transparent)',
									background: 'rgba(2, 6, 23, 0.6)',
									backdropFilter: 'blur(10px)'
								}}
							>
								{(fileProgress > 0 || receivingFile) && (
									<div className="w-100 mb-3 fade-in">
										<div className="d-flex justify-content-between font-monospace small mb-1 text-light">
											<span className="text-truncate pe-2">
												{receivingFile
													? `RECEIVING: ${receivingFile.name}`
													: 'UPLOADING...'}
											</span>
											<span
												style={{
													color: 'var(--theme-color)'
												}}
											>
												{fileProgress}%
											</span>
										</div>
										<ProgressBar
											now={fileProgress}
											variant="info"
											style={{
												height: '6px',
												backgroundColor:
													'rgba(0,0,0,0.4)'
											}}
										/>
										{transferStats && (
											<div
												className="d-flex justify-content-between font-monospace mt-2"
												style={{ fontSize: '0.65rem', color: '#94a3b8' }}
											>
												<span>
													{formatFileSize(transferStats.bytesTransferred)} /{' '}
													{formatFileSize(transferStats.totalBytes)}
												</span>
												<span>{formatFileSize(transferStats.speed)}/s</span>
												<span>ETA: {formatEta(transferStats.eta)}</span>
											</div>
										)}
									</div>
								)}
								<Form
									onSubmit={sendChatMessage}
									className="d-flex gap-2"
								>
									<div className="position-relative">
										<Form.Control
											type="file"
											id="chat-file-upload"
											className="d-none"
											onChange={(e) => {
												processFileTransfer(
													e.target.files[0]
												);
												e.target.value = null; // allow resending same file
											}}
											disabled={fileProgress > 0 || !isChatReady}
										/>
										<Button
											as="label"
											htmlFor="chat-file-upload"
											variant="none"
											className="hud-btn-secondary d-flex align-items-center justify-content-center m-0"
											style={{
												borderColor:
													'var(--theme-color)',
												color: 'var(--theme-color)',
												cursor:
													fileProgress > 0 || !isChatReady
														? 'not-allowed'
														: 'pointer',
												width: '40px',
												height: '40px',
												opacity:
													fileProgress > 0 || !isChatReady ? 0.5 : 1
											}}
											title="Upload File"
										>
											<svg
												width="20"
												height="20"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21" />
												<path d="M16 16l-4-4-4 4" />
											</svg>
										</Button>
									</div>
									<Form.Control
										type="text"
										placeholder={isChatReady ? "Type a message..." : "Waiting for secure channel..."}
										value={chatInput}
										onChange={(e) =>
											setChatInput(e.target.value)
										}
										className="hud-input font-monospace"
										disabled={!isChatReady}
									/>
									<Button
										type="submit"
										variant="none"
										className="hud-btn-secondary fw-bold px-4"
										style={{
											borderColor: 'var(--theme-color)',
											color: 'var(--theme-color)',
											height: '40px',
											opacity: isChatReady ? 1 : 0.5
										}}
										disabled={!isChatReady}
									>
										SEND
									</Button>
								</Form>
							</div>
						</div>
					</Col>

					{/* Connected Peers Panel */}
					<Col
						lg={4}
						className="d-none d-lg-flex flex-column p-0 ps-lg-2 peers-panel-container"
					>
						<div className="glass-panel p-0 overflow-hidden d-flex flex-column border-0 h-100">
							<div
								className="px-3 py-2 border-bottom d-flex align-items-center"
								style={{
									borderColor:
										'color-mix(in srgb, var(--theme-color) 20%, transparent)',
									background: 'rgba(255, 255, 255, 0.02)'
								}}
							>
								<span
									className="font-monospace small fw-bold"
									style={{ color: 'var(--theme-color)' }}
								>
									NETWORK_NODES // PEERS
								</span>
							</div>
							{renderPeersList()}
						</div>
					</Col>
				</Row>
			)}

			{/* Global QR Code Scanner Modal */}
			<Modal
				show={!!scanningConnId}
				onHide={() => setScanningConnId(null)}
				centered
			>
				<Modal.Header
					closeButton
					className="border-secondary bg-dark text-light"
				>
					<Modal.Title
						className="font-monospace"
						style={{ color: 'var(--theme-color)' }}
					>
						SCAN QR CODE
					</Modal.Title>
				</Modal.Header>
				<Modal.Body className="bg-dark p-3">
					{scanningConnId && (
						<QRScanner
							onScanSuccess={(text) => {
								updateRemoteCode(scanningConnId, text);
								setScanningConnId(null);
							}}
						/>
					)}
				</Modal.Body>
			</Modal>

			{/* Mobile Peers Modal */}
			<Modal
				show={showPeersModal}
				onHide={() => setShowPeersModal(false)}
				centered
				contentClassName="bg-transparent border-0"
			>
				<div
					className="glass-panel p-0 overflow-hidden d-flex flex-column border-0"
					style={{ maxHeight: '80vh' }}
				>
					<div
						className="px-3 py-3 border-bottom d-flex align-items-center justify-content-between"
						style={{
							borderColor: 'color-mix(in srgb, var(--theme-color) 20%, transparent)',
							background: 'rgba(255, 255, 255, 0.02)'
						}}
					>
						<span className="font-monospace small fw-bold" style={{ color: 'var(--theme-color)' }}>
							NETWORK_NODES // PEERS
						</span>
						<Button variant="none" className="p-0 m-0 fs-4 lh-1 text-light border-0" onClick={() => setShowPeersModal(false)}>
							&times;
						</Button>
					</div>
					{renderPeersList()}
				</div>
			</Modal>
		</div>
	);
}

export default DataBridge;
