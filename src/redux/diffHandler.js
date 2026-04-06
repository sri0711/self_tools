import { createSlice } from '@reduxjs/toolkit';

export const JsonDiffSlice = createSlice({
	name: 'json_diff_data',
	initialState: {
		value: {
			value1: null,
			value2: null
		}
	},
	reducers: {
		getJsonDiffData: (state) => {
			return state;
		},
		setJson1DiffData: (state, action) => {
			state.value.value1 = action.payload;
		},
		setJson2DiffData: (state, action) => {
			state.value.value2 = action.payload;
		}
	}
});

export const { getJsonDiffData, setJson1DiffData, setJson2DiffData } =
	JsonDiffSlice.actions;

export default JsonDiffSlice.reducer;
