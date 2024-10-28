import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';

import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';

import './DockerRegistryCard.css';
import { EditRawModalButton } from '../../modals/RawEditorModal';
import ShowDockerRegistryModal from './DockerRegistryModal';
import { useSelector } from '../../app/Store';

/** @param {{id: string}} arg1*/
export default function DockerRegistryCard({id}) {
  const item = useSelector(state=>state.dockerRegistriesInfo.entries[id]);
  return (
    <Card className='DockerRegistryCard'>
      <CardHeader
        action={<>
            {EditRawModalButton({id, dbName: "dockerRegistries", width: 300, rows: 10})}
            <IconButton
              className='cardActionButton'
              onClick={()=>ShowDockerRegistryModal({item})}
              >
              <EditIcon />
            </IconButton>
          </>}
        title={item.name}
        subheader={item.id}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {item.address}
        </Typography>
      </CardContent>
    </Card>
  );
}