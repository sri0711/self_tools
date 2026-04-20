import { Offcanvas, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import JsonViewerThemes from './JsonViewerThemes';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentScreen } from '../redux/userSettings';

const availableScreens = {
	'/': 'Home',
	'/jsonDiff': 'Json Diff',
	'/dashboard': 'Dashboard',
	'/format': 'Code Formatter',
	'/viewer': 'Editor'
};

function AppDrawer({ show, onHide, onItemClick }) {
	const dispatch = useDispatch();
	const userSettings = useSelector((state) => {
		return state.user_settings;
	});

	const clickHandler = (e) => {
		const linkUrl = new URL(e.currentTarget.href);
		const hash = linkUrl.hash || '#/';
		const routePath = hash.startsWith('#') ? hash.slice(1) : hash;
		dispatch(setCurrentScreen(routePath));
		if (onItemClick) {
			onItemClick();
		}
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
						className="nav-link fw-bold"
						onClick={clickHandler}
					>
						Home
					</Link>
					<Link
						to="/viewer"
						className="nav-link text-black fw-bold"
						onClick={clickHandler}
					>
						Json Viewer
					</Link>
					<Link
						to="/jsonDiff"
						className="nav-link fw-bold"
						onClick={clickHandler}
					>
						Json Diff
					</Link>

					<Link
						to="/dashboard"
						className="nav-link fw-bold"
						onClick={clickHandler}
					>
						Data Dashboard
					</Link>

					<Link
						to="/format"
						className="nav-link fw-bold"
						onClick={clickHandler}
					>
						Code Formatter
					</Link>

					{userSettings.value.current_screen === '/viewer' && (
						<JsonViewerThemes />
					)}
				</Nav>
			</Offcanvas.Body>
		</Offcanvas>
	);
}

export default AppDrawer;
