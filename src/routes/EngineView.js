import { useState, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Fade from '@mui/material/Fade';

import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EngineeringIcon from '@mui/icons-material/Engineering';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import './EngineView.css';
import ShowDeployModal from '../features/deployInfo/DeployModal';
import { EditRawModalButton } from '../modals/RawEditorModal';
import ShowDockerEngineModal from '../features/dockerEngineInfo/DockerEngineModal';
import DeployedPackCard from '../features/deployInfo/DeployedPackCard';
import RawContainerCard from '../cards/RawContainerCard';
import DeployQueueCard from '../features/deployInfo/DeployQueueCard';
import { DeployBundle, DockerRPC, RemovePack } from '../common/Actions';
import { CatchModalError } from '../modals/ShowModal';

function QueuePanel()
{
  const path = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.path);
  const selectedId = useMemo(()=>decodeURIComponent(path.split("/").slice(-1)[0]), [path]);
  const deployQueue = useSelector((/** @type {ReduxStoreType}*/state) => state.deployQueue.entries);
  const filteredEngines = useSelector((/** @type {ReduxStoreType}*/state) => state.filteredEngines);

  const controllerQueueItems = useMemo(()=>Object.values(deployQueue).filter(it=>(
    selectedId === "All" 
      ? (filteredEngines.ids.length === 0 || it.request.dockerEngineFilters?.find(label=>filteredEngines.ids.includes(label)))
      : it.request.dockerEngineFilters?.includes(selectedId))
  ), [selectedId, deployQueue, filteredEngines]);

  return (
    <Box className='QueuePanel'>
      <Grid container spacing={0}>
        {controllerQueueItems.map(it=>(
          <Grid display={"flex"} alignItems={"start"} key={it.id} item={true}>
            <DeployQueueCard id={it.id}/>
          </Grid>))}
      </Grid>
    </Box>
  )
}

