window.startComicReader = () => {
  'use strict';
  const work=window.STORY_ATLAS_PUBLISHED_STATE?.state?.works?.[0];
  const episodes=[...(work?.episodes||[])].sort((a,b)=>Number(a.no)-Number(b.no));
  const list=document.querySelector('#chapterList');
  const select=document.querySelector('#chapterSelect');
  const pages=document.querySelector('#comicPages');

  function esc(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
  function titleOf(episode){return episode.title.replace(/^第\d+話[｜|]\s*/, '');}
  function pageData(episode){return (Array.isArray(episode.comicPages)?episode.comicPages:[]).map((page,index)=>typeof page==='string'?{src:page,label:`P${String(index+1).padStart(2,'0')}`}:{...page,label:page.label||`P${String(index+1).padStart(2,'0')}`}).filter(page=>page.src);}
  function chapterFromUrl(){const value=Number(new URLSearchParams(location.search).get('chapter'));return episodes.some(item=>Number(item.no)===value)?value:Number(episodes[0]?.no||1);}
  function render(no,push=true){
    const episode=episodes.find(item=>Number(item.no)===Number(no));if(!episode)return;
    const index=episodes.indexOf(episode),comicPages=pageData(episode);
    document.querySelector('#chapterKicker').textContent=`COMIC EPISODE ${String(episode.no).padStart(2,'0')} / ${String(episodes.length).padStart(2,'0')}`;
    document.querySelector('#chapterTitle').textContent=titleOf(episode);
    document.querySelector('#chapterStatus').textContent=`第 ${episode.no} 話・${comicPages.length?`${comicPages.length} 頁漫畫`:'漫畫準備中'}・更新 ${episode.updatedAt||work.updatedAt||'—'}`;
    pages.innerHTML=comicPages.length?comicPages.map((page,pageIndex)=>`<figure class="comic-page"><div class="page-marker"><span>${esc(page.label)}</span><small>${String(pageIndex+1).padStart(2,'0')} / ${String(comicPages.length).padStart(2,'0')}</small></div><img src="${esc(page.src)}" alt="第 ${episode.no} 話漫畫 ${esc(page.label)}" ${pageIndex>1?'loading="lazy"':''}></figure>`).join(''):`<div class="comic-empty"><span>COMING SOON</span><strong>本話漫畫準備中</strong><p>小說內容已可閱讀，漫畫頁完成後會依閱讀順序顯示在這裡。</p><a href="read.html?chapter=${episode.no}">先閱讀小說版</a></div>`;
    select.value=String(episode.no);
    list.querySelectorAll('button').forEach(button=>button.classList.toggle('active',Number(button.dataset.no)===Number(episode.no)));
    const prev=document.querySelector('#prevChapter'),next=document.querySelector('#nextChapter');
    prev.disabled=index===0;next.disabled=index===episodes.length-1;
    prev.onclick=()=>render(episodes[index-1].no);next.onclick=()=>render(episodes[index+1].no);
    document.querySelector('#novelReaderLink').href=`read.html?chapter=${episode.no}`;
    if(push)history.pushState({chapter:episode.no},'',`?chapter=${episode.no}`);
    document.title=`第${episode.no}話漫畫｜${titleOf(episode)}`;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  if(!episodes.length){pages.innerHTML='<div class="comic-empty"><strong>目前沒有可閱讀的話數。</strong></div>';return;}
  list.innerHTML=episodes.map(item=>{const count=pageData(item).length;return `<button data-no="${item.no}"><span>${String(item.no).padStart(2,'0')}</span><b>${esc(titleOf(item))}</b><small>${count?`${count} PAGES`:'準備中'}</small></button>`;}).join('');
  select.innerHTML=episodes.map(item=>`<option value="${item.no}">第 ${item.no} 話｜${esc(titleOf(item))}${pageData(item).length?'':'（漫畫準備中）'}</option>`).join('');
  list.onclick=event=>{const button=event.target.closest('button[data-no]');if(button)render(button.dataset.no);};
  select.onchange=()=>render(select.value);
  window.onpopstate=()=>render(chapterFromUrl(),false);
  window.addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('#readingProgress').style.width=`${max>0?scrollY/max*100:0}%`;},{passive:true});
  render(chapterFromUrl(),false);
};
