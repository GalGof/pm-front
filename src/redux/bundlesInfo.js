import { createSlice } from '@reduxjs/toolkit'
import { makeSliceParams } from './utils';

/** @type {ReturnType<typeof makeSliceParams<BundleInfo>>} */
const params = makeSliceParams();

const bundlesInfoSlice = createSlice({
  name: 'bundleInfo',
  ...params,
})

// Action creators are generated for each case reducer function
export const { updateItem, deleteItem, initItems } = bundlesInfoSlice.actions

export default bundlesInfoSlice.reducer