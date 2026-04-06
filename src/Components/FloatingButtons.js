import { useDispatch, useSelector } from 'react-redux';
import EditModal from './EditModal';
import { Button, Image } from 'react-bootstrap';
import save from '../images/save.png';
import { setJson1DiffData, setJson2DiffData } from '../redux/diffHandler';

function FloatingButtons({ onMenuClick }) {
	let userSetting = useSelector((state) => state.user_settings.value);
	const Dispatch = useDispatch();

	const HandleValuePaste = async (e, buttonValue) => {
		e.preventDefault();
		let pastedData = await navigator.clipboard.readText();
		console.log('🚀 ~ HandleValuePaste ~ buttonValue:', buttonValue);
		let writeData = null;
		try {
			writeData = JSON.parse(pastedData);
		} catch {
			writeData = pastedData;
		}
		Dispatch(
			buttonValue === 1
				? setJson1DiffData(writeData)
				: setJson2DiffData(writeData)
		);
	};

	return (
		<>
			{userSetting.current_screen !== '/jsonDiff' && <EditModal />}

			{userSetting.current_screen === '/jsonDiff' && (
				<>
					<Button
						variant="dark"
						className="floatingMenuButton diffButton_1"
						onClick={(e) => HandleValuePaste(e, 1)}
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
						onClick={(e) => HandleValuePaste(e, 2)}
					>
						<Image
							src={save}
							alt="Save"
							style={{ width: '20px' }}
						/>
					</Button>
				</>
			)}

			<button
				className="floatingMenuButton"
				onClick={onMenuClick}
				aria-label="Open menu"
				title="Open menu"
			>
				☰
			</button>
		</>
	);
}

export default FloatingButtons;
