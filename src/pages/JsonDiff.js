import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';

function JsonDiff({ onMenuClick }) {
	const diffData = useSelector((state) => state.json_diff_data.value);
	const { value1: diffValue1, value2: diffValue2 } = diffData;

	return (
		<div className="p-4 tool-page-bg theme-mint d-flex flex-column min-vh-100">
			<div className="glass-panel flex-grow-1 p-0 overflow-hidden border-0 d-flex flex-column">
				<div
					className="d-flex justify-content-between align-items-center p-3 border-bottom"
					style={{
						borderColor: 'rgba(56, 189, 248, 0.1)',
						background: 'rgba(255, 255, 255, 0.02)'
					}}
				>
					<span className="font-monospace text-secondary small">
						INPUT_STREAM // JSON_DIFF
					</span>
					<Button
						variant="none"
						className="hud-btn-secondary fw-bold btn-sm py-1"
						onClick={onMenuClick}
					>
						[ ☰ MENU ]
					</Button>
				</div>
				<div
					className="flex-grow-1 overflow-auto"
					style={{ height: 'calc(100vh - 140px)' }}
				>
					<ReactDiffViewer
						oldValue={JSON.stringify(diffValue1, null, 3)}
						newValue={JSON.stringify(diffValue2, null, 3)}
						splitView={true}
						useDarkTheme={true}
						infiniteLoading={{
							pageSize: 20,
							containerHeight: '100%'
						}}
						loadingElement={() => (
							<div className="text-info font-monospace p-4 text-center">
								COMPUTING_DIFF...
							</div>
						)}
					/>
				</div>
			</div>
		</div>
	);
}

export default JsonDiff;
