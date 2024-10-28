import { useSelector } from 'react-redux';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';

import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';

import './SharedDataCard.css';
import { EditRawModalButton } from '../../modals/RawEditorModal';
import ShowSharedDataModal from './SharedDataModal';

/** @param {{id: string}} arg1*/
export default function SharedDataCard({id}) {
  const item = useSelector((/** @type {ReduxStoreType}*/state) => state.sharedDataInfo.entries[id]);

  return (
    <Card className='SharedDataInfo'>
      <CardHeader
        action={<>
            {EditRawModalButton({id, dbName: "sharedData", width: 400, rows: 15})}
            <IconButton
              className='cardActionButton'
              onClick={()=>ShowSharedDataModal({item})}
            >
              <EditIcon />
            </IconButton>
          </>}
        title={item.name}
        subheader={item.id}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {item.dockerRegistryId}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {item.image}
        </Typography>
      </CardContent>
    </Card>
  );
}