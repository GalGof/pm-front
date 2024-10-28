import { useState, Fragment, useCallback } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';
import Modal from '@mui/material/Modal';
import Divider from '@mui/material/Divider';

import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import './DockerRegistryModal.css';
import { SaveDBModalCall, } from '../../common/Actions';
import { CreateRenderTick } from '../../common/utils';
import { AddModal } from '../../modals/ModalManager';
import store from '../../app/Store';
import { FormHandler } from '../../common/FormHandler';

function MakeName(/** @type {string}*/str)
{
  return str[0].toUpperCase() + str.slice(1);
}

/** @param {{item?: DockerRegistryInfo }} [param] */
export default function ShowDockerRegistryModal({item} = {})
{
  /** @type {DockerRegistryInfo} */
  const defaults = {
    id: "",
    name: "",
    address: "",
  }
  const regisriesIds = store.getState().dockerRegistriesInfo.ids;

  /** @type {FormHandler<DockerRegistryInfo>} */
  const formHandler = new FormHandler({defaults: item || defaults});

  const mainFields = ["id", "name", "address"];

  /** @param {{close: ()=>void}} param */
  function RootComponent({close}) {
    const renderTick = CreateRenderTick();
    const [saveInProgress, setSaveInProgress] = useState(false);

    const onSave = useCallback(()=>{
      const data = formHandler.getValues();
      formHandler.clearErrors();
      for (let it of mainFields) {
        //@ts-ignore
        if (!data[it]) {
          formHandler.addError(it);
        }
      }
      if (!item && regisriesIds.includes(data.id)) {
        formHandler.addError("id");
      }
      if (formHandler.hasErrors()) {
        renderTick();
        return;
      }
      SaveDBModalCall(data, setSaveInProgress, close, 'dockerRegistries');
    }, []);

    const onClose = useCallback(()=>{
      if (saveInProgress) return;
      close();
    }, [saveInProgress]);

    return (<>
      <Modal
        hideBackdrop={true}
        // open={opened}
        open
        onClose={onClose}
        >
        <div className='DockerRegistryModal noSelect'>
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
              {item ? "Edit registry item" : "Add new registry"}
            </Typography>
            <Divider className='w100'/>
            <Grid container spacing={3} columns={12}>
              {mainFields.map(it=>(<Fragment key={it}>
                <Grid item xs={3}>
                  <InputLabel>
                    {MakeName(it)}
                  </InputLabel>
                </Grid>
                <Grid item xs={8}>
                  <Input
                    disabled={item && it === "id"}
                    {...formHandler.register(it)}
                    error={formHandler.errors[it]}
                  />
                </Grid></Fragment>))}
            </Grid>
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
      </Modal>
    </>);
  }

  AddModal(RootComponent, {});
}