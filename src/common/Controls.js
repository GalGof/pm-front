import Badge from '@mui/material/Badge';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';

import LockPersonIcon from '@mui/icons-material/LockPerson';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { CopyTextToClipboard } from './utils';
import { useRef } from 'react';

export const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: 5,
    top: 4,
    backgroundColor: '#333',
    // border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 1px',
  },
}));

export const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  flexGrow: 1,
}));


/** @type {(adminAccess: boolean, children: JSX.Element|string)=>JSX.Element} */
export function AdminLockBadge(adminAccess, children)
{
  return <StyledBadge invisible={adminAccess} badgeContent={<LockPersonIcon sx={{fontSize: "16px", color: "gray"}}/>}>
    {children}
  </StyledBadge>;
}

/** @type {(adminAccess: boolean, onClick: ()=>void, IconClass: ({color}: {color?: string})=>JSX.Element)=>JSX.Element} */
export function AdminIconButton(adminAccess, onClick, IconClass)
{
  return <StyledBadge invisible={adminAccess} badgeContent={<LockPersonIcon sx={{fontSize: "16px", color: "gray"}}/>}>
    {/* <IconButton className='cardActionButton' onClick={onClick} >{IconClass({color: !adminAccess ? 'disabled' : undefined})}</IconButton> */}
    <IconButton className='cardActionButton' onClick={onClick} ><IconClass color={!adminAccess ? 'disabled' : undefined}/></IconButton>
  </StyledBadge>;
}

export const WideTextField = styled(TextField)(function ({ theme }){ return {
  width: "100%",
  variant: '',
}});

/** @param {{text: string}} param */
export function CopyTextButton({text})
{
  /** @type {React.RefObject<HTMLButtonElement>} */
  const ref = useRef(null);
  return <Tooltip title={"Copy"}>
    <IconButton ref={ref} className='copyTextButton' onClick={(e)=>{CopyTextToClipboard(text, ref.current);e.stopPropagation()}} >
      <ContentCopyIcon />
    </IconButton>
  </Tooltip>
};