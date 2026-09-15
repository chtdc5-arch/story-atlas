(() => {
  'use strict';
  const PASSWORD_HASH='855fd9d6a68d9e2b4f27f9a116b4f83a433f45c6155f9bf7eea9156e770a3bb3';
  const SESSION_KEY='story-atlas-reader-access-v1';
  const form=document.querySelector('#accessForm');
  const input=document.querySelector('#accessPassword');
  const error=document.querySelector('#accessError');
  let loading=false;

  async function digest(value){
    const bytes=new TextEncoder().encode(value);
    const hash=await crypto.subtle.digest('SHA-256',bytes);
    return [...new Uint8Array(hash)].map(item=>item.toString(16).padStart(2,'0')).join('');
  }
  function loadStory(){
    if(loading)return;loading=true;
    const script=document.createElement('script');
    script.src='published-story-data.js?v=20260910-17';
    script.onload=()=>{
      const overrides=document.createElement('script');
      overrides.src='published-story-overrides.js?v=20260916';
      overrides.onload=()=>{
        document.body.classList.remove('reader-locked');
        document.querySelector('#accessGate').classList.add('unlocked');
        window.startStoryReader();
      };
      overrides.onerror=()=>{loading=false;error.textContent='修訂內容載入失敗，請稍後再試。';};
      document.head.appendChild(overrides);
    };
    script.onerror=()=>{loading=false;error.textContent='內容載入失敗，請稍後再試。';};
    document.head.appendChild(script);
  }
  async function unlock(value){
    if(await digest(value)!==PASSWORD_HASH){error.textContent='密碼不正確，請重新輸入。';input.select();return;}
    sessionStorage.setItem(SESSION_KEY,'granted');
    error.textContent='';loadStory();
  }
  form.addEventListener('submit',event=>{event.preventDefault();unlock(input.value);});
  if(sessionStorage.getItem(SESSION_KEY)==='granted')loadStory();
})();
