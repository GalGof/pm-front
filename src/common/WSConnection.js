import { srvAddress } from '../common/Config';

class WSConnection
{
  constructor()
  {
    /** @type {WebSocket?} */
    this.ws = null;
    this.stateChangeCallbacks = new Set();
    this.messageCallbacks = new Set();
    this.openCallbacks = new Set();
    this.connected = false;

    this.init();
  }
  /** @param {(state: boolean)=>void} callback */
  addOnStateChange(callback)
  {
    this.stateChangeCallbacks.add(callback);
    callback(this.connected);
  }
  /** @param {(state: boolean)=>void} callback */
  removeOnStateChange(callback)
  {
    this.stateChangeCallbacks.delete(callback);
  }
  /** @param {(e: MessageEvent)=>void} callback */
  addOnMessage(callback)
  {
    this.messageCallbacks.add(callback);
  }
  /** @param {(e: MessageEvent)=>void} callback */
  removeOnMessage(callback)
  {
    this.messageCallbacks.delete(callback);
  }
  /** @param {()=>void} callback */
  addOnOpen(callback)
  {
    this.openCallbacks.add(callback);
    if (this.connected) {
      callback();
    }
  }
  /** @param {()=>void} callback */
  removeOnOpen(callback)
  {
    this.openCallbacks.delete(callback);
  }
  /** @param {object} dataObj */
  async sendData(dataObj)
  {
    if (!this.connected) {
      /** @type {((state: boolean)=>void)?} */
      let cb = null
      await new Promise((resolve)=>{
        cb = (state)=>{if (state) resolve(null)};
        this.addOnStateChange(cb)
      }).then(()=>cb && this.removeOnStateChange(cb));
    }
    if (!this.ws) throw new Error("Unexpected state");
    this.ws.send(JSON.stringify(dataObj));
  }
  init()
  {
    const connect = ()=>{
      this.ws = new WebSocket(`ws://${srvAddress}/websockets`);
      this.ws.onopen = ()=>{
        this.connected = true;
        this.stateChangeCallbacks.forEach(it=>it(true));
        for (const callback of this.openCallbacks.values()) {
          try {
            callback();
          } catch (error) {
            console.error("WS callback exception", error);
          }
        }
      };
      this.ws.onmessage = (event)=>{
        for (const callback of this.messageCallbacks.values()) {
          try {
            callback(event);
          } catch (error) {
            console.error("WS callback exception", error);
          }
        }
      };
      this.ws.onclose = ()=>{
        this.connected = false;
        this.stateChangeCallbacks.forEach(it=>it(false));
        setTimeout(connect, 5000);
      };
    };
    connect();
  }
}

export const wsConnection = new WSConnection();
