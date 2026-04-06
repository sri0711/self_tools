import JsonView from '@microlink/react-json-view';
import { useDispatch, useSelector } from 'react-redux';
import { setJsonData } from '../redux/JsonHandler';

export default function Home() {
	let userSettings = useSelector((state) => state.user_settings.value);
	let jsonData = useSelector((state) => state.json_data.value);
	const Dispatch = useDispatch();

	const updateData = (newData) => {
		Dispatch(setJsonData(newData));
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
