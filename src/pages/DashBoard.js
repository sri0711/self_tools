import React, { useMemo, useState } from 'react';
import JsonTable from '../Components/JsonTable';
import DynamicFilter from '../Components/DynamicFilter';
import FileHandlerModel from '../Components/FileHandlerModel';
import { useSelector } from 'react-redux';

function DashBoard() {
	let dashboardData = useSelector((state) => state.dashboard_data.value);
	const initialData = useMemo(() => dashboardData, [dashboardData]);
	const [filteredData, setFilteredData] = useState(initialData);

	return (
		<div className="dashboard">
			<FileHandlerModel />
			<DynamicFilter
				data={initialData}
				onFiltered={setFilteredData}
				filteredData={filteredData}
			/>
			<JsonTable data={filteredData} />
		</div>
	);
}

export default DashBoard;
