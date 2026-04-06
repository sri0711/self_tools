import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Home from './pages/Home';
import AppDrawer from './Components/AppDrawer';
import FloatingButtons from './Components/FloatingButtons';
import JsonDiff from './pages/JsonDiff';

function Settings() {
	return (
		<div>
			<h2>Settings</h2>
			<p>Use the navigation dropdown to explore additional routes.</p>
		</div>
	);
}

function App() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const timeoutRef = useRef(null);

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

			<AppDrawer
				show={drawerOpen}
				onHide={() => setDrawerOpen(false)}
				onItemClick={handleDrawerItemClick}
			/>

			<Container className="w-100 p-0 m-0">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/jsonDiff" element={<JsonDiff />} />
				</Routes>
			</Container>
		</Router>
	);
}

export default App;
