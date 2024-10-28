import { useState, useContext, useMemo, Fragment, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Badge from '@mui/material/Badge';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import { useForm, Controller } from 'react-hook-form';

import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PlusIcon from '@mui/icons-material/Add';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import CheckIcon from '@mui/icons-material/Check';
import EditNoteIcon from '@mui/icons-material/EditNote';

import './DeployUpdrageModal.css';
import { 
  dockerEnginesInfoContext,
  bundlesInfoContext,
  sharedDataInfoContext,
  buildersInfoContext,
 } from '../common/Contexts';
import { DockerRPC } from '../../common/Actions';
import { ModalError } from '../../modals/ShowModal';
import { AddModal } from '../../modals/ModalManager';
import { OverrideParamsComponent, SimpleParams, simpleKeys, BundleSelector, AddonRowHeader } from './components/DeployComponentsOrg';
import { CreateRenderTick } from '../../common/utils';

const preventEnter = (/**@type {any}*/e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
};

const Panel = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: "5px",
  // margin: "5px 5px",
  // marginTop: "5px",
  marginRight: "5px",
  // textAlign: 'center',
  color: theme.palette.text.secondary,
  flexGrow: 1,
  border: "1px solid #465c5f",
}));


/** @typedef {{fixedBundleInfo?: BundleInfo, fixedEngineId?: string}} DeployModalParams  */

