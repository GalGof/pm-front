import {  useContext, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import AppBar from '@mui/material/AppBar';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import * as allIcons from '@mui/icons-material'
import CropOriginalIcon from '@mui/icons-material/CropOriginal';
import GiteIcon from '@mui/icons-material/Gite';
import CableIcon from '@mui/icons-material/Cable';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import CastleIcon from '@mui/icons-material/Castle';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import SavingsIcon from '@mui/icons-material/Savings';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import CommentIcon from '@mui/icons-material/Comment';
import CommentsDisabledIcon from '@mui/icons-material/CommentsDisabled';

import './LogPanel.css';
import useResize from '../common/useResize';


/** @param {{connected, ConnectionIconClass?, width?}} arg1 */
export default function LogPanel({
    connected,
    ConnectionIconClass = CableIcon,
    // width = 240,
  }) {
  const messages = useSelector((/** @type {ReduxStoreType}*/state) => state.serviceLogger.messages);
  const path = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.path);
  const { width, enableResize } = useResize({ minWidth: 200, defaultWidth: +(localStorage.getItem("logPanelWidth") || 200) });

  const selectedId = decodeURIComponent(path.split("/").slice(-1)[0]);
  localStorage.setItem("logPanelWidth", width);

  return (
    <Drawer
      sx={{width: width, display: 'flex', flexDirection: 'column', height: '100vh'}}
      className='LogPanel'
      variant="persistent"
      open
      anchor={'right'}
      PaperProps={{
        sx: { width },
      }}
    >
      <div
        style={{ 
          position: 'absolute',
          width: '5px',
          top: '0',
          left: '0px',
          bottom: '0',
          cursor: 'col-resize',
          userSelect: 'none',
        }}
        onMouseDown={enableResize}
      />
      <AppBar position='relative'>
        <Toolbar variant="dense" sx={{alignSelf: 'center'}}>
          <ConnectionIconClass fontSize="large" sx={{ color: connected ? '#622f0e' : 'gray' }}/>
          <Typography variant="body2" color="text.secondary" >Logs</Typography>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', padding: '10px', overflow: 'auto' }} className='col-parent' >
        {messages.map((it)=><div key={it.id}>{it.timestamp} [{it.component}][{it.severity}]<pre>{it.message}</pre>{it.debug?<pre>{JSON.stringify(it.debug)}</pre>:""}</div>)}
      </Box>
    </Drawer>
  );
}
  