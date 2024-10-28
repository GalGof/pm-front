import { useState, useMemo, createRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux'
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlusIcon from '@mui/icons-material/Add';

import './DeployComponents.css';
import ButtonSelect from '../../common/ButtonSelect';
import { isOldMui, linuxDockerCaps } from '../../common/Config';
import VirtualizedSelect from '../../common/VirtualizedSelect';
import { CreateRenderTick } from '../../common/utils';
import { FormHandler } from '../../common/FormHandler';

const preventEnter = (/**@type {any}*/e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
};

const Panel = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: "5px",
  marginRight: "5px",
  color: theme.palette.text.secondary,
  flexGrow: 1,
  border: "1px solid #465c5f",
}));

/** @typedef {{label: string, propName: string, inputType: "multiple"|"multiline", loadOptions: {name: string, value: string[]|string}[]}} descProp */

/**
 * @param {object} param
 * @param {FormHandler} param.formHandler
 * @param {descProp} param.it
 * @param {string} param.prefix
 * @param {{[x:string]: React.RefObject<HTMLInputElement>}} param.propRefs
 * @param {string[]} [param.options]
 * @param {(name: string)=>void} param.removeProp
 */
function ParamComponent({it, prefix, formHandler, propRefs, options = [], removeProp})
{
  console.log("ParamComponent render", it.propName);
  const renderTick = CreateRenderTick();
  const key = prefix + it.propName;
  let children = <></>;
  let defaultValue = it.loadOptions[0].value;

  /** @type {(value: string)=>any} */
  const loadValue = (value)=>{
    let current = propRefs[it.propName].current;
    if (current) {
      let newValue = it.inputType === "multiline" && Array.isArray(value) ? value.join('\n') : value;
      if (it.inputType === "multiline") {
        current.value = newValue;
      }
      formHandler.setValue(key, value);
      // recalc height for multiline input,
      // redraw loaded value for autocomplete input..
      renderTick();
    }
  }

  const onRemoveProp = useCallback(()=>removeProp(it.propName), [removeProp]);
  
  if (it.inputType === "multiline") {
    children = <TextField
      {...formHandler.register(key, {defaultValue, controlType: "textarea"})}
      fullWidth
      multiline
      maxRows={12}
      inputRef={propRefs[it.propName]}
    />
  } else if (it.inputType === "multiple") {
    const freeSolo = ["udpPorts", "tcpPorts", "CapAdd"].includes(it.propName);
    children = <Autocomplete
      {...formHandler.register(key, {defaultValue})}
      onChange={(e, data) => {formHandler.setValue(key, data);renderTick()}}
      // value={formHandler.getValue(key)}
      onKeyDown={preventEnter}
      multiple
      freeSolo={freeSolo}
      options={options || []}
      // @ts-ignore
      renderInput={(params) => (
        <TextField
          error={formHandler.errors[key]}
          inputRef={propRefs[it.propName]}
          {...params}
          variant="outlined"
          />)}
    />
  }
  return <Panel className='nestedPanel' key={it.label}>
    <div className='flexRow'>
      <Button onClick={onRemoveProp} color="warning">
        <DeleteForeverIcon/>{it.label}
      </Button>
      {it.loadOptions && it.loadOptions.length > 1 && <ButtonSelect
        caption="Load value"
        options={it.loadOptions}
        width={"150px"}
        onSelect={loadValue}
        />}
    </div>
    {children}
  </Panel>
}

const accordionProps = isOldMui ? {TransitionProps: {timeout: 0, unmountOnExit: false}} : {slotProps: {transition: {timeout: 0, unmountOnExit: false}}};

/**
 * @param {object} param
 * @param {FormHandler} param.formHandler
 * @param {string} param.prefix
 * @param {string[]} param.sharedDataIds
 * @param {DeployedContainerInfo=} param.info
 * @param {BuilderInfo=} param.builderInfo
 * @param {Dockerode.ContainerInspectInfo=} param.myInspectInfo
 * @param {string=} param.pcid
 */
