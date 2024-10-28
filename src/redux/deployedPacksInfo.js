import { createSlice } from '@reduxjs/toolkit'

const deployedPacksInfoSlice = createSlice({
  name: 'deployedPacksInfo',
  initialState: {
    /** @type {string[]} */
    ids: [],
    /** @type {{[itemId: string]: DeployedInfo}} */
    entries: {},
    /** @type {{[engineId: string]: string[]}} */
    engineIds: {},
  },
  reducers: {
    /** @param {{payload: DeployedInfo[], type: string}} action*/
    initItems: (state, action) => {
      state.ids = action.payload.map(it=>it.id);
      state.entries = {};
      state.engineIds = {};
      let dockerEngineId, id;
      for (let it of action.payload) {
        id = it.id;
        dockerEngineId = it.dockerEngineId;
        state.entries[id] = it;
        if (!state.engineIds[dockerEngineId]) state.engineIds[dockerEngineId] = [];
        state.engineIds[dockerEngineId].push(id);
      }
    },
    /** @param {{payload: DeployedInfo, type: string}} action*/
    updateItem: (state, action) => {
      let id = action.payload.id;
      if (!state.entries[id]) {
        state.ids.unshift(id);
        if (!state.engineIds[action.payload.dockerEngineId]) state.engineIds[action.payload.dockerEngineId] = [];
        state.engineIds[action.payload.dockerEngineId].unshift(id);
      }
      state.entries[id] = action.payload;
    },
    /** @param {{payload: string, type: string}} action*/
    deleteItem: (state, action) => {
      let id = action.payload;
      let dockerEngineId = state.entries[id].dockerEngineId;
      state.ids.splice(state.ids.indexOf(id), 1);
      let eids = state.engineIds[dockerEngineId];
      eids.splice(eids.indexOf(id), 1);
      delete state.entries[id];
    },
  },
})

// Action creators are generated for each case reducer function
export const { updateItem, deleteItem, initItems } = deployedPacksInfoSlice.actions

export default deployedPacksInfoSlice.reducer