import { useContext, useState } from 'react';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import './RawContainerCard.css';
import { DockerRPC } from '../common/Actions';
import { ContainerProcessesModal } from '../modals/ContainerProcessesModal';
import ContainerTcpInfoModal from '../modals/ContainerTcpInfoModal';
import XTerminalModal from '../modals/XTerminalModal';
import { CopyTextButton } from '../common/Controls';
import { ModalError, ModalText } from '../modals/ShowModal';
import { isOldMui } from '../common/Config';

/** @param {{item: Dockerode.ContainerInfo, dockerId: string}} arg1*/
export default function RawContainerCard({item, dockerId}) {
  const containerId = item.Id;
  const [activeRequestCount, setActiveRequestCount] = useState(0);

  const incReq = ()=>setActiveRequestCount(function inc(v) {return v + 1})
  const decReq = ()=>setActiveRequestCount(function dec(v) {return v - 1})

  const inspect = ()=>{
    incReq();
    DockerRPC({dockerId, fname: "containerInspect", args: [{id: containerId}]})
      .then((data)=>{
        ModalText({content: JSON.stringify(data, null, 2), title: "Container.Inspect data"});
      })
      .catch((error)=>{ModalError({error, content: "Failed to get logs"})})
      .finally(decReq)
  }

  const showInfo = ()=>{
    ModalText({content: JSON.stringify(item, null, 2), title: "List info"});
  }

  /** @param {{tail?: number, since?: number}} param0 */
  const showLogs = ({tail = undefined, since = undefined})=>{
    incReq();
    DockerRPC({dockerId, fname: "getContainerLogs", args: [{id: containerId, tail, since}]})
      .then((data)=>{
        ModalText({content: data, title: "Container logs"});
      })
      .catch((error)=>{ModalError({error, content: "Failed to get logs"})})
      .finally(decReq)
  }
  
  /** @param {{action: string, showErr?: boolean}} param */
  const changeContainerState = ({action, showErr = true})=>{
    incReq();
    DockerRPC({dockerId, fname: "changeContainerState", args: [{containerId, data: {action, updateState: true} }]})
      .catch((error)=>{showErr && ModalError({error, content: "Failed to change state"})})
      .finally(decReq)
  }

  const showProcesses = ()=>{
    incReq();
    DockerRPC({
      dockerId,
      fname: "_containerExec",
      args: [{containerId, includeStdOut: true, WorkingDir: "/", Cmd: ['ps', '-ef']}]
    })
      .then((data)=>{
        ContainerProcessesModal({
          data,
          containerId,
          dockerId,
        });
      })
      .catch((error)=>{ModalError({error, content: "Failed to get processes"})})
      .finally(decReq)
  }

  const showTcpInfo = ()=>{
    incReq();
    DockerRPC({
        dockerId,
        fname: "_containerExec",
        args: [{containerId, includeStdOut: true, WorkingDir: "/", Cmd: ['cat', '/proc/net/tcp', '/proc/net/tcp6']}]
    })
      .then((data)=>{
        ContainerTcpInfoModal({data});
      })
      .catch((error)=>{ModalError({error, content: "Failed to get TCP info"})})
      .finally(decReq)
  }

  /** @param {{Cmd: string[]}} param */
  const xterminal = ({Cmd})=>{
    XTerminalModal({
      containerId,
      dockerId,
      Cmd,
    });
  }

  const accordionProps = isOldMui ? {TransitionProps: {unmountOnExit: true}} : {slotProps: {transition: {unmountOnExit: true}}};

  return (
    <Accordion className='RawContainerCard' disableGutters {...accordionProps}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <div className='flexCol'>
          <div className='flexRow'>
            <Typography variant='body2' color="orange">{!!activeRequestCount && "Requests: " + activeRequestCount}</Typography> 
            <Tooltip title={item.Names[0]}>
              <Typography variant='body1'>Name: {item.Names[0].slice(0, 64)}</Typography>
            </Tooltip>
            <CopyTextButton text={item.Names[0]}/>
          </div>
          <Typography variant='body2' color={"text.secondary"}>Image: {item.Image}<CopyTextButton text={item.Image}/></Typography>
          <Typography variant='body2' color={"text.secondary"}>Id: {item.Id}<CopyTextButton text={item.Id}/></Typography>
          <Typography variant='body2' color={"text.primary"}><span className={item.State !== "running" ? "notRunning" : undefined}>{item.State}</span> ({item.Status})</Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant='body2' color={"text.secondary"}>Created: {new Date((+item.Created)*1000).toISOString()}</Typography> 
        <Typography variant='body2' color={"text.secondary"}>Command: {item.Command}</Typography> 
        <div className='flexRow mb'>
          <Button onClick={()=>xterminal({Cmd: ["/bin/bash"]})} color="success">bash</Button>
          <Button onClick={()=>xterminal({Cmd: ["/bin/sh"]})} color="success">sh</Button>

          <Button onClick={showInfo} color="info">Info</Button>
          <Button onClick={()=>showLogs({tail: 1000})} color="info">Logs 1k</Button>
          <Button onClick={()=>showLogs({since: Math.floor(+new Date()/1000-300) })} color="info">Logs 5m</Button>
          <Button onClick={()=>inspect()} color="info">Inspect</Button>
          <Button onClick={()=>showProcesses()} color="info">Processes</Button>
          <Button onClick={()=>showTcpInfo()} color="info">Tcp info</Button>

          <Button onClick={()=>changeContainerState({action: "restart"})}>Restart</Button>
          <Button onClick={()=>changeContainerState({action: "start"})}>Start</Button>
          <Button onClick={()=>changeContainerState({action: "stop"})}>Stop</Button>
          <Button onClick={()=>changeContainerState({action: "kill"})}>Kill</Button>
          <Button onClick={()=>changeContainerState({action: "pause"})}>Pause</Button>
          <Button onClick={()=>changeContainerState({action: "unpause"})}>Unpause</Button>
        </div>
      </AccordionDetails>
    </Accordion>
  );
}