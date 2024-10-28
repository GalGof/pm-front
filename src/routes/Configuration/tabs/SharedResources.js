import ShowSharedDataModal from '../../../features/sharedData/SharedDataModal';
import SharedDataCard from '../../../features/sharedData/SharedDataCard';
import { DataTab } from './DataTab';

export function SharedResourcesTab() {
  return <DataTab
    CardComponent={SharedDataCard}
    ShowAddModal={ShowSharedDataModal}
    dataKey='sharedDataInfo'
    />
}
