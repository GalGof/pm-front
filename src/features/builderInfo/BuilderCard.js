import { useSelector } from 'react-redux';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';

import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import "./BuilderCard.css";
import { EditRawModalButton } from '../../modals/RawEditorModal';
import ShowBuilderModal from './BuilderModal';

/** @param {{id: string}} arg1*/
export default function BuilderCard({id}) {
  const item = useSelector((/** @type {ReduxStoreType}*/state) => state.builders.entries[id]);

  return (
    <Card className='BuilderCard'>
      <CardHeader
        action={<>
          {EditRawModalButton({id, dbName: "builders", width: 900, rows: 30})}
          <IconButton className='cardActionButton' onClick={()=>ShowBuilderModal({item})} ><EditIcon /></IconButton>
          <IconButton className='cardActionButton' onClick={()=>ShowBuilderModal({copyFrom: item})} ><ContentCopyIcon /></IconButton>
        </>}
        title={id}
        subheader={<>{item.name}<br/>{new Date(item.createdTimestamp || 0).toISOString()}</>}
      />
      {/* <CardContent>
      </CardContent> */}
    </Card>
  );
}