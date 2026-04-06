import { createSlice } from '@reduxjs/toolkit';

export const JsonSlice = createSlice({
	name: 'json_data',
	initialState: {
		value: {}
    },
    reducers: {
        getJsonData: (state) => {
            return state;
        },
        setJsonData: (state, action) => {
            state.value = action.payload;
        }
    }
});


export const { getJsonData, setJsonData } = JsonSlice.actions;

export default JsonSlice.reducer;