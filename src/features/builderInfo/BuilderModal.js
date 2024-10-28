import { useState, createRef, useCallback, memo } from 'react';
import { useSelector } from 'react-redux'
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';

import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HelpIcon from '@mui/icons-material/Help';
import CheckIcon from '@mui/icons-material/Check';

import './BuilderModal.css';
import { SaveDBModalCall, } from '../../common/Actions';
import { CreateRenderTick, objectCopy } from '../../common/utils';
import { ModalInfo } from '../../modals/ShowModal';
import { AddModal } from '../../modals/ModalManager';
import { FormHandler } from '../../common/FormHandler';
import { OptionalParamsConfiguration } from '../deployInfo/DeployComponents';

const Panel = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: "3px 32px",
  // textAlign: 'center',
  color: theme.palette.text.secondary,
  flexGrow: 1,
}));

function ShowHelp()
{
  ModalInfo({content: <Box>
    <Typography variant="h6">{"Environment, CMD params:"}</Typography>
    <Typography variant="body2">{"$[CIP] replaced with actual IP assigned to component during deployment."}</Typography>
    <Typography variant="body2">{"$[MIP] replaced with actual IP assigned to main(cloneId=0) components during deployment."}</Typography>
  </Box>, title: "Help"});
}


/** @typedef {{item?: BuilderInfo, copyFrom?: BuilderInfo}} BuilderModalParams  */

