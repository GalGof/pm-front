import * as redux from 'react-redux';
import { configureStore } from '@reduxjs/toolkit'
import buildersInfoReducer from '../redux/buildersInfo';
import bundlesInfoReducer from '../redux/bundlesInfo';
import filteredEnginesReducer from '../redux/filteredEngines';
import deployedPacksInfoReducer from '../redux/deployedPacksInfo';
import dockerEnginesInfoReducer from '../redux/dockerEnginesInfo';
import telemetryInfoReducer from '../redux/telemetryInfo';
import serviceLoggerReducer from '../redux/serviceLogger';
import globalsReducer from '../redux/globals';
import dockerRegistriesInfoReducer from '../redux/dockerRegistriesInfo';
import sharedDataInfoReducer from '../redux/sharedDataInfo';
import deployQueueReducer from '../redux/deployQueue';
import buildBundleQueueReducer from '../redux/buildBundleQueue';

const store = configureStore({
  reducer: {
    // service db
    builders: buildersInfoReducer,
    bundles: bundlesInfoReducer,
    deployedPacksInfo: deployedPacksInfoReducer,
    dockerEnginesInfo: dockerEnginesInfoReducer,
    dockerRegistriesInfo: dockerRegistriesInfoReducer,
    sharedDataInfo: sharedDataInfoReducer,

    // service queues
    deployQueue: deployQueueReducer,
    buildBundleQueue: buildBundleQueueReducer,
    
    // var service data
    telemetryInfo: telemetryInfoReducer,
    serviceLogger: serviceLoggerReducer,

    // front data
    filteredEngines: filteredEnginesReducer,
    globals: globalsReducer,
  },
});

export default store;

/** @type {redux.UseSelector<ReturnType<typeof store.getState>>} */
export const useSelector = redux.useSelector;