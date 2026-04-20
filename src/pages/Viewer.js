import React from 'react';
import JsonView from '@microlink/react-json-view';
import { useDispatch, useSelector } from 'react-redux';
import { setJsonData } from '../redux/JsonHandler';

function Viewer() {
	const userSettings = useSelector((state) => state.user_settings.value);
	const jsonData = useSelector((state) => state.json_data.value);
	const dispatch = useDispatch();

	const updateData = (newData) => {
		dispatch(setJsonData(newData));
	};

	return (
		<div className="w-100">
			<JsonView
				onAdd={(e) => updateData(e.updated_src)}
				onEdit={(e) => updateData(e.updated_src)}
				onDelete={(e) => updateData(e.updated_src)}
				src={jsonData}
				className="w-100"
				style={{
					minHeight: '100vh',
					width: '100vw'
				}}
				theme={userSettings?.json_viewer_theme}
			/>
		</div>
	);
}

export default Viewer;
