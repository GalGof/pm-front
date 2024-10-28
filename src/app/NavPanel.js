import { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import CableIcon from '@mui/icons-material/Cable';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import CastleIcon from '@mui/icons-material/Castle';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import SavingsIcon from '@mui/icons-material/Savings';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import CommentIcon from '@mui/icons-material/Comment';
import CommentsDisabledIcon from '@mui/icons-material/CommentsDisabled';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import EngineeringIcon from '@mui/icons-material/Engineering';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import SensorsIcon from '@mui/icons-material/Sensors';
import SensorsOffIcon from '@mui/icons-material/SensorsOff';
import FactoryIcon from '@mui/icons-material/Factory';

import './NavPanel.css';
import { NavRoutes } from '../common/Config';
import { StyledBadge } from '../common/Controls';
import * as filteredEnginesStore from '../redux/filteredEngines';
import * as serviceLoggerActions from '../redux/serviceLogger';
import * as globalsActions from '../redux/globals';
import { engineFeatureIcon } from '../features/dockerEngineInfo/icons';

const filterModalStyle = {
  position: 'absolute',
  top: '200px',
  left: '200px',
  width: 200,
  bgcolor: 'background.paper',
  border: '3px solid #333',
  boxShadow: 24,
  p: 4,
};

/**
 * @param {object} param
 * @param {string} param.id
 * @param {string} param.selectedId
 * @param {(id: string, group: string)=>void} param.SelectListItem
 * @returns 
 */
function EngineNavItem({id, selectedId, SelectListItem})
{
  const mainControllerTelemetry = useSelector((/** @type {ReduxStoreType}*/state) => state.telemetryInfo.data);
  const engineFeatureLabels = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.engineFeatureLabels);
  const item = useSelector((/** @type {ReduxStoreType}*/state) => state.dockerEnginesInfo.entries[id]);

  let icons = useMemo(()=>{
    const icons = [];
    if (item.labels.includes(engineFeatureLabels.builder)) {
      icons.push(<Tooltip key="builder" title="builder"><engineFeatureIcon.builder /></Tooltip>);
    } 
    if (engineFeatureLabels.automation.find(it=>item.labels.includes(it))) {
      icons.push(<Tooltip key="automation" title="automation"><engineFeatureIcon.autotests /></Tooltip>);
    }
    if (icons.length === 0) {
      icons.push(<Tooltip key="manual" title="manual"><engineFeatureIcon.manual /></Tooltip>);
    }
    return icons
  }, [item, engineFeatureLabels]);


  return <ListItem key={id} disablePadding sx={{ pl: 1 }}>
  <ListItemButton selected={id === selectedId} onClick={()=>SelectListItem(id, NavRoutes.engines)} dense >
    <ListItemIcon children={icons}/>
    <ListItemText primary={id} />
    {item.disabled && <NotInterestedIcon/>}
    {mainControllerTelemetry?.engines?.[id]?.pong ? <SensorsIcon/> : <SensorsOffIcon color="error"/>}
  </ListItemButton>
  </ListItem>
}

/**
 * @param {object} param
 * @param {boolean} param.connected
 * @param {any} param.ConnectionIconClass
 * @param {number} [param.width]
 * @returns 
 */
