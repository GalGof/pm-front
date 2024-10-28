import { useState } from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';

import './ControllerView.css';
import { ControllerRPC, Restart } from '../common/Actions';
import DeployQueueCard from '../features/deployInfo/DeployQueueCard';
import BuildBundleQueueCard from '../features/bundleInfo/BuildBundleQueueCard';

//@ts-ignore
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

export default function ControllerView() {
  const deployQueue = useSelector((/** @type {ReduxStoreType}*/state) => state.deployQueue.ids);
  const buildBundleQueue = useSelector((/** @type {ReduxStoreType}*/state) => state.buildBundleQueue.ids);
  const adminAccess = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.adminAccess);
  const [tabIdx, _setTabIdx] = useState(0);

  //@ts-ignore
  const setTabIdx = (event, newValue) => {
    _setTabIdx(newValue);
  };

  const restart = ()=>{
    if (window.confirm("Restart?")) {
      Restart();
    }
  }

  return (!adminAccess ? "" :
  <Box sx={{flex: 'auto', display: 'flex', flexDirection: 'column', height: '100vh'}}>
    <AppBar position='relative'>
      <Toolbar>
        <Tabs value={tabIdx} onChange={setTabIdx} aria-label="basic tabs example">
          <Tab label={`Deploy Queue(${deployQueue.length})`} />
          <Tab label={`Build Queue(${buildBundleQueue.length})`} />
          {/* <Tab label="Docker Engines" /> */}
        </Tabs>
        <div className='flexRow'>
          <Button onClick={()=>restart()}>Restart</Button>
        </div>
      </Toolbar>
    </AppBar>
    <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', padding: '10px', overflow: 'auto' }} className='col-parent' >
      <CustomTabPanel value={tabIdx} index={0}>
        <div className='flexRow'>
          <Button onClick={()=>ControllerRPC({fname: "deployQueueTick"}).catch(function(){})}>Tick</Button>
        </div>
        <Grid container spacing={0} >
          {deployQueue.map(id=>(
            <Grid display={"flex"} alignItems={"start"} key={id} item={true}>
              <DeployQueueCard id={id} />
            </Grid>))}
        </Grid>
      </CustomTabPanel>
      <CustomTabPanel value={tabIdx} index={1}>
        <Grid container spacing={0} >
          {buildBundleQueue.map(id=>(
            <Grid display={"flex"} alignItems={"start"} key={id} item={true}>
              <BuildBundleQueueCard id={id} />
            </Grid>))}
        </Grid>
      </CustomTabPanel>
    </Box>
  </Box>
  );
}
