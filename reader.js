window.startStoryReader = () => {
  'use strict';
  const work=window.STORY_ATLAS_PUBLISHED_STATE?.state?.works?.[0];
  const episodes=[...(work?.episodes||[])].sort((a,b)=>Number(a.no)-Number(b.no));
  const list=document.querySelector('#chapterList');
  const select=document.querySelector('#chapterSelect');
  const content=document.querySelector('#novelContent');

  function esc(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
  function inline(value=''){return esc(value).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/_([^_]+)_/g,'<em>$1</em>');}
  function markdown(source=''){
    const lines=String(source).split(/\r?\n/);const output=[];
    for(let i=0;i<lines.length;i++){
      const line=lines[i].trim();if(!line)continue;
      if(/^---+$/.test(line)){output.push('<hr>');continue;}
      const heading=line.match(/^(#{1,3})\s+(.+)$/);if(heading){output.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);continue;}
      if(line.startsWith('>')){
        const quote=[];while(i<lines.length&&lines[i].trim().startsWith('>')){quote.push(lines[i].trim().replace(/^>\s?/,''));i++;}i--;
        const callout=quote[0]?.match(/^\[!(note|info|warning|danger|success|todo)\]\s*(.*)$/i);
        output.push(callout?`<aside><strong>${inline(callout[2]||'系統')}</strong>${quote.slice(1).filter(Boolean).map(item=>`<p>${inline(item)}</p>`).join('')}</aside>`:`<blockquote>${quote.filter(Boolean).map(item=>`<p>${inline(item)}</p>`).join('')}</blockquote>`);continue;
      }
      output.push(`<p>${inline(line)}</p>`);
    }
    return output.join('');
  }
  function chapterFromUrl(){const value=Number(new URLSearchParams(location.search).get('chapter'));return episodes.some(item=>Number(item.no)===value)?value:Number(episodes[0]?.no||1);}
  function render(no,push=true){
    const episode=episodes.find(item=>Number(item.no)===Number(no));if(!episode)return;
    const index=episodes.indexOf(episode);
    document.querySelector('#chapterKicker').textContent=`EPISODE ${String(episode.no).padStart(2,'0')} / ${String(episodes.length).padStart(2,'0')}`;
    document.querySelector('#chapterTitle').textContent=episode.title.replace(/^第\d+話[｜|]\s*/, '');
    document.querySelector('#chapterStatus').textContent=`第 ${episode.no} 話・${episode.status||'修訂中'}・更新 2026-09-10`;
    content.innerHTML=markdown(episode.novel);
    select.value=String(episode.no);
    list.querySelectorAll('button').forEach(button=>button.classList.toggle('active',Number(button.dataset.no)===Number(episode.no)));
    const prev=document.querySelector('#prevChapter'),next=document.querySelector('#nextChapter');
    prev.disabled=index===0;next.disabled=index===episodes.length-1;
    prev.onclick=()=>render(episodes[index-1].no);next.onclick=()=>render(episodes[index+1].no);
    if(push)history.pushState({chapter:episode.no},'',`?chapter=${episode.no}`);
    document.title=`第${episode.no}話｜${episode.title.replace(/^第\d+話[｜|]\s*/, '')}`;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  if(!episodes.length){content.innerHTML='<p>目前沒有可閱讀的話數。</p>';return;}
  list.innerHTML=episodes.map(item=>`<button data-no="${item.no}"><span>${String(item.no).padStart(2,'0')}</span>${esc(item.title.replace(/^第\d+話[｜|]\s*/,''))}</button>`).join('');
  select.innerHTML=episodes.map(item=>`<option value="${item.no}">第 ${item.no} 話｜${esc(item.title.replace(/^第\d+話[｜|]\s*/,''))}</option>`).join('');
  list.onclick=event=>{const button=event.target.closest('button[data-no]');if(button)render(button.dataset.no);};
  select.onchange=()=>render(select.value);
  window.onpopstate=()=>render(chapterFromUrl(),false);
  window.addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('#readingProgress').style.width=`${max>0?scrollY/max*100:0}%`;},{passive:true});
  render(chapterFromUrl(),false);
};
