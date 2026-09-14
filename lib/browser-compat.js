'use strict';
// Preserve modern declarations, with a preceding fallback for pre-Chromium-108 TVs.
function cssFallbacks(css){return css.replace(/([\w-]+)\s*:\s*([^;{}]*\b\d*\.?\d+[dsv](?:vh|vw)[^;{}]*)([;}])/g,(_,property,value,end)=>`${property}:${value.replace(/(\d)[dsv](vh|vw)\b/g,'$1$2')};${property}:${value}${end}`);}
module.exports={cssFallbacks};