export function OptionalParamsConfiguration({prefix, formHandler, sharedDataIds, myInspectInfo, builderInfo, info, pcid})
{
  console.log("OptionalParamsConfiguration", prefix);
  const [expanded, setExpanded] = useState(true);
  const toggleExpanded = useCallback(()=>setExpanded((value)=>!value), [setExpanded]);

  const {description, propRefs, defaultAdded} = useMemo(()=>{
    const defaultAdded = new Set();
    const parts = prefix.split('.').filter(q=>q);
    let propsObj = formHandler.values;
    for (let part of parts) {
      propsObj = propsObj[part];
      if (!propsObj) break;
    }
    if (!propsObj) propsObj = {};

    const mpcid = pcid || info?.pcid;
    const defaultInfo = builderInfo?.images.find(it=>it.pcid === mpcid);
    // if (!defaultInfo) throw new Error("unexpected");
    /** @type {descProp[]} */
    const description = [];
    for (const [dprop, bprop] of /** @type {[string|null, string][]}*/([[null,"udpPorts"],[null,"tcpPorts"],[null,"sharedResources"],[null,"volumes"], ["Cmd", "Cmd"], ["Binds", "Binds"], ["Entrypoint", "Entrypoint"], ["Env", "Env"], ["CapAdd", "CapAdd"]])) {
      if (propsObj[bprop] !== null && propsObj[bprop] !== undefined) {
        defaultAdded.add(bprop);
      }
      const isMultiline = ((dprop && dprop !== "CapAdd") || bprop === "volumes");
      /** @type {descProp} */
      const it = {
        label: dprop || (bprop[0].toUpperCase() + bprop.slice(1)),
        propName: bprop,
        inputType: isMultiline ? "multiline" : "multiple",
        loadOptions: [{name: "empty", value: isMultiline ? "" : []}],
      }
      //@ts-ignore
      if (defaultInfo?.[bprop]?.length > 0) it.loadOptions.unshift({name: "default", value: defaultInfo[bprop]});
      if (myInspectInfo && dprop) {
        //@ts-ignore
        let value = myInspectInfo.Config[dprop];
        if (dprop === "Binds") {
          value = myInspectInfo.Mounts.map(it=>`${it.Source}:${it.Destination}${it.RW?':rw':':ro'}${it.Propagation?':'+it.Propagation:''}`);
        } else if (dprop === "CapAdd") {
          value = myInspectInfo.HostConfig.CapAdd;
        }
        if (value) it.loadOptions.unshift({name: "current", value});
      }
      if (dprop === "Cmd") it.loadOptions?.push(...(defaultInfo?.cmdVariants?.map(({name, cmd})=>({name, value: cmd})) || []))
      description.push(it);
    }
    /** @type {{[x:string]: React.RefObject<HTMLInputElement>}} */
    let propRefs = {};
    for (const prop of description) {
      propRefs[prop.propName] = createRef();
    }

    return {description, propRefs, defaultAdded};
  }, [myInspectInfo, builderInfo, info, pcid]);

  const [added, setAdded] = useState(defaultAdded);

  const prop = useMemo(()=>({
    add: (/** @type {string}*/propName)=>{
      setAdded(new Set([...added, propName]));
    },
    remove: (/** @type {string}*/propName)=>{
      added.delete(propName)
      setAdded(new Set(added));
    }
  }), [added, setAdded]);

  const goto = (/**@type {React.MouseEvent}*/e, /** @type {string} */it)=>{
    e.stopPropagation();
    const cb = ()=>propRefs[it]?.current?.scrollIntoView({behavior: "instant", block: "end", inline: "nearest"});
    if (!expanded) {
      setExpanded(true);
      setTimeout(cb, 100);
    } else {
      cb();
    }
  }

  const addedDetails = useMemo(()=>(
    <div className='flexCol'>
      {description.filter(it=>added.has(it.propName)).map(it=>{
        /** @type {string[]} */
        let options = [];
        if (it.propName === "sharedResources") {
          options = sharedDataIds;
        } else if (it.propName === "CapAdd") {
          options = linuxDockerCaps;
        }
        // console.log(it.propName, options)
        return <ParamComponent 
          key={prefix+it.propName}
          it={it}
          prefix={prefix}
          formHandler={formHandler}
          propRefs={propRefs}
          options={options}
          removeProp={prop.remove}
          />
      })}
    </div>), [added, prop.remove])

  return (
  <Accordion className='OptionalParamsConfiguration' expanded={expanded} {...accordionProps} disableGutters  onChange={toggleExpanded}>
  {/* <Accordion className='OptionalParamsConfiguration' {...accordionProps} disableGutters> */}
    <AccordionSummary expandIcon={<ExpandMoreIcon />} >
      <div className='flexCol'>
        <div className='flexRow'>
          <Typography variant='body2'>Set:{added.size === 0 && " None"}</Typography>
          {description.filter(it=>added.has(it.propName)).map(it=><Chip key={it.propName} label={it.label} onClick={e=>goto(e, it.propName)} />)}
        </div>
        <div className='flexRow'>
          {expanded && description.filter(it=>!added.has(it.propName)).map(it=>
              <Button key={it.propName} onClick={(e)=>{prop.add(it.propName);e.stopPropagation()}}><AddIcon/>{it.label}</Button>)}
        </div>
      </div>
    </AccordionSummary>
    <AccordionDetails>
      {addedDetails}
    </AccordionDetails>
  </Accordion>)
}

