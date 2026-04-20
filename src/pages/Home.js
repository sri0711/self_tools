import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentScreen } from '../redux/userSettings';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { ReactComponent as ViewerIcon } from '../images/viewer-icon.svg';
import { ReactComponent as DiffIcon } from '../images/diff-icon.svg';
import { ReactComponent as DashboardIcon } from '../images/dashboard-icon.svg';
import { ReactComponent as FormatIcon } from '../images/format-icon.svg';
import ParticleNetwork from '../Components/ParticleNetwork';
import PackageJson from '../../package.json';

function FeatureCardItem({ feat, dispatch }) {
	const cardRef = useRef(null);

	const handleMouseMove = (e) => {
		if (!cardRef.current) return;
		const rect = cardRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		cardRef.current.style.setProperty('--mouse-x', `${x}px`);
		cardRef.current.style.setProperty('--mouse-y', `${y}px`);
	};

	return (
		<Card
			ref={cardRef}
			onMouseMove={handleMouseMove}
			className="feature-card text-light text-center p-3 rounded-4"
			style={{
				'--card-color': feat.color,
				'--card-color-glow': `${feat.color}25`
			}}
		>
			<Card.Body className="d-flex flex-column">
				<div
					className="mb-4"
					style={{
						color: feat.color,
						filter: `drop-shadow(0 0 12px ${feat.color}40)`
					}}
				>
					{feat.icon}
				</div>
				<Card.Title className="fw-bold mb-3">{feat.title}</Card.Title>
				<Card.Text className="text-secondary mb-4 small">
					{feat.desc}
				</Card.Text>
				<Button
					className="mt-auto rounded-pill feature-btn"
					href={`#${feat.path}`}
					onClick={() => dispatch(setCurrentScreen(feat.path))}
				>
					Launch Tool
				</Button>
			</Card.Body>
		</Card>
	);
}

function Home() {
	const dispatch = useDispatch();

	const features = [
		{
			id: 'viewer',
			title: 'JSON Editor',
			desc: 'Interactive JSON viewer and editor with syntax highlighting, auto-formatting, and multiple rich dark themes.',
			icon: <ViewerIcon width="48" height="48" />,
			path: '/viewer',
			color: '#38bdf8'
		},
		{
			id: 'diff',
			title: 'JSON Diff',
			desc: 'Advanced side-by-side comparison tool for payloads to instantly spot additions, deletions, and modifications.',
			icon: <DiffIcon width="48" height="48" />,
			path: '/jsonDiff',
			color: '#34d399'
		},
		{
			id: 'dashboard',
			title: 'Data Dashboard',
			desc: 'Process massive CSV and Excel files entirely in the browser. Features dynamic background filtering and fast exports.',
			icon: <DashboardIcon width="48" height="48" />,
			path: '/dashboard',
			color: '#fbbf24'
		},
		{
			id: 'format',
			title: 'Code Formatter',
			desc: 'Universal code formatter powered by Prettier & Monaco. Auto-detects language and supports over 20 syntax types.',
			icon: <FormatIcon width="48" height="48" />,
			path: '/format',
			color: '#a78bfa'
		}
	];

	return (
		<div className="landing-page-wrapper min-vh-100 py-5 d-flex align-items-center">
			<ParticleNetwork />
			<Container>
				<Row className="text-center mb-5">
					<Col>
						<Badge
							bg="transparent"
							className="hero-badge mb-4 px-3 py-2 rounded-pill"
						>
							v{PackageJson.version} • Developer Toolkit
						</Badge>
						<h1 className="hero-title mb-3">Self Tools</h1>
						<p
							className="lead col-lg-8 mx-auto mb-4 fs-5"
							style={{ color: '#cbd5e1' }}
						>
							A blazing-fast, client-side utility suite built for
							modern developers. Analyze payloads, format code,
							and manipulate massive datasets without ever sending
							your data to a server.
						</p>
					</Col>
				</Row>

				<Row className="g-4">
					{features.map((feat) => (
						<Col md={6} lg={3} key={feat.id}>
							<FeatureCardItem feat={feat} dispatch={dispatch} />
						</Col>
					))}
				</Row>
			</Container>
		</div>
	);
}

export default Home;
