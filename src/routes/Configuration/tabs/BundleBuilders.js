import ShowBuilderModal from '../../../features/builderInfo/BuilderModal';
import BuilderCard from '../../../features/builderInfo/BuilderCard';
import { DataTab } from './DataTab';

export function BundleBuildersTab() {
  return <DataTab
    CardComponent={BuilderCard}
    ShowAddModal={ShowBuilderModal}
    dataKey='builders'
    />
}