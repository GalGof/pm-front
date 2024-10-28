import { createSlice } from '@reduxjs/toolkit'
import { makeSliceParams } from './utils';

/** @type {ReturnType<typeof makeSliceParams<SharedDataInfo>>} */
const params = makeSliceParams();

const sharedDataInfoSlice = createSlice({
  name: 'sharedDataInfo',
  ...params,
})

// Action creators are generated for each case reducer function
export const { updateItem, deleteItem, initItems } = sharedDataInfoSlice.actions

export default sharedDataInfoSlice.reducer