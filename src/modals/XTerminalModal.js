import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Modal from '@mui/material/Modal';
import Tooltip from '@mui/material/Tooltip';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css'

import CloseIcon from '@mui/icons-material/Close';
import TerminalIcon from '@mui/icons-material/Terminal';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SensorsIcon from '@mui/icons-material/Sensors';

import './XTerminalModal.css';
import { AddModal } from './ModalManager';
import { srvAddress } from '../common/Config';
import store from '../app/Store'

const initialRows = 20;
const initialCols = 80;
const limitRows = 40;
const limitCols = 160;
const lowLimit = 0;

/** 
 * @param {object} param
 * @param {string} param.containerId
 * @param {string} param.dockerId
 * @param {string} param.builderId
 * @param {string} [param.pcid]
 * @param {string[]} [param.Cmd]
 * */
export default function XTerminalModal({containerId, dockerId, Cmd, builderId, pcid})
{
  const builder = store.getState().builders.entries[builderId];
  let terminal = ["/bin/sh"];
  if (builder && pcid) {
    let _terminal = builder.images.find(it=>it.pcid === pcid)?.terminal;
    if (_terminal) {
      terminal = [_terminal];
    }
  }
  Cmd = Cmd || terminal;


  const webSocket = new WebSocket(`ws://${srvAddress}/websockets/container/exec`)
  const xterminal = new Terminal({rows: initialRows, cols: initialCols});

  xterminal.onData((str)=>{
    if (webSocket.readyState !== webSocket.OPEN) return;
    webSocket.send("1"+str);
  })
  /**@type {HTMLElement|null}*/
  let containerRef = null;

  const setContainerRef = (/**@type {HTMLElement|null}*/element)=>{
    if (element) xterminal.open(element)
    containerRef = element;
  }

  /** @param {{w: number, h: number}} param */
  function setTermianlSize({w, h})
  {
    webSocket.send("0" + JSON.stringify({command: "resize", params: {w, h}}));
    xterminal.resize(w, h);
  }

  const startCmd = ()=>{
    webSocket.send(JSON.stringify({dockerId, containerId, Cmd}));
  }
  if (webSocket.readyState === webSocket.OPEN) {
    startCmd();
  } else {
    webSocket.addEventListener("open", startCmd);
  }
  webSocket.addEventListener("close", (...args)=>{
    // console.log("ws closed", args)
    if (containerRef) {
      containerRef.innerText += "\nConnection closed!";
    }
  });
  webSocket.addEventListener("message", async (msg)=>{
    let text = msg.data;
    let isTerminalMsg = text[0] === "1";
    let message = text.slice(1);
    if (isTerminalMsg) {
      xterminal.write(message);
    } else {
      if (message === "started") {
        setTermianlSize({w: initialCols, h: initialRows});
        return;
      }
      let data = JSON.parse(message);
      console.log(data)
    }
  })

  const cmdStr = Cmd.join(' ');

  function DynamicControl(/**@type {{close: ()=>void}}*/{close})
  {
    const [tw, setTw] = useState(initialCols);
    const [th, setTh] = useState(initialRows);
    const [bell, setBell] = useState(false);
    const [connected, setConnected] = useState(webSocket.readyState === webSocket.OPEN);

    /**
     * @param {string} value 
     * @param {number} highLimit 
     * @param {(value: number)=>void} cb 
     * @returns 
     */
    const setDimension = (value, highLimit, cb)=>{
      let digit = value.match(/\d+/);
      if (!digit) return;
      cb(Math.max(lowLimit, Math.min(+digit[0], highLimit)));
    }

    useEffect(()=>{
      /** @type {NodeJS.Timeout} */
      let timeout;
      xterminal.onBell(()=>{
        setBell(true);
        clearTimeout(timeout);
        timeout = setTimeout(()=>setBell(false), 200);
      })
      const closeCb = ()=>setConnected(false);
      const openCb = ()=>setConnected(true);
      webSocket.addEventListener("close", closeCb);
      webSocket.addEventListener("open", openCb);
      setConnected(webSocket.readyState === webSocket.OPEN);
      return ()=>{
        webSocket.removeEventListener("close", closeCb);
        webSocket.removeEventListener("open", openCb);
      }
    }, [setConnected])

    const onClose = ()=>{
      if (webSocket.readyState === webSocket.OPEN) {
        webSocket.send("1\x04");
        webSocket.close();
      }
      close();
    }

    return <Modal
      className="XTerminalModal"
      hideBackdrop={true}
      open
      disableRestoreFocus
      disableEscapeKeyDown
      onClose={onClose}
      >
      <Box className="ModalContent">
        <Typography id="modal-modal-title" variant="h6" component="h2">
          <SensorsIcon color={connected ? "success" : "error"}/>
          XTerminal ({cmdStr})</Typography>
        <Divider />
        <div className='pm_xterminal'>
          <div ref={setContainerRef}></div>
        </div>
        <Divider />
        <div className='controlsPanel'>
          <Tooltip title="terminal beeps"><NotificationsActiveIcon color={bell ? "success" : "disabled"}/></Tooltip>
          <TextField size="small" onChange={(e)=>setDimension(e.target.value, limitCols, setTw)} value={tw}/>
          <span>X</span>
          <TextField size="small" onChange={(e)=>setDimension(e.target.value, limitRows, setTh)} value={th}/>
          <Button onClick={()=>setTermianlSize({h: th, w: tw})}><TerminalIcon />resize</Button>
          <Button className='fr' onClick={onClose}><CloseIcon />Close</Button>
        </div>
      </Box>
    </Modal>
  }

  AddModal(DynamicControl, {});
};