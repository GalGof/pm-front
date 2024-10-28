import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';

import { DockerRPC } from '../common/Actions';
import { ModalInfo, ModalError, ThenModalOk, CatchModalError } from '../modals/ShowModal';

const Panel = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: "2px 5px 6px 5px",
  margin: "5px",
  // textAlign: 'center',
  color: theme.palette.text.secondary,
  flexGrow: 1,
  border: "1px solid #465c5f",
}));

/** @param {{data: string}} param */
export function parsePsOutput({data})
{
  // console.log(text)
  let lines = data.split('\n');
  let titles = lines[0].match(/\w+/g);
  if (!titles) {
    ModalError({content: "Bad ps output"})
    return
  }
  // last column (cmd) may contain whitespaces
  let linePattern = `${"(\\S+) +".repeat(titles.length - 1)}(.+)`;
  /** @type {{titles: string[], processes: string[][]}} */
  let psInfo = {titles, processes: []};
  for (let i = 1; i < lines.length; ++i) {
    let parseResult = new RegExp(linePattern).exec(lines[i]);
    if (!parseResult) continue;
    let info = Array.from(parseResult);
    // full match
    info.splice(0, 1);
    psInfo.processes.push(info);
  }
  return psInfo;
}

/** 
 * @param {object} param
 * @param {string} param.data
 * @param {string} param.dockerId
 * @param {string} param.containerId
 * @param {string=} param.pcid
 * */
export function ContainerProcessesModal({data, dockerId, containerId, pcid}) {
  const psInfo = parsePsOutput({data});
  if (!psInfo) {
    ModalInfo({content: JSON.stringify(data, null, 2), title: "raw ps output"})
    return 
  };
  // console.log(psInfo)

  const pidIndex = psInfo.titles.findIndex(q=>q === "PID");
  const cmdIndex = psInfo.titles.findIndex(q=>q === "CMD" || q === "COMMAND");

  const sendCmd = (/** @type {string[]}*/Cmd)=>{
    return DockerRPC({
      dockerId,
      fname: "_containerExec",
      args: [{containerId, includeStdOut: true, WorkingDir: "/", Cmd}]
    })
  }

  const sendPidSignal = (/** @type {string}*/pid, /** @type {string}*/signal)=>{
    sendCmd(['kill', '-s', signal, pid])
      .then((data)=>{
        ModalInfo({content: data, title: "Signal send"});
      })
      .catch((error)=>{ModalError({error, content: "Error"})});
  }

  const gcore = (/** @type {string}*/pid)=>{
    sendCmd(['gcore', '-o', `/tmp/cores/core.gcore_${pcid}.${pid}.${containerId.substr(0, 12)}.${Math.floor(+new Date()/1000)}`, pid])
      .then(res=>ModalInfo({
        content: <pre style={{maxWidth: '80vw', maxHeight: '80vh', overflow: 'auto'}}>{res}</pre>,
        title: "GCore result"
      }))
      .catch(error=>ModalError({content: "GCore send error", error}));
  }

  const takeMassifSnapshot = (/** @type {string}*/pid, marker='Manual')=>{
    sendCmd(['bash', '-c', `vgdb --pid=${pid} detailed_snapshot /valgrind/massif_snapshot_${marker}_${+new Date()}.txt`])
      .then(ThenModalOk)
      .catch(CatchModalError)
  }

  const saveMassifSnapCache = (/** @type {string}*/pid, marker='Manual')=>{
    sendCmd(['bash', '-c', `vgdb --pid=${pid} all_snapshots /valgrind/massif_out_snapshots_${marker}_${+new Date()}.txt`])
      .then(ThenModalOk)
      .catch(CatchModalError)
  }

  ModalInfo({
    content: <Box sx={{overflow: "auto", maxWidth: "80vw", width: "max-content", maxHeight: "70vh"}}>
      {psInfo.processes.map((it, idx)=>{
        const pid = it[pidIndex];
        return <Panel key={pid}>
          <Typography variant='subtitle1' title={it[cmdIndex]}>{pid} {it[cmdIndex].slice(0, 128)}</Typography>
          <div style={{display: "flex", gap: "3px", flexWrap: "wrap"}}>
            <Button onClick={()=>sendPidSignal(pid, "SIGINT")}>SIGINT</Button>
            <Button onClick={()=>sendPidSignal(pid, "SIGTERM")}>SIGTERM</Button>
            <Button onClick={()=>sendPidSignal(pid, "SIGABRT")}>SIGABRT</Button>
            <Button onClick={()=>sendPidSignal(pid, "SIGTSTP")}>SIGTSTP</Button>
            <Button onClick={()=>sendPidSignal(pid, "SIGSTOP")}>SIGSTOP</Button>
            <Button onClick={()=>sendPidSignal(pid, "CONT")}>CONT</Button>
            {/* <Button onClick={()=>takeMassifSnapshot(pid)}>Take massif snapshot</Button>
            <Button onClick={()=>saveMassifSnapCache(pid)}>Save massif snapshots cache</Button> */}
            <Button onClick={()=>gcore(pid)}>gcore</Button>
          </div>
        </Panel>})}
    </Box>,
    title: "Processes",
  });
};