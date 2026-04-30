import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
	HashRouter as Router,
	Routes,
	Route,
	useLocation
} from 'react-router-dom';
import Home from './pages/Home';
import AppDrawer from './Components/AppDrawer';
import FloatingButtons from './Components/FloatingButtons';
import WhatsNewModal from './Components/WhatsNewModal';
import JsonDiff from './pages/JsonDiff';
import { useSelector } from 'react-redux';
import DashBoard from './pages/DashBoard';
import Formatter from './pages/Formatter';
import Viewer from './pages/Viewer';
import NotFound from './pages/NotFound';
import URLManipulator from './pages/URLManipulator';
import JSONModelGenerator from './pages/JSONModelGenerator';
import JsonAnalyzer from './pages/JsonAnalyzer';
import viewerIconUrl from './images/viewer-icon.svg';
import diffIconUrl from './images/diff-icon.svg';
import dashboardIconUrl from './images/dashboard-icon.svg';
import formatIconUrl from './images/format-icon.svg';
import modelIconUrl from './images/model-icon.svg';
import urlIconUrl from './images/url-icon.svg';
import analyzeIconUrl from './images/analyze-icon.svg';

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
			"/json-analyser": "JSON Analyser | Self Tools"
		};
		document.title = titles[location.pathname] || 'Not Found | Self Tools';

		const icons = {
			'/dashboard': dashboardIconUrl,
			'/format': formatIconUrl,
			'/jsonDiff': diffIconUrl,
			'/viewer': viewerIconUrl,
			'/url-manipulator': urlIconUrl,
			'/json-model-generator': modelIconUrl,
			'/json-analyser': analyzeIconUrl
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

			<FloatingButtons />

			<WhatsNewModal />
			<AppDrawer
				show={drawerOpen}
				onHide={() => setDrawerOpen(false)}
				onItemClick={handleDrawerItemClick}
			/>

			<div className="vw-100 p-0 m-0">
				<Routes>
					<Route
						path="/"
						element={<Home onMenuClick={handleMenuClick} />}
					/>
					<Route
						path="/dashboard"
						element={<DashBoard onMenuClick={handleMenuClick} />}
					/>
					<Route
						path="/format"
						element={<Formatter onMenuClick={handleMenuClick} />}
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
							<JSONModelGenerator onMenuClick={handleMenuClick} />
						}
					/>
					<Route
						path="/json-analyser"
						element={<JsonAnalyzer onMenuClick={handleMenuClick} />}
					/>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</div>
		</Router>
	);
}

export default App;
