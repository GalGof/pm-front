import { useEffect, useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';

import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { AddModal } from './ModalManager';

/** @typedef {import('@mui/system/styleFunctionSx').SxProps} _SxProps */

/** @type {_SxProps} */
export const defaultStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  // width: 400,
  // maxWidth: "90vw", maxHeight: "90vh", overflow: "auto",
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

/** @param {{className?: string, titleIcon?: JSX.Element, content: JSX.Element | string, title?: JSX.Element | string, close: ()=>void, onAction?: ()=>(Promise<any>|void), modalStyle?: _SxProps, actionCaption?: string, waitForResult?: boolean}} arg */
function GenericModal({className = 'MultiModal', content, title = undefined, close, actionCaption = undefined, onAction = undefined, modalStyle = defaultStyle, titleIcon = undefined, waitForResult=true}) {
  const [actionDisabled, setActionDisabled] = useState(false);
  const Action = ()=>{
    if (actionDisabled) return;
    console.log("Action", actionDisabled);
    setActionDisabled(true);
    let result = onAction?.();
    // @ts-ignore
    if (waitForResult && result?.then) {
      result.then(close)
        .catch(err=>{ModalError({content: String(err)})})
        .finally(()=>{setActionDisabled(false)})
    } else {
      close()
    }
  }

  return (<Modal
      className={className}
      hideBackdrop={true}
      open
      disableRestoreFocus
      onClose={close}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      >
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h6" component="h2">{titleIcon} {title}</Typography>
        <Divider />
        <Box sx={{maxWidth: "calc(90vw - 100px)", maxHeight: "calc(95vh - 100px)", overflow: "auto",}}>
          {content}
        </Box>
        <Divider />
        {onAction && <Button autoFocus={true} color='success' disabled={actionDisabled} variant="contained" size="small" onClick={Action} type="submit" >{actionCaption}</Button>}
        <Button variant="contained" size="small" startIcon={<CloseIcon />} onClick={close} sx={{float: "right"}} >Close</Button>
      </Box>
    </Modal>);
}

/** @param {{className?: string, content: JSX.Element | string, title?: JSX.Element | string, modalStyle?: _SxProps, actionCaption: string, onAction: ()=>(Promise<any>|void)}} arg */
export function ShowModal({className = undefined, content, title = undefined, actionCaption, onAction, modalStyle = defaultStyle}) {
  AddModal(GenericModal, {
    content,
    title,
    actionCaption,
    onAction,
    modalStyle,
    className,
  })
}

/** @param {{content: JSX.Element | string, title?: JSX.Element | string, modalStyle?: _SxProps, actionCaption?: string, onAction: ()=>any}} arg */
export function ModalConfirm({content, title = undefined, actionCaption = "Confirm", onAction, modalStyle = defaultStyle}) {
  AddModal(GenericModal, {
    content,
    title,
    actionCaption,
    onAction,
    modalStyle,
    waitForResult: false,
  })
}

/** @param {{content: JSX.Element|string, title: JSX.Element | string, onClose?:()=>void}} arg */
export function ModalInfo({content, title, onClose}) {
  AddModal(GenericModal, {content, title, titleIcon: <InfoOutlinedIcon color='info'/>, close: onClose});
}

/** @param {{content: string, title: JSX.Element | string}} arg */
export function ModalText({content, title}) {
  AddModal(GenericModal, {
    content: <pre style={{overflow: "auto", maxWidth: "calc(80vw - 100px)", maxHeight: "calc(80vh - 100px)"}}>{content}</pre>,
    title,
    titleIcon: <InfoOutlinedIcon color='info'/>,
    modalStyle: {...defaultStyle, width: undefined}
  });
}

const style ={overflow: "auto", maxWidth: "80vw", maxHeight: "80vh"};
/** @param {{content?: JSX.Element | string, title?: JSX.Element | string, error?: Error|string}} arg */
export function ModalError({content="", title="Error", error = ""}) {
  AddModal(GenericModal, {
    content: <>{content}{<pre >{error instanceof Error || typeof(error) !== 'object' ? String(error) : JSON.stringify(error, null, 2)}</pre>}</>,
    title,
    titleIcon: <ErrorOutlineIcon color='error'/>,
    modalStyle: {...defaultStyle, width: undefined}
    });
}

export function ThenModalOk() {
  AddModal(GenericModal, {content: "Ok.", title: "Succsess", titleIcon: <InfoOutlinedIcon color='info'/>});
}

/** @param {Error} error */
export function CatchModalError(error) {
  ModalError({error})
}
