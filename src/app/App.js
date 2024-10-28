import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import DvrIcon from '@mui/icons-material/Dvr';

import './GlobalVars.css';
import './App.css';
import { PostAdminAceessKey } from '../common/Actions';
import NavPanel from './NavPanel';
import RouteView from './RouteView';
import LogPanel from './LogPanel';
import { ModalManager } from '../modals/ModalManager';
import { darkTheme } from './Theme';
import { wsConnection } from '../common/WSConnection';
import * as buildersInfoActions from '../redux/buildersInfo';
import * as bundlesInfoActions from '../redux/bundlesInfo';
import * as deployedPacksInfoActions from '../redux/deployedPacksInfo';
import * as dockerEnginesInfoActions from '../redux/dockerEnginesInfo';
import * as dockerRegistriesInfoActions from '../redux/dockerRegistriesInfo';
import * as sharedDataInfoActions from '../redux/sharedDataInfo';
import * as deployQueueActions from '../redux/deployQueue';
import * as buildBundleQueueActions from '../redux/buildBundleQueue';
import * as telemetryInfoActions from '../redux/telemetryInfo';
import * as serviceLoggerActions from '../redux/serviceLogger';
import * as globalsActions from '../redux/globals';
import { cyrb53 } from '../common/cyrb53';

/** @type {{[dbName: string]: {deleteItem: import('@reduxjs/toolkit').ActionCreatorWithPayload<string>, updateItem: import('@reduxjs/toolkit').ActionCreatorWithPayload<any>, initItems: import('@reduxjs/toolkit').ActionCreatorWithPayload<any[]>}}} */
const reducers = {
  "builders": buildersInfoActions,
  "bundles": bundlesInfoActions,
  "deployed": deployedPacksInfoActions,
  "dockerEngines": dockerEnginesInfoActions,
  "dockerRegistries": dockerRegistriesInfoActions,
  "sharedData": sharedDataInfoActions,
  "deployQueue": deployQueueActions,
  "buildBundleQueue": buildBundleQueueActions,
};

export default function App() {
  // console.log("app")
  const dispatch = useDispatch()
  const showLog = useSelector((/** @type {ReduxStoreType}*/state) => state.serviceLogger.enabled);
  const [connected, setConnected] = useState(false);

  useEffect(()=>{
    PostAdminAceessKey({currentKey: localStorage.getItem("currentKey") || String(cyrb53(""))})
      .then(()=>dispatch(globalsActions.setAdminAccess(true)))
      .catch((err)=>{console.log(err)});

    wsConnection.addOnStateChange(setConnected);
    const onOpen = ()=> wsConnection.sendData({message: "log.subscribe"});
    wsConnection.addOnOpen(onOpen);
    const onMessage = (/** @type {MessageEvent}*/event)=>{
      /** @type {{dbName: string, type: "db.info"} & ({operation: "db.init", items: []} | {operation: "db.change", item: {id: string}} | {operation: "db.delete", itemId: string}) | {type: "log.message", operation: "log.messages", data: LogMessages} | {type: "mainController.telemetry", data: object, operation?: string}} */
      let msg = JSON.parse(event.data);
      if (msg.type === "db.info") {
        // update redux store
        if (reducers[msg.dbName]) {
          if (msg.operation === "db.init") {
            // dispatch(reducers.builders.init(msg.items))
            dispatch(reducers[msg.dbName].initItems(msg.items));
          } else if (msg.operation === "db.change") {
            dispatch(reducers[msg.dbName].updateItem(msg.item));
          } else if (msg.operation === "db.delete") {
            dispatch(reducers[msg.dbName].deleteItem(msg.itemId));
          }
        }
      } else if (msg.type === "log.message") {
        dispatch(serviceLoggerActions.addMessages(msg.data))
      } else if (msg.type === "mainController.telemetry") {
        dispatch(telemetryInfoActions.setTelemetry(msg.data))
      }
    }
    wsConnection.addOnMessage(onMessage);

    return ()=>{
      wsConnection.removeOnOpen(onOpen);
      wsConnection.removeOnMessage(onMessage);
    };
  }, []);
  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{display: 'flex'}}>
        <NavPanel
          connected={connected}
          ConnectionIconClass={DvrIcon}
          />
        <Box sx={{flex: 1}}><RouteView /></Box>
        {showLog && <LogPanel connected={true}/>}
      </Box>
      <ModalManager/>
    </ThemeProvider>
  );
}