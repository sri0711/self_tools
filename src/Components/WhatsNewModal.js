import { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import PackageJson from '../../package.json';

const checkUpdate = async (setChanges, setVersion) => {
	try {
		if (
			window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1'
		) {
			setVersion(`${PackageJson.version}-dev`);
			setChanges(['Running in development mode. No updates available.']);
			return;
		}
		const response = await fetch(
			'https://api.github.com/repos/sri0711/self_tools/releases'
		);
		const data = await response.json();
		const latestVersion = data[0].tag_name;
		setVersion(latestVersion);
		const changes = data.map((release) => release.body);
		setChanges(changes);
	} catch (error) {
		console.error('Error checking for updates:', error);
	}
};

function WhatsNewModal() {
	const [show, setShow] = useState(false);
	const [version, setVersion] = useState('');
	const [changes, setChanges] = useState([]);

	useEffect(() => {
		checkUpdate(setChanges, setVersion);
	}, []);

	return (
		<>
			<div className="whatsNewBar">
				<span className="versionBadge">v{version}</span>
				<button
					className="whatsNewButton"
					onClick={() => setShow(true)}
				>
					What's new
				</button>
			</div>

			<Modal show={show} onHide={() => setShow(false)} centered size="lg">
				<Modal.Header closeButton>
					<Modal.Title>What's new in v{version}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p className="text-info mb-4">
						<strong>Change Log</strong> of the latest updates and
						improvements for Self Tools.
					</p>
					<div
						style={{
							maxHeight: '400px',
							overflowY: 'auto',
							whiteSpace: 'pre-wrap',
							background: 'rgba(0, 0, 0, 0.2)',
							padding: '15px',
							borderRadius: '10px',
							border: '1px solid rgba(255, 255, 255, 0.05)'
						}}
					>
						{changes.map((change, index) => (
							<div key={index} className="changeItem">
								{change}
								<p className="changeSeparator">
									{index < changes.length - 1
										? new Array(100).join('-')
										: ''}
								</p>
							</div>
						))}
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="secondary"
						onClick={() =>
							window.open('https://github.com/sri0711/self_tools')
						}
					>
						View Source
					</Button>
					<Button variant="secondary" onClick={() => setShow(false)}>
						Close
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

export default WhatsNewModal;
