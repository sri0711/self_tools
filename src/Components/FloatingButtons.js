import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';
import { setJson1DiffData, setJson2DiffData } from '../redux/diffHandler';
import { setJsonData } from '../redux/JsonHandler';
import { setFileHandlerModal } from '../redux/userSettings';

function FloatingButtons() {
	const userSetting = useSelector((state) => state.user_settings.value);
	const dispatch = useDispatch();

	const handleValuePaste = async (e, buttonValue) => {
		e.preventDefault();
		const pastedData = await navigator.clipboard.readText();
		let writeData = null;
		try {
			writeData = JSON.parse(pastedData);
		} catch {
			writeData = pastedData;
		}
		dispatch(
			buttonValue === 1
				? setJson1DiffData(writeData)
				: setJson2DiffData(writeData)
		);
	};

	const handlePasteValueForJsonEditor = async () => {
		const pastedData = await navigator.clipboard.readText();
		let writeData = null;
		try {
			writeData = JSON.parse(pastedData);
		} catch {
			writeData = pastedData;
		}
		dispatch(setJsonData(writeData));
	};

	const openFileHandlerModal = () => {
		dispatch(setFileHandlerModal());
	};

	return (
		<>
			{userSetting.current_screen === '/jsonDiff' && (
				<>
					<Button
						className="hud-action-pill position-fixed"
						style={{
							bottom: '40px',
							left: '25%',
							transform: 'translateX(-50%)',
							'--btn-glow': '#34d399'
						}}
						onClick={(e) => handleValuePaste(e, 1)}
					>
						📋 [ PASTE LEFT ]
					</Button>
					<Button
						className="hud-action-pill position-fixed"
						style={{
							bottom: '40px',
							left: '75%',
							transform: 'translateX(-50%)',
							'--btn-glow': '#34d399'
						}}
						onClick={(e) => handleValuePaste(e, 2)}
					>
						📋 [ PASTE RIGHT ]
					</Button>
				</>
			)}
			{userSetting.current_screen === '/viewer' && (
				<Button
					className="hud-action-pill position-fixed"
					style={{
						bottom: '40px',
						left: '50%',
						transform: 'translateX(-50%)',
						'--btn-glow': '#38bdf8'
					}}
					onClick={handlePasteValueForJsonEditor}
					aria-label="Paste JSON"
					title="Paste JSON"
				>
					📋 [ PASTE JSON ]
				</Button>
			)}

			{userSetting.current_screen === '/dashboard' && (
				<Button
					className="hud-action-pill position-fixed"
					style={{
						bottom: '40px',
						left: '50%',
						transform: 'translateX(-50%)',
						'--btn-glow': '#fbbf24'
					}}
					onClick={openFileHandlerModal}
					aria-label="Data Source"
					title="Data Source"
				>
					📝 [ UPLOAD DATA ]
				</Button>
			)}
		</>
	);
}

export default FloatingButtons;
