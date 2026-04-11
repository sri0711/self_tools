import React, { useState } from 'react';
import JsonTable from '../Components/JsonTable';
import DynamicFilter from '../Components/DynamicFilter';

function DashBoard() {
	const initialData = [];
	const [filteredData, setFilteredData] = useState(initialData);

	return (
		<div className="dashboard">
			<DynamicFilter data={initialData} onFiltered={setFilteredData} />
			<JsonTable data={filteredData} />
		</div>
	);
}

export default DashBoard;
