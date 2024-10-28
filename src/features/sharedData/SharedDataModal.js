import { useState, Fragment } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';
import Modal from '@mui/material/Modal';
import Divider from '@mui/material/Divider';

import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import './SharedDataModal.css';
import { SaveDBModalCall, } from '../../common/Actions';
import { CreateRenderTick } from '../../common/utils';
import { AddModal } from '../../modals/ModalManager';
import store from '../../app/Store';
import { FormHandler } from '../../common/FormHandler';

function MakeName(/** @type {string}*/str)
{
  return str[0].toUpperCase() + str.slice(1);
}

/** @param {{item?: SharedDataInfo}} [args] */
export default function ShowSharedDataModal({item} = {})
{
  /** @type {SharedDataInfo} */
  const defaults = {
    id: "",
    name: "",
    dataPath: [],
    lastSave: 0,
    image: "",
    hidden: false,
    dockerRegistryId: "",
  }
  const state = store.getState();
  const sharedDataIds = state.sharedDataInfo.ids;
  const dockerRegisties = Object.values(state.dockerRegistriesInfo.entries);

  /** @type {FormHandler<SharedDataInfo>} */
  const formHandler = new FormHandler({defaults: item || defaults});
  const textFields = ["id", "name", "image"];
  
  /** @param {{close: ()=>void}} param */
  function RootComponent({close}) {
    const renderTick = CreateRenderTick();
    const [saveInProgress, setSaveInProgress] = useState(false);

    const onClose = ()=>{
      if (saveInProgress) return;
      close();
    }

    const onSave = () =>{
      let data = formHandler.getValues();
      formHandler.clearErrors();
      for (let it of textFields.concat(["dockerRegistryId"])) {
        //@ts-ignore
        if (!data[it]) {
          formHandler.addError(it);
        }
      }
      if (!item && sharedDataIds.includes(data.id)) {
        formHandler.addError("id");
      }
      if (!data.dataPath.length || data.dataPath.findIndex(it=>!it || it[0] !== "/") >= 0) {
        formHandler.addError("dataPath");
      }

      if (formHandler.hasErrors()) {
        console.log(formHandler.errors)
        renderTick();
        return;
      }
      SaveDBModalCall(data, setSaveInProgress, close, 'sharedData');    
    }

    return (
      <Modal
        hideBackdrop={true}
        open
        onClose={onClose}
        >
        <div className='SharedDataModal noSelect'>
          <fieldset disabled={saveInProgress}>
          <form>
            <div className='FormContent'>
              <FormControlLabel
                className='fr'
                control={
                  <Checkbox
                    {...formHandler.register("hidden", {controlType: 'checkbox'})}
                />}
                label="Hidden"
              />
              <Typography variant="h6" component="h2">
                {item ? "Edit SharedData item" : "Add new SharedData"}
              </Typography>
              <Divider className='w100'/>
              <div className='flexCol'>
                <Grid container spacing={3} columns={12}>
                  {textFields.map(it=>(<Fragment key={it}>
                    <Grid item xs={3}>
                      <InputLabel>
                        {MakeName(it)}
                      </InputLabel>
                    </Grid>
                    <Grid item xs={8}>
                      <Input
                        {...formHandler.register(it)}
                        disabled={item && it === "id"}
                        error={formHandler.errors[it]}
                      />
                    </Grid></Fragment>))}
                </Grid>
                <TextField
                  select
                  label="Docker Registry"
                  variant='outlined'
                  {...formHandler.register("dockerRegistryId")}
                  error={formHandler.errors.dockerRegistryId}
                  >
                    {dockerRegisties.map(it=>(
                      <MenuItem key={it.id} value={it.id}>
                        {it.name}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  {...formHandler.register("dataPath", {controlType: 'textarea'})}
                  label="Data Path"
                  error={formHandler.errors.dataPath}
                  multiline
                  maxRows={4}
                />
              </div>
              <Divider />
              <Button
                disabled={saveInProgress}
                variant="contained"
                onClick={onSave}
                >
                <SaveIcon />Save
              </Button>
              <Button
                className='fr'
                disabled={saveInProgress}
                variant="contained"
                onClick={onClose}
                >
                <CloseIcon />Cancel
              </Button>
            </div>
          </form>
          </fieldset>
        </div>
      </Modal>);
  }

  AddModal(RootComponent, {})
}