/**
 * @param {object} param
 * @param {DeployedContainerInfo} [param.info]
 * @param {string} [param.pcid]
 * @param {{[x:(string|symbol)]: Promise<Dockerode.ContainerInspectInfo>}} [param.inspectInfo]
 * @param {FormHandler} param.formHandler
 * @param {string[]} param.sharedDataIds
 * @param {string} param.prefix
 * @param {BuilderInfo} param.builderInfo
 * @param {string[]} param.bundlesIds
 */
export function OverrideParamsComponent({formHandler, info, pcid, inspectInfo, sharedDataIds, prefix, builderInfo})
{
  console.log("OverrideParamsComponent render");
  /** @type {[Dockerode.ContainerInspectInfo|undefined, React.Dispatch<React.SetStateAction<Dockerode.ContainerInspectInfo|undefined>>]} */
  const [myInspectInfo, setMyInspectInfo] = useState();
  const [inspectInProgress, setInspectInProgress] = useState(!!inspectInfo);
  const reloadInspectInfo = ()=>{
    if (!inspectInfo || !info) return;
    setInspectInProgress(true);
    inspectInfo[info.id].then(setMyInspectInfo).finally(()=>setInspectInProgress(false));
  }

  useEffect(()=>{reloadInspectInfo();}, []);

  const mpcid = pcid || info?.pcid;
  const hasBuilderInfo = !!builderInfo.images.find(it=>it.pcid === mpcid);
  const bundleKey = prefix + "imageFromBundleId";

  return <div className='OverrideParamsComponent'>
    <BundleSelector
      defaultBuilderId={builderInfo.id}
      bundleFormName={bundleKey}
      formHandler={formHandler}
      />
    {inspectInProgress ? <Typography variant='body2'>Loading container data...</Typography>
      : <>
      {!hasBuilderInfo && <Typography variant='body2' color="red">No "{pcid}" info found in bundle builder({builderInfo.id})</Typography>}
      {!!inspectInfo && !myInspectInfo && <div className='flexRow'>
        <Typography variant='body2' color="red">Failed to inspect current container</Typography>
        <Button onClick={reloadInspectInfo} color="warning"><RefreshIcon/>Retry</Button>
      </div>}
      <OptionalParamsConfiguration
        formHandler={formHandler}
        prefix={prefix}
        sharedDataIds={sharedDataIds}
        builderInfo={builderInfo}
        info={info}
        myInspectInfo={myInspectInfo}
        pcid={pcid}
        />
      </>}
    </div>
}

/** @typedef {"bindHostTZ"|"addSniffer"|"autoRestart"|"collectPerformanceData"|"monitorDumps"} propstr */
/** @type {{name: string, prop: propstr}[]} */
export const simpleKeys = [
  {name: "Bind host TZ", prop: "bindHostTZ"},
  {name: "Add sniffer", prop: "addSniffer"},
  {name: "Auto restart", prop: "autoRestart"},
  {name: "Collect perf data", prop: "collectPerformanceData"},
  {name: "Monitor dumps", prop: "monitorDumps"},
];

/**
 * @param {object} param
 * @param {FormHandler} param.formHandler
 * @param {string} [param.className]
 */
export function SimpleParams({formHandler, className=""})
{
  return <div className={'flexCol ' + className}>
      <TextField
        className='comment'
        {...formHandler.register("comment")}
        label="Comment"
        onKeyDown={preventEnter}
      />
      <div className='flexRow checkParams'>
        {simpleKeys.map(it=>
          <FormControlLabel key={it.prop}
            control={
              <Checkbox 
                {...formHandler.register(it.prop)}
                />}
            label={it.name}
            />
          )}
      </div>
    </div>
}

