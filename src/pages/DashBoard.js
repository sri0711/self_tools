import React, { useEffect, useState, useCallback, useRef } from 'react';
import JsonTable from '../Components/JsonTable';
import DynamicFilter from '../Components/DynamicFilter';
import FileHandlerModel from '../Components/FileHandlerModel';
import { useDispatch, useSelector } from 'react-redux';
import {
	retrieveLargeData,
	getDatabaseMeta,
	retrieveDataByPage
} from '../Tools/clientDatabase';
import { Spinner, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { setJsonData } from '../redux/JsonHandler';
import { setCurrentScreen } from '../redux/userSettings';

function DashBoard({ onMenuClick }) {
	const dashboardData = useSelector((state) => state.dashboard_data.value);
	const [fullData, setFullData] = useState([]);
	const [filteredData, setFilteredData] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalRows, setTotalRows] = useState(0);
	const [isDbPaginated, setIsDbPaginated] = useState(false);
	const [isTableDbPaginated, setIsTableDbPaginated] = useState(false);
	const isFilterActiveRef = useRef(false);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	useEffect(() => {
		const loadData = async () => {
			if (!dashboardData) return;
			setCurrentPage(1);
			isFilterActiveRef.current = false;

			if (dashboardData && dashboardData.isLarge) {
				setIsLoading(true);
				const meta = await getDatabaseMeta('dashboard_active_sheet');
				if (meta) {
					setIsDbPaginated(true);
					setIsTableDbPaginated(true);
					setTotalRows(meta.totalRows);
					const { data } = await retrieveDataByPage(
						'dashboard_active_sheet',
						1,
						100
					);
					setFullData(data);
					setFilteredData(data);
				} else {
					let data = await retrieveLargeData(
						'dashboard_active_sheet'
					);
					if (data) {
						setIsDbPaginated(false);
						setIsTableDbPaginated(false);
						setTotalRows(data.length);
						setFullData(data);
						setFilteredData(data);
					}
				}

				setIsLoading(false);
			} else if (Array.isArray(dashboardData)) {
				setIsDbPaginated(false);
				setIsTableDbPaginated(false);
				setFullData(dashboardData);
				setFilteredData(dashboardData);
				setTotalRows(dashboardData.length);
			}
		};
		loadData();
	}, [dashboardData]);

	useEffect(() => {
		const fetchPage = async () => {
			if (isTableDbPaginated) {
				const activeId = isFilterActiveRef.current
					? 'dashboard_filtered_sheet'
					: 'dashboard_active_sheet';
				const { data } = await retrieveDataByPage(
					activeId,
					currentPage,
					100
				);
				setFilteredData(data);
			}
		};
		fetchPage();
	}, [currentPage, isTableDbPaginated]);

	const handleFiltered = useCallback(
		async (result, active) => {
			isFilterActiveRef.current = active;

			if (active) {
				if (result && result.isDb) {
					setIsTableDbPaginated(true);
					setTotalRows(result.totalRows);
					setCurrentPage(1);
					const { data } = await retrieveDataByPage(
						result.baseId,
						1,
						100
					);
					setFilteredData(data);
				} else {
					setIsTableDbPaginated(false);
					setTotalRows(result.length);
					setCurrentPage(1);
					setFilteredData(result);
				}
			} else {
				if (isDbPaginated) {
					setIsTableDbPaginated(true);
					const meta = await getDatabaseMeta(
						'dashboard_active_sheet'
					);
					setTotalRows(meta ? meta.totalRows : 0);
					setCurrentPage(1);
					const { data } = await retrieveDataByPage(
						'dashboard_active_sheet',
						1,
						100
					);
					setFilteredData(data);
				} else {
					setIsTableDbPaginated(false);
					setTotalRows(fullData.length);
					setCurrentPage(1);
					setFilteredData(fullData);
				}
			}
		},
		[isDbPaginated, fullData]
	);

	const handleToEditor = () => {
		dispatch(setJsonData(filteredData));
		dispatch(setCurrentScreen('/viewer'));
		navigate('/viewer');
	};

	const handleToModelGen = () => {
		const sampleData = filteredData.slice(0, 100);
		dispatch(setCurrentScreen('/json-model-generator'));
		navigate('/json-model-generator', {
			state: { jsonInput: JSON.stringify(sampleData, null, 2) }
		});
	};

	const handleToAnalyser = () => {
		dispatch(setCurrentScreen('/json-analyser'));
		navigate('/json-analyser', {
			state: { jsonInput: JSON.stringify(filteredData, null, 2) }
		});
	};

	return (
		<div className="p-4 tool-page-bg theme-amber d-flex flex-column min-vh-100">
			<FileHandlerModel />
			{isLoading ? (
				<div className="glass-panel flex-grow-1 p-0 border-0 d-flex flex-column">
					<div
						className="d-flex justify-content-between align-items-center p-3 border-bottom"
						style={{
							borderColor: 'rgba(56, 189, 248, 0.1)',
							background: 'rgba(255, 255, 255, 0.02)'
						}}
					>
						<span className="font-monospace text-secondary small">
							INPUT_STREAM // DASHBOARD
						</span>
						<Button
							variant="none"
							className="hud-btn-secondary fw-bold btn-sm py-1"
							onClick={onMenuClick}
						>
							[ ☰ MENU ]
						</Button>
					</div>
					<div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-5">
						<Spinner
							animation="border"
							role="status"
							className="mb-3 text-warning"
						/>
						<h5 className="font-monospace text-warning">
							Loading Database Records...
						</h5>
					</div>
				</div>
			) : (
				<div className="glass-panel flex-grow-1 p-0 border-0 d-flex flex-column">
					<div
						className="d-flex justify-content-between align-items-center p-3 border-bottom"
						style={{
							borderColor: 'rgba(56, 189, 248, 0.1)',
							background: 'rgba(255, 255, 255, 0.02)'
						}}
					>
						<span className="font-monospace text-secondary small">
							INPUT_STREAM // DASHBOARD
						</span>
						<div className="d-flex gap-2">
							<Button
								variant="none"
								className="hud-btn-secondary fw-bold btn-sm py-1"
								onClick={handleToEditor}
							>
								↗ EDITOR
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
								onClick={handleToAnalyser}
							>
								↗ ANALYSER
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
					<div className="flex-grow-1 d-flex flex-column gap-3 p-4">
						<DynamicFilter
							data={fullData}
							onFiltered={handleFiltered}
							filteredData={filteredData}
							dbBaseId="dashboard_active_sheet"
							isDbPaginated={isDbPaginated}
						/>
						<div
							className="flex-grow-1 overflow-auto rounded border border-secondary border-opacity-25 dashboard-table-wrapper"
						>
							<JsonTable
								data={filteredData}
								serverPagination={isTableDbPaginated}
								totalServerRows={totalRows}
								currentServerPage={currentPage}
								onServerPageChange={setCurrentPage}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default DashBoard;
