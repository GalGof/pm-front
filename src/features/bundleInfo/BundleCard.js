import { useRef } from 'react';
import { useSelector } from 'react-redux'
import CardContent from '@mui/material/CardContent';
import Portal from '@mui/material/Portal';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import IconButton from '@mui/material/IconButton';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/DeleteForever';

import './BundleCard.css';
import { RpcCall } from '../../common/Actions';
import { EditRawModalButton } from '../../modals/RawEditorModal';
import ShowDeployModal from '../deployInfo/DeployModal';
import { isDevEnv, isOldMui } from '../../common/Config';
import { ModalConfirm, ModalError } from '../../modals/ShowModal';

/** @param {{id: string}} arg1*/
export default function BundleCard({id}) {
  const item = useSelector((/** @type {ReduxStoreType}*/state) => state.bundles.entries[id]);
  const buildInfoContainer = useRef(null);
  const imagesListContainer = useRef(null);
  const devDelete = ()=>{
    ModalConfirm({
      content: `Delete (${item.id})?`,
      title: "Delete",
      onAction: ()=>{
        RpcCall({
          target: 'Database',
          dbName: "bundles",
          method: "delete",
          args: [item.id],
        }).catch((error)=>{ModalError({error, content: "Failed to remove"})})
      },
    })
  }

  const accordionProps = isOldMui ? {TransitionProps: {unmountOnExit: true}} : {slotProps: {transition: {unmountOnExit: true}}};

  return (
    <Card className='BundleCard'>
      <div className='flexRow'>
        <Typography variant="body2" color="text.secondary">{new Date(item.lastSave || 0).toISOString()}</Typography>
        {isDevEnv && <IconButton className='cardActionButton' onClick={devDelete} ><DeleteIcon /></IconButton>}
          {EditRawModalButton({id, dbName: "bundles", width: 400, rows: 25})}
          <IconButton
            disabled={item.corrupted}
            className='cardActionButton'
            onClick={()=>ShowDeployModal({fixedBundleInfo: item})}
            >
              <RocketLaunchIcon color={item.corrupted ? 'disabled' : undefined}/>
          </IconButton>
      </div>
      <Typography variant="h6" color="text.primary">{item.id}</Typography>
      <CardContent>
        {item.corrupted && <Typography variant="body2" color="orange">Bad data</Typography>}
        <Typography variant="body2" color="text.secondary">
          {item.builderId || "Nemo"}
        </Typography>
      </CardContent>
      <Divider />
      <div className='flexRow'>
        {/* accordion style depends on if there is more accordions before it */}
        <Accordion sx={{display: "none"}}><AccordionSummary></AccordionSummary></Accordion>
        <Accordion disableGutters {...accordionProps} sx={{width: 120}}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Build Info
          </AccordionSummary>
          <Portal container={() => buildInfoContainer.current}>
            <AccordionDetails>
              <pre>{JSON.stringify(item.buildInfo, null, 2)}</pre>
            </AccordionDetails>
          </Portal>
        </Accordion>
        <Accordion disableGutters {...accordionProps} sx={{width: 120}}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Images
          </AccordionSummary>
          <Portal container={() => imagesListContainer.current}>
            <AccordionDetails>
            {item.imagesToDeploy?.map(it=>(<div key={it.pcid}>
              <span>{it.pcid} </span>
              {it.original ?
                <span>{it.original.registryId} {it.original.repoName}:{it.original.imageTag}</span>
                : <span>{it.registryId} {it.repoName}:{it.imageTag}</span>}
              </div>))}
            </AccordionDetails>
          </Portal>
        </Accordion>
      </div>
      <div style={{overflow: "auto"}}></div>
      <div ref={imagesListContainer}/>
      <div ref={buildInfoContainer}/>
    </Card>
  );
}