export default function NavPanel({
    connected,
    ConnectionIconClass = CableIcon,
    width = 240,
  }) {
  console.log("NavPanel")
  const dispatch = useDispatch();
  const showLog = useSelector((/** @type {ReduxStoreType}*/state) => state.serviceLogger.enabled);
  const setShowLog = (/**@type {boolean}*/value)=>{
    dispatch(value ? serviceLoggerActions.enableLog() : serviceLoggerActions.disableLog())
  }
  const filteredEngines = useSelector((/** @type {ReduxStoreType}*/state) => state.filteredEngines.ids);
  const dockerEnginesIds = useSelector((/** @type {ReduxStoreType}*/state) => state.dockerEnginesInfo.ids);
  const [usertag, _setUsertag] = useState(localStorage.getItem("userTag") || "Nemo");
  const setUsertag = (/** @type {string}*/value)=>{
    value = value.slice(0, 10);
    localStorage.setItem("userTag", value);
    _setUsertag(value);
  }
  const [filterOpened, setFilterOpened] = useState(false);
  const path = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.path);
  const adminAccess = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.adminAccess);

  const filteredList = dockerEnginesIds.filter(it=>filteredEngines.length === 0 || filteredEngines.includes(it));

  const SelectListItem = (/** @type {string}*/item, /** @type {string=}*/group) => {
    let itemPath = (group ? group + "/" : "" ) + encodeURIComponent(item);
    dispatch(globalsActions.setPath(itemPath))
  }

  const selectedGroup = decodeURIComponent(path.split("/")[0]);
  const selectedId = decodeURIComponent(path.split("/").slice(-1)[0]);
  const toggleFilter = (/** @type {string}*/id)=>{
    if (filteredEngines.includes(id)) {
      dispatch(filteredEnginesStore.removeItem(id));
      // setFilteredEngines(filteredEngines.filter(it=>it !== id));
    } else {
      let item = dockerEnginesIds.find(it=>it === id);
      if (!item) throw new Error("unexpected");
      dispatch(filteredEnginesStore.addItem(item));
      // setFilteredEngines(filteredEngines.concat([id]));
    }
  }
  const shownCount = filteredEngines.length === 0 ? dockerEnginesIds.length : filteredEngines.length;
  const filtered = shownCount === dockerEnginesIds.length;
  const toggleAll = ()=>{
    if (filteredEngines.length > 0) {
      // setFilteredEngines([]);
      dispatch(filteredEnginesStore.setItems([]));
    } else {
      dispatch(filteredEnginesStore.setItems(dockerEnginesIds));
      // setFilteredEngines(dockerEngines.map(it=>it.id));
    }
  }

  const filterModal = (<Modal
    open={filterOpened}
    onClose={()=>setFilterOpened(false)}
    >
    <Box sx={filterModalStyle}>
      <Typography id="modal-modal-title" variant="h6" component="h2">Filter engines</Typography>
      <Divider />
      <List sx={{ width: '100%', maxHeight: "calc(100vh - 500px)", overflow: "auto", bgcolor: 'background.paper' }}>
      {dockerEnginesIds.map((id) => {
        return (
          <ListItem key={id} disablePadding >
            <ListItemButton role={undefined} onClick={()=>toggleFilter(id)} dense >
                <Checkbox checked={filteredEngines.indexOf(id) !== -1} />
              <ListItemText primary={id} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
    <Divider />
    <Button 
      variant="contained"
      size="small"
      // startIcon={<SaveIcon />}
      onClick={toggleAll}
      >Toggle All</Button>
    <Button 
      variant="contained"
      size="small"
      startIcon={<CloseIcon />}
      onClick={()=>setFilterOpened(false)}
      sx={{float: "right"}}
      >Close</Button>
    </Box>
  </Modal>)

  const staticItems = [
    {name: NavRoutes.bundles, icon: <SavingsIcon/>},
    {name: NavRoutes.settings, icon: <SettingsIcon/>},
    {name: NavRoutes.controller, icon: <EngineeringIcon/>, disabled: !adminAccess, postIcon: !adminAccess ? <LockPersonIcon/> : ""},
  ];

  const connectionTooltip = connected ? "Server connected" : "No connection to server";

  return (
    <Drawer
      className='NavPanel'
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Toolbar variant="dense" sx={{alignSelf: 'center', padding: 0}}>
        <StyledBadge className='AcccessBadge' badgeContent={<Tooltip title="Extended Access"><AdminPanelSettingsIcon fontSize="small" sx={{color: 'green'}}/></Tooltip>} >
          <Tooltip title={connectionTooltip}><ConnectionIconClass fontSize="large" sx={{ color: connected ? '#622f0e' : 'gray' }}/></Tooltip>
        </StyledBadge>
        <TextField
            onChange={(e)=>setUsertag(e.target.value)}
            value={usertag}
            label='User Tag'
            sx={{margin: "8px!important", width: "150px"}}
          />
      </Toolbar>
      <Divider />
      {staticItems.map(it=>(<ListItem key={it.name} disablePadding sx={{ pl: 0}}>
          <ListItemButton disabled={it.disabled} selected={it.name === selectedId || it.name === selectedGroup} onClick={()=>SelectListItem(it.name)}>
            <ListItemIcon>{it.icon}</ListItemIcon>
            <ListItemText primary={it.name} />
            {it.postIcon && <ListItemIcon>{it.postIcon}</ListItemIcon>}
          </ListItemButton>
          </ListItem>))}
      <ListItem disablePadding>
        <ListItemButton onClick={(e)=>{setFilterOpened(true);}} >
        <ListItemIcon><CastleIcon/></ListItemIcon>
        <ListItemText primary={<>Engines {shownCount}/{dockerEnginesIds.length}</>} />
        {filtered ? <FilterAltIcon/> : <FilterAltOutlined/>}
        </ListItemButton>
        {filterModal}
      </ListItem>
      <List sx={{overflow: 'auto', flex: 1}}>
        <ListItem disablePadding sx={{ pl: 1 }}>
          <ListItemButton selected={"All" === selectedId} onClick={()=>SelectListItem("All", NavRoutes.engines)} dense >
            <ListItemIcon><FactoryIcon/></ListItemIcon>
            <ListItemText primary={"All"} />
          </ListItemButton>
        </ListItem>
        {filteredList.map(it=>(<EngineNavItem id={it} SelectListItem={SelectListItem} selectedId={selectedId} key={it}/>))}
      </List>
      <ListItem disablePadding >
        <ListItemButton onClick={()=>setShowLog(!showLog)} >
        <ListItemIcon><AllInboxIcon/></ListItemIcon>
        <ListItemText primary="Toggle Log" />
        {showLog ? <CommentIcon/> : <CommentsDisabledIcon/>}
        </ListItemButton>
      </ListItem>
    </Drawer>
  );
}
  