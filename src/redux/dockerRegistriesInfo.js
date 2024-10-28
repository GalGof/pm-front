import { createSlice } from '@reduxjs/toolkit'
import { makeSliceParams } from './utils';

/** @type {ReturnType<typeof makeSliceParams<DockerRegistryInfo>>} */
const params = makeSliceParams();

const dockerRegistriesInfoSlice = createSlice({
  name: 'dockerRegistriesInfo',
  ...params,
})

// Action creators are generated for each case reducer function
export const { updateItem, deleteItem, initItems } = dockerRegistriesInfoSlice.actions

export default dockerRegistriesInfoSlice.reducer