import React, { useEffect, useState, useCallback, useRef } from 'react';
import JsonTable from '../Components/JsonTable';
import DynamicFilter from '../Components/DynamicFilter';
import FileHandlerModel from '../Components/FileHandlerModel';
import { useSelector } from 'react-redux';
import {
	retrieveLargeData,
	getDatabaseMeta,
	retrieveDataByPage
} from '../Tools/clientDatabase';
import { Spinner } from 'react-bootstrap';

function DashBoard() {
	let dashboardData = useSelector((state) => state.dashboard_data.value);
	const [fullData, setFullData] = useState([]);
	const [filteredData, setFilteredData] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalRows, setTotalRows] = useState(0);
	const [isDbPaginated, setIsDbPaginated] = useState(false);
	const [isTableDbPaginated, setIsTableDbPaginated] = useState(false);
	const [isFilterActive, setIsFilterActive] = useState(false);
	const isFilterActiveRef = useRef(false);

	// Reset page to 1 when a new file is imported
	useEffect(() => {
		const loadData = async () => {
			if (!dashboardData) return;
			setCurrentPage(1);
			setIsFilterActive(false);
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
	}, [dashboardData?.timestamp]);

	// Handle table page flips explicitly
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
			setIsFilterActive(active);
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

	return (
		<div className="dashboard">
			<FileHandlerModel />
			{isLoading ? (
				<div className="d-flex flex-column align-items-center justify-content-center p-5 m-5 text-light">
					<Spinner
						animation="border"
						role="status"
						className="mb-3"
					/>
					<h5>Loading Database Records...</h5>
				</div>
			) : (
				<>
					<DynamicFilter
						data={fullData}
						onFiltered={handleFiltered}
						filteredData={filteredData}
						dbBaseId="dashboard_active_sheet"
						isDbPaginated={isDbPaginated}
					/>
					<JsonTable
						data={filteredData}
						serverPagination={isTableDbPaginated}
						totalServerRows={totalRows}
						currentServerPage={currentPage}
						onServerPageChange={setCurrentPage}
					/>
				</>
			)}
		</div>
	);
}

export default DashBoard;
