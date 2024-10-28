import { createRef } from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';

import RawOnIcon from '@mui/icons-material/RawOn';

// import './RawEditorModal.css';
import { RawSaveDB, } from '../common/Actions';
import { ShowModal, ModalText } from '../modals/ShowModal';
import store from '../app/Store';

/** @type {import('@mui/system/styleFunctionSx').SxProps} */
const modalStyle = {
  position: 'absolute',
  top: '50px',
  left: '50%',
  transform: 'translate(-50%, 0)',
  width: 900,
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const dbStoreName = {
  "deployed": "deployedPacksInfo",
  "bundles": "bundles",
  "dockerRegistries": "dockerRegistriesInfo",
  "builders": "builders",
  "dockerEngines": "dockerEnginesInfo",
  "sharedData": "sharedDataInfo",
}

/** @typedef {{id: string, dbName: "deployed" | "bundles" | "dockerRegistries" | "builders" | "dockerEngines" | "sharedData", width: number|string, rows: number}} params */
/**
 * @param {params} param0 
 * @returns 
 */
export function RawEditorModal({id, dbName, width, rows}) {
  // /** @type {React.Ref<HTMLInputElement>} */
  const textRef = createRef();
  const onAction = async () =>{
    let value = textRef.current?.value;
    if (!value) throw new Error("No value");
    return await RawSaveDB(JSON.parse(value), dbName);
  }
  const storeState = store.getState();
  const rawEditMode = storeState.globals.rawEditMode;
  const adminAccess = storeState.globals.adminAccess;
  //@ts-ignore
  const item = storeState[dbStoreName[dbName]].entries[id];

  if (adminAccess && rawEditMode) {
    ShowModal({
      content: <TextField
        sx={{width: '100%', marginTop: "6px"}}
        multiline
        rows={rows}
        label="JSON"
        defaultValue={JSON.stringify(item, null, 2)}
        inputRef={textRef}/>,
      actionCaption: "Save",
      modalStyle: {...modalStyle, width},
      onAction,
      title: "Edit (" + id + ":"+ dbName +")",
    });
  } else {
    ModalText({
      content: JSON.stringify(item, null, 2),
      title: "View (" + id + ":"+ dbName +")",
    })
  }
}

/**
 * 
 * @param {params & {iconButtonProps?: object}} param0 
 * @returns 
 */
export function EditRawModalButton({id, dbName, width, rows, iconButtonProps = {}})
{
  return <IconButton
    className='cardActionButton warning'
    color="warning"
    onClick={()=>RawEditorModal({id, dbName, width, rows})}
    {...iconButtonProps}
    >
    <RawOnIcon />
  </IconButton>
}