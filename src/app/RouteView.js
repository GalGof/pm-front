import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { NavRoutes } from '../common/Config';
import Configuration from '../routes/Configuration';
import EngineView from '../routes/EngineView';
import BundlesView from '../routes/BundlesView';
import ControllerView from '../routes/ControllerView';
import TestView from '../routes/TestView';


export default function RouteView() {
  const path = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.path);
  const selectedGroup = decodeURIComponent(path.split("/")[0]);
  // const selectedId = decodeURIComponent(path.split("/").slice(-1)[0]);

  switch (selectedGroup){
    case NavRoutes.engines:
      return <EngineView/>
    case NavRoutes.settings:
      return <Configuration/>
    case NavRoutes.bundles:
      return <BundlesView/>
    case NavRoutes.controller:
      return <ControllerView/>
    case "testView":
      return <TestView/>;
    default:
  }
  return <Box sx={{flex: 'auto', display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default', color: 'white'}}><Typography>404</Typography></Box>
}