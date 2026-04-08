import React, { useState } from 'react';
import JsonTable from '../Components/JsonTable';
import DynamicFilter from '../Components/DynamicFilter';

function DashBoard() {
	const initialData = [
		{
			name: 'John Doe',
			age: 30,
			email: 'john.doe@example.com',
			address: '123 Main St, Anytown, USA',
			gender: 'Male',
			phone: '123-456-7890',
			occupation: 'Software Engineer',
			company: 'Tech Solutions Inc.',
			joined: '2020-01-15',
			ethinicity: 'Caucasian',
			marital_status: 'Single',
			interests: ['Coding', 'Hiking', 'Cooking']
		},
		{
			name: 'Jane Smith',
			age: 25,
			email: 'jane.smith@example.com',
			address: '456 Oak Ave, Somewhere, USA',
			gender: 'Female',
			phone: '098-765-4321',
			occupation: 'Marketing Manager',
			company: 'Marketing Masters LLC',
			joined: '2019-06-20',
			ethinicity: 'Asian',
			marital_status: 'Married',
			interests: ['Traveling', 'Photography', 'Yoga']
		},
		{
			name: 'Bob Johnson',
			age: 35,
			email: 'bob.johnson@example.com',
			address: '789 Pine Rd, Elsewhere, USA',
			gender: 'Male',
			phone: '555-123-4567',
			occupation: 'Sales Director',
			company: 'Global Sales Corp.',
			joined: '2018-03-10',
			ethinicity: 'African American',
			marital_status: 'Divorced',
			interests: ['Golf', 'Fishing', 'Cooking']
		}
	];
	const [filteredData, setFilteredData] = useState(initialData);

	return (
		<div className="dashboard">
			<DynamicFilter data={initialData} onFiltered={setFilteredData} />
			<JsonTable data={filteredData} />
		</div>
	);
}

export default DashBoard;
