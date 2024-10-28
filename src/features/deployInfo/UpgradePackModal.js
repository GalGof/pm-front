import { useState, useContext, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux'
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';

import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import PlusIcon from '@mui/icons-material/Add';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import CheckIcon from '@mui/icons-material/Check';

import './DeployUpdrageModal.css';
import { DockerRPC } from '../../common/Actions';
import { ModalError } from '../../modals/ShowModal';
import { AddModal } from '../../modals/ModalManager';
import { OverrideParamsComponent, SimpleParams, simpleKeys, AddonRowHeader } from './DeployComponents';
import { FormHandler } from '../../common/FormHandler';
import { CreateRenderTick } from '../../common/utils';
import VirtualizedSelect from '../../common/VirtualizedSelect';

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
  // marginRight: "5px",
  // textAlign: 'center',
  color: theme.palette.text.secondary,
  flexGrow: 1,
  border: "1px solid #465c5f",
}));

const canvas = document.createElement('canvas');

/**
 * @param {object} param
 * @param {string=} [param.defaultBuilderId]
 * @param {(value: string)=>void} param.onBundlePeeked
 */
function BundlePeeker({onBundlePeeked=()=>{}, defaultBuilderId})
{
  const buildersIds = useSelector((/** @type {ReduxStoreType}*/state) => state.builders.ids);
  const bundlesInfo = useSelector((/** @type {ReduxStoreType}*/state) => state.bundles.entries);
  /** @type {React.MutableRefObject<HTMLInputElement|null>} */
  const bundleRef = useRef(null);
  
  const [selectedBuilderId, setSelectedBuilder] = useState(defaultBuilderId || null);

  const filteredBundlesIds = useMemo(()=>{
      return Object.values(bundlesInfo)
        .filter(it=>!selectedBuilderId || it.builderId === selectedBuilderId)
        .map(it=>it.id);
    }, [bundlesInfo, selectedBuilderId]);

  /** @param {any} e @param {string|null} value */
  const onBuilderChange = (e, value)=>{
    setSelectedBuilder(value);
  }

  /** @param {any} e @param {string|null} value */
  const onBundleChange = (e, value)=>{
    console.log("onBundleChange", value);
    if (value) onBundlePeeked(value);
    if (bundleRef.current) bundleRef.current.blur();
  }

  return <Panel className="flexRow BundleSelector">
    <VirtualizedSelect
      value={selectedBuilderId}
      options={buildersIds}
      label={"Bundles filter"}
      onChange={onBuilderChange}
      onKeyDown={preventEnter}
      />
    <VirtualizedSelect
      iprops={{inputRef: bundleRef}}
      value={null}
      options={filteredBundlesIds}
      label={"Set bundle for changes"}
      onChange={onBundleChange}
      onKeyDown={preventEnter}
      />
 </Panel>
}

