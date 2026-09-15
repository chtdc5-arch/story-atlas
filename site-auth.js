(() => {
  'use strict';
  const PASSWORD_HASH='855fd9d6a68d9e2b4f27f9a116b4f83a433f45c6155f9bf7eea9156e770a3bb3';
  const SESSION_KEY='story-atlas-reader-access-v1';
  const form=document.querySelector('#siteAccessForm');
  const input=document.querySelector('#siteAccessPassword');
  const error=document.querySelector('#siteAccessError');
  let loading=false;
  const scripts=['supabase-config.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','roadmap-data.js?v=20260909','roadmap.js?v=20260909','published-story-data.js?v=20260910-17','published-story-overrides.js?v=20260916','app.js?v=20260910-17'];

  async function digest(value){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(item=>item.toString(16).padStart(2,'0')).join('');}
  function addScript(src){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.appendChild(script);});}
  async function loadSite(){
    if(loading)return;loading=true;
    try{for(const src of scripts)await addScript(src);document.body.classList.remove('site-locked');document.querySelector('#siteAccess').classList.add('unlocked');}
    catch{loading=false;error.textContent='網站載入失敗，請稍後再試。';}
  }
  async function unlock(value){
    if(await digest(value)!==PASSWORD_HASH){error.textContent='密碼不正確，請重新輸入。';input.select();return;}
    sessionStorage.setItem(SESSION_KEY,'granted');error.textContent='';loadSite();
  }
  form.addEventListener('submit',event=>{event.preventDefault();unlock(input.value);});
  if(sessionStorage.getItem(SESSION_KEY)==='granted')loadSite();
})();
