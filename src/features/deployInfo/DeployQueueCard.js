import { useSelector } from 'react-redux';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import DeleteIcon from '@mui/icons-material/DeleteForever';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import './DeployQueueCard.css';
import { ControllerRPC } from '../../common/Actions';
import { ModalError, ModalConfirm } from '../../modals/ShowModal';
import { AdminIconButton } from '../../common/Controls';
import { isOldMui } from '../../common/Config';

/** @param {{id: string}} arg1*/
export default function DeployQueueCard({id}) {
  const item = useSelector((/** @type {ReduxStoreType}*/state) => state.deployQueue.entries[id]);
  const adminAccess = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.adminAccess);
  const removeFromQueue = ()=>{
    ControllerRPC({fname: "removeDeployQueueItem", args: [id]})
      .catch((error)=>{
        console.error(error);
        ModalError({error, title: "Failed to remove queue item"});
      })
  }

  const onDelete = ()=>{
    ModalConfirm({
      content: `Delete (${id})?`,
      title: "Delete from unassigned queue",
      onAction: removeFromQueue,
    })
  }

  const accordionProps = isOldMui ? {TransitionProps: {unmountOnExit: true}} : {slotProps: {transition: {unmountOnExit: true}}};

  return (
    <Card className='DeployQueueCard' sx={{ minWidth: 100, maxWidth: 400, margin: '0 0 5px 5px' }}>
      <CardHeader
        titleTypographyProps={{variant: "body1"}}
        subheaderTypographyProps={{variant: "caption"}}
        title={<>Delpoy Queue {item.id}</>}
        subheader={new Date(item.lastSave || 0).toISOString()}
      />
      <CardContent>
        {AdminIconButton(adminAccess, onDelete, DeleteIcon)}
        <Typography variant="body2" color="text.secondary" sx={{display: "inline", paddingLeft: "3px"}}>
          Attempt {item.missCount || "Nemo"}
        </Typography>
      </CardContent>
      <Divider />
      <Accordion disableGutters {...accordionProps}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          Request info
        </AccordionSummary>
        <AccordionDetails>
          <pre>{JSON.stringify(item.request, null, 2)}</pre>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
}