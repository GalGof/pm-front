import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import './Configuration.css';
import { NavRoutes } from '../../common/Config';
import { AdminLockBadge } from '../../common/Controls';
import * as globalsActions from '../../redux/globals';

import {
  GeneralSettingsTab,
  DockerRegistryTab,
  DockerEnginesTab,
  BundleBuildersTab,
  SharedResourcesTab,
} from "./tabs";

const tabs = [
  {Component: GeneralSettingsTab, name: "General Settings", adminLock: false},
  {Component: DockerRegistryTab, name: "Registries", adminLock: true},
  {Component: DockerEnginesTab, name: "Engines", adminLock: true},
  {Component: BundleBuildersTab, name: "Builders", adminLock: true},
  {Component: SharedResourcesTab, name: "Shared Resources", adminLock: true},
]

export default function Configuration() {
  const dispatch = useDispatch();
  const path = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.path);
  const adminAccess = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.adminAccess);
  const pathSelectedId = path.split("/").slice(-1)[0];
  const [tabIdx, setTabIdx] = useState( Math.min(Number.isNaN(+pathSelectedId) ? 0 : +pathSelectedId, tabs.length - 1));
  
  if (pathSelectedId !== String(tabIdx)) {
    setTimeout(()=>dispatch(globalsActions.setPath(NavRoutes.settings + "/" + tabIdx)), 0);
  }

  const activeTab = tabs[tabIdx];

  return (
    <Box className='Configuration noSelect' sx={{flex: 'auto', display: 'flex', flexDirection: 'column', height: '100vh'}}>
      <AppBar position='relative'>
        <Toolbar>
          <Tabs variant="scrollable" value={tabIdx} onChange={(e, value)=>setTabIdx(value)} scrollButtons="auto">
            {tabs.map(it=>(
              <Tab key={it.name}
                {...(it.adminLock 
                  ? {disabled: !adminAccess, label: AdminLockBadge(adminAccess, it.name)}
                  : {label: it.name})}
                />))}
          </Tabs>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', padding: '10px', overflow: 'auto' }} className='col-parent' >
        {(!activeTab.adminLock || adminAccess) && <activeTab.Component />}
      </Box>
    </Box>
  );
}