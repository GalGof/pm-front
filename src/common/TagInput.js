import { useContext, useState } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Container from '@mui/material/Container';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import Modal from '@mui/material/Modal';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { styled } from '@mui/material/styles';

/** @type {React.CSSProperties} */
const boxStyle = {
  display: "flex",
  flexDirection: "row",
  border: "darkgray",
  borderStyle: "solid",
  borderWidth: "1px", 
  // alignItems: "baseline",
  alignItems: "center",
  borderRadius: "5px",
  maxWidth: "500px",
}

/**
 * @param {{tags: string[], onTagsChange: (tags: string[])=>void, sx?: React.CSSProperties,}} param0 
 */
export default function TagInput({tags, onTagsChange, sx={}, ...props}) {
  const [text, setText] = useState("");

  const RemoveTag = (value) => {
    onTagsChange(tags.filter(it=>it !== value));
  }

  const OnInputKeyDown = (/** @type {KeyboardEvent}*/ev) => {
    if (ev.key !== "Enter" || tags.includes(text) || !text) return;
    onTagsChange([...tags, text]);
    setText("");
  }

  return (
    <Box sx={{...boxStyle, ...sx}} {...props}>
        <div>{tags.map(it=>(<Chip key={it} onDelete={()=>RemoveTag(it)} label={it} />))}</div>
        <TextField sx={{width: "100%", minWidth: "150px", margin: "0!important"}} variant="outlined" onKeyDown={OnInputKeyDown} value={text} onChange={(e)=>setText(e.target.value)}/>
        {tags.length > 5 && <IconButton size="small" sx={{backgroundColor: "#333", color: "#fff"}} onClick={()=>onTagsChange([])} ><DeleteForeverIcon /></IconButton>}
    </Box>
  );
}