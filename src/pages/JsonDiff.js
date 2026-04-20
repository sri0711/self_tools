import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useSelector } from 'react-redux';

function JsonDiff() {
	const diffData = useSelector((state) => state.json_diff_data.value);
	const { value1: diffValue1, value2: diffValue2 } = diffData;

	return (
		<div
			className="diffArea"
			style={{
				minHeight: '100vh',
				width: '100vw',
				position: 'fixed',
				top: 0,
				left: 0,
				zIndex: 1
			}}
		>
			<ReactDiffViewer
				oldValue={JSON.stringify(diffValue1, null, 3)}
				newValue={JSON.stringify(diffValue2, null, 3)}
				splitView={true}
				useDarkTheme={true}
				infiniteLoading={{
					pageSize: 20,
					containerHeight: '100vh'
				}}
				loadingElement={() => (
					<div style={{ padding: '20px', textAlign: 'center' }}>
						Computing diff...
					</div>
				)}
			/>
		</div>
	);
}

export default JsonDiff;
