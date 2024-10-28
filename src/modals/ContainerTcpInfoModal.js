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

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { ModalInfo } from '../modals/ShowModal';
import "./ContainerTcpInfoModal.css";

function handleIp(/** @type {string} */str)
{
  function toIpv4(/** @type {string} */_str) {
    return _str.match(/.{2}/g)?.map(it=>parseInt(it, 16)).reverse().join(".")
  }

  if (str.length === 8) {
    return toIpv4(str);
  }
  if (str.length === 32) {
    if (str.match(/^00000000000000000000ffff/i)) {
      // reversed or not reversed ipv4 part?
      return "::ffff:" + toIpv4(str.slice(24));
    }
    return "["+str.match(/.{4}/g)?.map(it=>it.replace(/^0{1,3}/, '')).join(":").replace(/^(0:){2,8}/, "::")+"]";
  }
  return str;
}

// https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/include/net/tcp_states.h
let CONN_STATE = [ 'filler',
  'TCP_ESTABLISHED',
  'TCP_SYN_SENT',
  'TCP_SYN_RECV',
  'TCP_FIN_WAIT1',
  'TCP_FIN_WAIT2',
  'TCP_TIME_WAIT',
  'TCP_CLOSE',
  'TCP_CLOSE_WAIT',
  'TCP_LAST_ACK',
  'TCP_LISTEN',
  'TCP_CLOSING',    /* Now a valid state */
  'TCP_NEW_SYN_RECV',
  'TCP_BOUND_INACTIVE', /* Pseudo-state for inet_diag */

  'TCP_MAX_STATES'  /* Leave at the end! */
];

// https://docs.kernel.org/networking/proc_net_tcp.html
let TIMER_ACTIVE = [
  'no timer is pending',
  'retransmit-timer is pending',
  'another timer (e.g. delayed ack or keepalive) is pending',
  'this is a socket in TIME_WAIT state.',
  'zero window probe timer is pending'
]

/** 
 * @param {object} param
 * @param {string} param.data
 * */
export default function ContainerTcpInfoModal({data}) {
  let parser = /^\s+(\d+):\s+([^:]+):(\S+)\s+([^:]+):(\S+)\s+(\S+)\s+([^:]+):(\S+)\s+([^:]+):(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)?\s+(\S+)?\s+(\S+)?\s+(\S+)?\s+(\S+)?\s*$/gm;
  /** @type {{[x:string]: string|number}[]} */
  let rows = [];
  let key = 0;
  while (true)
  {
    let res = parser.exec(data)
    if (!res) break;
    res.shift();
    let id = res[0];
    let localIp = handleIp(res[1]);
    let localPort = parseInt(res[2], 16);
    let remoteIp = handleIp(res[3]);
    let remotePort = parseInt(res[4], 16);
    let status = CONN_STATE[parseInt(res[5], 16)];
    let trQueue = res[6];
    let recvQueue = res[7];
    let timerActive = TIMER_ACTIVE[parseInt(res[8], 16)];
    let unansweredZeroWindowProbes = res[12];
    let retransmitTimeout = res[16];
    rows.push({key: key++, id, local: `${localIp}:${localPort}`, remote: `${remoteIp}:${remotePort}`, status, trQueue, recvQueue, timerActive, unansweredZeroWindowProbes, retransmitTimeout});
  }
  let parseErrors = rows.length + 3 !== data.split('\n').length;

  const columns = ['id', 'local', 'remote', 'status', 'trQueue', 'recvQueue', 'timerActive', 'unansweredZeroWindowProbes', 'retransmitTimeout'].map(it=>{
    return {headerName: it[0].toUpperCase() + it.slice(1), field: it, key: it};
  });

  const rawContent = <>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant='h6'>Raw info</Typography>
    </AccordionSummary>
    <AccordionDetails sx={{padding: 0, overflow: "auto", maxHeight: "calc(80vh - 200px)"}}>
      <pre>{data}</pre>
    </AccordionDetails>
  </>;

  const parsedContent = <>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant='h6'>Parsed info {parseErrors && "(had parsing errors)"}</Typography>
    </AccordionSummary>
    <AccordionDetails sx={{padding: 0, overflow: "auto", maxHeight: "calc(80vh - 200px)"}}>
      <TableContainer component={Paper}>
        <Table  size="small" aria-label="simple table">
          <TableHead>
            <TableRow>
              {columns.map(it=><TableCell key={it.key} align="right">{it.headerName}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.key}
                sx={{ '&:last-child td, &:last-child th': { border: 0 }}}
              >
                {columns.map(it=><TableCell key={it.key} align="right">{row[it.field]}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </AccordionDetails>
  </>;

  const ControlledAccordions = ()=>{
    const [expanded, setExpanded] = useState("parsed");
  
    //@ts-ignore
    const handleChange = (panel) => (event, isExpanded) => {
      setExpanded(isExpanded ? panel : false);
    };

    return <Box className='ContainerTcpInfoModal'>
      <Accordion
        defaultExpanded={rows.length > 16}
        expanded={rows.length > 16 ? expanded === 'raw' : undefined}
        onChange={handleChange('raw')}
      >
        {rawContent.props.children}
      </Accordion>
      <Accordion
        defaultExpanded={rows.length < 16}
        expanded={rows.length > 16 ? expanded === 'parsed' : undefined}
        onChange={handleChange('parsed')}
      >
        {parsedContent.props.children}
      </Accordion>
    </Box>
  }

  ModalInfo({
    content: <ControlledAccordions/>,
    title: "TCP Info",
  });
};