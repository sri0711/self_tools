import React, { useEffect } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useSelector } from 'react-redux';

function JsonDiff() {
	let diffData = useSelector((state) => state.json_diff_data.value);
	let [diffValue1, diffValue2] = [diffData.value1, diffData.value2];
	return (
		useEffect(() => {
			console.log('Diff Data Updated:', diffData);
		}, [diffData]),
		(
			<div
				className={'diffArea'}
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
					oldValue={JSON.stringify(diffValue1, null, 2)}
					newValue={JSON.stringify(diffValue2, null, 2)}
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
		)
	);
}

export default JsonDiff;
