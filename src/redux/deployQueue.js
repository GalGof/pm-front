import { createSlice } from '@reduxjs/toolkit'
import { makeSliceParams } from './utils';

/** @type {ReturnType<typeof makeSliceParams<DeployQueueItem>>} */
const params = makeSliceParams();

const deployQueueSlice = createSlice({
  name: 'deployQueue',
  ...params,
})

// Action creators are generated for each case reducer function
export const { updateItem, deleteItem, initItems } = deployQueueSlice.actions

export default deployQueueSlice.reducer