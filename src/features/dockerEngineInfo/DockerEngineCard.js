import { useSelector } from 'react-redux';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';

import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DoDisturbOnIcon from '@mui/icons-material/DoDisturbOn';

import './DockerEngineCard.css';
import { EditRawModalButton } from '../../modals/RawEditorModal';
import ShowDockerEngineModal from './DockerEngineModal';
import { engineFeatureIcon } from './icons';

/** @param {{id: string}} arg1*/
export default function DockerEngineCard({id}) {
  const item = useSelector((/** @type {ReduxStoreType}*/state) => state.dockerEnginesInfo.entries[id]);
  const engineFeatureLabels = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.engineFeatureLabels);

  return (
    <Card className='DockerEngineCard'>
      <CardHeader
        action={<>
            {EditRawModalButton({id: item.id, dbName: "dockerEngines", width: 400, rows: 25})}
            <IconButton
              className='cardActionButton'
              onClick={()=>ShowDockerEngineModal({id: item.id})}
              >
              <EditIcon />
            </IconButton>
          </>}
        title={<>
          {item.disabled && <Tooltip title="Disabled"><DoDisturbOnIcon/></Tooltip>}
          {item.name}
        </>}
        subheader={id}
      />
      <CardContent>
        <div className='flexRow labels'>
          {item.labels?.map(it=>{
            if (it === id) return;
            let icon = <></>;
            if (engineFeatureLabels.builder === it) {
              icon = <Tooltip title="builder"><engineFeatureIcon.builder /></Tooltip>;
            } else 
            if (engineFeatureLabels.automation.includes(it)) {
              icon = <Tooltip title="automation"><engineFeatureIcon.autotests /></Tooltip>;
            }
            return <Chip
              key={it}
              label={<>{icon}<span>{it}</span></>}
            />
          })}
        </div>
      </CardContent>
    </Card>
  );
}