/**
 * @param {object} param
 * @param {FormHandler} param.formHandler
 * @param {string} param.bundleFormName
 * @param {string=} [param.defaultBuilderId]
 * @param {(value: string|null)=>void} [param.onBundleChange]
 * @param {boolean=} [param.required]
 * @param {boolean} [param.disabled]
 */
export function BundleSelector({
  formHandler,
  bundleFormName,
  onBundleChange=()=>{},
  defaultBuilderId,
  required=false,
  disabled=false,
})
{
  const renderTick = CreateRenderTick();
  const buildersIds = useSelector((/** @type {ReduxStoreType}*/state) => state.builders.ids);
  const bundlesIds = useSelector((/** @type {ReduxStoreType}*/state) => state.bundles.ids);
  const bundlesInfo = useSelector((/** @type {ReduxStoreType}*/state) => state.bundles.entries);
  
  const bundleId = formHandler.getValue(bundleFormName) || null;
  
  const _defaultBuilderId = useMemo(()=>
    {
      if (defaultBuilderId) return defaultBuilderId;
      if (bundleId) return bundlesInfo[bundleId]?.builderId || null;
      return null;
    }, []);
  const [_selectedBuilderId, setSelectedBuilder] = useState(_defaultBuilderId);

  const {filteredBundlesIds, selectedBuilderId} = useMemo(()=>{
      // if builder filter selected & dont match external bundle set - replace with builder from bundle...
      let selectedBuilderId = (!!_selectedBuilderId && !!bundleId && bundlesInfo[bundleId]?.builderId) || _selectedBuilderId;
      let filteredBundlesIds = Object.values(bundlesInfo)
        .filter(it=>!selectedBuilderId || it.builderId === selectedBuilderId)
        .map(it=>it.id);
      return {filteredBundlesIds, selectedBuilderId}
    }, [bundlesInfo, _selectedBuilderId, bundleId]);


  /** @param {any} e @param {string|null} value */
  const onBuilderChange = (e, value)=>{
    setSelectedBuilder(value);
    if (value) {
      formHandler.setValue(bundleFormName, bundlesIds.find(it=>bundlesInfo[it].builderId === value) || null);
      renderTick();
    }
  }

  /** @param {any} e @param {string|null} value */
  const _onBundleChange = (e, value)=>{
    onBundleChange(value);
    formHandler.setValue(bundleFormName, value);
    renderTick();
  }

  return <div className="flexRow BundleSelector">
      <VirtualizedSelect
        disabled={disabled}
        value={selectedBuilderId}
        options={buildersIds}
        label={"Bundles filter"}
        onChange={onBuilderChange}
        onKeyDown={preventEnter}
        />
      <VirtualizedSelect
        {...formHandler.register(bundleFormName, {refName: 'mref'})}
        disabled={disabled}
        errors={formHandler.errors[bundleFormName] || (required && !bundleId)}
        value={bundleId}
        options={filteredBundlesIds}
        label={"Image from bundle"}
        onChange={_onBundleChange}
        onKeyDown={preventEnter}
        />
 </div>
}

/**
 * 
 * @param {object} param
 * @param {(value: string)=>void} param.removeAddon
 * @param {FormHandler} param.formHandler
 * @param {string} param.name
 * @param {string} param.pcid
 * @returns 
 */
export function AddonRowHeader({removeAddon, formHandler, name, pcid})
{
  const defaultCount = 1;
  const [count, setCount] = useState(defaultCount);

  const onChange = (/** @type {String}*/value)=>{
    let sdigit = value.match(/\d+/);
    if (!sdigit) return;
    let digit = Math.min(Math.max(+sdigit[0], 1), 99)
    setCount(digit);
    formHandler.setValue(name, digit);
  }

  return <div className='flexRow addonRow'>
    <Tooltip title="Cancel addon">
      <Button onClick={()=>removeAddon(pcid)} color="warning">
        Cancel<PlusIcon color="error"/>
      </Button>
    </Tooltip>
    <Typography variant='h6' color='text.primary'>Add: {pcid}</Typography>
    <TextField
      {...formHandler.register(name, {defaultValue: defaultCount, defaultPropName: null})}
      onChange={(e)=>onChange(e.target.value)}
      value={count}
      className='addonsCount'
      label="Count"
      onKeyDown={preventEnter}
    />
  </div>
}