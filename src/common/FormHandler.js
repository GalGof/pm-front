/**
 * 'react-hook-form' require bunch of crutches to handle errors for names like 'xxx.xxx.xxx'
 * + crutches to handle defaults, passing useform between several components for complex forms..
 * useform data blinks between parent/child renders, have different getValue result without form changes
 */

/**
 * usual form behavour - wysiwyg
 * but we need more like edit of some of object fields, without loosing props we dont know of
 * and has ability to remove props we know of..
 */

import { objectCopy } from "./utils";

function pathValue(/** @type {string}*/path, /** @type {*} */ data)
{
  let parts = path.split('.');
  let target = data;
  for (let part of parts) {
    if (!target[part]) return target[part];
    target = target[part];
  }
  return target;
}

/**
 * @param {string} path 
 * @param {*} data 
 * @param {*} value 
 */
function pathSetValue(path, data, value)
{
  let parts = path.split('.');
  let target = data;
  let prev = parts[0];
  for (let curr of parts.slice(1)) {
    if (target[prev] === undefined) {
      if (curr.match(/^\d+$/)) {
        target[prev] = [];
      } else {
        target[prev] = {};
      }
    }
    target = target[prev];
    prev = curr;
  }
  target[prev] = value;
}

function clearArrays(/** @type {*} */obj)
{
  for (let [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      obj[key] = value.filter(it=>it !== null && it !== undefined);
    }
    if (value && typeof(value) === "object") {
      clearArrays(obj[key])
    }
  }
}

/** @typedef {"autocompleteMultiple"|"textarea"|"checkbox"|"autocompleteSelect"} ControlType */

/** @template {{[x:string]:any}} [T=any] */
export class FormHandler
{
  /** @ts-ignore @param {{defaults?: T}} [param] */
  constructor({defaults = {}} = {})
  {
    console.log("FormHandler", JSON.stringify(defaults, null, 2))
    /** @ts-ignore @type {T} */
    this.defaults = objectCopy(defaults);
    /** @ts-ignore @type {T} */
    this.values = objectCopy(defaults);
    /** @type {{[x:string]: any}} */
    this._defaults = {};
    /** @type {{[x:string]: boolean}}} */
    this.errors = {};
    /** @type {{[x:string]: any}} */
    this.components = {};
    /** @type {{[x:string]: any}} */
    this.regs = {};
    /** @type {{[x:string]: ControlType|undefined}} */
    this.controlTypes = {};
  }
  setDefault(/** @type {string}*/path, /** @type {*} */value)
  {
    if (Array.isArray(value) && this.controlTypes[path] === "textarea") {
      value = value.join('\n');
    }
    this._defaults[path] = value === undefined ? null : value;
  }
  getDefault(/** @type {string}*/path)
  {
    if (this._defaults[path] === undefined) {
      this.setDefault(path, pathValue(path, this.defaults));
    }
    return this._defaults[path];
  }
  getValue(/** @type {string}*/path)
  {
    return pathValue(path, this.values);
  }
  setValue(/** @type {string}*/path, /** @type {any} */ value)
  {
    pathSetValue(path, this.values, value);
  }
  /**
   * @param {string} path 
   * @param {{refName?: "ref"|"mref", defaultValue?: any, controlType?: ControlType, defaultPropName?: "defaultValue"|"defaultChecked"|null}} [options]
   * @returns 
   */
  register(path, {refName="ref", defaultValue, controlType, defaultPropName = "defaultValue"} = {})
  {
    if (!this.regs[path]) {
      this.controlTypes[path] = controlType;
      if (defaultValue !== undefined) {
        if (this.getDefault(path) === null) {
          this.setDefault(path, defaultValue);
          this.setValue(path, defaultValue);
        }
      }
      /** @param {React.ChangeEvent<HTMLInputElement>} e*/
      let onChange = (e)=>this.setValue(path, e.target.value);
      if (controlType === "textarea") {
        onChange = (e)=>this.setValue(path, e.target.value.split('\n'));
      } else
      if (controlType === "checkbox") {
        if (defaultPropName !== null) {
          defaultPropName = "defaultChecked";
        }
        onChange = (e)=>this.setValue(path, e.target.checked);
      } else
      if (controlType === "autocompleteSelect") {
        // TODO check usage/remove
        onChange = (e)=>this.setValue(path, e.target.value.split('\n'));
      } else
      if (controlType === "autocompleteMultiple") {
        //@ts-ignore
        onChange = (e, data)=>this.setValue(path, data);
      }
      this.components[path] = null;
      this.regs[path] = {
        [refName]: (/** @type {HTMLElement|null}*/element)=>{
          this.components[path] = element;
        },
        onChange,
      }
      let defValue = this.getDefault(path);
      if (defaultPropName && defValue !== null) {
        this.regs[path][defaultPropName] = defValue;
      }
    }
    return this.regs[path];
  }
  /** @return {T} */
  getValues()
  {
    /** @type {T} */
    let values = objectCopy(this.values);
    Object.entries(this.components).forEach(([prop, value])=>{
      if (!value) {
        console.log("getValues removed", prop);
        let target = values;
        let props = prop.split('.');
        for (let it of props.slice(0, -1)) {
          target = target[it];
          if (!target) return;
        }
        delete target[props[props.length - 1]];
      }
    })
    clearArrays(values)
    
    console.log("getValues", JSON.stringify(values, null, 2));
    return values;
  }
  hasErrors()
  {
    return !!Object.keys(this.errors).length;
  }
  /**
   * @param {string} name 
   */
  addError(name)
  {
    this.errors[name] = true;
  }
  /**
   * @param {string} name 
   */
  removeError(name)
  {
    delete this.errors[name];
  }
  clearErrors()
  {
    this.errors = {};
  }
}