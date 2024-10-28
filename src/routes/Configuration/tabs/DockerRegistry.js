import ShowDockerRegistryModal from '../../../features/dockerRegistryInfo/DockerRegistryModal';
import DockerRegistryCard from '../../../features/dockerRegistryInfo/DockerRegistryCard';
import { DataTab } from './DataTab';

export function DockerRegistryTab() {
  return <DataTab
    CardComponent={DockerRegistryCard}
    ShowAddModal={ShowDockerRegistryModal}
    dataKey='dockerRegistriesInfo'
    />
}
