import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { useTheme, styled } from '@mui/material/styles';
import { FixedSizeList } from 'react-window';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import ClickAwayListener from '@mui/material/ClickAwayListener';

import './ButtonSelect.css';

/** @param {{options: string[]|{name: string, value: any}[], itemSize?: number, caption: string, width?: string, onSelect: (value: any)=>void}} param */
export default function ButtonSelect({options, itemSize = 24, width="300px", caption, onSelect}) {
  const [open, setOpen] = useState(false);
  const strOptions = typeof(options[0]) === "string";

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };

  const height = useMemo(()=>{
    return Math.min(8, options.length) * itemSize;
  }, [options, itemSize])

  /** @type {(idx: number)=>void} */
  const onClick = (index)=>{
    //@ts-ignore
    onSelect(strOptions ? options[index] : options[index].value);
    setOpen(false);
  }

  const list = <FixedSizeList
    className="virtualList"
    itemData={options}
    height={height}
    width={width}
    // outerElementType={OuterElementType}
    innerElementType="ul"
    itemSize={itemSize}
    overscanCount={5}
    itemCount={options.length}
  >
    {/* @ts-ignore */}
    {({data, index, style })=><Typography style={style} component="li" noWrap onClick={()=>onClick(index)}>{strOptions ? data[index] : data[index].name}</Typography>}
  </FixedSizeList>;

  return <ClickAwayListener onClickAway={handleTooltipClose}>
    <div>
      <Tooltip
        className='ButtonSelect'
        PopperProps={{
          disablePortal: true,
        }}
        onClose={handleTooltipClose}
        open={open}
        disableFocusListener
        disableHoverListener
        disableTouchListener
        title={list}
      >
        <Button onClick={handleTooltipOpen}>{caption}</Button>
      </Tooltip>
    </div>
  </ClickAwayListener>
}