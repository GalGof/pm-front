import { useContext, useState, Fragment } from 'react';
import { useSelector } from 'react-redux'
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useForm, Controller } from 'react-hook-form';

import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import './AddBundleModal.css';
import { CreateBundle, ActionWrapper } from '../../common/Actions';
import { AddModal } from '../../modals/ModalManager';
import { objectCopy } from '../../common/utils';
import VirtualizedSelect from '../../common/VirtualizedSelect';
import { WideTextField } from '../../common/Controls';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  maxWidth: "80vw",
  maxHeight: "80vh",
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

/** @type {{[x:string]: boolean}}*/
const errType = {};

/** @param {{close: ()=>void}} param0  */
function AddBundleModal({close}) {
  const buildersInfo = useSelector((/** @type {ReduxStoreType}*/state) => state.builders.entries);
  const buildersInfoIds = useSelector((/** @type {ReduxStoreType}*/state) => state.builders.ids);
  const [saveInProgress, setSaveInProgress] = useState(false);
  /** @ts-ignore @type {ReactState<string|null>} */
  const [selectedBuilderId, _setSelectedBuilderId] = useState("");
  const selectedBuilderInfo = buildersInfo[selectedBuilderId];
  const [errorIds, setErrorIds] = useState(errType);

  const setSelectedBuilderId = (/**@type {string|null}*/value)=>{
    if (value && errorIds.builderId) {
      setErrorIds({});
    }
    _setSelectedBuilderId(value);
  }

  const onSubmit = (/**@type {object}*/data) =>{
    let reData = objectCopy(data);
    console.log(reData);
    // @ts-ignore
    if (!validateInputs(reData)) return;
    // @ts-ignore
    return ActionWrapper(()=>CreateBundle(reData), setSaveInProgress, close);
  }

  const onClose = ()=>{
    if (saveInProgress) return;
    close();
  }

  const validateInputs = (/** @type {BuildBundleRequest} */data)=>{
    /** @type {{[x:string]: boolean}}*/
    let errors = {}
    if (!data.builderId) {
      errors.builderId = true;
    }
    if (data.imagesInfo) {
      for (let prop of Object.getOwnPropertyNames(data.imagesInfo)) {
        if (!data.imagesInfo[prop].imageName) {
          errors["imagesInfo." + prop + ".imageName"] = true;
        }
      }
    }
    setErrorIds(errors);
    return Object.getOwnPropertyNames(errors).length === 0;
  };

  const { register, handleSubmit, control } = useForm({shouldUnregister: true,});

  const preventEnter = (/**@type {KeyboardEvent}*/e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <Modal
      className='AddBundleModal'
      hideBackdrop={true}
      open
      onClose={onClose}
      >
      <Box sx={modalStyle}>
        <fieldset disabled={saveInProgress}>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h6">Add new bundle</Typography>
        <Divider />
          <FormControl>
            <InputLabel>Id</InputLabel>
            <Input {...register("id")}/>
          </FormControl>
          <Controller
            render={({ field }) => (
              <VirtualizedSelect
                errors={errorIds.builderId}
                options={buildersInfoIds}
                label={"Builder Id"}
                onChange={(e, data) => {setSelectedBuilderId(data);field.onChange(data)}}
                onKeyDown={preventEnter}
                />)}
            name={"builderId"}
            control={control}
          />
        <Divider />
        <Typography variant="caption" component="h2">Images:</Typography>
        {/* width: "calc(80vw - 300px)" */}
        <Box sx={{overflow: "auto", height: "calc(80vh - 400px)", padding: "0 30px"}}>
          {selectedBuilderInfo && selectedBuilderInfo.images.map(it=>{
            let imageId = "imagesInfo." + it.pcid + ".imageName";
            return (<Fragment key={it.pcid}>
            <Typography variant="body2">{it.pcid}</Typography>
            <WideTextField error={errorIds[imageId]} {...register(imageId)} label="Image"/>
            <WideTextField {...register("imagesInfo." + it.pcid + ".buildInfo")} label="Build Info" multiline maxRows={4}/>
            </Fragment>)})}
        </Box>
        <Divider />
        <Button disabled={saveInProgress} variant="contained" startIcon={<SaveIcon />} type="submit" color="success">Save</Button>
        <Button disabled={saveInProgress} variant="contained" startIcon={<CloseIcon />} onClick={onClose} sx={{float: "right"}} >Cancel</Button>
        </form>
        </fieldset>
      </Box>
    </Modal>);
}

export default function ShowAddBundleModal() {
  AddModal(AddBundleModal, {});
}