/** @param {{item: DeployedInfo}} param  */
export default async function UpgradePackModal({item}) {
  const dockerId = item.dockerEngineId;
  /** @type {{[containerId: string|symbol]: Promise<Dockerode.ContainerInspectInfo>}}*/
  const inspectCache = {};
  const inspectInfo = new Proxy(inspectCache, {
    get(target, prop) {
      if (!target[prop]) {
        target[prop] = DockerRPC({dockerId, fname: "containerInspect", args: [{id: prop}]}).catch(()=>{delete target[prop]});
      }
      return target[prop];
    }
  })
  /** @type {{[pcid: string]: number}} */
  const pcidCount = {};
  for (const info of item.containersInfo) {
    if (!pcidCount[info.pcid]) {
      pcidCount[info.pcid] = 0;
    }
    pcidCount[info.pcid]++;
  }

  function DynamicControl(/**@type {{close: ()=>void}}*/{close})
  {
    const renderTick = CreateRenderTick();
    // console.log("UpgradePackModal render");
    const [saveInProgress, setSaveInProgress] = useState(false);
    const buildersInfo = useSelector((/** @type {ReduxStoreType}*/state) => state.builders.entries);
    const bundlesIds = useSelector((/** @type {ReduxStoreType}*/state) => state.bundles.ids);
    const bundlesInfo = useSelector((/** @type {ReduxStoreType}*/state) => state.bundles.entries);
    const sharedDataIds = useSelector((/** @type {ReduxStoreType}*/state) => state.sharedDataInfo.ids);
    const {builderInfo, pcidBuilderInfo} = useMemo(()=>{
      const builderInfo = buildersInfo[item.builderId];
      if (!builderInfo) throw new Error("Pack's builder info not found");
      /** @type {{[pcid: string]: ImageBuilderInfo}} */
      const pcidBuilderInfo = {};
      for (const it of builderInfo.images) {
        pcidBuilderInfo[it.pcid] = it;
      }
      return {builderInfo, pcidBuilderInfo}
    }, [buildersInfo]);
    const lastBuilderBundle = useMemo(
      ()=>bundlesIds.find(id=>bundlesInfo[id].builderId === item.builderId),
      [bundlesInfo, bundlesIds])

      /** @typedef {{change: "add", info: DeployedContainerInfo, bundleId: string}} changeAdd */
    /** @typedef {{change: "update", info: DeployedContainerInfo, bundleId: string}} changeUpdate */
    /** @typedef {{change: "delete", info: DeployedContainerInfo}} changeDelete */

    /** @ts-ignore @type {ReactState<changeAdd[]>} */
    const [achanges, setAChanges] = useState([]);
    /** @ts-ignore @type {ReactState<changeUpdate[]>} */
    const [uchanges, setUChanges] = useState([]);
    /** @ts-ignore @type {ReactState<changeDelete[]>} */
    const [dchanges, setDChanges] = useState([]);

    const defaultValues = useMemo(()=>{
      /** @type {{[x:string]: any}} */
      let def = {
        comment: item.comment,
      };
      for (const it of simpleKeys) {
        //@ts-ignore
        def[it.prop] = !!item[it.prop];
      }
      return def;
    }, [])
    const formHandler = useMemo(()=>new FormHandler({defaults: defaultValues}), []);

    /** @param {DeployedContainerInfo} info */
    const markDelete = (info) => {
      setDChanges([{change: "delete", info}, ...dchanges]);
    }

    /** @param {DeployedContainerInfo} info */
    const cancelUpdate = (info)=>{
      setUChanges(uchanges.filter(q=>q.info.id !== info.id));
    }

    /** @param {DeployedContainerInfo} info */
    const cancelDelete = (info)=>{
      setDChanges(dchanges.filter(q=>q.info.id !== info.id));
    }

    /** @param {DeployedContainerInfo} info */
    const markUpdate = (info) => {
      setUChanges([{change: "update", info, bundleId: info.bundleId || item.initialBundleId}, ...uchanges]);
      formHandler.setValue("update." + info.id + ".override.imageFromBundleId", lastBuilderBundle);
    }

    /** @param {DeployedContainerInfo} info */
    const markAdd = (info) => {
      formHandler.setValue("pcidsToAdd." + info.pcid + ".override.imageFromBundleId", info.bundleId);
      setAChanges([{change: "add", info, bundleId: info.bundleId || item.initialBundleId}, ...achanges]);
    }

    /** @param {string} pcid */
    const removeAddon = (pcid)=>{
      setAChanges(achanges.filter(q=>q.info.pcid !== pcid || q.change !== "add"));
    }
    
    /** @type {(value: string)=>void} */
    const setBundleForAll = (value)=>{
      for (const it of achanges) {
        formHandler.setValue("pcidsToAdd." + it.info.pcid + ".override.imageFromBundleId", value);
      }
      for (const it of uchanges) {
        formHandler.setValue("update." + it.info.id + ".override.imageFromBundleId", value);
      }
      renderTick();
    }

    const onAction = async ()=>{
      setSaveInProgress(true);
      let data = formHandler.getValues();
      try {
        const pcidsToAdd = [];
        for (const [pcid, it] of Object.entries(data.pcidsToAdd || {})) {
          pcidsToAdd.push({...it, pcid, count: +it.count})
        }
        const containersToUpgrade = [];
        for (const [id, it] of Object.entries(data.update || {})) {
          containersToUpgrade.push({id, ...it})
        }
        /** @type {UpgradeDeployedRequest} */
        let request = {
          packId: item.id,
          comment: data.comment,
          bindHostTZ: data.bindHostTZ,
          addSniffer: data.addSniffer,
          autoRestart: data.autoRestart,
          collectPerformanceData: data.collectPerformanceData,
          monitorDumps: data.monitorDumps,
          pcidsToAdd,
          containersToDelete: dchanges.map(it=>it.info.id),
          containersToUpgrade,
          userTag: localStorage.getItem("userTag") || "Nemo",
        };
        console.log("request", JSON.stringify(request, null, 2))
        // if (isDevEnv) throw new Error("test");
        await DockerRPC({dockerId, fname: "upgradePack", args: [request]}).then(close);
      } catch (error) {
        //@ts-ignore
        ModalError({error})
        setSaveInProgress(false);
      }
    }

    const renderAddon = (/** @type {changeAdd}*/change)=>{
      const overridePrefix = "pcidsToAdd." + change.info.pcid + ".override.";
      const countKey = "pcidsToAdd." + change.info.pcid + ".count";
      return <Panel key={change.info.pcid}>
        <AddonRowHeader
          name={countKey}
          pcid={change.info.pcid}
          removeAddon={removeAddon}
          formHandler={formHandler}
          />
        <OverrideParamsComponent
          inspectInfo={inspectInfo}
          info={change.info}
          formHandler={formHandler}
          sharedDataIds={sharedDataIds}
          prefix={overridePrefix}
          builderInfo={builderInfo}
          bundlesIds={bundlesIds}
          />
      </Panel>
    }

    const renderUpdate = (/** @type {changeUpdate}*/change)=>{
      const overridePrefix = "update." + change.info.id + ".override.";
      return <Panel key={change.info.id} className='flexCol'>
        <div className='flexRow'>
          <Tooltip title="Cancel update"><Button onClick={()=>cancelUpdate(change.info)} color="warning">Cancel<UpgradeIcon color="error"/></Button></Tooltip>
          <Typography variant='h6' color='text.primary'>Update: {change.info.pcid}({change.info.cloneId})</Typography>
        </div>
        <OverrideParamsComponent
          inspectInfo={inspectInfo}
          info={change.info}
          formHandler={formHandler}
          sharedDataIds={sharedDataIds}
          prefix={overridePrefix}
          builderInfo={builderInfo}
          bundlesIds={bundlesIds}
          />
      </Panel>
    }

    return (
      <Modal
      hideBackdrop={true}
      open
      disableRestoreFocus
      disableEscapeKeyDown
      onClose={close}
      >
      <div className="DeployUpdrageModal">
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Upgrade ({item.id})
        </Typography>
        <Divider />
        <fieldset disabled={saveInProgress}>
        <form>
        <div className='FormContent flexRow mc'>
          <div className='flexCol pcidList'>
            {item.containersInfo.filter(it=>!it.isSysPcid)
              .sort((q, w)=>q.pcid.localeCompare(w.pcid))
              .map(it=>{
                const toDelete = !!dchanges.find(q=>q.info.id === it.id);
                const toUpdate = !!uchanges.find(q=>q.info.id === it.id);
                const toAdd = !!achanges.find(q=>q.info.pcid === it.pcid);
                const disableDelete = pcidCount[it.pcid] - dchanges.filter(q=>q.info.pcid === it.pcid).length <= 1 || toDelete || toUpdate;
                const disableUpdate = !pcidBuilderInfo[it.pcid].updatable || toDelete || toUpdate;
                const disableAdd = !pcidBuilderInfo[it.pcid].clonable || !!achanges.find(q=>q.change === "add" && q.info.pcid === it.pcid);
                return (<Panel key={it.id} className='containerRow'>
                    <div className='flexRow'>
                      <div className='controls'>
                        {toDelete
                          ? <>
                              <Tooltip title="Cancel deletion">
                                <Button onClick={()=>cancelDelete(it)} color="info">
                                  Cancel<RestoreFromTrashIcon />
                                </Button>
                              </Tooltip>
                            </> 
                          : <>
                            {/* crutch for mui focus bug. after delition canceled - first item here gets focus? & disableFocusListener on title doesnt work */}
                            <span></span>
                            <Tooltip title="Delete">
                              <span>
                                <IconButton onClick={()=>markDelete(it)} disabled={disableDelete} color="warning">
                                  <DeleteForeverIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Upgrade">
                              <span>
                                <Badge badgeContent={<CheckIcon/>} invisible={!toUpdate}>
                                  <IconButton onClick={()=>markUpdate(it)} disabled={disableUpdate} color="success">
                                    <UpgradeIcon/>
                                  </IconButton>
                                </Badge>
                              </span>
                            </Tooltip>
                            <Tooltip title="Add">
                              <span>
                                <Badge badgeContent={<CheckIcon/>} invisible={!toAdd}>
                                  <IconButton onClick={()=>markAdd(it)} disabled={disableAdd} color="info">
                                    <PlusIcon/>
                                  </IconButton>
                                </Badge>
                              </span>
                            </Tooltip>
                          </>}
                      </div>
                      <div>
                        <Tooltip title={it.pcid}>
                          <Typography variant='body1'>
                            {it.pcid.slice(-16)}({it.cloneId})
                          </Typography>
                        </Tooltip>
                        <Tooltip title={it.bundleId}>
                          <Typography id='bundleId' variant='body2'>
                            {it.bundleId?.slice(-16)}
                          </Typography>
                        </Tooltip>
                      </div>
                    </div>
                    <Tooltip title="Create timestamp">
                      <Typography id='createTime' variant='body2'>
                        {it.createTime}
                      </Typography>
                    </Tooltip>
                  </Panel>
                )}
            )}
          </div>
          <div className='flexCol detailsCol'>
            {/* //@ts-ignore */}
            <SimpleParams formHandler={formHandler}/>
            <div className='flexRow'>
              {(uchanges.length + achanges.length > 1) && 
                <BundlePeeker onBundlePeeked={setBundleForAll} defaultBuilderId={item.builderId}/>}
            </div>
            {achanges.map(renderAddon)}
            {uchanges.map(renderUpdate)}
            <div className="scrollBlinkWorkaround"/>
            </div>
        </div>
        <Divider />
        <Button onClick={onAction} autoFocus={true} color='success' disabled={saveInProgress} variant="contained" size="small" >Upgrade</Button>
        <Button className='fr' variant="contained" size="small" startIcon={<CloseIcon />} onClick={close}>Close</Button>
        </form>
        </fieldset>
      </div>
    </Modal>
    )
  }

  AddModal(DynamicControl, {});
}