import { useSelector } from 'react-redux';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';

import DeleteIcon from '@mui/icons-material/DeleteForever';

import { RemovePack } from '../../common/Actions';
import { AdminIconButton } from '../../common/Controls';
import { ModalConfirm, defaultStyle } from '../../modals/ShowModal';

/** @param {{id: string}} arg1*/
export default function DeployInProgressCard({id}) {
  const item = useSelector((/** @type {ReduxStoreType}*/state) => state.deployedPacksInfo.entries[id]);
  const adminAccess = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.adminAccess);

  const onDelete = ()=>{
    ModalConfirm({
      content: `Delete (${item.id})?`,
      title: "Delete assigned queued item",
      onAction: ()=>RemovePack({dockerId: item.dockerEngineId, packId: item.id}),
      modalStyle: {...defaultStyle},
    })
  }

  return (
    <Card raised={item.deployInProgress} className='DeployInProgressCard' sx={{ maxWidth: "calc(100vw - 300px)"}}>
      <CardHeader
        titleTypographyProps={{variant: "h6"}}
        title={item.id}
        subheader={<>
          <Typography variant='body2'>{new Date(item.lastSave || 0).toISOString()}</Typography> 
          {AdminIconButton(adminAccess, onDelete, DeleteIcon)} 
          <Typography variant='body2' sx={{display: "inline", paddingLeft: "3px"}}>{item.builderId}</Typography>
        </>}
      />
    </Card>
  );
}