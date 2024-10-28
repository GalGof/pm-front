import { useCallback, Fragment, useState } from 'react';
import { useSelector } from 'react-redux'
import CardContent from '@mui/material/CardContent';
import Portal from '@mui/material/Portal';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';

import IconButton from '@mui/material/IconButton';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import AutoDeleteIcon from '@mui/icons-material/AutoDelete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

import './DeployedPackCard.css';
import { RemovePack, DockerRPC } from '../../common/Actions';
import { EditRawModalButton } from '../../modals/RawEditorModal';
import { ContainerProcessesModal } from '../../modals/ContainerProcessesModal';
import ContainerTcpInfoModal from '../../modals/ContainerTcpInfoModal';
import PackDumpsInfoModal from '../../modals/PackDumpsInfoModal';
import XTerminalModal from '../../modals/XTerminalModal';
import UpgradePackModal from './UpgradePackModal';
import { AdminLockBadge, CopyTextButton } from '../../common/Controls';
import { ModalConfirm, ModalInfo, ModalError, ShowModal, ModalText, CatchModalError } from '../../modals/ShowModal';
import { isOldMui } from '../../common/Config';

const Panel = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: "5px",
  margin: "5px",
  // textAlign: 'center',
  color: theme.palette.text.secondary,
  flexGrow: 1,
  border: "1px solid #465c5f",
}));