export default function EngineView() {
  console.log("EngineView")
  const path = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.path);
  const adminAccess = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.adminAccess);
  const dockerEnginesIds = useSelector((/** @type {ReduxStoreType}*/state) => state.dockerEnginesInfo.ids);
  const deployedInfoIds = useSelector((/** @type {ReduxStoreType}*/state) => state.deployedPacksInfo.ids);
  const deployedInfoEngineIds = useSelector((/** @type {ReduxStoreType}*/state) => state.deployedPacksInfo.engineIds);
  const filteredEngines = useSelector((/** @type {ReduxStoreType}*/state) => state.filteredEngines);
  const [tabIdx, setTabIdx] = useState(0);
  const [appbarMore, setAppbarMore] = useState(false);
  /** @ts-ignore @type {ReactState<HTMLButtonElement|null>} */
  const [manuAnchorEl, setMenuAnchorEl] = useState(null);
  /** @type {ReactState<Dockerode.ContainerInfo[]|undefined>} */
  const [containersList, setContainersList] = useState();
  const [listTimestamp, setListTimestamp] = useState("never");
  const [listReqiestInProgress, setListReqiestInProgress] = useState(false);

  const selectedId = useMemo(()=>decodeURIComponent(path.split("/").slice(-1)[0]), [path]);
  /** @type {{[id:string]: (arg0: {action: string})=>void}} */
  const actionCallRefs = useMemo(()=>({}), []);

  const { activeDockerId, activeItems, queueItems, error } = useMemo(()=>{
    /** @type {string|undefined} */
    let activeDockerId = undefined;
    /** @type {string[]} */
    let filteredInfo = [];
    if (selectedId !== "All") {
      activeDockerId = dockerEnginesIds.find(it=>it === selectedId);
      if (!activeDockerId) return {error: "404: engine not found"};
      filteredInfo = deployedInfoEngineIds[selectedId] || [];
    } else if (filteredEngines.ids.length === 0) {
      filteredInfo = deployedInfoIds;
    } else {
      /** @type {string[]} */
      let typedDef = [];
      filteredInfo = filteredEngines.ids.reduce((prev, curr)=>prev.concat(deployedInfoEngineIds[curr] || []), typedDef);
    }
    return {activeDockerId, activeItems: filteredInfo, queueItems: [], error: false};
  }, [deployedInfoEngineIds, deployedInfoIds, dockerEnginesIds, selectedId, filteredEngines])
  if (error) return error;
  if (activeItems === undefined || queueItems === undefined) return "should not happen, for typing below";
  if (tabIdx && !activeDockerId) {
    setTabIdx(0);
    return "";
  }

  const drawMainTab = ()=><>
    <Box sx={{ padding: '10px', overflow: 'auto', flex: "1" }} >
      <Grid container spacing={0} >
        {activeItems.map(id=>(
          <Grid display={"flex"} alignItems={"start"} key={id} item={true}>
            <DeployedPackCard id={id} actionCallRefs={actionCallRefs}/>
          </Grid>))}
      </Grid>
    </Box>
    <QueuePanel/>
  </>

  const spammer = ()=>{
    let promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(DeployBundle({
        bundleId: "TestStuff_1",
        dockerEngineFilters: ["someEngine3"],
        keepAlive: true,
        bindHostTZ: false,
      }).then((data)=>RemovePack({dockerId: "someEngine3", packId: data.id})).catch(error=>{
        console.error(error);
      }));
    }
    Promise.all(promises).then(spammer)
  }

  const cleanup = ()=>{
    DockerRPC({dockerId: selectedId, fname: "_removeCorruptedContainers"})
  }

  /** @param {{action: string}} param */
  const callAllContainers = ({action})=>{
    for (const it of activeItems) {
      actionCallRefs[it]?.({action});
    }
  }

  const setCorePattern = ()=>{
    if (!activeDockerId) throw new Error("Unexpected state");
    DockerRPC({
      dockerId: activeDockerId,
      fname: "execEngineHost",
      args: [{cmd: ['sysctl', 'kernel.core_pattern=/tmp/cores/core.%e.%p.%h.%t'], privileged: true}]
    })
      .catch(function(){});
  }

  const getContainersList = ()=>{
    if (!activeDockerId) throw new Error("Unexpected state");
    setListReqiestInProgress(true)
    DockerRPC({
      dockerId: activeDockerId,
      fname: "listContainers",
    })
      .then(data=>{
        setContainersList(data)
        setListTimestamp(new Date().toISOString())
      })
      .catch(CatchModalError)
      .finally(()=>setListReqiestInProgress(false))
  }

  const drawRawDockerTab = ()=>{
    return activeDockerId ? <>
      <div className='rawDockerTab'>
        <Typography>Last refresh:{listTimestamp}</Typography>
        {containersList && containersList.map(it=>
          <RawContainerCard key={it.Id} item={it} dockerId={activeDockerId}/>)}
      </div>
    </> : <Typography>Select Engine</Typography>}

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };
  const onSelectedTab = (/**@type {number}*/tabIdx)=>{
    setTabIdx(tabIdx);
    closeMenu();
  }
  const menuOpen = !!manuAnchorEl;

  const tabNames = ["Deployed Packs"];
  if (activeDockerId) tabNames.push("Raw docker");

  return (
    <div className='EngineView'>
      <AppBar position='relative'>
        <Toolbar>
          <Button className='info2' onClick={(e)=>setMenuAnchorEl(e.currentTarget)}>
            {tabNames[tabIdx]}<KeyboardArrowDownIcon />
          </Button>
          <Menu
            anchorEl={manuAnchorEl}
            open={menuOpen}
            onClose={closeMenu}
            TransitionComponent={Fade}
          >
            {tabNames.map((it, idx)=>
              <MenuItem key={it+idx} onClick={()=>onSelectedTab(idx)}>{it}</MenuItem>)}
          </Menu>
          <Paper sx={{backgroundColor: '#1A2027', padding: "5px", display: "flex"}}>
            <Typography sx={{alignContent: "center", marginLeft: "3px"}} color={(theme)=>theme.palette.text.secondary}>{selectedId}</Typography>
            {activeDockerId && EditRawModalButton({id: activeDockerId, dbName: "dockerEngines", width: 400, rows: 25 })}
            {adminAccess && activeDockerId && <>
                <IconButton className='cardActionButton' onClick={()=>ShowDockerEngineModal({id: activeDockerId})}><EditIcon /></IconButton>
                <Button onClick={setCorePattern}><EngineeringIcon/>Set core_pattern</Button>
              </>}
          </Paper>
          {tabIdx === 0 && <>
            <Button onClick={()=>ShowDeployModal({fixedEngineId: activeDockerId})} sx={{marginLeft: "5px"}} color="success"><AddIcon/>Deploy</Button>
            <Button onClick={()=>callAllContainers({action: "start"})}><PlayCircleOutlineIcon />Start All</Button>
            {appbarMore && <>
              <Button onClick={()=>callAllContainers({action: "restart"})}><RefreshOutlinedIcon />Restart All</Button>
              <Button onClick={spammer}><AddIcon />Debug Spam</Button>
              <Button onClick={cleanup}><AddIcon />Debug cleanup</Button>
            </>}
          </>}
          {tabIdx === 1 && <>
            <Button disabled={listReqiestInProgress} onClick={getContainersList}><RefreshOutlinedIcon />Refresh containers list</Button>
          </>}
          <Button className='info2' onClick={()=>setAppbarMore((value)=>!value)}>{appbarMore ? "<<<" : ">>>"}</Button>
        </Toolbar>
      </AppBar>
      <div id="tabs">
        {   tabIdx === 0 ? drawMainTab()
          : tabIdx === 1 ? drawRawDockerTab()
          : ""}
      </div>
    </div>
  );
}