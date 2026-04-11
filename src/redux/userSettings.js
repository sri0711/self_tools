import { createSlice } from '@reduxjs/toolkit';

const initialValue = () => {
	let basicSettings = {
		base_theme: 'dark',
		json_viewer_theme: 'monokai',
		current_screen: '/',
		file_handler_modal: false
	};
	const storedSettings = localStorage.getItem('user_settings');
	if (storedSettings) {
		let parsedSettings = JSON.parse(storedSettings);

		if (
			Object.keys(parsedSettings).length !==
			Object.keys(basicSettings).length
		) {
			localStorage.setItem(
				'user_settings',
				JSON.stringify(basicSettings)
			);
			return basicSettings;
		}
		return parsedSettings;
	}

	localStorage.setItem('user_settings', JSON.stringify(basicSettings));
	return basicSettings;
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
		},
		setFileHandlerModal: (state) => {
			state.value.file_handler_modal = !state.value.file_handler_modal;
			updateLocalStorage(state.value);
		}
	}
});

export const {
	getUserSettings,
	setJsonViewerTheme,
	setCurrentScreen,
	setFileHandlerModal
} = UserSettingsSlice.actions;

export default UserSettingsSlice.reducer;
