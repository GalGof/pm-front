import { useState, useMemo, Fragment } from 'react';
import { useSelector } from 'react-redux'
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import PlusIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import EditNoteIcon from '@mui/icons-material/EditNote';

import './DeployUpdrageModal.css';
import { DockerRPC } from '../../common/Actions';
import { ModalError } from '../../modals/ShowModal';
import { AddModal } from '../../modals/ModalManager';
import { OverrideParamsComponent, SimpleParams, BundleSelector, AddonRowHeader } from './DeployComponents';
import { CreateRenderTick } from '../../common/utils';
import { FormHandler } from '../../common/FormHandler';

const Panel = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: "5px",
  marginRight: "5px",
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
  const dockerEnginesIds = useSelector((/** @type {ReduxStoreType}*/state) => state.dockerEnginesInfo.ids);
  const filteredEngines = useSelector((/** @type {ReduxStoreType}*/state) => state.filteredEngines);
  const {otherEngines} = useMemo(()=>{
    const otherEngines =  dockerEnginesIds.filter(it=>!filteredEngines.ids.includes(it));
    return {otherEngines};
  }, [filteredEngines, dockerEnginesIds]);
  const sharedDataIds = useSelector((/** @type {ReduxStoreType}*/state) => state.sharedDataInfo.ids);
  const bundlesIds = useSelector((/** @type {ReduxStoreType}*/state) => state.bundles.ids);
  const bundlesInfo = useSelector((/** @type {ReduxStoreType}*/state) => state.bundles.entries);
  const defaultEngineId = fixedEngineId || localStorage.getItem("lastDeployedEngineId") || "";
  
  const defaultValues = useMemo(()=>{
    const userTag = localStorage.getItem("userTag") || "Nemo";
    /** @type {{[x:string]: any}} */
    let def = {
      bundleId: fixedBundleInfo?.id || bundlesIds[0],
      comment: userTag  + ": ",
      bindHostTZ: true,
      monitorDumps: true,
      target: defaultEngineId,
    };
    return def;
  }, [])
  const formHandler = useMemo(()=>new FormHandler({defaults: defaultValues}), []);

  const bundleId = formHandler.getValue("bundleId");
  const buildersInfo = useSelector((/** @type {ReduxStoreType}*/state) => state.builders.entries);
  const {builderInfo, chosenBundleInfo} = useMemo(()=>{
    const chosenBundleInfo = bundlesInfo[bundleId];
    const builderInfo = !!chosenBundleInfo && buildersInfo[chosenBundleInfo.builderId];
    if (!builderInfo) return {};
    /** @type {{[pcid: string]: ImageBuilderInfo}} */
    const pcidBuilderInfo = {};
    for (const it of builderInfo.images) {
      pcidBuilderInfo[it.pcid] = it;
    }
    return {builderInfo, chosenBundleInfo}
  }, [buildersInfo, bundleId, bundlesInfo]);

  const onDeploy = async()=>{
    try {
      setSaveInProgress(true);
      let data = formHandler.getValues();
      formHandler.clearErrors();
      if (!dockerEnginesIds.includes(data.target)) formHandler.addError("target");
      if (!data.bundleId) formHandler.addError("bundleId");
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
      console.log("errors", formHandler.hasErrors())
      if (formHandler.hasErrors()) {
        return setSaveInProgress(false);
      }
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
        formHandler={formHandler}
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
        formHandler={formHandler}
        pcid={pcid}
        sharedDataIds={sharedDataIds}
        prefix={overridePrefix}
        builderInfo={builderInfo}
        bundlesIds={bundlesIds}
        />
    </Panel>
  }

  console.log(formHandler.getValue("bundleId"))

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
        <form>
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
                    formHandler={formHandler}
                    />
                <TextField
                  {...formHandler.register("target")}
                  disabled={!!fixedEngineId}
                  label="Target Host"
                  // defaultValue={defaultEngineId}
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
              <SimpleParams formHandler={formHandler}/>
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
        <Button onClick={onDeploy} autoFocus disabled={saveInProgress} variant="contained" size="small" startIcon={<SaveIcon />} color="success">Deploy</Button>
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