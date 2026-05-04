import { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import PackageJson from '../../package.json';

const checkUpdate = async (setChanges, setVersion, setTitle) => {
	try {
		if (
			window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1'
		) {
			setVersion(`${PackageJson.version}-dev`);
			setTitle('Local Build');
			setChanges([
				{
					version: `${PackageJson.version}-dev`,
					title: 'Local Build',
					body: 'Running in development mode. No updates available.'
				}
			]);
			return;
		}
		const response = await fetch(
			'https://api.github.com/repos/sri0711/self_tools/releases'
		);
		const data = await response.json();
		if (data && data.length > 0) {
			const latestVersion = data[0].tag_name;
			const latestTitle = data[0].name;
			setVersion(latestVersion);
			setTitle(latestTitle);
			const changes = data.map((release) => ({
				version: release.tag_name,
				title: release.name,
				body: release.body
			}));
			setChanges(changes);
		}
	} catch (error) {
		console.error('Error checking for updates:', error);
	}
};

function WhatsNewModal() {
	const [show, setShow] = useState(false);
	const [version, setVersion] = useState('');
	const [title, setTitle] = useState('');
	const [changes, setChanges] = useState([]);

	useEffect(() => {
		checkUpdate(setChanges, setVersion, setTitle);
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
					<Modal.Title
						className="font-monospace fw-bold"
						style={{ color: 'var(--theme-color, #38bdf8)' }}
					>
						What's new in {title ? `- ${title}` : ''} v{version}
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p
						className="mb-4"
						style={{ color: 'var(--theme-color, #38bdf8)' }}
					>
						<strong className="text-light">Change Log</strong> of
						the latest updates and improvements for Self Tools.
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
								<div
									className="fw-bold mb-2 font-monospace"
									style={{
										fontSize: '1.1rem',
										color: 'var(--theme-color, #38bdf8)'
									}}
								>
									{change.version}{' '}
									{change.title ? `- ${change.title}` : ''}
								</div>
								{change.body}
								<p className="changeSeparator text-secondary mt-3">
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
						variant="none"
						className="hud-btn-secondary fw-bold"
						onClick={() =>
							window.open('https://github.com/sri0711/self_tools')
						}
					>
						[ VIEW SOURCE ]
					</Button>
					<Button
						variant="none"
						className="hud-btn-primary fw-bold"
						onClick={() => setShow(false)}
					>
						[ CLOSE ]
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

export default WhatsNewModal;
