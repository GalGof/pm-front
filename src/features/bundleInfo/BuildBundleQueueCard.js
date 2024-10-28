import { useSelector } from 'react-redux';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import './BuildBundleQueueCard.css';

/** @param {{id: string}} arg1*/
export default function BuildBundleQueueCard({id}) {
  const item = useSelector((/** @type {ReduxStoreType}*/state) => state.buildBundleQueue.entries[id]);
  const adminAccess = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.adminAccess);

  // @TODO
  const removeFromQueue = ()=>{}

  return (
    <Card className='BuildBundleQueueCard'>
      <CardHeader
        titleTypographyProps={{
          variant: "body1",
        }}
        subheaderTypographyProps={{
          variant: "caption",
        }}
        action={<>
          {adminAccess && <IconButton className='cardActionButton' onClick={removeFromQueue} ><CloseIcon /></IconButton>}
        </>}
        title={<>Build Queue {id}</>}
        subheader={new Date(item.lastSave || 0).toISOString()}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          Attempt {item.missCount || "Nemo"}
        </Typography>
      </CardContent>
      <Divider />
      <Accordion disableGutters>
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