import { srvAddress } from './Config';
import { ModalError } from '../modals/ShowModal';
import { wsConnection } from '../common/WSConnection';

let rpcId = 0;

/** @param {WsRpcParams} params */
export async function RpcCall(params)
{
  let requestId = rpcId++;
  /** @type {null|((state: boolean)=>void)} */
  let onStateCB = null;
  /** @type {null|((event: MessageEvent)=>void)} */
  let onMessage = null;
  return new Promise((resolve, reject)=>{
    onStateCB = (state)=>{if (!state) reject("Disconnected.")};
    onMessage = (event)=>{
      try {
        let message = JSON.parse(event.data);
        if (message?.rpcId === requestId) {
          console.log("<<<", message);
          if (message.error) {
            reject(message.error)
          } else {
            resolve(message.result);
          }
        }
      } catch(error) {
        console.error("rpc responce hadler error", error);
        console.log(event.data);
      }
    }
    wsConnection.addOnStateChange(onStateCB);
    wsConnection.addOnMessage(onMessage);
    const message = {rpcId: requestId, message: "rpc.call", ...params};
    console.log(">>>", message);
    wsConnection.sendData(message);
  }).finally(()=>{
    if (onStateCB) wsConnection.removeOnStateChange(onStateCB);
    if (onMessage) wsConnection.removeOnMessage(onMessage);
  });
}

/** @param {{currentKey: string, newKey?: string}} param0 */
export async function PostAdminAceessKey({currentKey, newKey = undefined})
{
  return fetch(`http://${srvAddress}/api/adminAccessKey`, {
    body: JSON.stringify({currentKey, newKey}),
    method: 'POST',
    headers: {
        "Content-Type": "application/json"
    },
  }).then(res=>{if (res.status !== 200) throw new Error("Bad result")});
}

/**
 * @param {object} params 
 * @param {"deployed"|"bundles"|"dockerRegistries"|"builders"|"dockerEngines"|"sharedData"} dbName
 * */
export async function RawSaveDB(params, dbName)
{
  return fetch(`http://${srvAddress}/api/db/${dbName}/item/save`, {
    body: JSON.stringify(params),
    method: 'POST',
    headers: {
        "Content-Type": "application/json"
    },
  }).then(res=>{if (res.status !== 200) throw new Error("Bad result")});
}

/**
 * @param {any} params 
 * @param {(state: boolean)=>void} setSaveInProgress 
 * @param {(opened?: boolean)=>void} close 
 * @param {"bundles"|"dockerRegistries"|"builders"|"dockerEngines"|"sharedData"} dbName
 * */
export async function SaveDBModalCall(params, setSaveInProgress, close, dbName)
{
  setSaveInProgress(true);
  RawSaveDB(params, dbName).then(()=>{
    close(false);
  }).catch(error=>{
    console.error(dbName, params, error);
    ModalError({title: `Failed to save item db(${dbName})`, error});
  }).finally(()=>{
    setSaveInProgress(false);
  });
}

/**
 * @param {()=>Promise<any>} action
 * @param {(opened?: boolean)=>void} close 
 * @param {(arg0: boolean)=>void} setSaveInProgress
 * */
export async function ActionWrapper(action, setSaveInProgress, close)
{
  setSaveInProgress(true);
  action().then(()=>{
    close(false);
  }).catch(error=>{
    console.error(error);
    ModalError({title: `Action failed`, error});
  }).finally(()=>{
    setSaveInProgress(false);
  });
}

/** @param {object} params */
export async function SaveBundle(params)
{
  return RawSaveDB(params, "bundles");
}

/** @param {object} params */
export async function SaveRegistry(params)
{
  return RawSaveDB(params, "dockerRegistries");
}

/** @param {object} params */
export async function SaveBuilder(params)
{
  return RawSaveDB(params, "builders");
}

/** @return {Promise<DeployedInfo>}*/
export async function DeployBundle(/** @type {DeployBundleRequest}*/params)
{
  return RpcCall({
    target: "Controller",
    method: "deployBundle",
    args: [params]
  });
}

export async function CreateBundle(/** @type {BuildBundleRequest}*/params)
{
  return fetch(`http://${srvAddress}/api/controller/bundle/create`, {
    body: JSON.stringify(params),
    method: 'POST',
    headers: {
        "Content-Type": "application/json"
    },
  }).then(async res=>{
    if (res.status !== 200) {
      throw new Error(`${res.status} ${res.statusText} ${await res.text()}`)
    }
  });
}

export async function RemovePack(/** @type {{dockerId: string, packId: string}}*/params)
{
  return RpcCall({
    target: "Docker",
    dockerId: params.dockerId,
    method: "removePack",
    args: [params.packId]
  });
}

export async function DockerRPC(/** @type {{dockerId: string, fname: string, args?: any[]}}*/params)
{
  return RpcCall({
    target: "Docker",
    dockerId: params.dockerId,
    method: params.fname,
    args: params.args,
  });
}

export async function ControllerRPC(/** @type {{fname: string, args?: any[]}}*/params)
{
  return RpcCall({
    target: "Controller",
    method: params.fname,
    args: params.args,
  });
}

export async function Restart()
{
  fetch(`http://${srvAddress}/api/restart`, {method: "DELETE"})
    .then(()=>window.alert("send."))
    .catch((error)=>{
      console.error(error);
      window.alert("error.")
    })
}