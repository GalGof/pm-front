import { useState, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Fade from '@mui/material/Fade';

import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EngineeringIcon from '@mui/icons-material/Engineering';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import './EngineView.css';
import ShowDeployModal from '../features/deployInfo/DeployModal';
import { EditRawModalButton } from '../modals/RawEditorModal';
import ShowDockerEngineModal from '../features/dockerEngineInfo/DockerEngineModal';
import DeployedPackCard from '../features/deployInfo/DeployedPackCard';
import RawContainerCard from '../cards/RawContainerCard';
import DeployQueueCard from '../features/deployInfo/DeployQueueCard';
import DeployInProgressCard from '../features/deployInfo/DeployInProgressCard';
import { DeployBundle, DockerRPC, RemovePack } from '../common/Actions';
import { CatchModalError } from '../modals/ShowModal';

export default function TestView() {
  console.log("TestView");
  const deployedInfo = useSelector((/** @type {ReduxStoreType}*/state) => state.deployedPacksInfo.ids);
  // return deployedInfo.map(it=><div key={it.id}>{it.id}</div>)
  // return deployedInfo.items.map(it=><div key={it.id}>{it.id}</div>)
  return deployedInfo.map(it=><div key={it}>{it}</div>)
}