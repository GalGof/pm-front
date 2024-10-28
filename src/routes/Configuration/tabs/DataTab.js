import { useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import AddIcon from '@mui/icons-material/Add';

/**
 * @param {object} param
 * @param {"builders"|"dockerEnginesInfo"|"dockerRegistriesInfo"|"sharedDataInfo"} param.dataKey
 * @param {()=>void} param.ShowAddModal
 * @param {JSX.ElementType} param.CardComponent
 * @returns 
 */
export function DataTab({dataKey, ShowAddModal, CardComponent}) {
  const filterProp = dataKey === "dockerEnginesInfo" ? "disabled" : "hidden";
  const filterName = dataKey === "dockerEnginesInfo" ? "Disabled" : "Hidden";
  const entries = Object.values(useSelector((/** @type {ReduxStoreType}*/state) => state[dataKey].entries));
  const [showFiltered, setShowFiltered] = useState(false);
  const filteredItems = entries.filter(it=>showFiltered || !it[filterProp]);

  return (
    <div>
      <div className='flexRow'>
        <Button onClick={ShowAddModal} color="primary" ><AddIcon />Add</Button>
        <FormControlLabel
          labelPlacement='start'
          label={`Show ${filterName}(${entries.length - filteredItems.length})`}
          control={<Checkbox checked={showFiltered} onChange={()=>setShowFiltered(!showFiltered)} />}
        />
      </div>
      <Divider />
      <Grid container spacing={0} >
        {filteredItems.map(it=>(
          <Grid display={"flex"} alignItems={"start"} key={it.id} item={true}>
            <CardComponent id={it.id}/>
          </Grid>))}
      </Grid>
    </div>
  );
}