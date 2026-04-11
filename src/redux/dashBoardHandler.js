import { createSlice } from '@reduxjs/toolkit';

export const DashBoardSlice = createSlice({
	name: 'dashboard_data',
	initialState: {
		value: []
	},
	reducers: {
		getDashboardData: (state) => {
			return state;
		},
		setDashboardData: (state, action) => {
			state.value = action.payload;
		}
	}
});

export const { getDashboardData, setDashboardData } = DashBoardSlice.actions;
export default DashBoardSlice.reducer;
