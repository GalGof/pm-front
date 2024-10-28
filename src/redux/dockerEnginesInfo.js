import { createSlice } from '@reduxjs/toolkit'
import { makeSliceParams } from './utils';

/** @type {ReturnType<typeof makeSliceParams<DockerEngineInfo>>} */
const params = makeSliceParams();

const dockerEnginesInfoSlice = createSlice({
  name: 'dockerEngines',
  ...params,
  // initialState: {
  //   /** @type {string[]} */
  //   ids: [],
  //   /** @type {{[itemId: string]: DockerEngineInfo}} */
  //   entries: {},
  // },
  // reducers: {
  //   /** @param {{payload: DockerEngineInfo[], type: string}} action*/
  //   initItems: (state, action) => {
  //     state.ids = action.payload.map(it=>it.id);
  //     state.entries = {};
  //     for (let it of action.payload) {
  //       state.entries[it.id] = it;
  //     }
  //   },
  //   /** @param {{payload: DockerEngineInfo, type: string}} action*/
  //   updateItem: (state, action) => {
  //     let id = action.payload.id;
  //     if (!state.entries[id]) {
  //       state.ids.unshift(id);
  //     }
  //     state.entries[id] = action.payload;
  //   },
  //   /** @param {{payload: string, type: string}} action*/
  //   deleteItem: (state, action) => {
  //     state.ids.splice(state.ids.indexOf(action.payload), 1);
  //     delete state.entries[action.payload];
  //   },
  // },
})

// Action creators are generated for each case reducer function
export const { updateItem, deleteItem, initItems } = dockerEnginesInfoSlice.actions

export default dockerEnginesInfoSlice.reducer