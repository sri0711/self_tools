import { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import PackageJson from '../../package.json';

let checkUpdate = async (setChanges, setVersion) => {
	try {
		if (
			window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1'
		) {
			setVersion(`${PackageJson.version}-dev`);
			setChanges('Running in development mode. No updates available.');
			return;
		}
		let response = await fetch(
			'https://api.github.com/repos/sri0711/self_tools/releases/latest'
		);
		let data = await response.json();
		let latestVersion = data.tag_name;
		setVersion(latestVersion);
		let changes = data.body;
		setChanges(changes);
	} catch (error) {
		console.error('Error checking for updates:', error);
	}
};

function WhatsNewModal() {
	const [show, setShow] = useState(false);
	const [version, setVersion] = useState('');
	const [changes, setChanges] = useState('');

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

			<Modal show={show} onHide={() => setShow(false)} centered>
				<Modal.Header closeButton>
					<Modal.Title>What's new in v{version}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Here are the latest updates and improvements:</p>
					<div
						style={{
							maxHeight: '400px',
							overflowY: 'auto',
							whiteSpace: 'pre-wrap'
						}}
					>
						{changes}
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
