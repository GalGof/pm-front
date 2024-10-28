import { useMemo, useState } from 'react';

/** 
 * @template T
 * @param {T} obj
 * @return {T}
 */
export function objectCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function CopyTextToClipboard(/** @type {string}*/text, /** @type {HTMLElement?}*/parent) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
  } else {
    let input = document.createElement("textarea");
    // modal may block focus into elements outside of it,
    // so we need some temp element inside modal
    const element = (parent || document.body);
    input.value = text;
    element.appendChild(input);
    input.focus({preventScroll: true});
    input.select();
    document.execCommand("copy");
    element.removeChild(input);
  }
}

export function CreateRenderTick()
{
  const cb = useState(0)[1];
  return useMemo(()=>()=>cb((i)=>i+1), [cb]);
}

//@ts-ignore
export const preventEnter = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
};
