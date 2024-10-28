import { createSlice } from '@reduxjs/toolkit'

const filteredEnginesSlice = createSlice({
  name: 'filteredEngines',
  initialState: {
    /** @type {string[]} */
    ids: [],
  },
  reducers: {
    /** @param {{payload: string, type: string}} action*/
    addItem: (state, action) => {
      state.ids.push(action.payload);
    },
    /** @param {{payload: string, type: string}} action*/
    removeItem: (state, action) => {
      state.ids = state.ids.filter(it=>it !== action.payload);
    },
    /** @param {{payload: string[], type: string}} action*/
    setItems: (state, action) => {
      state.ids = action.payload;
    },
  },
})

// Action creators are generated for each case reducer function
export const { addItem, removeItem, setItems } = filteredEnginesSlice.actions

export default filteredEnginesSlice.reducer