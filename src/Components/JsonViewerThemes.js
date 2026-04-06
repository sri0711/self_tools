import { NavDropdown } from 'react-bootstrap';
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
		<NavDropdown
			title={userSettings.json_viewer_theme}
			className="dropDown"
			id="nav-dropdown"
		>
			{themes.map((theme) => {
				if (theme === userSettings.json_viewer_theme) {
					return null;
				}

				return (
					<NavDropdown.Item
						key={theme}
						value={theme}
						onClick={() => handleThemeChange(theme)}
					>
						{theme}
					</NavDropdown.Item>
				);
			})}
		</NavDropdown>
	);
}

export default JsonViewerThemes;
