import { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { DockerRPC } from '../common/Actions';
import { ModalInfo, ModalText, ModalError, CatchModalError } from '../modals/ShowModal';
import "./ContainerTcpInfoModal.css";
import { CopyTextButton } from '../common/Controls';
import { Filter, Preview } from '@mui/icons-material';
import { parsePsOutput } from './ContainerProcessesModal';

/** 
 * @param {object} param
 * @param {PackDumpsInfo} param.data
 * @param {DeployedInfo} param.item
 * */
export default function PackDumpsInfoModal({data, item}) {
  let missingAppPath = [];
  /** @type {{[pcid: string]: string|undefined}} */
  const pcidBinPath = {};
  for (const it of item.containersInfo) {
    if (it.isSysPcid) continue;
    if (!it.appBinPath) missingAppPath.push(it.pcid);
    pcidBinPath[it.pcid] = it.appBinPath;
  }
  
  
  function DynamicControl() {
    const [gdbInProgress, setGdbInProgress] = useState(false);
    const [intInProgress, setIntInProgress] = useState(false);

    /** @param {{cmd: string[], containerId: string}} param */
    const gdbCmd = ({cmd, containerId})=>{
      setGdbInProgress(true);
      DockerRPC({
        dockerId: item.dockerEngineId,
        fname: "_containerExec",
        args: [{containerId, includeStdOut: true, WorkingDir: "/", Cmd: cmd}]
      }).then((text)=>{
        ModalInfo({
          content: <><CopyTextButton text={text}/><pre>{text}</pre></>,
          title: "gdb output"
        })
      }).catch(CatchModalError)
        .finally(()=>setGdbInProgress(false))
    }
    
    /** @typedef {{filename: string, binPath: string, containerId: string}} callParams */
    /** @param {callParams} param */
    const showBt = ({filename, binPath, containerId})=>{
      let cmd = ['gdb', '--batch', '-ex', 'bt', binPath, `/tmp/cores/${filename}`];
      gdbCmd({cmd, containerId});
    }
  
    /** @param {callParams} param */
    const showThreads = ({filename, binPath, containerId})=>{
      let cmd = ['gdb', '--batch', '-ex', 'thread apply all bt', binPath, `/tmp/cores/${filename}`];
      gdbCmd({cmd, containerId});
    }
  
    /** @param {{filename: string, containerId: string}} param */
    const sigIntGdb = ({filename, containerId})=>{
      setIntInProgress(true);
      // on some dumps gdb may hang untill sigint received?
      // happens even with manual call in terminal..
      DockerRPC({
        dockerId: item.dockerEngineId,
        fname: "_containerExec",
        args: [{containerId, includeStdOut: true, WorkingDir: "/", Cmd: ['ps', '-ef']}]
      })
        .then((data)=>parsePsOutput(data))
        .then(psInfo=>{
          if (!psInfo) return;
          const pidIdx = psInfo.titles.findIndex(q=>q === "PID");
          const cmdIdx = psInfo.titles.findIndex(q=>q === "CMD" || q === "COMMAND");
          if (pidIdx < 0 || cmdIdx < 0) throw new Error("Failed to process ps output");
          const gdbIdx = psInfo.processes.findIndex(q=>q[cmdIdx].match(filename));
          if (gdbIdx < 0) throw new Error("Failed to find gdb pid");
          return DockerRPC({
            dockerId: item.dockerEngineId,
            fname: "_containerExec",
            args: [{
              containerId,
              includeStdOut: true,
              WorkingDir: "/",
              Cmd: ['kill', '-s', 'SIGINT', psInfo.processes[gdbIdx][pidIdx]]
            }]
          })
        })
        .catch(CatchModalError)
        .finally(()=>setIntInProgress(false))
    }

    /** @param {{pcid: string, containerId?: string, filenames: string[], group: string}} param */
    function drawDumps({pcid, containerId, filenames, group})
    {
      const binPath = item.containersInfo.find(it=>it.pcid === pcid)?.appBinPath;
      const prepared = filenames.map(name=>{
        let date = /core\.[^\.]+\.\d+\.[^\.]+\.([^\.]+)/.exec(name);
        if (date) {
          let timestamp = new Date(+date[1] * 1000);
          return {order: +timestamp, date: timestamp.toISOString(), name}
        }
        return {order: Number.MAX_SAFE_INTEGER, date: "unknown", name}
      }).sort((q, w)=>w.order - q.order)
      return <>
        <Typography>{group}</Typography>
        {prepared.map(it=><Box sx={{display: "flex", gap: "1px"}}>
          {it.date} {it.name}
          {containerId && binPath && <>
            <Button onClick={()=>showBt({binPath, containerId, filename: it.name})}>bt</Button>
            <Button onClick={()=>showThreads({binPath, containerId, filename: it.name})}>threads</Button>
            <Button onClick={()=>sigIntGdb({containerId, filename: it.name})}>sigint gdb</Button>
          </>}
        </Box>)}
      </>
    }

    /** @param {{pcid: string, value: {[x in ("my"|"manual"|"others")]: string[]}}} param */
    function drawPcid({pcid, value})
    {
      const containerId = item.containersInfo.find(it=>it.pcid === pcid)?.id;
      const filteredData = Object.entries(value).filter(it=>it[1].length);
      if (!filteredData.length) return "";
      return <>
        <Typography>{pcid} dumps:</Typography>
        {containerId && <Button onClick={()=>sigIntGdb({containerId, filename: "gdb"})}>send SININT to gdb</Button>}
        {filteredData.map(([group, filenames])=>drawDumps({pcid, group, filenames, containerId}))}
      </>
    }
    
    return <>
      {Object.entries(data.dumps).map(([pcid, value])=>drawPcid({pcid, value}))}
      {/* <Button disabled={intInProgress} onClick={()=>sigIntGdb({filename: "gdb", containerId: })} >SIGINT first GDB</Button> */}
    </>
  }

  ModalInfo({content: <>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant='h6'>Parsed data</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{padding: 0, overflow: "auto", maxHeight: "calc(80vh - 200px)"}}>
            {!data.config.isOk && <Typography variant='body2' color="orange">Unexpected dumps config: {data.config.current}</Typography>}
            <DynamicControl/>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant='h6'>Raw data</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{padding: 0, overflow: "auto", maxHeight: "calc(80vh - 200px)"}}>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </AccordionDetails>
        </Accordion>
  </>, title: "Dumps Info"});

  if (item.monitorDumps && !data.config.isOk) {
    const tempConfigCommand = "sysctl kernel.core_pattern=" + data.config.expected;
    const permanentConfig = "kernel.core_pattern=" + data.config.expected;
    const configPath = "/etc/sysctl.conf";
    ModalError({content: <>
        <Typography variant='body2'>Current config</Typography>
        <pre>{data.config.current}</pre>
        <Typography variant='body2'>
          Expected config<br/>
          {data.config.expected}<CopyTextButton text={data.config.expected}/>
        </Typography>

        <Typography variant='body2' sx={{ padding: "5px 0" }}>
          To set config until host reboot:<br/>
          {tempConfigCommand}<CopyTextButton text={tempConfigCommand}/><br/>
        </Typography>
          {/* * Require? container restart: Docker read config once on container start.</Typography> */}
        <Typography variant='body2' sx={{ whiteSpace: "pre-wrap" }}>
          For config after host reboot edit {configPath}<CopyTextButton text={configPath}/> add<br/>
          {permanentConfig}<CopyTextButton text={permanentConfig}/></Typography>
      </>,
      title: "Unexpected dumps config"
      });
  }
};