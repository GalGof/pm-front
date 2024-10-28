import { createSlice } from '@reduxjs/toolkit'

const isDevEnv = process.env.NODE_ENV === "development";

const globalsSlice = createSlice({
  name: 'globals',
  initialState: {
    adminAccess: isDevEnv,
    rawEditMode: isDevEnv || !!localStorage.getItem("rawEditMode"),
    path: decodeURI(window.location.pathname.slice(1)),
    engineFeatureLabels: {
      builder: "dockerBuilder",
      /** @type {string[]} */
      automation: ["autotests"],
    }
  },
  reducers: {
    /** @param {{payload: boolean, type: string}} action*/
    setAdminAccess: (state, action) => {
      state.adminAccess = action.payload;
    },
    /** @param {{payload: string, type: string}} action*/
    setPath: (state, action) => {
      window.history.pushState(null, '', "/" + action.payload);
      state.path = action.payload;
    },
    /** @param {{payload: boolean, type: string}} action*/
    setRawEditMode: (state, action) => {
      state.rawEditMode = action.payload;
      if (state.rawEditMode) {
        localStorage.setItem("rawEditMode", "active");
      } else {
        localStorage.removeItem("rawEditMode");
      }
    },
    /** @param {{payload: string[], type: string}} action*/
    setAutomationLabels: (state, action) => {
      state.engineFeatureLabels.automation = action.payload;
    },
  },
})

// Action creators are generated for each case reducer function
export const {
  setAdminAccess,
  setPath,
  setRawEditMode,
  setAutomationLabels,
} = globalsSlice.actions

export default globalsSlice.reducer