/** @param {{id: string, actionCallRefs: {[id:string]: (arg0: {action: string})=>void}}} arg1*/
export default function DeployedPackCard({id, actionCallRefs}) {
  console.log("DeployedPackCard", id);
  const item = useSelector((/** @type {ReduxStoreType}*/state) => state.deployedPacksInfo.entries[id]);
  const [activeRequestCount, setActiveRequestCount] = useState(0);
  const adminAccess = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.adminAccess);
  const packChangeInProgress = (item.deployInProgress || item.upgradeInProgress || item.markedForDelete);

  const incReq = ()=>setActiveRequestCount(function inc(v) {return v + 1})
  const decReq = ()=>setActiveRequestCount(function dec(v) {return v - 1})

  const onDelete = useCallback(()=>{
    ModalConfirm({
      content: `Delete (${item.id})?`,
      title: "Delete",
      onAction: ()=>{
        incReq();
        RemovePack({dockerId: item.dockerEngineId, packId: item.id})
          .catch((error)=>{ModalError({error, content: "Failed to remove"})})
          .finally(decReq);
      },
    })
  }, [item])

  const onUpgrade = ()=>{
    UpgradePackModal({item})
      .catch(CatchModalError)
  }

  const showInfo = ()=>{
    const initialBundleId = item.initialBundleId;
    const someBundleId = item.containersInfo.find(it=>!it.isSysPcid)?.bundleId;
    let rawDeploy = !item.containersInfo.find(it=>it.bundleId !== initialBundleId && !it.isSysPcid);
    let sameDeploy = !item.containersInfo.find(it=>it.bundleId !== someBundleId && !it.isSysPcid);
    /** @type {{[x:string]: string}} */
    let info = {};
    for (const [key, value] of Object.entries(item.buildInfo || {})) {
      info[key] = JSON.stringify(value, null, 2);
    }
    for (const it of item.containersInfo) {
      if (it.isSysPcid) continue;
      const itId = `${it.pcid}_${it.cloneId}`;
      info[itId] = "Bundle: " + it.bundleId + (info[itId] ? "\n" + info[itId] : "");
    }
    ModalInfo({
      content: <>
        <div className='flexRow'>
          {!rawDeploy && <Chip label="Upgraded" />}
          {!sameDeploy && <Chip label="Mixed bundle" />}
        </div>
        {Object.entries(info).map(([key, value])=>{
          return (<Fragment key={key}>
            <Typography variant='body2' display={"inline"}>{key}</Typography>
            <CopyTextButton text={value}/>
            <pre>{value}</pre>
          </Fragment>)})}
      </>,
      title: "Pack Info"
    })
  }

  const exportData = ()=>{
    incReq();
  }

  const dumpsInfo = ()=>{
    incReq();
    DockerRPC({dockerId: item.dockerEngineId, fname: "getDumpsInfo", args: [{packId: item.id}]})
      .then((data)=>{
        PackDumpsInfoModal({data, item});
      })
      .catch((error)=>{ModalError({error, content: "Failed to get dumps info"})})
      .finally(decReq)
  }

  /** @param {{id: string, tail?: number, since?: number}} param0 */
  const showLogs = ({id, tail = undefined, since = undefined})=>{
    incReq();
    DockerRPC({dockerId: item.dockerEngineId, fname: "getContainerLogs", args: [{id, tail, since}]})
      .then((data)=>{
        ModalText({content: data, title: "Container logs"});
      })
      .catch((error)=>{ModalError({error, content: "Failed to get logs"})})
      .finally(decReq)
  }

  /** @param {{id: string}} param */
  const inspect = ({id})=>{
    incReq();
    DockerRPC({dockerId: item.dockerEngineId, fname: "containerInspect", args: [{id}]})
      .then((data)=>{
        ModalText({content: JSON.stringify(data, null, 2), title: "Container.Inspect data"});
      })
      .catch((error)=>{ModalError({error, content: "Failed to get logs"})})
      .finally(decReq)
  }

  /** @param {{id: string, action: string, showErr?: boolean}} param */
  const changeContainerState = ({id, action, showErr = true})=>{
    incReq();
    DockerRPC({dockerId: item.dockerEngineId, fname: "changeContainerState", args: [{containerId: id, data: {action, updateState: true} }]})
      .catch((error)=>{showErr && ModalError({error, content: "Failed to change state"})})
      .finally(decReq)
  }

  /** @param {{action: string}} param */
  const changeAllContainersState = ({action})=>{
    for (const it of item.containersInfo) {
      changeContainerState({id: it.id, action, showErr: false})
    }
  }

  actionCallRefs[id] = changeAllContainersState;

  /** @param {{id: string, pcid: string}} param */
  const showProcesses = ({id, pcid})=>{
    incReq();
    DockerRPC({
      dockerId: item.dockerEngineId,
      fname: "_containerExec",
      args: [{containerId: id, includeStdOut: true, WorkingDir: "/", Cmd: ['ps', '-ef']}]
    })
      .then((data)=>{
        ContainerProcessesModal({
          data,
          containerId: id,
          dockerId: item.dockerEngineId,
          pcid,
        });
      })
      .catch((error)=>{ModalError({error, content: "Failed to get processes"})})
      .finally(decReq)
  }

  /** @param {{id: string}} param */
  const showTcpInfo = ({id})=>{
    incReq();
    DockerRPC({
        dockerId: item.dockerEngineId,
        fname: "_containerExec",
        args: [{containerId: id, includeStdOut: true, WorkingDir: "/", Cmd: ['cat', '/proc/net/tcp', '/proc/net/tcp6']}]
    })
      .then((data)=>{
        ContainerTcpInfoModal({data});
      })
      .catch((error)=>{ModalError({error, content: "Failed to get TCP info"})})
      .finally(decReq)
  }

  /** @param {{id: string}} param*/
  const showPerfLogs = ({id})=>{
    // incReq();
    // DockerRPC({dockerId: item.dockerEngineId, fname: "getContainerLogs", args: [{id, tail, since}]})
    //   .then((data)=>{
    //     ModalText({content: data, title: "Container logs"});
    //   })
    //   .catch((error)=>{ModalError({error, content: "Failed to get logs"})})
    //   .finally(decReq)
  }

  /** @param {{containerId: string, Cmd?: string[]}} param */
  const xterminal = ({containerId, Cmd})=>{
    let pcid = item.containersInfo.find(it=>it.id === containerId)?.pcid;
    XTerminalModal({
      containerId,
      dockerId: item.dockerEngineId,
      Cmd: Cmd,
      builderId: item.builderId,
      pcid,
    });
  }

  const disabledIfAuto = !adminAccess && !item.keepAlive;
  const runningCount = item.containersInfo.filter(it=>it.state === "running").length;
  const totalCount = item.containersInfo.length;
  const hasMyDumps = !!Object.values(item.lastDumpsInfo?.dumps || {}).find(it=>it.my.length);
  const hasOtherDumps = !!Object.values(item.lastDumpsInfo?.dumps || {}).find(it=>it.others.length);
  const dumpsConfigError = item.monitorDumps && item.lastDumpsInfo?.config.isOk === false;
  const dumpsColor = hasMyDumps ? "error" : hasOtherDumps ? "warning" : dumpsConfigError ? "error" : "info";

  const accordionProps = isOldMui ? {TransitionProps: {unmountOnExit: true}} : {slotProps: {transition: {unmountOnExit: true}}};

  return (
    <Card
      raised={item.upgradeInProgress || item.markedForDelete}
      className='DeployedPackCard'
      >
      <CardHeader
        action={<>
          {EditRawModalButton({id, dbName: "deployed", width: 800, rows: 25})}
        </>}
        title={<Typography variant='h6'>{!item.keepAlive && <AutoModeIcon color="info"/>} {item.id}</Typography> }
        subheader={<>
          <Typography variant='body2'>{item.builderId}</Typography>
          <Typography variant='body2'>{item.initialBundleId}</Typography> 
          <Typography variant='body2'>{new Date(item.createdTimestamp || 0).toISOString()}</Typography> 
          <Typography variant='body2'>{item.comment}</Typography>
          </>}
        sx={{padding: "8px 8px 0 8px"}}
      />
      <CardContent sx={{padding: "0 8px"}}>
        <div className='flexRow'>
          {!item.keepAlive && <Tooltip title="Delete on timeout ON"><AutoDeleteIcon css-title="Delete on timeout ON" color="info"/></Tooltip>}
          {item.monitorDumps && <Tooltip title="Dumps monitoring ON"><MonitorHeartIcon css-title="Dumps monitoring ON" color="info"/></Tooltip>}
          {item.markedForDelete && <Tooltip title="Marked for delete"><DeleteForeverIcon color="warning"/></Tooltip>}
          {item.upgradeInProgress && <Tooltip title="Upgrade in progress"><UpgradeIcon color="warning"/></Tooltip>}
          {item.deployInProgress && <Tooltip title="Deploy in progress"><MovieFilterIcon color="warning"/></Tooltip>}
          {item.corrupted && <Tooltip title="Corrupted"><BrokenImageIcon color="error"/></Tooltip>}
          {item.collectPerformanceData && <Tooltip title="Performance data collection ON"><QueryStatsIcon color="info"/></Tooltip>}
        </div>
        <div className='flexRow'>
          {item.ipList.map(it=>(<Fragment key={it}>
            <Typography variant='body2'>{it}<CopyTextButton text={it}/></Typography>
          </Fragment>))}
          <Typography variant='body2' color="orange">{!!activeRequestCount && "Requests: " + activeRequestCount}</Typography> 
        </div>
        <div className='flexRow'>
          <Button onClick={showInfo} color="info">Info</Button>
          <Button disabled={packChangeInProgress} onClick={exportData}>Export</Button>
          <Button disabled={packChangeInProgress || disabledIfAuto} onClick={onUpgrade}>Upgrade</Button>
          <Button disabled={packChangeInProgress} onClick={dumpsInfo} color={dumpsColor}>Dumps</Button>
          <span style={{flex: 1}}></span>
          <Button disabled={disabledIfAuto} onClick={onDelete}>Delete</Button>
        </div>
      </CardContent>
      {!packChangeInProgress && <><Divider className='mt'/>
        <Accordion disableGutters {...accordionProps}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant='body1'>Containers (running <span style={{color: runningCount !== totalCount ? "orange" : undefined }}>{runningCount}</span>/{totalCount})</Typography>
          </AccordionSummary>
          <AccordionDetails className='pad0'>
            <Panel className='flexRow'>
              <Button onClick={()=>changeAllContainersState({action: "start"})}>Start All</Button>
              <Button onClick={()=>changeAllContainersState({action: "restart"})}>Restart All</Button>
            </Panel>
            {item.containersInfo.map(it=>(<Panel key={it.pcid + it.cloneId + it.id} sx={{columnGap: "5px"}}>
              <Typography variant='body1'>{it.pcid}({it.cloneId}) <span  style={{color: it.state !== "running" ? "orange" : undefined}}>{it.state}</span>({it.status})</Typography> 
              <Typography variant='body1' color={it.bundleId !== item.initialBundleId ? "orange" : undefined}>{it.bundleId}</Typography> 
              {it.ip && <Typography variant='body2'>{it.ip}<CopyTextButton text={it.ip}/></Typography>}
              <div className='flexRow mb'>
                <Button className="actionType1" onClick={()=>showLogs({id: it.id, tail: 1000})}>Logs 1k</Button>
                <Button className="actionType1" onClick={()=>showLogs({id: it.id, since: Math.floor(+new Date()/1000-300) })}>Logs 5m</Button>
                <Button className="actionType1" onClick={()=>inspect({id: it.id})}>Inspect</Button>
                <Button className="actionType1" onClick={()=>showProcesses({id: it.id, pcid: it.pcid})}>Processes</Button>
                <Button className="actionType1" onClick={()=>showTcpInfo({id: it.id})}>Tcp info</Button>
                <Button className="actionType1" onClick={()=>showPerfLogs({id: it.id})}>Perf Info</Button>
              </div>
              <div className='flexRow'>
                <Button className="actionType3" onClick={()=>xterminal({containerId: it.id})}>Terminal</Button>
                <Button className="actionType2" onClick={()=>changeContainerState({id: it.id, action: "restart"})}>Restart</Button>
                <Button className="actionType2" onClick={()=>changeContainerState({id: it.id, action: "start"})}>Start</Button>
                <Button className="actionType2" onClick={()=>changeContainerState({id: it.id, action: "stop"})}>Stop</Button>
                <Button className="actionType2" onClick={()=>changeContainerState({id: it.id, action: "kill"})}>Kill</Button>
                <Button className="actionType2" onClick={()=>changeContainerState({id: it.id, action: "pause"})}>Pause</Button>
                <Button className="actionType2" onClick={()=>changeContainerState({id: it.id, action: "unpause"})}>Unpause</Button>
              </div>
              <div className='flexRow'>
              </div>
            </Panel>))}
          </AccordionDetails>
        </Accordion>
        </>}
    </Card>
  );
}