import { useState } from 'react';
import { useSelector } from 'react-redux'
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';

import AddIcon from '@mui/icons-material/Add';

import './BundlesView.css';
import ShowAddBundleModal from '../features/bundleInfo/AddBundleModal';
import BundleCard from '../features/bundleInfo/BundleCard';
import { AdminLockBadge } from '../common/Controls';

export default function BundlesView() {
  const adminAccess = useSelector((/** @type {ReduxStoreType}*/state) => state.globals.adminAccess);
  const bundlesIds = useSelector((/** @type {ReduxStoreType}*/state) => state.bundles.ids);
  const [itemsPerPage, _setItemsPerPage] = useState(15);
  const [pageId, setPageId] = useState(1);
  const itemsFrom = (pageId - 1) * itemsPerPage;
  const itemsTo = itemsFrom + itemsPerPage;
  const setItemsPerPage = (/** @type {number}*/ value)=>{
    _setItemsPerPage(value);
    setPageId(Math.floor(itemsFrom / value) + 1);
  }

  return (
    <div className='bundles-view'>
      <AppBar position='relative'>
        <Toolbar>
          {AdminLockBadge(
            adminAccess,
            <Button disabled={!adminAccess} onClick={()=>ShowAddBundleModal()}>
              <AddIcon />Add
            </Button>
          )}
          <div className='paginationPanel'>
            <Select
              value={itemsPerPage}
              onChange={(e)=>setItemsPerPage(+e.target.value)}
              >
              {[15, 40, 100].map(it=>(<MenuItem key={it} value={it}>{it}</MenuItem>))}
            </Select>
            <Pagination
              count={Math.ceil(bundlesIds.length / itemsPerPage)}
              page={pageId}
              onChange={(e, value)=>setPageId(value)}
              sx={{width: 380}}
              />
          </div>
        </Toolbar>
      </AppBar>
      <div className='content'>
        <Grid container spacing={0} >
          {bundlesIds.slice(itemsFrom, itemsTo).map(id=>(
            <Grid display={"flex"} alignItems={"start"} key={id} item={true}>
              <BundleCard id={id}/>
            </Grid>))}
        </Grid>
      </div>
    </div>
  );
}