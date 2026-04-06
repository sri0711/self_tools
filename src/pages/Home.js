import JsonView from '@microlink/react-json-view';
import { useSelector } from 'react-redux';

export default function Home() {
	let userSettings = useSelector((state) => state.user_settings.value);
	return (
		<div className="w-100">
			<JsonView
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
