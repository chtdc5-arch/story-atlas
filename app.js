(() => {
  'use strict';
  const STORE = 'story-atlas-formal-v1';
  const RESET = 'story-atlas-formal-reset-v1';
  if (!localStorage.getItem(RESET)) { localStorage.clear(); localStorage.setItem(RESET, 'done'); }
  const empty = { works: [], selectedWorkId: null, view: 'overview' };
  let state = read();
  let editorFormat = 'outline';
  let editorMode = 'write';
  let activeEpisodeId = null;
  const supabaseClient = window.supabase && window.STORY_ATLAS_SUPABASE ? window.supabase.createClient(window.STORY_ATLAS_SUPABASE.url, window.STORY_ATLAS_SUPABASE.anonKey) : null;
  let syncCode = localStorage.getItem('story-atlas-sync-code') || '';
  let syncTimer = null;
  let syncing = false;

  function read(){ try { return { ...empty, ...(JSON.parse(localStorage.getItem(STORE)) || {}) }; } catch { return { ...empty }; } }
  function save(){ localStorage.setItem(STORE, JSON.stringify(state)); queueSync(); }
  function queueSync(){ if(!syncCode || !supabaseClient || syncing)return; clearTimeout(syncTimer); syncTimer=setTimeout(pushCloud,900); }
  async function pushCloud(){ if(!syncCode || !supabaseClient)return; syncing=true; const {error}=await supabaseClient.from('workspace_sync').upsert({workspace_key:syncCode,payload:state,updated_at:new Date().toISOString()},{onConflict:'workspace_key'}); syncing=false; if(error)toast('同步失敗：請確認同步資料表已建立'); else toast('已同步到雲端'); }
  async function loadCloud(code,close){ if(!supabaseClient){toast('同步服務尚未載入');return;} syncCode=code.trim(); if(syncCode.length<8){toast('同步碼至少需要 8 個字元');return;} localStorage.setItem('story-atlas-sync-code',syncCode); syncing=true; const {data,error}=await supabaseClient.from('workspace_sync').select('payload,updated_at').eq('workspace_key',syncCode).maybeSingle(); syncing=false; if(error){toast('無法連線，請先執行 sync-schema.sql');return;} if(data?.payload){state={...empty,...data.payload};localStorage.setItem(STORE,JSON.stringify(state));close();render();toast('已載入雲端作品資料');}else{await pushCloud();close();toast('已建立新的雲端工作庫');} }
  function uid(prefix){ return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`; }
  function esc(v=''){ return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function markdown(source=''){
    const inline=s=>esc(s).replace(/\[\[([^\]]+)\]\]/g,'<a class="wiki-link">$1</a>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
    const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>x.trim());
    const lines=String(source).split(/\r?\n/), out=[]; let listType=null;
    const close=()=>{if(listType){out.push(`</${listType}>`);listType=null;}};
    for(let i=0;i<lines.length;i++){
      const t=lines[i].trim(); if(!t){close();continue;}
      if(t.includes('|') && i+1<lines.length && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i+1].trim())){
        close(); const headers=cells(t); i+=2; const rows=[]; while(i<lines.length && lines[i].trim().includes('|') && lines[i].trim()){rows.push(cells(lines[i]));i++;} i--; out.push(`<div class="table-scroll"><table><thead><tr>${headers.map(x=>`<th>${inline(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${headers.map((_,n)=>`<td>${inline(row[n]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
      }
      if(/^(---+|\*\*\*+|___+)$/.test(t)){close();out.push('<hr class="markdown-divider">');continue;}
      const h=t.match(/^(#{1,4})\s+(.+)$/);if(h){close();out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);continue;}
      const ol=t.match(/^\d+\.\s+(.+)$/);if(ol){if(listType!=='ol'){close();out.push('<ol>');listType='ol';}out.push(`<li>${inline(ol[1])}</li>`);continue;}
      const ul=t.match(/^[-*]\s+(.+)$/);if(ul){if(listType!=='ul'){close();out.push('<ul>');listType='ul';}out.push(`<li>${inline(ul[1])}</li>`);continue;}
      if(t.startsWith('>')){
        close(); const quote=[]; while(i<lines.length && lines[i].trim().startsWith('>')){quote.push(lines[i].trim().replace(/^>\s?/,'').trim());i++;} i--;
        const callout=quote[0]?.match(/^\[!(note|info|tip|warning|danger|success|todo)\]\s*(.*)$/i);
        if(callout){const kind=callout[1].toLowerCase(), title=callout[2]||kind[0].toUpperCase()+kind.slice(1);out.push(`<aside class="callout callout-${kind}"><div class="callout-title"><span>✦</span>${inline(title)}</div><div class="callout-body">${quote.slice(1).filter(Boolean).map(inline).join('<br>')}</div></aside>`);}else out.push(`<blockquote class="speech">${quote.map(inline).join('<br>')}</blockquote>`);
        continue;
      }
      close();const dialogue=/^(「|『|“|\").+[」』”\"]$/.test(t);out.push(`<p class="${dialogue?'dialogue':''}">${inline(t)}</p>`);
    }
    close(); return out.join('');
  }
  function work(){ return state.works.find(w => w.id === state.selectedWorkId) || null; }
  function list(){ return work()?.episodes || []; }
  function stamp(){ return new Date().toLocaleString('zh-TW',{dateStyle:'medium',timeStyle:'short'}); }
  function toast(message){ const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2300); }
  function download(name,text,type='application/json'){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }

  const nav = [
    ['overview','⌂','創作總覽'], ['episodes','▤','寫作內容'], ['characters','♙','角色資料庫'], ['scenes','⌘','場景資料庫'], ['assets','◫','圖像資產']
  ];
  const labels = Object.fromEntries(nav.map(x=>[x[0],x[2]]));
  function renderNav(){
    const item=([id,icon,label])=>`<button class="${state.view===id?'active':''}" data-view="${id}"><span>${icon}</span><em>${label}</em></button>`;
    document.querySelector('#sidebarNav').innerHTML = `<div class="nav-primary">${item(nav[0])}</div><div class="nav-section">創作內容</div>${item(nav[1])}<div class="nav-section">世界設定</div>${nav.slice(2).map(item).join('')}`;
  }
  function renderWorkMenu(){
    const current=work(); document.querySelector('#workSelect').innerHTML=current?`${esc(current.title)} <b>⌄</b>`:'請選擇作品 <b>⌄</b>';
    document.querySelector('#workMenu').innerHTML = state.works.length ? state.works.map(w=>`<button data-select-work="${w.id}"><strong>${esc(w.title)}</strong><small>${esc(w.status)}・${w.episodes.length} 話</small></button>`).join('') : '<div class="empty" style="min-height:90px;border:0;padding:10px"><small>尚未建立作品</small></div>';
  }
  function heading(eyebrow,title,desc,action=''){ return `<div class="heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${desc}</p></div>${action}</div>`; }
  function emptyBlock(title='尚未建立資料',hint='請按右上角按鈕開始建立。'){ return `<div class="empty"><div><strong>${title}</strong><small>${hint}</small></div></div>`; }
  function action(label,kind='primary',data=''){ return `<button class="${kind}" ${data}>${label}</button>`; }

  function render(){
    renderNav(); renderWorkMenu();
    document.querySelector('#breadcrumb').textContent = labels[state.view] || '創作總覽';
    const primary=document.querySelector('#primaryAction'); primary.textContent=state.view==='overview'?'＋ 建立作品':state.view==='episodes'?'＋ 新增話數':state.view==='characters'?'＋ 新增角色':state.view==='scenes'?'＋ 新增場景':state.view==='assets'?'＋ 新增資產':'＋ 新增';
    primary.onclick=()=>state.view==='overview'?openWork():state.view==='episodes'?openEpisode():state.view==='characters'?openCharacter():state.view==='scenes'?openScene():openAsset();
    const app=document.querySelector('#app'); app.innerHTML = state.view==='overview'?overview():state.view==='episodes'?episodes():state.view==='characters'?characters():state.view==='scenes'?scenes():assets();
    bindView();
  }
  function overview(){
    const current=work();
    let body=state.works.length ? `<div class="work-list">${state.works.map(w=>`<div class="work-row" data-select-work="${w.id}"><span class="work-symbol" ${w.coverUrl?`style="background-image:url('${w.coverUrl}')"`:''}>${w.coverUrl?'':esc(w.title.slice(0,1))}</span><span><strong>${esc(w.title)}</strong><small>${esc(w.status)}・${w.episodes.length} 話・${esc(w.updatedAt||'尚未更新')}</small></span><span class="progress"><i style="width:${Math.min(100,w.episodes.length*10)}%"></i><small>${w.episodes.length} 話內容</small></span><span class="tags"><b class="tag">${w.episodes.length?'小說':'待開始'}</b></span><button class="quiet mini" data-edit-work="${w.id}">編輯</button></div>`).join('')}</div>`:emptyBlock('尚未建立作品','建立作品後，所有創作項目會集中顯示在這裡。');
    const stats=current?[['話數',current.episodes.length],['角色',current.characters.length],['場景',current.scenes.length],['資產',current.assets.length]]:[['話數',0],['角色',0],['場景',0],['資產',0]];
    return `${heading('WORKSPACE OVERVIEW','小說創作管理庫','管理作品、內容版本與世界設定。',action('＋ 建立作品','primary','data-new-work'))}<div class="section-title"><h2>所有作品</h2><small>${state.works.length} 部作品</small></div>${body}<div class="section-title"><h2>目前作品資料</h2><small>${current?esc(current.title):'請先選擇作品'}</small></div><div class="stats">${stats.map(([k,v])=>`<div class="stat"><strong>${v}</strong><small>${k}</small></div>`).join('')}</div>`;
  }
  function episodes(){
    const w=work(); if(!w) return `${heading('WRITING CONTENT','寫作內容','請先從創作總覽建立或選擇作品。',action('回到創作總覽','quiet','data-go-overview'))}${emptyBlock('尚未選擇作品','作品選擇器位於左側。')}`;
    const eps=w.episodes; if(!activeEpisodeId || !eps.some(e=>e.id===activeEpisodeId)) activeEpisodeId=eps[0]?.id||null;
    const ep=eps.find(e=>e.id===activeEpisodeId);
    const side=eps.length?`<div class="episode-list"><div class="list-head"><strong>全部話數</strong><span>${eps.length}</span></div>${eps.map((e,i)=>`<button class="episode-row ${e.id===activeEpisodeId?'selected':''}" data-episode="${e.id}"><b class="episode-cover" ${e.coverUrl?`style="background-image:url('${e.coverUrl}')"`:''}>${e.coverUrl?'':String(i+1).padStart(2,'0')}</b><span><strong>${esc(e.title)}</strong><small>${esc(e.status||'構思中')}・第 ${e.versions?.length||1} 版</small></span><i>⋯</i></button>`).join('')}</div>`:emptyBlock('尚未建立話數','按右上角「新增話數」開始。');
    const editor=ep?`<div class="editor"><div class="tabs">${[['outline','大綱'],['novel','網路小說'],['comic','漫畫'],['video','影片']].map(([k,l])=>`<button class="${editorFormat===k?'active':''}" data-format="${k}">${l}</button>`).join('')}</div><div class="editor-body"><div class="editor-head"><span class="number">第 ${ep.no} 話</span><h2>${esc(ep.title)}</h2><span class="version">V${ep.versions?.[0]?.version||1}</span><button class="quiet mini" data-edit-episode="${ep.id}">編輯話數</button></div><div class="editor-mode"><button class="${editorMode==='write'?'active':''}" data-editor-mode="write">編輯原文</button><button class="${editorMode==='preview'?'active':''}" data-editor-mode="preview">預覽格式</button><small>Obsidian Markdown：**粗體**　1. 編號　- 清單　# 標題　&gt; 引用　[[連結]]</small></div>${editorMode==='write'?`<textarea id="contentEditor">${esc(ep[editorFormat]||'')}</textarea>`:`<article class="markdown-preview">${markdown(ep[editorFormat]||'尚未輸入內容')}</article>`}<div class="editor-footer"><small>本機保存・每次儲存會建立版本</small><button class="quiet" data-history>版本紀錄</button>${editorMode==='write'?'<button class="primary" data-save-content>儲存新版本</button>':''}</div></div></div>`:emptyBlock();
    return `${heading('WRITING CONTENT','寫作內容','同一話數可分別管理大綱、小說、漫畫與影片版本。',action('＋ 新增話數','primary','data-new-episode'))}<div class="episode-layout">${side}${editor}</div>`;
  }
  function characters(){ const w=work(); if(!w)return `${heading('CHARACTER CODEX','角色資料庫','請先選擇作品。')}${emptyBlock('尚未選擇作品')}`; return `${heading('CHARACTER CODEX','角色資料庫','角色、關係、服裝與出現話數集中管理。',action('＋ 新增角色','primary','data-new-character'))}<div class="toolbar"><div class="search">⌕<input id="searchCharacters" placeholder="搜尋姓名、別名或身份" /></div></div><div id="characterGrid" class="grid">${w.characters.length?w.characters.map(c=>`<button class="item" data-character="${c.id}"><h3>${esc(c.name)}</h3><small>${esc(c.alias||c.identity)}</small><p>${esc(c.personality||'尚未填寫個性')}</p><div class="meta">服裝 ${c.outfits?.length||0} 套・${esc(c.episodes||'未設定出現話數')}</div></button>`).join(''):emptyBlock('尚未建立角色')}</div>`; }
  function scenes(){ const w=work(); if(!w)return `${heading('SCENE ATLAS','場景資料庫','請先選擇作品。')}${emptyBlock('尚未選擇作品')}`; return `${heading('SCENE ATLAS','場景設定','固定欄位管理地點、時間、天氣、描述與使用話數。',action('＋ 新增場景','primary','data-new-scene'))}<div class="toolbar"><div class="search">⌕<input id="searchScenes" placeholder="搜尋場景名稱或分類" /></div></div><div id="sceneGrid" class="grid scene-grid">${w.scenes.length?w.scenes.map(s=>`<button class="item" data-scene="${s.id}"><h3>${esc(s.name)}</h3><small>${esc(s.category)}・${esc(s.time)}・${esc(s.weather)}</small><p>${esc(s.description)}</p><div class="meta">${esc(s.episodes||'尚未關聯話數')}</div></button>`).join(''):emptyBlock('尚未建立場景')}</div>`; }
  function assets(){ const w=work(); if(!w)return `${heading('ASSET LIBRARY','圖像資產','請先選擇作品。')}${emptyBlock('尚未選擇作品')}`; return `${heading('ASSET LIBRARY','圖像資產','記錄角色、服裝、場景、漫畫與影片所使用的檔案。',action('＋ 新增資產','primary','data-new-asset'))}<div class="toolbar"><div class="search">⌕<input id="searchAssets" placeholder="搜尋檔名、類型或標籤" /></div></div><div id="assetGrid" class="grid asset-grid">${w.assets.length?w.assets.map(a=>`<button class="item asset" data-asset="${a.id}" ${a.dataUrl?`style="background-image:linear-gradient(#ffffffcc,#ffffffcc),url('${a.dataUrl}')"`:''}><span class="tag">${esc(a.type)}</span><div><strong>${esc(a.name)}</strong><small>${esc(a.note||'')}</small></div></button>`).join(''):emptyBlock('尚未建立圖像資產','可先記錄檔案與提示詞，或上傳圖片檔案。')}</div>`; }

  function bindView(){
    document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;save();render();});
    document.querySelectorAll('[data-select-work]').forEach(b=>b.onclick=()=>{state.selectedWorkId=b.dataset.selectWork;state.view='overview';save();render();toast('已切換目前作品');});
    document.querySelectorAll('[data-edit-work]').forEach(b=>b.onclick=e=>{e.stopPropagation();openWork(workById(b.dataset.editWork));});
    document.querySelector('[data-go-overview]')?.addEventListener('click',()=>{state.view='overview';save();render();});
    document.querySelector('[data-new-work]')?.addEventListener('click',openWork);document.querySelector('[data-new-episode]')?.addEventListener('click',openEpisode);document.querySelector('[data-new-character]')?.addEventListener('click',openCharacter);document.querySelector('[data-new-scene]')?.addEventListener('click',openScene);document.querySelector('[data-new-asset]')?.addEventListener('click',openAsset);
    document.querySelectorAll('[data-episode]').forEach(b=>b.onclick=()=>{activeEpisodeId=b.dataset.episode;editorFormat='outline';render();});
    document.querySelectorAll('[data-format]').forEach(b=>b.onclick=()=>{editorFormat=b.dataset.format;render();});
    document.querySelectorAll('[data-editor-mode]').forEach(b=>b.onclick=()=>{editorMode=b.dataset.editorMode;render();});
    document.querySelector('[data-edit-episode]')?.addEventListener('click',()=>openEpisode(work()?.episodes.find(e=>e.id===activeEpisodeId)));
    document.querySelector('[data-save-content]')?.addEventListener('click',saveContent);document.querySelector('[data-history]')?.addEventListener('click',showHistory);
    document.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>openCharacter(work().characters.find(x=>x.id===b.dataset.character)));
    document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>openScene(work().scenes.find(x=>x.id===b.dataset.scene)));
    document.querySelectorAll('[data-asset]').forEach(b=>b.onclick=()=>openAsset(work().assets.find(x=>x.id===b.dataset.asset)));
    bindSearch('searchCharacters','characterGrid','[data-character]');bindSearch('searchScenes','sceneGrid','[data-scene]');bindSearch('searchAssets','assetGrid','[data-asset]');
  }
  function workById(id){ return state.works.find(w=>w.id===id); }
  function bindSearch(inputId,gridId,selector){ const input=document.querySelector('#'+inputId);if(!input)return;input.oninput=()=>document.querySelectorAll('#'+gridId+' '+selector).forEach(x=>x.style.display=x.textContent.toLowerCase().includes(input.value.toLowerCase())?'':'none'); }

  function modal(title,desc,body,onSave,saveLabel='儲存',danger=false){ const root=document.querySelector('#modalRoot');root.innerHTML=`<div class="modal-backdrop"><div class="modal"><button class="modal-close">×</button><h2>${title}</h2><p>${desc}</p>${body}<div class="modal-actions"><button class="quiet" data-cancel>取消</button><button class="${danger?'danger':'primary'}" data-modal-save>${saveLabel}</button></div></div></div>`;const close=()=>root.innerHTML='';root.querySelector('.modal-close').onclick=close;root.querySelector('[data-cancel]').onclick=close;root.querySelector('.modal-backdrop').onclick=e=>{if(e.target===e.currentTarget)close();};root.querySelector('[data-modal-save]').onclick=()=>onSave(root,close); }
  function field(key,label,value='',full=false,textarea=false){return `<label class="${full?'full':''}">${label}${textarea?`<textarea name="${key}">${esc(value)}</textarea>`:`<input name="${key}" value="${esc(value)}">`}</label>`;}
  function readImage(root,name,current=''){const file=root.querySelector(`[name=${name}]`)?.files?.[0];if(!file)return Promise.resolve(current);return new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file);});}
  function openWork(existing=null){ const w=existing||{};modal(existing?'編輯作品':'建立作品','作品是所有話數、角色、場景與資產的關聯中心。',`<div class="form-grid">${field('title','書名',w.title)}${field('status','狀態',w.status||'構思中')} ${field('summary','簡介',w.summary,true,true)}<label class="full">小說封面圖<input type="file" name="cover" accept="image/*">${w.coverUrl?'<small class="image-hint">已設定封面；選擇新圖片即可替換</small>':''}</label></div>`,async(root,close)=>{const title=root.querySelector('[name=title]').value.trim();if(!title)return toast('請輸入書名');const coverUrl=await readImage(root,'cover',w.coverUrl);if(existing){Object.assign(existing,{title,summary:root.querySelector('[name=summary]').value,status:root.querySelector('[name=status]').value,coverUrl,updatedAt:stamp()});}else{const item={id:uid('work'),title,summary:root.querySelector('[name=summary]').value,status:root.querySelector('[name=status]').value,coverUrl,updatedAt:stamp(),episodes:[],characters:[],scenes:[],assets:[]};state.works.push(item);state.selectedWorkId=item.id;}save();close();render();toast(existing?'作品已更新':'作品已建立');}); }
  function openEpisode(existing=null){ const w=work();if(!w)return toast('請先選擇作品');const e=existing||{};modal(existing?'編輯話數':'新增話數','建立後可在寫作內容中編輯四種版本。',`<div class="form-grid">${field('title','話數標題',e.title)}${field('status','內容狀態',e.status||'構思中')}${field('outline','大綱',e.outline,'full',true)}<label class="full">話數代表圖<input type="file" name="cover" accept="image/*">${e.coverUrl?'<small class="image-hint">已設定代表圖；選擇新圖片即可替換</small>':''}</label></div>`,async(root,close)=>{const title=root.querySelector('[name=title]').value.trim();if(!title)return toast('請輸入話數標題');const coverUrl=await readImage(root,'cover',e.coverUrl);if(existing){Object.assign(existing,{title,status:root.querySelector('[name=status]').value,outline:root.querySelector('[name=outline]').value,coverUrl,updatedAt:stamp()});}else{const item={id:uid('episode'),no:w.episodes.length+1,title,status:root.querySelector('[name=status]').value,outline:root.querySelector('[name=outline]').value,coverUrl,novel:'',comic:'',video:'',versions:[{version:1,note:'建立話數',at:stamp()}]};w.episodes.push(item);activeEpisodeId=item.id;state.view='episodes';}save();close();render();toast(existing?'話數已更新':'話數已建立');}); }
  function saveContent(){const w=work(),e=w?.episodes.find(x=>x.id===activeEpisodeId);if(!e)return;const value=document.querySelector('#contentEditor').value;if(value===(e[editorFormat]||''))return toast('內容沒有變更');e[editorFormat]=value;e.versions=e.versions||[];e.versions.unshift({version:(e.versions[0]?.version||0)+1,note:`更新${{outline:'大綱',novel:'網路小說',comic:'漫畫',video:'影片'}[editorFormat]}內容`,at:stamp()});e.updatedAt=stamp();save();render();toast('已儲存新版本');}
  function showHistory(){const e=work()?.episodes.find(x=>x.id===activeEpisodeId);if(!e)return;modal('版本紀錄','每次儲存會留下版本號、變更內容與時間。',`<div class="panel">${(e.versions||[]).map(v=>`<div style="padding:12px;border-bottom:1px solid var(--line)"><b>V${v.version}</b>　${esc(v.note)}<small style="display:block;color:var(--muted);margin-top:5px">${esc(v.at)}</small></div>`).join('')}</div>`,(_,close)=>close(),'關閉');}
  function openCharacter(existing=null){const w=work();if(!w)return toast('請先選擇作品');const c=existing||{};const outfits=c.outfits||[];modal(existing?'編輯角色':'新增角色','角色可與多套服裝及多話數關聯。',`<div class="form-grid">${field('name','姓名',c.name)}${field('alias','別名',c.alias)}${field('identity','身份',c.identity)}${field('personality','個性',c.personality)}${field('appearance','年齡／身高／外貌特徵',c.appearance,'full',true)}${field('relations','人物關係',c.relations,'full',true)}${field('episodes','出現話數',c.episodes)}${field('prompt','AI 生成提示詞',c.prompt,'full',true)}<label class="full">服裝（每行：類型｜描述｜使用話數與場景）<textarea name="outfits">${esc(outfits.map(o=>`${o.type||''}｜${o.description||''}｜${o.episodes||''}`).join('\n'))}</textarea></label></div>`,(root,close)=>{const item={id:c.id||uid('character'),name:root.querySelector('[name=name]').value.trim(),alias:root.querySelector('[name=alias]').value.trim(),identity:root.querySelector('[name=identity]').value.trim(),personality:root.querySelector('[name=personality]').value.trim(),appearance:root.querySelector('[name=appearance]').value,relations:root.querySelector('[name=relations]').value,episodes:root.querySelector('[name=episodes]').value,prompt:root.querySelector('[name=prompt]').value,outfits:root.querySelector('[name=outfits]').value.split('\n').filter(Boolean).map(x=>{const [type,description,episodes]=x.split('｜');return{type,description,episodes};})};const i=w.characters.findIndex(x=>x.id===item.id);if(i<0)w.characters.push(item);else w.characters[i]=item;save();close();render();toast(existing?'角色已更新':'角色已建立');});}
  function openScene(existing=null){const w=work();if(!w)return toast('請先選擇作品');const s=existing||{};modal(existing?'編輯場景':'新增場景','固定保存地點、時間、天氣、描述、提示詞與使用話數。',`<div class="form-grid">${field('name','場景名稱',s.name)}${field('category','地點分類',s.category)}${field('time','時間',s.time)}${field('weather','天氣',s.weather)}${field('description','場景描述',s.description,'full',true)}${field('prompt','AI 生成提示詞',s.prompt,'full',true)}${field('episodes','使用話數與場次',s.episodes,'full')}</div>`,(root,close)=>{const item={id:s.id||uid('scene'),name:root.querySelector('[name=name]').value.trim(),category:root.querySelector('[name=category]').value,time:root.querySelector('[name=time]').value,weather:root.querySelector('[name=weather]').value,description:root.querySelector('[name=description]').value,prompt:root.querySelector('[name=prompt]').value,episodes:root.querySelector('[name=episodes]').value};const i=w.scenes.findIndex(x=>x.id===item.id);if(i<0)w.scenes.push(item);else w.scenes[i]=item;save();close();render();toast(existing?'場景已更新':'場景已建立');});}
  function openAsset(existing=null){const w=work();if(!w)return toast('請先選擇作品');const a=existing||{};modal(existing?'編輯資產':'新增資產','可記錄檔案、類型、標籤、使用話數與 AI 生成提示詞。',`<div class="form-grid">${field('name','資產名稱／檔名',a.name)}${field('type','資產類型',a.type||'角色參考圖')}${field('tags','標籤',a.tags)}${field('episodes','使用話數與場次',a.episodes)}${field('prompt','AI 生成提示詞',a.prompt,'full',true)}<label class="full">圖片檔案<input type="file" name="file" accept="image/*"></label></div>`,async(root,close)=>{const file=root.querySelector('[name=file]').files[0];const item={...a,id:a.id||uid('asset'),name:root.querySelector('[name=name]').value.trim()||file?.name||'未命名資產',type:root.querySelector('[name=type]').value,tags:root.querySelector('[name=tags]').value,episodes:root.querySelector('[name=episodes]').value,prompt:root.querySelector('[name=prompt]').value};if(file){item.dataUrl=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file);});}const i=w.assets.findIndex(x=>x.id===item.id);if(i<0)w.assets.push(item);else w.assets[i]=item;save();close();render();toast(existing?'資產已更新':'資產已建立');});}

  function resetLocal(){if(confirm('確定清空全部作品、話數、角色、場景、資產與版本紀錄？此操作無法復原。')){localStorage.clear();location.reload();}}
  function syncSettings(){modal('雲端同步','在每台裝置輸入同一組同步碼，即可共用作品資料；不需要建立個人帳號。同步碼請使用長且難以猜測的字串。',`<div class="form-grid"><label class="full">同步碼<input name="syncCode" type="password" value="${esc(syncCode)}" placeholder="例如：story-atlas-你的專屬長密碼"></label><div class="full empty"><div><strong>目前狀態</strong><small>${syncCode?'已設定同步碼，儲存後會載入雲端資料。':'尚未連接雲端工作庫。'}</small></div></div></div>`,(root,close)=>loadCloud(root.querySelector('[name=syncCode]').value,close),'連接同步庫');}
  function settings(){modal('系統設定','單人工作庫不需要登入。建議定期匯出 JSON 備份。',`<div class="form-grid"><div class="full empty"><div><strong>本機資料保存</strong><small>資料只保存在這個瀏覽器；可用上方匯出／匯入跨裝置搬移。</small></div></div></div><div style="margin-top:18px"><button class="danger" data-wipe>清空全部本機資料</button></div>`,(root,close)=>close(),'關閉');document.querySelector('[data-wipe]')?.addEventListener('click',resetLocal);}
  document.querySelector('#workSelect').onclick=()=>document.querySelector('#workMenu').classList.toggle('open');
  document.querySelector('#syncBtn').onclick=syncSettings;
  document.querySelector('#settingsBtn').onclick=settings;
  document.querySelector('#resetBtn').onclick=resetLocal;
  document.querySelector('#exportBtn').onclick=()=>download(`story-atlas-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(state,null,2));
  document.querySelector('#importBtn').onclick=()=>document.querySelector('#fileImport').click();
  document.querySelector('#fileImport').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const imported=JSON.parse(await file.text());if(!Array.isArray(imported.works))throw new Error('格式錯誤');state={...empty,...imported};save();render();toast('資料匯入完成');}catch{toast('匯入失敗：請選擇卷宗台 JSON 備份');}e.target.value='';};
  document.querySelector('#workMenu').onclick=e=>{const b=e.target.closest('[data-select-work]');if(b){state.selectedWorkId=b.dataset.selectWork;state.view='overview';save();render();document.querySelector('#workMenu').classList.remove('open');}};
  document.addEventListener('click',e=>{if(!e.target.closest('.workspace-switcher'))document.querySelector('#workMenu').classList.remove('open');});
  render();
  if(syncCode) loadCloud(syncCode,()=>{});
})();