/** @param {DeployModalParams & {close: ()=>void}} param0  */
function DeployModal({fixedBundleInfo = undefined, close, fixedEngineId = undefined}) {
  const renderTick = CreateRenderTick();
  /** @ts-ignore @type {ReactState<string[]>} */
  const [addons, setAddons] = useState([]);
  /** @ts-ignore @type {ReactState<string[]>} */
  const [overrrides, setOverrides] = useState([]);
  const [exportMode, setExportMode] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const dockerEnginesInfo = useContext(dockerEnginesInfoContext);
  const filteredEngines = useSelector((/** @type {ReduxStoreType}*/state) => state.filteredEngines);
  const {otherEngines, allEnginesIds} = useMemo(()=>{
    const allEnginesIds = dockerEnginesInfo.map(it=>it.id);
    const otherEngines =  allEnginesIds.filter(it=>!filteredEngines.ids.includes(it));
    return {otherEngines, allEnginesIds};
  }, [filteredEngines, dockerEnginesInfo]);
  const sharedDataInfo = useContext(sharedDataInfoContext);
  const sharedDataIds = useMemo(()=>sharedDataInfo.map(it=>it.id), [sharedDataInfo]);
  const bundlesInfo = useContext(bundlesInfoContext);
  // const [bundleToDeployId, setBundleToDeployId] = useState(fixedBundleInfo?.id || bundlesInfo[0]?.id);
  // const bundleToDeployId = getValues("bundleId") || fixedBundleInfo?.id || bundlesInfo[0]?.id || null;
  const defaultEngineId = fixedEngineId || localStorage.getItem("lastDeployedEngineId") || "";
  // const [engineId, setEngineId] = useState(lastDeployEngineId);
  
  const defaultValues = useMemo(()=>{
    const userTag = localStorage.getItem("userTag") || "Nemo";
    /** @type {{[x:string]: any}} */
    let def = {
      bundleId: fixedBundleInfo?.id || bundlesInfo[0]?.id,
      comment: userTag  + ": ",
      bindHostTZ: true,
      monitorDumps: true,
      target: defaultEngineId,
    };
    return def;
  }, [])

  const usedForm = useForm({shouldUnregister: true, reValidateMode: "onSubmit", mode: "onSubmit", defaultValues});
  const { register, handleSubmit, getValues, setValue, formState: { errors }, clearErrors, setError } = usedForm;

  useEffect(()=>{
    // react-hook-form crutch:
    // without defaultValues passed to useForm - local render dont see this setValue result on first render
    // without setValue here - child components dont see defaults on first render...
    for (const [prop, value] of Object.entries(defaultValues)) {
      setValue(prop, value);
    }
  }, [])

  //@ts-ignore
  const mregister = (key, options)=>({...register(key, options), error: hasError(key)})
  const hasError = (/** @type {string}*/key)=>{
    let error = errors;
    for (const prop of key.split(".")) {
      //@ts-ignore
      error = error?.[prop];
    }
    return !!error;
  }
  // console.log("errors", errors)

  const bundleId = getValues("bundleId");
  console.log("bundleId", bundleId);
  const buildersInfo = useContext(buildersInfoContext);
  const {builderInfo, chosenBundleInfo, bundlesIds} = useMemo(()=>{
    const bundlesIds = bundlesInfo.map(it=>it.id)
    const chosenBundleInfo = bundlesInfo.find(it=>it.id === bundleId);
    const builderInfo = !!chosenBundleInfo && buildersInfo.find(it=>it.id === chosenBundleInfo.builderId);
    if (!builderInfo) return {};
    /** @type {{[pcid: string]: ImageBuilderInfo}} */
    const pcidBuilderInfo = {};
    for (const it of builderInfo.images) {
      pcidBuilderInfo[it.pcid] = it;
    }
    return {builderInfo, chosenBundleInfo, bundlesIds}
  }, [buildersInfo, bundleId, bundlesInfo]);

  const onDeploy = async()=>{
    try {
      setSaveInProgress(true);
      let sdata = JSON.stringify(getValues(), null, 2);
      console.log("deploy form data", sdata)
      let data = JSON.parse(sdata);
      clearErrors();
      if (!allEnginesIds.includes(data.target)) setError("target", {type: 'value'});
      if (!data.bundleId) setError("bundleId", {type: 'required'});
      /** @type {DeployBundleRequest} */
      let request = {
        comment: data.comment,
        bindHostTZ: data.bindHostTZ,
        addSniffer: data.addSniffer,
        autoRestart: data.autoRestart,
        collectPerformanceData: data.collectPerformanceData,
        monitorDumps: data.monitorDumps,
        bundleId: data.bundleId,
        pcidsToAdd: data.pcidsToAdd,
        overrides: data.overrides,
        userTag: localStorage.getItem("userTag") || "Nemo",
        dockerEngineFilters: [data.target],
        keepAlive: true,
      };
      console.log("request", JSON.stringify(request, null, 2))
      console.log("errors", usedForm.formState.isValid)
      return setSaveInProgress(false);
      await DockerRPC({dockerId: data.target, fname: "addPack", args: [request]});
      localStorage.setItem("lastDeployedEngineId", data.target);
      close();
    } catch (error) {
      //@ts-ignore
      ModalError({error})
      setSaveInProgress(false);
    }
  };

  /** @param {string} pcid */
  const markAdd = (pcid) => {
    setAddons([...addons, pcid]);
  }
  
  /** @param {string} pcid */
  const removeAddon = (pcid) => {
    setAddons(addons.filter(it=>it !== pcid));
  }
  
  /** @param {string} pcid */
  const markOverride = (pcid) => {
    // setValue("overrides." + pcid + ".imageFromBundleId", bundleToDeployId);
    setOverrides([...overrrides, pcid]);
  }
  
  /** @param {string} pcid */
  const removeOverride = (pcid) => {
    setOverrides(overrrides.filter(it=>it !== pcid));
  }

  const renderAddon = (/** @type {string} */pcid)=>{
    const countKey = "pcidsToAdd." + pcid;
    return <Panel key={countKey}>
      <AddonRowHeader
        name={countKey}
        pcid={pcid}
        removeAddon={removeAddon}
        usedForm={usedForm}
        />
    </Panel>
  }

  const renderOverride = (/** @type {string} */pcid)=>{
    if (!builderInfo || !bundlesIds) return "";
    const overridePrefix = "overrides." + pcid + ".";
    return <Panel key={overridePrefix} className='flexCol'>
      <div className='flexRow'>
        <Tooltip title="Cancel override">
          <Button onClick={()=>removeOverride(pcid)} color="warning">
            Cancel<EditNoteIcon color="error"/>
          </Button>
        </Tooltip>
        <Typography variant='h6' color='text.primary'>Override: {pcid}</Typography>
      </div>
      <OverrideParamsComponent
        pcid={pcid}
        usedForm={usedForm}
        sharedDataIds={sharedDataIds}
        prefix={overridePrefix}
        builderInfo={builderInfo}
        bundlesIds={bundlesIds}
        />
    </Panel>
  }

  console.log(getValues("bundleId"))

  return (<>
    <Modal
      hideBackdrop={true}
      disableRestoreFocus
      disableEscapeKeyDown
      open
      onClose={close}
      >
      <div className="DeployUpdrageModal">
        <Typography id="modal-modal-title" variant="h6" component="h2">{fixedBundleInfo ? `Deploy bundle(${fixedBundleInfo.id})` : fixedEngineId ? `Deploy To(${fixedEngineId})` : "Deploy"}</Typography>
        <Divider />
        <fieldset disabled={saveInProgress}>
        <form onSubmit={handleSubmit(onDeploy)}>
        <div className='FormContent flexRow mc'>
          {exportMode && 
            <div className='flexCol pcidList'>
              {chosenBundleInfo?.imagesToDeploy.map(it=>{
                let markedOverride = overrrides.includes(it.pcid);
                let markedAdd = addons.includes(it.pcid);
                return <Panel className='flexRow' key={it.pcid}>
                  <Tooltip title="Override">
                    <span>
                      <Badge badgeContent={<CheckIcon/>} invisible={!markedOverride}>
                        <IconButton onClick={()=>markOverride(it.pcid)} disabled={markedOverride} color="success">
                          <EditNoteIcon/>
                        </IconButton>
                      </Badge>
                    </span>
                  </Tooltip>
                  <Tooltip title="Add">
                    <span>
                      <Badge badgeContent={<CheckIcon/>} invisible={!markedAdd}>
                        <IconButton onClick={()=>markAdd(it.pcid)} disabled={markedAdd} color="info">
                          <PlusIcon/>
                        </IconButton>
                      </Badge>
                    </span>
                  </Tooltip>
                  <Tooltip title={it.pcid}><Typography variant='body1'>{it.pcid.slice(-16)}</Typography></Tooltip>
                </Panel>})}
            </div>}
            <div className='flexCol detailsCol'>
              <div className='flexRow'>
                  <BundleSelector
                    disabled={!!fixedBundleInfo}
                    onBundleChange={renderTick}
                    required={true}
                    bundleFormName={"bundleId"}
                    usedForm={usedForm}
                    />
                <TextField
                  {...mregister("target")}
                  disabled={!!fixedEngineId}
                  label="Target Host"
                  defaultValue={defaultEngineId}
                  select
                  SelectProps={{MenuProps: {PaperProps: {style: {maxHeight: "300px"}}}}}
                  sx={{width: "250px"}}
                  >
                    {defaultEngineId && <MenuItem key="defaultEngineId" value={defaultEngineId}>{defaultEngineId}</MenuItem>}
                    <ListSubheader>Filtered</ListSubheader>
                    {filteredEngines.ids.map(it=>(<MenuItem key={it} value={it}>{it}</MenuItem>))}
                    <ListSubheader>Others</ListSubheader>
                    {otherEngines.map(it=>(<MenuItem key={it} value={it}>{it}</MenuItem>))}
                </TextField>
              </div>
              <SimpleParams usedForm={usedForm} defaults={defaultValues}/>
              {!exportMode && <Button onClick={()=>setExportMode(true)} className='info'>Enter export mode</Button>}
              {exportMode && chosenBundleInfo?.imagesToDeploy.map(it=>{
                const pcid = it.pcid;
                return <Fragment key={pcid}>
                  {addons.includes(pcid) && renderAddon(pcid)}
                  {overrrides.includes(pcid) && renderOverride(pcid)}
                </Fragment>
              })}
              <div className="scrollBlinkWorkaround"/>
            </div>
        </div>
        <Divider />
        <Button autoFocus disabled={saveInProgress} variant="contained" size="small" startIcon={<SaveIcon />} type="submit" color="success">Deploy</Button>
        <Button disabled={saveInProgress} variant="contained" size="small" startIcon={<CloseIcon />} onClick={close} sx={{float: "right"}} >Cancel</Button>
        </form>
        </fieldset>
      </div>
    </Modal>
  </>);
}

/** @param {DeployModalParams} params */
export default function ShowDeployModal(params) {
  AddModal(DeployModal, params);
}