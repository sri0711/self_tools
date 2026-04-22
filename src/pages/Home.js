import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentScreen } from '../redux/userSettings';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { ReactComponent as ViewerIcon } from '../images/viewer-icon.svg';
import { ReactComponent as DiffIcon } from '../images/diff-icon.svg';
import { ReactComponent as DashboardIcon } from '../images/dashboard-icon.svg';
import { ReactComponent as FormatIcon } from '../images/format-icon.svg';
import { ReactComponent as ModelIcon } from '../images/model-icon.svg';
import { ReactComponent as UrlIcon } from '../images/url-icon.svg';
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
			className="feature-card text-light text-center p-4 w-100 h-100"
			style={{
				'--card-color': feat.color,
				'--card-color-glow': `${feat.color}40`
			}}
		>
			<Card.Body className="d-flex flex-column p-0">
				<div
					className="icon-wrapper mb-5 mt-4 mx-auto d-flex align-items-center justify-content-center"
					style={{
						color: feat.color,
						filter: `drop-shadow(0 0 12px ${feat.color}40)`
					}}
				>
					<div>{feat.icon}</div>
				</div>
				<Card.Title className="fw-bolder mb-3 fs-4 text-uppercase feature-card-title">
					{feat.title}
				</Card.Title>
				<Card.Text className="mb-4 lh-lg flex-grow-1 feature-card-desc">
					{feat.desc}
				</Card.Text>
				<Button
					className="mt-auto feature-btn py-2 fw-bold w-100"
					href={`#${feat.path}`}
					onClick={() => dispatch(setCurrentScreen(feat.path))}
				>
					[ LAUNCH ]
				</Button>
			</Card.Body>
		</Card>
	);
}

function Home({ onMenuClick }) {
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
		},
		{
			id: 'JSONModelGenerator',
			title: 'JSON Model Generator',
			desc: 'Generate data models, schemas, interfaces, or classes instantly from your JSON payloads.',
			icon: <ModelIcon width="48" height="48" />,
			path: '/json-model-generator',
			color: '#d60101'
		},
		{
			id: 'URLManipulator',
			title: 'URL Manipulator',
			desc: 'Manipulate, test, and generate URLs with ease. Export your configured requests to various programming languages.',
			icon: <UrlIcon width="48" height="48" />,
			path: '/url-manipulator',
			color: '#ec4899'
		}
	];

	return (
		<div className="landing-page-wrapper min-vh-100">
			<ParticleNetwork />

			{/* Hero Section */}
			<div className="min-vh-100 d-flex flex-column justify-content-center align-items-center pt-5">
				<Container>
					<Row className="text-center">
						<Col>
							<Badge
								bg="transparent"
								className="hero-badge mb-4 px-4 py-2 fs-6 fade-in-up delay-1"
							>
								<span className="hero-badge-text">
									SYS.INIT // v{PackageJson.version}
								</span>
							</Badge>

							{/* Wrapped in a div to prevent WebKit background-clip opacity bug */}
							<div className="fade-in-up delay-2">
								<h1 className="hero-title mb-4">Self Tools</h1>
							</div>

							<p className="lead col-lg-7 mx-auto mb-4 fs-5 lh-lg fade-in-up delay-3 hero-desc">
								A blazing-fast client-side toolkit for modern
								developers. Analyze payloads, format code, and
								manipulate massive datasets completely locally.
							</p>

							<div
								className="d-flex flex-wrap justify-content-center gap-3 mb-5 fade-in-up delay-3 font-monospace small"
								style={{ color: '#38bdf8', opacity: 0.9 }}
							>
								<span>[ 🔒 ZERO SERVER CALLS ]</span>
								<span>[ 🚀 CONSTANTLY EXPANDING ]</span>
							</div>

							<div className="scroll-indicator mt-5 opacity-100 fade-in-up delay-4">
								<div className="fs-4 text-uppercase mb-2 scroll-text">
									SCROLL_TO_ACCESS
								</div>
								<div className="fs-3 scroll-arrow">↓</div>
							</div>
						</Col>
					</Row>
				</Container>
			</div>

			{/* Features Section */}
			<div className="py-5">
				<Container>
					<Row className="g-4 justify-content-center pb-5">
						{features.map((feat, index) => (
							<Col
								xs={12}
								md={6}
								lg={3}
								className="d-flex fade-in-up"
								style={{
									animationDelay: `${400 + index * 150}ms`
								}}
								key={feat.id}
							>
								<FeatureCardItem
									feat={feat}
									dispatch={dispatch}
								/>
							</Col>
						))}
					</Row>
				</Container>
			</div>
		</div>
	);
}

export default Home;
