import { createSlice, current } from '@reduxjs/toolkit';

const initialValue = () => {
	const storedSettings = localStorage.getItem('user_settings');
	if (storedSettings) {
		return JSON.parse(storedSettings);
	}

	localStorage.setItem(
		'user_settings',
		JSON.stringify({
			base_theme: 'dark',
			json_viewer_theme: 'monokai',
			current_screen: '/'
		})
	);
	return {
		base_theme: 'dark',
		json_viewer_theme: 'monokai',
		current_screen: '/'
	};
};

const updateLocalStorage = (settings) => {
	localStorage.setItem('user_settings', JSON.stringify(settings));
};

export const UserSettingsSlice = createSlice({
	name: 'user_settings',
	initialState: {
		value: initialValue()
	},
	reducers: {
		getUserSettings: (state) => {
			return state;
		},
		setJsonViewerTheme: (state, action) => {
			state.value.json_viewer_theme = action.payload;
			updateLocalStorage(state.value);
		},
		setCurrentScreen: (state, action) => {
			state.value.current_screen = action.payload;
			updateLocalStorage(state.value);
		}
	}
});

export const { getUserSettings, setJsonViewerTheme, setCurrentScreen } =
	UserSettingsSlice.actions;

export default UserSettingsSlice.reducer;
