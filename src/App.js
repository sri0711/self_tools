import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Home from './pages/Home';
import AppDrawer from './Components/AppDrawer';
import FloatingButtons from './Components/FloatingButtons';
import WhatsNewModal from './Components/WhatsNewModal';
import JsonDiff from './pages/JsonDiff';
import { useSelector } from 'react-redux';
import DashBoard from './pages/DashBoard';
import Formatter from './pages/Formatter';

function App() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const timeoutRef = useRef(null);

	const basePath = window.location.pathname.replace('/self_tools', '') || '/';
	const currentScreen = useSelector(
		(state) => state.user_settings.value.current_screen
	);
	useEffect(() => {
		if (currentScreen !== basePath) {
			window.location.pathname = currentScreen;
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

			<Container className="w-100 p-0 m-0">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/dashboard" element={<DashBoard />} />
					<Route path="/format" element={<Formatter />} />
					<Route path="/jsonDiff" element={<JsonDiff />} />
				</Routes>
			</Container>
		</Router>
	);
}

export default App;
