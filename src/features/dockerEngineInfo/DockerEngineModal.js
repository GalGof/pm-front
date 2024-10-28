import { useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import Modal from '@mui/material/Modal';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';

import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import './DockerEngineModal.css';
import { SaveDBModalCall } from '../../common/Actions';
import { CreateRenderTick } from '../../common/utils';
import { AddModal } from '../../modals/ModalManager';
import { FormHandler } from '../../common/FormHandler';
import store, { useSelector } from '../../app/Store';
import BorderedSection from '../../common/BorderedSection';

const ipOkRegex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/

/** @param {{id?: string}} [args] */
export default function ShowDockerEngineModal({id} = {}) {
  const state = store.getState();
  const item = id ? state.dockerEnginesInfo.entries[id] : null;
  /** @type {DockerEngineInfo} */
  const defaults = {
    id: "",
    name: "",
    bananasLimit: 100,
    connection: {
      host: "",
      protocol: "ssh",
    },
    labels: [],
    network: {
    }
  }

  const sysLabels = state.globals.engineFeatureLabels;
  const labelOptions = sysLabels.automation.concat(sysLabels.builder)

  /** @type {FormHandler<DockerEngineInfo>} */
  const formHandler = new FormHandler({defaults: item || defaults});

  /**
   * @param {string} path 
   * @param {()=>void} renderTick 
   */
  const onBlurValueCheck = (path, renderTick)=>{
    if (formHandler.getValue(path)) {
      formHandler.removeError(path);
    } else {
      formHandler.addError(path);
    }
    renderTick();
  }

  function BananasLimit({})
  {
    const renderTick = CreateRenderTick();
    //@ts-ignore
    const setBananas = useCallback((e)=>{
      let sdigit = e.target.value.match(/\d+/);
      if (!sdigit) return;
      let digit = Math.min(Math.max(+sdigit[0], 0), 9999)
      formHandler.setValue("bananasLimit", digit);
      renderTick();
    }, [])
    return (
    <TextField
      label="Bananas Limit"
      id="bananasLimit"
      {...formHandler.register("bananasLimit", {defaultPropName: null})}
      onChange={setBananas}
      value={formHandler.values.bananasLimit}
      />)
  }

  /**
   * @this {*}
   * @param {object} param
   * @param {string} param.label
   * @param {string} param.path
   * @param {*} [param.params]
   * @param {boolean} [param.checkValue]
   */
  function OptionalParam({label, path, params, checkValue = false})
  {
    const renderTick = CreateRenderTick();
    const [active, setActive] = useState(formHandler.getDefault(path) !== null);
    const onBlur = useCallback(onBlurValueCheck.bind(this, path, renderTick), []);

    const add = useCallback(()=>{
      // field was added, edited, removed, added...
      formHandler.removeError(path);
      formHandler.setValue(path, formHandler.getDefault(path));
      setActive(true)
    }, []);
    const remove = useCallback(()=>setActive(false), []);
    return <div className='OptionalParam'>
      {active 
        ? <TextField
            {...formHandler.register(path, {defaultPropName: !!params ? null : "defaultValue"})}
            {...(params || {})}
            label={label}
            onBlur={checkValue ? onBlur : undefined}
            id={path}
            error={formHandler.errors[path]}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    color="warning"
                    className="removeParamIcon"
                    size="small"
                    onClick={remove}
                    >
                    <DeleteForeverIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        : <Button onClick={add}><AddIcon/>{label}</Button>}
    </div>
  }

  function ConnectionPort({})
  {
    const renderTick = CreateRenderTick();
    //@ts-ignore
    const setPort = (e)=>{
      let sdigit = e.target.value.match(/\d+/);
      if (!sdigit) return;
      let digit = Math.min(Math.max(+sdigit[0], 1), 65535)
      formHandler.setValue("connection.port", digit);
      renderTick();
    };

    return (
      <OptionalParam
        path="connection.port"
        label="Port"
        params={{
          onChange: setPort,
          value: formHandler.values.connection?.port || 22,
        }}
      />
    )
  }

  const protocolOptions = ["https", "http", "ssh"];
  /** @this {*} */
  function Connection({})
  {
    const hostPath = "connection.host";
    const renderTick = CreateRenderTick();
    const onHostBlur = useCallback(onBlurValueCheck.bind(this, hostPath, renderTick), []);

    return (
      <BorderedSection title="Connection">
        <div className='flexRow'>
          <TextField
            {...formHandler.register(hostPath)}
            onBlur={onHostBlur}
            label="Host"
            error={formHandler.errors[hostPath]}
            variant="outlined"
            />
          <Autocomplete
            {...formHandler.register("connection.protocol")}
            id="connection.protocol"
            disableClearable
            options={protocolOptions}
            // @ts-ignore
            renderInput={(params) => (
              <TextField
                label="Protocol"
                error={formHandler.errors["connection.protocol"]}
                {...params}
                className='protocol'
                variant="outlined"
                />)}
          />
          <ConnectionPort/>
        </div>
        <div className='flexRow'>
          <OptionalParam
            path="connection.sshKey"
            label="SSH Key"
            checkValue={true}
          />
          <OptionalParam
            path="connection.username"
            label="Username"
            checkValue={true}
          />
          <OptionalParam
            path="connection.password"
            label="Password"
          />
        </div>
      </BorderedSection>)
  }

  function IpList({})
  {
    const path = "network.ipList";
    const label = "IP list";
    const [active, setActive] = useState(formHandler.getDefault(path) !== null);

    const renderTick = CreateRenderTick();
    const add = useCallback(()=>setActive(true), []);
    const remove = useCallback(()=>setActive(false), []);

    const onChange = useCallback(
      /**
       * @param {*} e 
       * @param {string[]} value 
       */
      (e, value)=>{
        if (value.find(it=>!it.match(ipOkRegex))) {
          formHandler.addError(path);
        } else {
          formHandler.removeError(path);
          formHandler.setValue(path, value);
        }
        renderTick();
    }, [])

    return <div className='flexRow ipLIst'>
      {active 
        ? <>
            <IconButton
              color="warning"
              className="removeIcon"
              size="small"
              onClick={remove}
              >
              <DeleteForeverIcon />
            </IconButton>
            <Autocomplete
              {...formHandler.register(path, {controlType: 'autocompleteMultiple'})}
              onChange={onChange}
              multiple
              freeSolo
              options={[]}
              // label={label}
              id={path}
              variant="outlined"
              // @ts-ignore
              renderInput={(params) => (
                <TextField
                  label={label}
                  error={formHandler.errors[path]}
                  {...params}
                  variant="outlined"
                />
              )}
            />
          </>
        : <Button onClick={add}><AddIcon/>{label}</Button>}
    </div>
  }

  function IpRange({})
  {
    const path = "network.ipRange";
    const label = "IP range";
    const pathStart = path + ".start";
    const pathCount = path + ".count";
    const renderTick = CreateRenderTick();
    const [active, setActive] = useState(formHandler.getDefault(path) !== null);

    const add = useCallback(()=>setActive(true), []);
    const remove = useCallback(()=>setActive(false), []);

    //@ts-ignore
    const setCount = useCallback((e)=>{
      let sdigit = e.target.value.match(/\d+/);
      if (!sdigit) return;
      let digit = Math.min(Math.max(+sdigit[0], 1), 255)
      formHandler.setValue(pathCount, digit);
      renderTick();
    }, []);

    const onStartBlur = ()=>{
      if (formHandler.getValue(pathStart)?.match(ipOkRegex)) {
        formHandler.removeError(pathStart);
      } else {
        formHandler.addError(pathStart);
      }
      renderTick();
    }

    return <div className='flexRow ipRange'>
      {active 
        ? <>
            <IconButton
              color="warning"
              className="removeIcon"
              size="small"
              onClick={remove}
              >
              <DeleteForeverIcon />
            </IconButton>
            <TextField
              {...formHandler.register(pathStart)}
              label="Start address"
              onBlur={onStartBlur}
              id={pathStart}
              error={formHandler.errors[pathStart]}
              variant="outlined"
            />
            <TextField
              {...formHandler.register(pathCount, {defaultPropName: null, defaultValue: 1})}
              onChange={setCount}
              value={formHandler.getValue(pathCount)}
              label="Count"
              id={pathCount}
              error={formHandler.errors[pathCount]}
              variant="outlined"
            />
          </>
        : <Button onClick={add}><AddIcon/>{label}</Button>}
    </div>
  }

  function Network({})
  {
    return (
      <BorderedSection title="Network">
        <IpRange/>
        <IpList/>
      </BorderedSection>)
  }

  /** 
   * @param {{close: ()=>void}} param
   * @this {*}
   * */
  function RootComponent({close})
  {
    console.log("DockerEngineModal root");
    const renderTick = CreateRenderTick();
    const dockerEnginesIds = useSelector(state => state.dockerEnginesInfo.ids);
    const [saveInProgress, setSaveInProgress] = useState(false);

    const onSave = async ()=>{
      let data = formHandler.getValues();
      if (!item && dockerEnginesIds.find(it=>it === data.id) || !data.id) {
        formHandler.addError("id");
      } else {
        formHandler.removeError("id");
      }
      for (let it of ["host", "sshKey", "username"]) {
        //@ts-ignore
        if (!data.connection[it] && data.connection[it] !== undefined) {
          formHandler.addError("connection." + it);
        } else {
          formHandler.removeError("connection." + it);
        }
      }
      if (data.network.ipRange && !data.network.ipRange.start?.match(ipOkRegex)) {
        formHandler.addError("network.ipRange.start");
      } else {
        formHandler.removeError("network.ipRange.start");
      }
      if (data.network.ipList && data.network.ipList.findIndex(it=>!it.match(ipOkRegex)) >= 0) {
        formHandler.addError("network.ipList");
      } else {
        formHandler.removeError("network.ipList");
      }
      if (formHandler.hasErrors()) {
        renderTick();
        return;
      }
      
      SaveDBModalCall(data, setSaveInProgress, close, 'dockerEngines');
    }

    const onClose = ()=>{
      if (saveInProgress) return;
      close();
    }

    const onIdBlur = useCallback(onBlurValueCheck.bind(this, "id", renderTick), []);

    return (<>
      <Modal
        hideBackdrop={true}
        disableEscapeKeyDown
        open
        onClose={onClose}
        >
        <div className='DockerEngineModal noSelect'>
        <fieldset disabled={saveInProgress}>
        <form>
          <div className='FormContent'>
          <FormControlLabel
            sx={{float: 'right'}}
            control={
              <Checkbox
                {...formHandler.register("disabled", {controlType: 'checkbox'})}
              />}
            label="Disabled"
          />
          <Typography variant="h6" component="h2">
            {item ? "Edit engine item" : "Add new engine"}
          </Typography>
          <Divider className='w100'/>
          <div className='flexCol'>
            <div className='flexRow'>
              <TextField
                disabled={!!item}
                label="Id"
                {...formHandler.register("id")}
                onBlur={onIdBlur}
                error={formHandler.errors["id"]}
              />
              <TextField
                label="Name"
                {...formHandler.register("name")}
              />
              <BananasLimit />
              <FormControlLabel
                label="Auto set core pattern"
                control={
                  <Checkbox
                  {...formHandler.register("autoSetCorePattern", {controlType: 'checkbox'})}
                  />}
              />
            </div>
            <Autocomplete
              {...formHandler.register("labels", {controlType: 'autocompleteMultiple'})}
              multiple
              freeSolo
              options={labelOptions}
              // @ts-ignore
              renderInput={(params) => (
                <TextField
                  label="Labels"
                  error={formHandler.errors["labels"]}
                  {...params}
                  variant="outlined"
                  />)}
            />
            <Connection/>
            <Network/>
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
      </Modal>
    </>);
  }

  AddModal(RootComponent, {})
}
