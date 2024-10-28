import ShowDockerEngineModal from '../../../features/dockerEngineInfo/DockerEngineModal';
import DockerEngineCard from '../../../features/dockerEngineInfo/DockerEngineCard';
import { DataTab } from './DataTab';

export function DockerEnginesTab() {
  return <DataTab
    CardComponent={DockerEngineCard}
    ShowAddModal={ShowDockerEngineModal}
    dataKey='dockerEnginesInfo'
    />
}
