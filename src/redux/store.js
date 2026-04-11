import { configureStore } from '@reduxjs/toolkit';

export default configureStore({
	reducer: {
		json_data: require('./JsonHandler').default,
		user_settings: require('./userSettings').default,
		json_diff_data: require('./diffHandler').default,
		dashboard_data: require('./dashBoardHandler').default
	}
});
