import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { PostAdminAceessKey, } from '../../../common/Actions';
import { cyrb53 } from '../../../common/cyrb53.js';
import {ModalError} from '../../../modals/ShowModal';
import * as globalsActions from '../../../redux/globals';
import { Item } from '../../../common/Controls';

export function GeneralSettingsTab() {
  const dispatch = useDispatch();
  const [currentKey, setCurrentKey] = useState("");
  const [newKey, setNewKey] = useState("");
  const adminAccess = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.adminAccess);
  const rawEditMode = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.rawEditMode);

  const CheckKey = ()=>{
    PostAdminAceessKey({currentKey: String(cyrb53(currentKey))})
      .then(()=>{
        dispatch(globalsActions.setAdminAccess(true))
        localStorage.setItem("currentKey", String(cyrb53(currentKey)));
      })
      .catch((error)=>{
        console.error(error);
        ModalError({title: "Failed to check key", error});
      });
  }

  const SetKey = ()=>{
    PostAdminAceessKey({currentKey: String(cyrb53(currentKey)), newKey: String(cyrb53(newKey))})
      .then(()=>localStorage.setItem("currentKey", String(cyrb53(newKey))))
      .catch((error)=>{
        console.error(error);
        ModalError({title: "Failed to set key", error});
      });
  }

  const Logout = ()=>{
    localStorage.removeItem("currentKey");
    dispatch(globalsActions.setAdminAccess(false))
  }

  //@ts-ignore
  const setRawEditMode = (e, checked)=>{
    dispatch(globalsActions.setRawEditMode(checked))
  }

  return (
    <div>
      <Stack direction="column" justifyContent="flex-start" alignItems="baseline" spacing={1} >
        <Item>
          <TextField onChange={(e)=>setCurrentKey(e.target.value)} label="Config Access Key" type="password" value={currentKey}/>
          <Button onClick={CheckKey}>Check</Button>
          <Button disabled={!adminAccess} onClick={Logout}>Disable</Button>
        </Item>
        {adminAccess && <>
        <Item>
          <TextField onChange={(e)=>setNewKey(e.target.value)} label="New Access Key" type="password" value={newKey}/>
          <Button onClick={SetKey}>Set</Button>
        </Item>
        <Item>
          <FormControlLabel
              labelPlacement='end'
              label="Raw data editable"
              control={<Checkbox
                defaultChecked={rawEditMode}
                onChange={setRawEditMode}
                />}
            />
        </Item>
        {/* <Item><AddItemControl/></Item> */}
        </>}
      </Stack>
    </div>
  );
}
