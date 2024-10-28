import { useState, Fragment } from 'react';

/** @typedef {{key: string, Item: JSX.Element}[]} mitems */
/** @type {{modals: [mitems, React.Dispatch<React.SetStateAction<mitems>>]}|undefined} */
var activeManager = undefined;
var nextKey = 0;

/** @param {string} key */
function RemoveModal(key)
{
  activeManager?.modals[1]((currItems)=>currItems.filter(it=>it.key !== key));
}

/** 
 * @template {{onClose?: ()=>void} & object} T
 * @param {(args: T & {close: ()=>void}) => JSX.Element} ItemType
 * @param {T} params
 * */
export function AddModal(ItemType, params)
{
  const key = String(nextKey++);
  activeManager?.modals[1]((currData)=>[...currData, 
  {
    key,
    Item: <ItemType {...params} close={()=>{RemoveModal(key);params.onClose?.()}}/>
  }]);
}

/** @type {mitems} */
const defItems = [];
export function ModalManager()
{
  activeManager = {
    modals: useState(defItems),
  }
  return <div id='modalManager' style={{width: 0, height: 0}}>
    {activeManager.modals[0].map((({key, Item})=><Fragment key={key}>{Item}</Fragment>))}
  </div>
}