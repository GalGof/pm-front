import { createSlice } from '@reduxjs/toolkit'

const serviceLoggerSlice = createSlice({
  name: 'serviceLogger',
  initialState: {
    /** @type {LogMessage[]} */
    messages: [],
    enabled: !!localStorage.getItem("showLog") || false,
  },
  reducers: {
    /** @param {{payload: LogMessages, type: string}} action*/
    addMessages: (state, action) => {
      if (!state.enabled) return;
      state.messages = action.payload.reverse().concat(state.messages);
    },
    enableLog: (state)=>{
      state.enabled = true;
      localStorage.setItem("showLog", "enabled")
    },
    disableLog: (state)=>{
      state.enabled = false;
      localStorage.removeItem("showLog");
    },
  },
})

// Action creators are generated for each case reducer function
export const { addMessages, enableLog, disableLog } = serviceLoggerSlice.actions

export default serviceLoggerSlice.reducer