import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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
			<FloatingButtons onMenuClick={handleMenuClick} />
			<WhatsNewModal />
			<AppDrawer
				show={drawerOpen}
				onHide={() => setDrawerOpen(false)}
				onItemClick={handleDrawerItemClick}
			/>

			<div className="vw-100 p-0 m-0">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/dashboard" element={<DashBoard />} />
					<Route path="/format" element={<Formatter />} />
					<Route path="/jsonDiff" element={<JsonDiff />} />
					<Route path="/viewer" element={<Viewer />} />
					<Route path="*" element={<NotFound />} />
				</Routes>
			</div>
		</Router>
	);
}

export default App;
