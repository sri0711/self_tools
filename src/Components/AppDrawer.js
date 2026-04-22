import { Offcanvas, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import JsonViewerThemes from './JsonViewerThemes';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentScreen } from '../redux/userSettings';

const availableScreens = {
	'/': 'Home',
	'/jsonDiff': 'Json Diff',
	'/dashboard': 'Data Dashboard',
	'/format': 'Code Formatter',
	'/viewer': 'JSON Editor',
	'/url-manipulator': 'URL Manipulator',
	'/json-model-generator': 'JSON Model Generator'
};

const screenThemes = {
	'/': '',
	'/jsonDiff': 'theme-mint',
	'/dashboard': 'theme-amber',
	'/format': 'theme-purple',
	'/viewer': 'theme-cyan',
	'/url-manipulator': 'theme-pink',
	'/json-model-generator': 'theme-red'
};

function AppDrawer({ show, onHide, onItemClick }) {
	const dispatch = useDispatch();
	const userSettings = useSelector((state) => {
		return state.user_settings;
	});
	const currentScreen = userSettings.value.current_screen;

	const clickHandler = (e) => {
		const linkUrl = new URL(e.currentTarget.href);
		const hash = linkUrl.hash || '#/';
		const routePath = hash.startsWith('#') ? hash.slice(1) : hash;
		dispatch(setCurrentScreen(routePath));
		if (onItemClick) {
			onItemClick();
		}
	};

	const getLinkClass = (path) => {
		return `nav-link fw-bold ${currentScreen === path ? 'active-link' : ''}`;
	};

	return (
		<Offcanvas
			show={show}
			onHide={onHide}
			placement="end"
			className={`appDrawer ${screenThemes[currentScreen] || ''}`}
		>
			<Offcanvas.Header closeButton>
				<Offcanvas.Title>
					Menu : {availableScreens[currentScreen] || 'Unknown Screen'}
				</Offcanvas.Title>
			</Offcanvas.Header>
			<Offcanvas.Body>
				<Nav className="flex-column gap-2">
					<Link
						to="/"
						className={getLinkClass('/')}
						onClick={clickHandler}
					>
						Home
					</Link>
					<Link
						to="/viewer"
						className={getLinkClass('/viewer')}
						onClick={clickHandler}
					>
						JSON Editor
					</Link>
					<Link
						to="/jsonDiff"
						className={getLinkClass('/jsonDiff')}
						onClick={clickHandler}
					>
						JSON Diff
					</Link>

					<Link
						to="/dashboard"
						className={getLinkClass('/dashboard')}
						onClick={clickHandler}
					>
						Data Dashboard
					</Link>

					<Link
						to="/format"
						className={getLinkClass('/format')}
						onClick={clickHandler}
					>
						Code Formatter
					</Link>

					<Link
						to="/json-model-generator"
						className={getLinkClass('/json-model-generator')}
						onClick={clickHandler}
					>
						JSON Model Generator
					</Link>

					<Link
						to="/url-manipulator"
						className={getLinkClass('/url-manipulator')}
						onClick={clickHandler}
					>
						URL Manipulator
					</Link>

					{currentScreen === '/viewer' && <JsonViewerThemes />}
				</Nav>
			</Offcanvas.Body>
		</Offcanvas>
	);
}

export default AppDrawer;
