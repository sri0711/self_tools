import { Offcanvas, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import JsonViewerThemes from './JsonViewerThemes';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentScreen } from '../redux/userSettings';

function AppDrawer({ show, onHide, onItemClick }) {
	const Dispatch = useDispatch();
	let availableScreens = {
		'/': 'Editor',
		'/jsonDiff': 'Json Diff'
	};
	const userSettings = useSelector((state) => {
		return state.user_settings;
	});

	const clickHandler = (e) => {
		Dispatch(setCurrentScreen(e.target.href.split('#')[1]));
		onItemClick();
	};
	return (
		<Offcanvas
			show={show}
			onHide={onHide}
			placement="end"
			className="appDrawer"
		>
			<Offcanvas.Header closeButton>
				<Offcanvas.Title>
					Menu :{' '}
					{availableScreens[userSettings.value.current_screen] ||
						'Unknown Screen'}
				</Offcanvas.Title>
			</Offcanvas.Header>
			<Offcanvas.Body>
				<Nav className="flex-column gap-2">
					<Link
						to="/"
						className="nav-link text-black fw-bold"
						onClick={clickHandler}
					>
						Json Viewer
					</Link>
					<Link
						to="/jsonDiff"
						className="nav-link text-black fw-bold"
						onClick={clickHandler}
					>
						Json Diff Viewer
                    </Link>
                    { userSettings.value.current_screen === '/' && <JsonViewerThemes /> }
				</Nav>
			</Offcanvas.Body>
		</Offcanvas>
	);
}

export default AppDrawer;
