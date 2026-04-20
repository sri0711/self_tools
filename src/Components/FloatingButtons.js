import { useDispatch, useSelector } from 'react-redux';
import { Button, Image } from 'react-bootstrap';
import save from '../images/save.png';
import { setJson1DiffData, setJson2DiffData } from '../redux/diffHandler';
import { setJsonData } from '../redux/JsonHandler';
import { setFileHandlerModal } from '../redux/userSettings';

function FloatingButtons({ onMenuClick }) {
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
						variant="dark"
						className="floatingMenuButton diffButton_1"
						onClick={(e) => handleValuePaste(e, 1)}
					>
						<Image
							src={save}
							alt="Save"
							style={{ width: '20px' }}
						/>
					</Button>
					<Button
						variant="dark"
						className="floatingMenuButton diffButton_2"
						onClick={(e) => handleValuePaste(e, 2)}
					>
						<Image
							src={save}
							alt="Save"
							style={{ width: '20px' }}
						/>
					</Button>
				</>
			)}
			{userSetting.current_screen === '/viewer' && (
				<Button
					className="floatingMenuButton diffButton_2"
					onClick={handlePasteValueForJsonEditor}
					aria-label="Edit"
					title="Edit"
				>
					<Image src={save} alt="Save" style={{ width: '20px' }} />
				</Button>
			)}

			{userSetting.current_screen === '/dashboard' && (
				<Button
					className="floatingMenuButton diffButton_2"
					onClick={openFileHandlerModal}
					aria-label="Edit"
					title="Edit"
				>
					<span style={{ fontSize: '1.5rem', lineHeight: 1 }}>
						📝
					</span>
				</Button>
			)}

			{userSetting.current_screen !== '/' && (
				<button
					className="floatingMenuButton"
					onClick={onMenuClick}
					aria-label="Open menu"
					title="Open menu"
				>
					☰
				</button>
			)}
		</>
	);
}

export default FloatingButtons;
