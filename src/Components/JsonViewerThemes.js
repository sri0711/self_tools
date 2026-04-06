import { Dropdown } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { setJsonViewerTheme } from '../redux/userSettings';

let themes = [
	'apathy',
	'ashes',
	'atelierDune',
	'atelierForest',
	'atelierHeath',
	'atelierLakeside',
	'atelierSeaside',
	'bespin',
	'brewer',
	'bright',
	'chalk',
	'codeschool',
	'colors',
	'eighties',
	'embers',
	'flat',
	'google',
	'grayscale',
	'greenscreen',
	'harmonic',
	'hopscotch',
	'isotope',
	'marrakesh',
	'mocha',
	'monokai',
	'ocean',
	'paraiso',
	'pop',
	'railscasts',
	'shapeshifter',
	'solarized',
	'summerfruit',
	'threezerotwofour',
	'tomorrow',
	'tube',
	'twilight'
];

function JsonViewerThemes() {
	let userSettings = useSelector((state) => state.user_settings.value);
	const dispatch = useDispatch();

	const handleThemeChange = (theme) => {
		dispatch(setJsonViewerTheme(theme));
	};

	return (
		<div className="d-flex justify-content-start align-items-center gap-2 mx-3">
			<p className="fw-bold text-black me-3 mt-2">Theme</p>
			<Dropdown
				title={userSettings.json_viewer_theme}
				className="dropDown"
				id="nav-dropdown"
			>
				<Dropdown.Toggle variant="light" id="dropdown-basic">
					{userSettings.json_viewer_theme}
				</Dropdown.Toggle>
				<Dropdown.Menu className="dropDownMenu">
					{themes.map((theme) => {
						if (theme === userSettings.json_viewer_theme) {
							return null;
						}

						return (
							<Dropdown.Item
								key={theme}
								value={theme}
								onClick={() => handleThemeChange(theme)}
							>
								{theme}
							</Dropdown.Item>
						);
					})}
				</Dropdown.Menu>
			</Dropdown>
		</div>
	);
}

export default JsonViewerThemes;
