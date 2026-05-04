import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import './Styles/App.css';
import {
	HashRouter as Router,
	Routes,
	Route,
	useLocation
} from 'react-router-dom';
import AppDrawer from './Components/AppDrawer';
import FloatingButtons from './Components/FloatingButtons';
import WhatsNewModal from './Components/WhatsNewModal';
import { useSelector } from 'react-redux';
import viewerIconUrl from './images/viewer-icon.svg';
import diffIconUrl from './images/diff-icon.svg';
import dashboardIconUrl from './images/dashboard-icon.svg';
import formatIconUrl from './images/format-icon.svg';
import modelIconUrl from './images/model-icon.svg';
import urlIconUrl from './images/url-icon.svg';
import analyzeIconUrl from './images/analyze-icon.svg';
import validatorIconUrl from './images/validator-icon.svg';

const Home = lazy(() => import('./pages/Home'));
const DashBoard = lazy(() => import('./pages/DashBoard'));
const Formatter = lazy(() => import('./pages/Formatter'));
const JsonDiff = lazy(() => import('./pages/JsonDiff'));
const Viewer = lazy(() => import('./pages/Viewer'));
const URLManipulator = lazy(() => import('./pages/URLManipulator'));
const JSONModelGenerator = lazy(() => import('./pages/JSONModelGenerator'));
const JsonAnalyzer = lazy(() => import('./pages/JsonAnalyzer'));
const JsonValidator = lazy(() => import('./pages/JsonValidator'));
const NotFound = lazy(() => import('./pages/NotFound'));

const screenThemes = {
	'/': '',
	'/jsonDiff': 'theme-mint',
	'/dashboard': 'theme-amber',
	'/format': 'theme-purple',
	'/viewer': 'theme-cyan',
	'/url-manipulator': 'theme-pink',
	'/json-model-generator': 'theme-red',
	'/json-analyser': 'theme-orange',
	'/json-validator': 'theme-blue'
};

function PageTitleUpdater() {
	const location = useLocation();

	useEffect(() => {
		const titles = {
			'/': 'Self Tools | Developer Toolkit',
			'/dashboard': 'Data Dashboard | Self Tools',
			'/format': 'Code Formatter | Self Tools',
			'/jsonDiff': 'JSON Diff | Self Tools',
			'/viewer': 'JSON Editor | Self Tools',
			'/url-manipulator': 'URL Manipulator | Self Tools',
			'/json-model-generator': 'JSON Model Generator | Self Tools',
			'/json-analyser': 'JSON Analyser | Self Tools',
			'/json-validator': 'JSON Validator | Self Tools'
		};
		document.title = titles[location.pathname] || 'Not Found | Self Tools';

		const icons = {
			'/dashboard': dashboardIconUrl,
			'/format': formatIconUrl,
			'/jsonDiff': diffIconUrl,
			'/viewer': viewerIconUrl,
			'/url-manipulator': urlIconUrl,
			'/json-model-generator': modelIconUrl,
			'/json-analyser': analyzeIconUrl,
			'/json-validator': validatorIconUrl
		};

		let link = document.querySelector("link[rel~='icon']");
		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.head.appendChild(link);
		}
		link.href = icons[location.pathname] || '/favicon.ico';
	}, [location]);

	return null;
}

const PageLoader = () => (
	<div
		className="vw-100 min-vh-100 d-flex flex-column justify-content-center align-items-center"
		style={{ backgroundColor: '#020617' }}
	>
		<div
			className="spinner-border text-info mb-3"
			role="status"
			style={{ width: '3rem', height: '3rem' }}
		></div>
		<div
			className="font-monospace fw-bold text-info"
			style={{ letterSpacing: '2px' }}
		>
			[ INITIALIZING_MODULE... ]
		</div>
	</div>
);

function App() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const timeoutRef = useRef(null);

	const rawHash = window.location.hash || '#/';
	const basePath = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
	const currentScreen = useSelector(
		(state) => state.user_settings.value.current_screen
	);
	useEffect(() => {
		if (currentScreen !== basePath) {
			window.location.hash = currentScreen;
		}
	}, [basePath, currentScreen]);

	useEffect(() => {
		if (drawerOpen) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(() => {
				setDrawerOpen(false);
			}, 30000);
		}

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [drawerOpen]);

	const handleDrawerItemClick = () => {
		setDrawerOpen(false);
	};

	const handleMenuClick = () => {
		setDrawerOpen(true);
	};

	return (
		<Router>
			<PageTitleUpdater />

			<div className={screenThemes[currentScreen] || ''}>
				<FloatingButtons />
				<WhatsNewModal />
			</div>

			<AppDrawer
				show={drawerOpen}
				onHide={() => setDrawerOpen(false)}
				onItemClick={handleDrawerItemClick}
			/>

			<div className="vw-100 p-0 m-0">
				<Suspense fallback={<PageLoader />}>
					<Routes>
						<Route
							path="/"
							element={<Home onMenuClick={handleMenuClick} />}
						/>
						<Route
							path="/dashboard"
							element={
								<DashBoard onMenuClick={handleMenuClick} />
							}
						/>
						<Route
							path="/format"
							element={
								<Formatter onMenuClick={handleMenuClick} />
							}
						/>
						<Route
							path="/jsonDiff"
							element={<JsonDiff onMenuClick={handleMenuClick} />}
						/>
						<Route
							path="/url-manipulator"
							element={
								<URLManipulator onMenuClick={handleMenuClick} />
							}
						/>
						<Route
							path="/viewer"
							element={<Viewer onMenuClick={handleMenuClick} />}
						/>
						<Route
							path="/json-model-generator"
							element={
								<JSONModelGenerator
									onMenuClick={handleMenuClick}
								/>
							}
						/>
						<Route
							path="/json-analyser"
							element={
								<JsonAnalyzer onMenuClick={handleMenuClick} />
							}
						/>
						<Route
							path="/json-validator"
							element={
								<JsonValidator onMenuClick={handleMenuClick} />
							}
						/>
						<Route path="*" element={<NotFound />} />
					</Routes>
				</Suspense>
			</div>
		</Router>
	);
}

export default App;
