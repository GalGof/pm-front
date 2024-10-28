import { createSlice } from '@reduxjs/toolkit'
import { makeSliceParams } from './utils';

/** @type {ReturnType<typeof makeSliceParams<BuilderInfo>>} */
const params = makeSliceParams();

const buildersInfoSlice = createSlice({
  name: 'buildersInfo',
  ...params,
})

// Action creators are generated for each case reducer function
export const { updateItem, deleteItem, initItems } = buildersInfoSlice.actions

export default buildersInfoSlice.reducer