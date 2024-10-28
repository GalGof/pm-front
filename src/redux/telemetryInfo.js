import { createSlice } from '@reduxjs/toolkit'

const telemetryInfoSlice = createSlice({
  name: 'telemetry',
  initialState: {
    /** @type {{engines?: {[engineId:string]: {pong?: boolean}}}} */
    data: {},
  },
  reducers: {
    /** @param {{payload: {engines?: {[engineId:string]: {pong?: boolean}}}, type: string}} action*/
    setTelemetry: (state, action) => {
      state.data = action.payload;
    },
  },
})

// Action creators are generated for each case reducer function
export const { setTelemetry } = telemetryInfoSlice.actions

export default telemetryInfoSlice.reducer