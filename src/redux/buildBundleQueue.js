import { createSlice } from '@reduxjs/toolkit'
import { makeSliceParams } from './utils';

/** @type {ReturnType<typeof makeSliceParams<BuildBundleQueueItem>>} */
const params = makeSliceParams();

const buildBundleQueueSlice = createSlice({
  name: 'buildBundleQueue',
  ...params,
})

// Action creators are generated for each case reducer function
export const { updateItem, deleteItem, initItems } = buildBundleQueueSlice.actions

export default buildBundleQueueSlice.reducer