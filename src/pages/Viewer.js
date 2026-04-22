import React from 'react';
import JsonView from '@microlink/react-json-view';
import { useDispatch, useSelector } from 'react-redux';
import { setJsonData } from '../redux/JsonHandler';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { setDashboardData } from '../redux/dashBoardHandler';
import { setJson1DiffData } from '../redux/diffHandler';
import { setCurrentScreen } from '../redux/userSettings';

function Viewer({ onMenuClick }) {
	const userSettings = useSelector((state) => state.user_settings.value);
	const jsonData = useSelector((state) => state.json_data.value);
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const updateData = (newData) => {
		dispatch(setJsonData(newData));
	};

	const handleToDashboard = () => {
		if (Array.isArray(jsonData)) {
			dispatch(setDashboardData(jsonData));
			dispatch(setCurrentScreen('/dashboard'));
			navigate('/dashboard');
		} else {
			alert(
				'Data must be an array of objects to be analyzed in the Dashboard.'
			);
		}
	};

	const handleToModelGen = () => {
		dispatch(setCurrentScreen('/json-model-generator'));
		navigate('/json-model-generator', {
			state: { jsonInput: JSON.stringify(jsonData, null, 2) }
		});
	};

	const handleToDiff = () => {
		dispatch(setJson1DiffData(jsonData));
		dispatch(setCurrentScreen('/jsonDiff'));
		navigate('/jsonDiff');
	};

	return (
		<div className="p-4 tool-page-bg theme-cyan d-flex flex-column min-vh-100">
			<div className="glass-panel flex-grow-1 p-0 overflow-hidden border-0 d-flex flex-column">
				<div
					className="d-flex justify-content-between align-items-center p-3 border-bottom"
					style={{
						borderColor: 'rgba(56, 189, 248, 0.1)',
						background: 'rgba(255, 255, 255, 0.02)'
					}}
				>
					<span className="font-monospace text-secondary small">
						INPUT_STREAM // JSON
					</span>
					<div className="d-flex gap-2">
						<Button
							variant="none"
							className="hud-btn-secondary fw-bold btn-sm py-1"
							onClick={handleToDashboard}
						>
							↗ DASHBOARD
						</Button>
						<Button
							variant="none"
							className="hud-btn-secondary fw-bold btn-sm py-1"
							onClick={handleToModelGen}
						>
							↗ MODEL GEN
						</Button>
						<Button
							variant="none"
							className="hud-btn-secondary fw-bold btn-sm py-1"
							onClick={handleToDiff}
						>
							↗ DIFF LEFT
						</Button>
						<Button
							variant="none"
							className="hud-btn-secondary fw-bold btn-sm py-1"
							onClick={onMenuClick}
						>
							[ ☰ MENU ]
						</Button>
					</div>
				</div>
				<div className="flex-grow-1 overflow-auto p-4 d-flex flex-column">
					<JsonView
						onAdd={(e) => updateData(e.updated_src)}
						onEdit={(e) => updateData(e.updated_src)}
						onDelete={(e) => updateData(e.updated_src)}
						src={jsonData}
						className="w-100 flex-grow-1 rounded bg-transparent"
						theme={userSettings?.json_viewer_theme}
					/>
				</div>
			</div>
		</div>
	);
}

export default Viewer;