/** @param {BuilderModalParams} [param] */
export default function ShowBuilderModal({item, copyFrom} = {}) {

  /** @type {BuilderInfo} */
  const defaultInfo = {
    hidden: false,
    images: [],
    id: "",
    lastSave: 0,
    name: "",
    nextResultId: 0,
    resultPrefix: ""
  };

  const navChipClick = (/** @type {number}*/idx)=>{
    imageElementRefs[idx]?.panel.current?.scrollIntoView();
  }

  let defaultValue = objectCopy(copyFrom || item || defaultInfo);
  if (copyFrom) {
    defaultValue.nextResultId = 0;
  }
  let imageElementRefs = defaultValue.images.map((it, idx)=>({
    panel: createRef(),
    // @ts-ignore
    onGoto: navChipClick.bind(this, idx)
  }))

  /** @type {{[x:string]: boolean}}*/
  const defaultErrorIds = copyFrom ? {id: true} : {};

  /** @type {FormHandler<BuilderInfo>} */
  const formHandler = new FormHandler({defaults: defaultValue});

  /**
   * @param {object} param 
   * @param {number} param.imageIdx
   * @param {DockerRegistryInfo[]} param.dockerRegistriesInfo
   * @returns 
   */
  function _ImageCache({imageIdx, dockerRegistriesInfo})
  {
    const item = formHandler.values.images[imageIdx];
    const defaults = defaultValue.images[imageIdx];
    const renderTick = CreateRenderTick();

    const cacheDstChange = useCallback(
      /**
       * @param {*} e 
       * @param {boolean} checked 
       */
      (e, checked)=>{
        if (checked) {
          item.cacheDst = {
            imageTagPrefix: "",
            registryId: "",
            repoName: "",
          }
        } else {
          delete item.cacheDst;
        }
        renderTick();
    }, []);

    const staticImageChange = useCallback(
      /**
       * @param {*} e 
       * @param {boolean} checked 
       */
      (e, checked)=>{
        if (checked) {
          item.staticImage = {
            image: "",
            registryId: "",
          }
        } else {
          delete item.staticImage;
        }
        renderTick();
    }, []);

    const staticActive = !!item.staticImage;
    const cacheActive = !!item.cacheDst;
    const keyPrefix = "images." + imageIdx + ".";

    if (!item) return <div>Image Cache Desync</div>
    return (
      <div className='boxedPanel imageCache'>
        <div className=''>
          <FormControlLabel
            labelPlacement='end'
            label="Cache Image"
            disabled={staticActive}
            control={<Checkbox
              defaultChecked={!!defaults?.cacheDst}
              onChange={cacheDstChange}
              />}
          />
          <FormControlLabel
            labelPlacement='end'
            label="Static Image"
            disabled={cacheActive}
            control={<Checkbox
              defaultChecked={!!defaults?.staticImage}
              onChange={staticImageChange}
              />}
          />
        </div>
        <div hidden={staticActive}>
          {cacheActive && <>
            <TextField
              label="Repo name"
              {...formHandler.register(keyPrefix + "cacheDst.repoName")}
              />
            <TextField
              label="Tag prefix"
              {...formHandler.register(keyPrefix + "cacheDst.imageTagPrefix")}
              />
            <TextField
              label="Destination Registry"
              {...formHandler.register(keyPrefix + "cacheDst.registryId", {defaultValue: ""})}
              select
              >
                {dockerRegistriesInfo.map(it=>(
                  <MenuItem key={it.id} value={it.id}>
                    {it.name}
                  </MenuItem>))}
            </TextField>
          </>}
        </div>
        <div hidden={cacheActive}>
          {staticActive && <>
            <TextField
              label="Full Image Name"
              {...formHandler.register(keyPrefix + "staticImage.image")}
              />
            <TextField
              label="Docker Registry"
              {...formHandler.register(keyPrefix + "staticImage.registryId", {defaultValue: ""})}
              select
              >
              {dockerRegistriesInfo.map(it=>(
                <MenuItem key={it.id} value={it.id}>
                  {it.name}
                </MenuItem>))}
            </TextField>
          </>}
        </div>
      </div>)
  }

  const ImageCache = memo(_ImageCache);
  

  /**
   * @param {object} param
   * @param {(key: number) => void} param.RemoveImage
   * @param {number} param.idx
   * @param {*} param.onRename
   * @returns 
   */
  function _PcidPanel({idx, RemoveImage, onRename})
  {
    const item = formHandler.values.images[idx];
    const renderTick = CreateRenderTick();
    const dockerRegistriesEntries = useSelector((/** @type {ReduxStoreType}*/state) => state.dockerRegistriesInfo.entries);
    const dockerRegistriesInfo = Object.values(dockerRegistriesEntries);
    const sharedDataIds = useSelector((/** @type {ReduxStoreType}*/state) => state.sharedDataInfo.ids);

    const AddCMD = ()=>{
      if (!item.cmdVariants) item.cmdVariants = [];
      item.cmdVariants.push({
        cmd: [],
        name: "",
      });
      renderTick();
    }

    const RemoveCmd = (/** @type {number}*/key)=>{
      if (window.confirm("Delete cmd variant?")) {
        //@ts-ignore
        delete item.cmdVariants[key];
        renderTick();
      }
    }

    /**
     * @param {*} e 
     */
    const onPcidEnter = (e)=>{
      if (e.key === "Enter") {
        e.preventDefault();
        onRename();
      }
    }

    return (
      <Panel className='pcidPanel flexCol' ref={imageElementRefs[idx].panel}>
        <div className='flexRow firstRow'>
          <IconButton
            id="removeImageIcon"
            size="small"
            onClick={()=>RemoveImage(idx)} >
              <DeleteForeverIcon />
          </IconButton>
          <FormControl error={formHandler.errors[`${idx}.pcid`]}>
            <FormControlLabel
              labelPlacement='start'
              label="PCID"
              control={<Input
                  onBlurCapture={onRename}
                  onKeyDown={onPcidEnter}
                  {...formHandler.register("images." + idx + ".pcid")}
                  // onBlur={renderTick}
                  // inputRef={imageElementRefs[idx].pcid}
                  />}/>
            <FormHelperText>Pack's component Id</FormHelperText>
          </FormControl>
          <FormControlLabel
            labelPlacement='start'
            label="Updatable"
            control={<Checkbox
              {...formHandler.register("images." + idx + ".updatable", {controlType: 'checkbox'})}
              />}/>
          <FormControlLabel
            labelPlacement='start'
            label="Clonable"
            control={<Checkbox
              {...formHandler.register("images." + idx + ".clonable", {controlType: 'checkbox'})}
              />}/>
        </div>
        <OptionalParamsConfiguration 
          formHandler={formHandler}
          prefix={"images." + idx + "."}
          sharedDataIds={sharedDataIds}
          />
        <TextField
          {...formHandler.register("images." + idx + ".dataToSave", {controlType: 'textarea'})}
          label="Data path to collect on demand"
          multiline
          maxRows={4}
          />
        <ImageCache
          dockerRegistriesInfo={dockerRegistriesInfo}
          imageIdx={idx}
        />
        <div className='boxedPanel cmdPanel'>
          <Button
            variant="contained"
            onClick={AddCMD}
            >
            <AddIcon />Manual Run Variant
          </Button>
          {item.cmdVariants?.map((it, cmdIdx)=>{
            if (!it) return "";
            let namePath = "images." + idx + ".cmdVariants." + cmdIdx + ".name";
            let cmdPath = "images." + idx + ".cmdVariants." + cmdIdx + ".cmd";
            return <div className='flexRow' key={cmdIdx}>
              <IconButton
                color="warning"
                id="removeImageIcon"
                size="small"
                sx={{backgroundColor: "#333", marginTop: "12px"}}
                onClick={()=>RemoveCmd(cmdIdx)}
                >
                <DeleteForeverIcon />
              </IconButton>
              <div className='flexCol fg'>
                <TextField
                  label="Name"
                  {...formHandler.register(namePath)}
                  />
                <TextField
                  {...formHandler.register(cmdPath, {controlType: 'textarea'})}
                  label="CMD"
                  multiline
                  maxRows={10}
                  />
              </div>
            </div>
          })}
        </div>
      </Panel>);
  }

  const PcidPanel = memo(_PcidPanel)

  let title = "Add new builder";
  if (item) title = "Edit builder";
  if (copyFrom) title = `Create from(${copyFrom.id})`;

  /** @param {{close: ()=>void}} param */
  function RootComponent({close}) {
    console.log("BuilderModal");
    const renderTick = CreateRenderTick();
    const buildersInfoIds = useSelector((/** @type {ReduxStoreType}*/state) => state.builders.ids);
    const [saveInProgress, setSaveInProgress] = useState(false);
    const [errorIds, setErrorIds] = useState(defaultErrorIds);

    const AddImage = useCallback(()=>{
      formHandler.values.images.push({
        pcid: "",
      });
      imageElementRefs.push({
        panel: createRef(),
        // pcid: createRef(),
        //@ts-ignore
        onGoto: navChipClick.bind(this, formHandler.values.images.length - 1),
      });
      if (errorIds.emptyComponents) {
        setErrorIds({...errorIds, emptyComponents: false});
      }
      renderTick();
    }, [renderTick])

    const RemoveImage = useCallback((/** @type {number}*/key)=>{
      if (window.confirm("Delete pcid?")) {
        delete formHandler.values.images[key];
        delete imageElementRefs[key];
        renderTick();
      }
    }, [renderTick])

    const validateInputs = (/** @type {BuilderInfo} */data)=>{
      // @TODO
      return false;
      // console.log(data);
      // /** @type {{[x:string]: boolean}}*/
      // let errors = {};
      // if (!data.images) {
      //   formHandler.addError("emptyComponents");
      // } else {
      //   data.images.forEach((it, idx)=>{
      //     if (!it) return;
      //     if (!it.pcid) {
      //       errors[`images.${idx}.pcid`] = true;
      //     }
      //     // @ts-ignore
      //     if (it.volumes) {
      //       // it.volumes = it.volumes.split('\n').filter(it=>it.trim()).map(it=>it.trim());
      //       it.volumes.forEach(q=>{if (q[0] !== "/") errors[`images.${idx}.volumes`] = true;});
      //     }
      //     // @ts-ignore
      //     if (it.Env) {
      //       // it.Env = it.Env.split('\n').filter(it=>it.trim());
      //       it.Env.forEach(q=>{if (!q.match(/^\w+=/)) errors[`images.${idx}.env`] = true;});
      //     }
      //     // @ts-ignore
      //     if (it.dataToSave) {
      //       // it.dataToSave = it.dataToSave.split('\n').filter(it=>it.trim()).map(it=>it.trim());
      //       it.dataToSave.forEach(q=>{if (q[0] !== "/") errors[`images.${idx}.dataToSave`] = true;});
      //     }
      //     it.cmdVariants?.forEach((it2, idx2)=>{
      //       if (!it2) return;
      //       // @ts-ignore
      //       it2.cmd = it2.cmd.split('\n').filter(it=>it.trim());
      //       if (!it2.name) errors[`images.${idx}.cmdVariants.${idx2}.name`] = true;
      //       if (it2.cmd.length === 0) errors[`images.${idx}.cmdVariants.${idx2}.cmd`] = true;
      //     });

      //     if (it.cacheDst) {
      //       ["imageTagPrefix", "registryId", "repoName"].forEach(q=>{
      //         if (!it.cacheDst[q]) {
      //           errors[`images.${idx}.cacheDst.${q}`] = true;
      //         }
      //       })
      //     }

      //     if (it.staticImage) {
      //       ["image", "registryId"].forEach(q=>{
      //         if (!it.staticImage[q]) {
      //           errors[`images.${idx}.staticImage.${q}`] = true;
      //         }
      //       })
      //     }
      //   });
      //   for (let q = 0; q < data.images.length; q++) {
      //     for (let w = q + 1; w < data.images.length; w++) {
      //       if (data.images[q] && data.images[w] && data.images[q].pcid === data.images[w].pcid) {
      //         errors[`images.${q}.pcid`] = true;
      //         errors[`images.${w}.pcid`] = true;
      //       }
      //     }
      //   }
      //   data.images = data.images?.filter(it=>it);
      // }
      // ["id", "name", "resultPrefix"].forEach(it=>{
      //   if (!data[it]) errors[it] = true;
      // });
      // if (!item && buildersInfoIds.find(it=>it === data.id)) {
      //   errors.id = true;
      // }
      // setErrorIds(errors);
      // return Object.getOwnPropertyNames(errors).length === 0;
    };

    const onSubmit = () =>{
      let data = formHandler.getValues();
      // console.log(JSON.stringify(data, null, 2))
      if (!validateInputs(data)) return;
      return;
      return SaveDBModalCall(data, setSaveInProgress, close, "builders");
    }

    const onValidate = ()=>validateInputs(formHandler.getValues());

    let title = "Add new builder";
    if (item) title = "Edit builder";
    if (copyFrom) title = `Create from(${copyFrom.id})`;

    return (<>
      <Modal
        disableEscapeKeyDown
        hideBackdrop={true}
        open
        onClose={close}
        >
        <div className='BuilderModal noSelect'>
          <fieldset disabled={saveInProgress}>
          <form>
          <Typography variant="h6" component="h2" display="inline">
            {title}
          </Typography>
          <IconButton color="info" sx={{float: "right"}} onClick={ShowHelp} >
            <HelpIcon />
          </IconButton>
          <FormControlLabel
            label="Hidden"
            sx={{float: 'right'}}
            control={<Checkbox
              {...formHandler.register("hidden", {controlType: 'checkbox'})}
              />}
            />
          <Divider className='w100'/>
            <div className='flexRow'>
              <TextField sx={{flex: 2}}
                disabled={!!item}
                label="Id"
                {...formHandler.register("id")}
                />
              <TextField sx={{flex: 3}}
                label="Name"
                {...formHandler.register("name")}
                />
              <TextField sx={{flex: 3}}
                label="Result prefix"
                {...formHandler.register("resultPrefix")}
                />
            </div>
          <Divider />
          <Button
            variant="contained"
            onClick={AddImage}
            color={errorIds.emptyComponents ? "error" : "primary"} >
              <AddIcon />Component
          </Button>
          {formHandler.values.images.length > 1 && <>
              <Typography
                variant="body1"
                component="h2"
                display='inline'
                sx={{padding: "0 3px"}}>
                  Go:
              </Typography>
              {formHandler.values.images.map((it, idx)=>{
                if (!it) return "";
                return <Chip
                  className='gotoChip'
                  key={idx}
                  label={formHandler.values.images[idx]?.pcid || idx}
                  onClick={imageElementRefs[idx]?.onGoto}
                  />})}
            </>}
          <div className='pcidList'>
          {formHandler.values.images.map((it, idx)=>{
            if (!it) return "";
            return <PcidPanel
              key={idx}
              idx={idx}
              RemoveImage={RemoveImage}
              onRename={renderTick}
              />
          })}
          </div>
          <Divider />
          <Button
            color="success"
            onClick={onSubmit}
            disabled={saveInProgress}
            >
            <SaveIcon />Save
          </Button>
          {Object.getOwnPropertyNames(errorIds).length !== 0 && 
            <Button
              color="warning"
              sx={{marginLeft: "5px"}}
              onClick={onValidate}
              >
              <CheckIcon />Validate
            </Button>}
          <Button
            disabled={saveInProgress}
            className='fr'
            onClick={close}
            >
            <CloseIcon />Cancel
          </Button>
          </form>
          </fieldset>
        </div>
      </Modal>
    </>);
  }
  AddModal(RootComponent, {});
}
