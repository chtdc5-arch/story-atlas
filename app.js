let navItems;
const views = document.querySelectorAll('.view');
const crumb = document.querySelector('.crumb');
const toast = document.getElementById('toast');
const activeWork = '《我只是看個小說，怎麼成了必死反派？》';
const workOptions = [activeWork, '《第二個尚未命名的故事》'];
const STORAGE_KEY = 'story-atlas-mvp-state';
const supabaseClient = window.supabase && window.STORY_ATLAS_SUPABASE
  ? window.supabase.createClient(window.STORY_ATLAS_SUPABASE.url, window.STORY_ATLAS_SUPABASE.anonKey)
  : null;
window.storyAtlasSupabase = supabaseClient;
const storedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
let selectedWork = storedState.selectedWork || null;
let lastView = storedState.lastView || 'overview';

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ selectedWork, lastView }));
}

const nav = document.querySelector('.sidebar nav');
nav.innerHTML = `
  <button class="nav-item active" data-view="overview"><span>⌂</span>創作總覽</button>
  <div class="nav-group-label">寫作內容</div>
  <button class="nav-item" data-view="episodes"><span>▤</span>話數與章節</button>
  <button class="nav-item nav-disabled" data-not-ready="大綱與時間線"><span>⌁</span>大綱與時間線</button>
  <div class="nav-group-label">世界設定</div>
  <button class="nav-item" data-view="characters"><span>♙</span>角色與關係</button>
  <button class="nav-item" data-view="scenes"><span>⌘</span>場景設定</button>
  <button class="nav-item" data-view="assets"><span>◫</span>圖像資產</button>`;
const workspaceSwitcher = document.querySelector('.workspace-switcher');
workspaceSwitcher.innerHTML = `<small class="workspace-label">${selectedWork ? '目前工作庫' : '目前創作項目'}</small><button class="workspace-choice"><strong class="selected-work-name">${selectedWork || '請選擇作品'}</strong><span>⌄</span></button><div class="workspace-menu">${workOptions.map((work, index) => `<button data-sidebar-work="${index}"><i>${work === selectedWork ? '●' : '○'}</i><span>${work}<small>${index === 0 ? '連載中・第 1 話' : '構思中・尚未建立話數'}</small></span></button>`).join('')}</div>`;
nav.insertBefore(workspaceSwitcher, nav.children[1]);
navItems = document.querySelectorAll('.nav-item[data-view]');
const creatorNav = document.querySelector('.sidebar nav');

function setProjectMode(isOpen, work = selectedWork) {
  selectedWork = isOpen ? work : null;
  creatorNav.classList.toggle('project-open', isOpen);
  document.body.classList.toggle('project-selected', isOpen);
  workspaceSwitcher.classList.toggle('workspace-selected', isOpen);
  workspaceSwitcher.querySelector('.workspace-label').textContent = isOpen ? '目前工作庫' : '目前創作項目';
  workspaceSwitcher.querySelector('.selected-work-name').textContent = isOpen ? selectedWork : '請選擇作品';
  saveState();
}

workspaceSwitcher.querySelector('.workspace-choice').addEventListener('click', () => workspaceSwitcher.classList.toggle('open'));
workspaceSwitcher.querySelectorAll('[data-sidebar-work]').forEach(option => option.addEventListener('click', () => {
  selectedWork = workOptions[Number(option.dataset.sidebarWork)];
  setProjectMode(true, selectedWork);
  workspaceSwitcher.classList.remove('open');
  if (selectedWork === activeWork) showView('episodes');
  else notify(`${selectedWork} 已選取，可以開始建立第一話`);
}));

const topbar = document.querySelector('.topbar');
const workPicker = document.createElement('div');
workPicker.className = 'current-work-picker';
workPicker.innerHTML = `<small>目前作品</small><button>${activeWork}<span>⌄</span></button><div class="work-menu">${workOptions.map((work, index) => `<button data-work-index="${index}"><i>${index === 0 ? '●' : '○'}</i>${work}<small>${index === 0 ? '連載中・第 1 話' : '構思中・尚未建立話數'}</small></button>`).join('')}</div>`;
topbar.querySelector('.crumb').after(workPicker);

workPicker.querySelector('button').addEventListener('click', () => workPicker.classList.toggle('open'));
workPicker.querySelectorAll('[data-work-index]').forEach(option => option.addEventListener('click', () => {
  const selected = workOptions[Number(option.dataset.workIndex)];
  if (selected !== activeWork) {
    selectedWork = selected;
    setProjectMode(true, selectedWork);
    notify(`${selected} 已選取，可以開始建立第一話`);
  } else {
    setProjectMode(true, selected);
    notify(`已切換至 ${selected}`);
  }
  workPicker.classList.remove('open');
}));

// 角色、場景與圖檔都隸屬於目前作品；正式版會由 work_id 取得此狀態。
['characters', 'scenes', 'assets'].forEach(viewId => {
  const view = document.getElementById(viewId);
  const toolbar = view?.querySelector('.catalog-toolbar');
  if (!toolbar) return;
  const filter = document.createElement('button');
  filter.className = 'filter work-filter';
  filter.textContent = `所屬作品：${activeWork.slice(0, 15)}…⌄`;
  filter.addEventListener('click', () => notify(`目前資料已鎖定於 ${activeWork}`));
  toolbar.insertBefore(filter, toolbar.children[1]);
  const note = document.createElement('div');
  note.className = 'linked-work-note';
  const counts = { characters: '角色 6 人・服裝 4 套', scenes: '場景 6 個・使用於第 1 話', assets: '34 個資產・角色 18・場景 12・漫畫 4' };
  note.innerHTML = `<span>目前顯示作品</span><strong>${activeWork}</strong><em>${counts[viewId]}</em>`;
  toolbar.insertAdjacentElement('afterend', note);
});

const overview = document.getElementById('overview');
const projectHero = overview.querySelector('.project-hero');
const workSummary = document.createElement('section');
workSummary.className = 'work-summary';
workSummary.innerHTML = `<div class="summary-heading"><div><p class="eyebrow">ALL CREATIONS</p><h2>我的創作進度</h2><p>先看全局，再進入其中一本作品繼續創作。</p></div><button class="quiet-btn">＋ 建立新作品</button></div><div class="work-list"><button class="work-row current"><span class="work-symbol">反</span><span class="work-copy"><strong>${activeWork}</strong><small>連載中・第 1 話・最後更新今天</small></span><span class="work-progress"><i style="width:42%"></i><small>42%　內容進度</small></span><span class="work-formats"><b>小說</b><b>漫畫</b><b class="off">影片</b></span><span class="work-arrow">→</span></button><button class="work-row"><span class="work-symbol second">未</span><span class="work-copy"><strong>第二個尚未命名的故事</strong><small>構思中・尚未建立話數</small></span><span class="work-progress"><i style="width:8%"></i><small>8%　內容進度</small></span><span class="work-formats"><b class="off">小說</b><b class="off">漫畫</b><b class="off">影片</b></span><span class="work-arrow">→</span></button></div>`;
projectHero.before(workSummary);

const relationStyle = document.createElement('style');
relationStyle.textContent = `.linked-work-note{display:flex;align-items:center;gap:12px;padding:13px 15px;background:#e8eee8;border-left:3px solid #305342;margin-top:18px;font-size:11px}.linked-work-note span{font:10px 'DM Mono';color:#6f786e}.linked-work-note strong{font-family:'Noto Serif TC';font-weight:600}.linked-work-note em{margin-left:auto;font-style:normal;font:10px 'DM Mono';color:#7a8178}.work-filter{color:#305342!important;border-color:#b8c9ba!important}.current-work-picker{position:relative;margin-left:24px;margin-right:auto;min-width:320px}.current-work-picker>small{display:block;color:#92958d;font:9px 'DM Mono';letter-spacing:.7px;margin-bottom:3px}.current-work-picker>button{border:0;background:transparent;padding:0;color:#24372d;font:600 13px 'Noto Serif TC';cursor:pointer}.current-work-picker>button span{font:12px 'Space Grotesk';margin-left:10px;color:#8c8b82}.work-menu{display:none;position:absolute;z-index:4;top:42px;left:-12px;width:320px;background:#faf8f3;border:1px solid #dcd8ce;box-shadow:0 16px 34px rgba(38,34,26,.14);padding:6px}.current-work-picker.open .work-menu{display:block}.work-menu button{display:grid;grid-template-columns:18px 1fr;text-align:left;border:0;background:transparent;width:100%;padding:11px 10px;color:#202421;font:500 11px 'Noto Serif TC';cursor:pointer}.work-menu button:hover{background:#e8eee8}.work-menu button>i{font-style:normal;color:#b78338}.work-menu button small{grid-column:2;color:#817f77;font:9px 'DM Mono';margin-top:4px}@media(max-width:700px){.current-work-picker{min-width:0;margin-left:12px}.current-work-picker>button{max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.work-menu{width:280px;left:auto;right:0}}`;
relationStyle.textContent += `.nav-group-label{font:9px 'DM Mono';letter-spacing:1px;color:#748078;text-transform:uppercase;padding:17px 12px 5px}.nav-disabled{color:#8d9790!important}.work-summary{margin-bottom:28px}.summary-heading{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:13px}.summary-heading h2{font:700 19px 'Noto Serif TC';margin:0}.summary-heading p:not(.eyebrow){font-size:11px;color:#817f77;margin:7px 0 0}.work-list{border-top:1px solid #dcd8ce}.work-row{width:100%;border:0;border-bottom:1px solid #dcd8ce;background:#faf8f3;display:flex;align-items:center;text-align:left;gap:15px;padding:15px 17px;cursor:pointer}.work-row:hover,.work-row.current{background:#e8eee8}.work-symbol{width:35px;height:35px;display:grid;place-items:center;background:#305342;color:#f7f3e9;font:700 16px 'Noto Serif TC'}.work-symbol.second{background:#c5b89e}.work-copy{flex:1}.work-copy strong,.work-copy small{display:block}.work-copy strong{font:600 13px 'Noto Serif TC'}.work-copy small{font-size:10px;color:#817f77;margin-top:5px}.work-progress{width:155px}.work-progress i{display:block;height:4px;background:#305342}.work-progress small{display:block;color:#817f77;font:9px 'DM Mono';margin-top:6px}.work-formats{display:flex;gap:5px}.work-formats b{font:9px 'DM Mono';padding:5px 6px;background:#e6d3ad;color:#86602a}.work-formats b.off{background:#e5e3dc;color:#9a9991}.work-arrow{font-size:18px;color:#817f77}@media(max-width:700px){.summary-heading .quiet-btn{display:none}.work-progress{display:none}.work-formats{margin-left:auto}.work-row{gap:10px}.work-copy strong{font-size:11px}.nav-group-label{padding-left:7px}}`;
relationStyle.textContent += `.sidebar nav:not(.project-open)>:nth-child(n+3){display:none}.sidebar nav:not(.project-open){min-height:30px}.sidebar nav.project-open{animation:navReveal .22s ease-out}@keyframes navReveal{from{opacity:.4;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}.workspace-switcher{margin:0 0 4px;padding:13px 12px}.workspace-choice{display:flex;align-items:center;justify-content:space-between;width:100%;border:0;background:transparent;color:#eeeae0;padding:0;cursor:pointer;text-align:left}.workspace-choice strong{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}.workspace-choice span{position:static;color:#a9afa9}.workspace-menu{display:none;position:absolute;z-index:8;left:12px;top:70px;width:210px;background:#faf8f3;border:1px solid #dcd8ce;box-shadow:0 16px 34px rgba(0,0,0,.2);padding:5px}.workspace-switcher.open .workspace-menu{display:block}.workspace-menu button{display:grid;grid-template-columns:17px 1fr;width:100%;border:0;background:transparent;color:#202421;text-align:left;padding:9px 8px;cursor:pointer;font:11px 'Noto Serif TC'}.workspace-menu button:hover{background:#e8eee8}.workspace-menu button i{font-style:normal;color:#b78338}.workspace-menu button span,.workspace-menu button small{display:block}.workspace-menu button small{font:9px 'DM Mono';color:#817f77;margin-top:4px}@media(max-width:700px){.workspace-menu{left:7px;width:205px}}`;
relationStyle.textContent += `.scene-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.scene-card,.scene-card.large{grid-row:auto;min-height:315px;height:315px;overflow:hidden}.scene-image,.scene-card.large .scene-image{height:205px;min-height:205px;flex:0 0 205px}.scene-card-body{min-height:110px;align-content:flex-start}@media(max-width:1050px){.scene-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.scene-grid{grid-template-columns:1fr}.scene-card,.scene-card.large{height:300px;min-height:300px}.scene-image,.scene-card.large .scene-image{height:190px;min-height:190px}}`;
relationStyle.textContent += `.profile{cursor:pointer}.auth-modal{display:none;position:fixed;inset:0;z-index:20;background:rgba(20,28,24,.52);align-items:center;justify-content:center;padding:20px}.auth-modal.open{display:flex}.auth-dialog{width:min(420px,100%);background:#faf8f3;padding:34px;box-shadow:0 24px 70px rgba(0,0,0,.25);position:relative}.auth-close{position:absolute;top:13px;right:16px;border:0;background:none;font-size:22px;color:#817f77;cursor:pointer}.auth-dialog h2{font:700 25px 'Noto Serif TC';margin:0}.auth-help{font-size:12px;line-height:1.7;color:#817f77;margin:10px 0 22px}.auth-dialog label{display:block;font:10px 'DM Mono';color:#817f77;margin-top:14px}.auth-dialog input{display:block;width:100%;border:1px solid #dcd8ce;background:#fffdf8;padding:12px;margin-top:6px;outline-color:#305342;font:12px 'Space Grotesk'}.auth-actions{display:flex;gap:9px;margin-top:22px}.auth-actions .dark-btn,.auth-actions .outline-btn{flex:1}.auth-message{display:block;color:#a26d2f;font-size:10px;line-height:1.5;margin-top:13px}`;
document.head.appendChild(relationStyle);

function showView(id) {
  setProjectMode(id !== 'overview');
  lastView = id;
  saveState();
  views.forEach(view => view.classList.toggle('active', view.id === id));
  document.querySelectorAll('.nav-item[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === id));
  const labels = { overview: '總覽', episodes: '話數管理', characters: '角色資料庫', scenes: '場景資料庫', assets: '圖檔資產庫' };
  crumb.innerHTML = `我的小說宇宙 <span>/</span> ${labels[id]}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));
document.querySelectorAll('[data-not-ready]').forEach(item => item.addEventListener('click', () => notify(`${item.dataset.notReady} 工作區將在下一階段開啟`)));
document.querySelectorAll('.work-row').forEach(item => item.addEventListener('click', () => {
  if (item.classList.contains('current')) { selectedWork = activeWork; setProjectMode(true, selectedWork); showView('episodes'); }
  else { selectedWork = workOptions[1]; setProjectMode(true, selectedWork); notify('這本作品已選取，下一步可以先建立第一話'); }
}));
document.querySelectorAll('[data-view-target]').forEach(item => item.addEventListener('click', () => showView(item.dataset.viewTarget)));

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

const authModal = document.createElement('div');
authModal.className = 'auth-modal';
authModal.innerHTML = `<div class="auth-dialog"><button class="auth-close">×</button><p class="eyebrow">STORY ATLAS ACCOUNT</p><h2>登入卷宗台</h2><p class="auth-help">登入後，你的作品與設定會安全同步到所有裝置。</p><label>電子郵件<input type="email" class="auth-email" placeholder="you@example.com" /></label><label>密碼<input type="password" class="auth-password" placeholder="至少 6 個字元" /></label><div class="auth-actions"><button class="dark-btn auth-signin">登入</button><button class="outline-btn auth-signup">建立帳號</button></div><small class="auth-message"></small></div>`;
document.body.appendChild(authModal);

function openAuth() { authModal.classList.add('open'); authModal.querySelector('.auth-email').focus(); }
function closeAuth() { authModal.classList.remove('open'); }
async function authenticate(mode) {
  if (!supabaseClient) return;
  const email = authModal.querySelector('.auth-email').value.trim();
  const password = authModal.querySelector('.auth-password').value;
  const message = authModal.querySelector('.auth-message');
  if (!email || password.length < 6) { message.textContent = '請輸入有效的電子郵件與至少 6 個字元的密碼。'; return; }
  message.textContent = '處理中…';
  const result = mode === 'signup'
    ? await supabaseClient.auth.signUp({ email, password })
    : await supabaseClient.auth.signInWithPassword({ email, password });
  if (result.error) { message.textContent = result.error.message; return; }
  message.textContent = mode === 'signup' ? '帳號建立成功，請查看信箱完成驗證。' : '登入成功。';
  if (mode === 'signin') { closeAuth(); notify('已登入，開始同步作品資料'); loadCloudWorks(); }
}
authModal.querySelector('.auth-close').addEventListener('click', closeAuth);
authModal.querySelector('.auth-signin').addEventListener('click', () => authenticate('signin'));
authModal.querySelector('.auth-signup').addEventListener('click', () => authenticate('signup'));
document.querySelector('.profile').addEventListener('click', openAuth);

async function loadCloudWorks() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('works').select('id,title,status,updated_at').order('updated_at', { ascending: false });
  if (error) { notify(`雲端資料讀取失敗：${error.message}`); return; }
  if (data?.length) notify(`已同步 ${data.length} 部作品`);
}

if (supabaseClient) {
  supabaseClient.auth.getSession().then(({ data }) => {
    if (data.session) loadCloudWorks();
  });
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (!session) notify('目前未登入，雲端資料尚未載入');
  });
}

document.querySelectorAll('#newEpisode, #newEpisode2').forEach(button => button.addEventListener('click', () => notify('已建立新的話數草稿')));
document.querySelectorAll('.editor-tabs button:not(.save-label)').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.editor-tabs button:not(.save-label)').forEach(tab => tab.classList.remove('active'));
  button.classList.add('active');
  notify(`已切換至${button.textContent}工作區`);
}));

if (selectedWork && lastView !== 'overview') {
  setProjectMode(true, selectedWork);
  showView(lastView);
}

/* ─────────────────────────────────────────────────────────────
   可操作工作區：本機資料與編輯器
   這層讓未登入使用者也能先完整使用；登入同步會沿用相同資料格式。
───────────────────────────────────────────────────────────── */
const EDITOR_KEY = 'story-atlas-editor-data-v1';
const RESET_MARKER = 'story-atlas-empty-reset-20260814';
if (!localStorage.getItem(RESET_MARKER)) {
  localStorage.removeItem(EDITOR_KEY);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(EDITOR_KEY, JSON.stringify({ episodes: [], characters: [], scenes: [], assets: [] }));
  localStorage.setItem(RESET_MARKER, 'done');
}
const starterData = {
  episodes: [{ id: 'ep-1', no: 1, title: '我只是看個小說，怎麼成了必死反派？', outline: '楚云曦穿越成為大雍監國長公主，原著中注定被紀淵以謀逆罪處死。她必須在 365 日內提升亡國指數，卻不能提前死亡。', novel: '我只是看個小說，怎麼成了必死反派？\n\n楚云曦只是想看完一本小說，卻在闔上書的瞬間，成了書中注定被處死的監國長公主。\n\n她看著銅鏡裡陌生的臉，腦中只剩一個念頭：先活過今天。', comic: '分鏡 1｜現代公司夜景｜楚云曦伏案閱讀。\n分鏡 2｜特寫｜書頁上的死亡結局。\n分鏡 3｜長公主寢殿｜楚云曦驚醒。', video: '場次 1｜現代公司・夜\n鏡頭：由窗外推入辦公桌。\n旁白：她只是看個小說。\n\n場次 2｜長公主寢殿\n台詞：這裡是哪裡？', versions: [{ version: 4, note: '加入三日限期', at: '今天 14:32' }, { version: 3, note: '調整紀淵登場動機', at: '昨天 21:08' }] }],
  characters: [{ id: 'ch-1', name: '楚云曦', alias: '監國長公主', identity: '大雍監國長公主／現代企業管理者', personality: '冷靜、果斷、擅長拆解問題', appearance: '黑長髮、鳳眼、身形修長', relations: '與紀淵互相試探；玉珠是貼身女官', episodes: '第 1 話', prompt: '古風長公主，黑長髮，鳳眼，沉著神情' }, { id: 'ch-2', name: '紀淵', alias: '攝政王', identity: '大雍攝政王', personality: '克制、重證據與規矩', appearance: '高大，黑衣，眉眼銳利', relations: '楚云曦的主要對手', episodes: '第 1 話', prompt: '古風攝政王，黑衣，冷峻，宮廷光影' }],
  scenes: [{ id: 'sc-1', name: '長公主府書房', category: '宮廷／室內', time: '深夜', weather: '月光、燭光', description: '滿桌帳冊、冷色月光與燭火交疊，是楚云曦第一次與紀淵正面交鋒的空間。', prompt: '古代長公主府書房，深夜，燭光與月光，滿桌帳冊', episodes: '第 1 話・場景 5' }, { id: 'sc-2', name: '現代公司會議室', category: '現代／室內', time: '晚上', weather: '陰天', description: '玻璃帷幕、高樓與尚未結束的會議。', prompt: '現代高樓會議室，夜景，冷色螢光燈', episodes: '第 1 話・場景 1' }],
  assets: []
};
let editorData;
try { editorData = JSON.parse(localStorage.getItem(EDITOR_KEY)) || starterData; } catch { editorData = starterData; }
const persistEditor = () => localStorage.setItem(EDITOR_KEY, JSON.stringify(editorData));
let currentEpisodeId = editorData.episodes[0]?.id || null;
let currentFormat = 'outline';

const editorStyle = document.createElement('style');
editorStyle.textContent = `.atlas-modal{position:fixed;inset:0;z-index:40;background:rgba(20,28,24,.58);display:none;align-items:center;justify-content:center;padding:18px}.atlas-modal.open{display:flex}.atlas-dialog{width:min(720px,100%);max-height:90vh;overflow:auto;background:#faf8f3;padding:28px;box-shadow:0 25px 80px rgba(0,0,0,.25)}.atlas-dialog h2{font:700 23px 'Noto Serif TC';margin:0 0 5px}.atlas-dialog>p{font-size:12px;color:#817f77;margin:0 0 20px}.atlas-close{float:right;border:0;background:transparent;font-size:22px;color:#817f77;cursor:pointer}.atlas-form{display:grid;gap:13px}.atlas-form label{font:10px 'DM Mono';color:#6d756e}.atlas-form input,.atlas-form textarea,.atlas-form select{display:block;width:100%;box-sizing:border-box;border:1px solid #d4d0c6;background:#fffdf8;padding:11px;margin-top:6px;font:13px 'Noto Serif TC';color:#202421}.atlas-form textarea{min-height:180px;resize:vertical;line-height:1.8}.atlas-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:20px}.atlas-editor{display:grid;gap:12px}.atlas-editor textarea{width:100%;min-height:360px;box-sizing:border-box;border:1px solid #d4d0c6;background:#fffdf8;padding:18px;font:14px 'Noto Serif TC';line-height:2;resize:vertical}.atlas-editor-actions{display:flex;align-items:center;gap:9px}.atlas-editor-actions span{margin-right:auto;font:10px 'DM Mono';color:#6f786e}.version-history{display:grid;gap:8px}.version-history div{display:flex;gap:12px;padding:11px;border-bottom:1px solid #e2ded5}.version-history b{font:11px 'DM Mono';color:#305342}.atlas-detail{display:grid;grid-template-columns:110px 1fr;gap:8px;font-size:12px}.atlas-detail b{font:10px 'DM Mono';color:#817f77}.atlas-detail span{line-height:1.6}@media(max-width:700px){.atlas-dialog{padding:20px}.atlas-detail{grid-template-columns:1fr}.atlas-detail b{margin-top:6px}}`;
editorStyle.textContent += `.empty-workspace{display:grid;place-items:center;gap:7px;min-height:110px;padding:22px;color:#817f77;text-align:center;border:1px dashed #cfcac0;background:#faf8f3}.empty-workspace strong{font:600 14px 'Noto Serif TC';color:#305342}.empty-workspace small{font-size:11px}`;
document.head.appendChild(editorStyle);

function atlasModal(title, subtitle, content, saveText = '儲存') {
  const modal = document.createElement('div'); modal.className = 'atlas-modal open';
  modal.innerHTML = `<div class="atlas-dialog"><button class="atlas-close">×</button><h2>${title}</h2><p>${subtitle || ''}</p>${content}<div class="atlas-actions"><button class="outline-btn atlas-cancel">取消</button><button class="dark-btn atlas-save">${saveText}</button></div></div>`;
  document.body.appendChild(modal); const close = () => modal.remove();
  modal.querySelector('.atlas-close').onclick = close; modal.querySelector('.atlas-cancel').onclick = close;
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  return { modal, close };
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[ch]));
function selectedEpisode() { return editorData.episodes.find(e => e.id === currentEpisodeId) || editorData.episodes[0]; }

function renderEpisodeList() {
  const list = document.querySelector('.episode-list'); if (!list) return;
  list.querySelectorAll('.episode-row').forEach(x => x.remove());
  editorData.episodes.forEach((ep, index) => {
    const row = document.createElement('button'); row.className = `episode-row ${ep.id === currentEpisodeId ? 'selected' : ''}`;
    row.innerHTML = `<b>${String(index + 1).padStart(2,'0')}</b><span><strong>${esc(ep.title)}</strong><small>${ep.outline ? '大綱完成' : '構思中'}・${ep.novel ? '文字已建立' : '文字草稿中'}</small></span><i>⋯</i>`;
    row.onclick = () => { currentEpisodeId = ep.id; currentFormat = 'outline'; renderEpisodeList(); renderEpisodeWorkspace(); };
    list.appendChild(row);
  });
  const head = list.querySelector('.list-head span'); if (head) head.textContent = `${editorData.episodes.length} / 12`;
}
function renderEpisodeWorkspace() {
  const ep = selectedEpisode(); const editor = document.querySelector('.episode-editor'); if (!ep || !editor) return;
  const formatLabels = { outline:'大綱', novel:'網路小說', comic:'漫畫', video:'影片' };
  const value = ep[currentFormat] || '';
  editor.innerHTML = `<div class="editor-tabs">${Object.entries(formatLabels).map(([key,label]) => `<button class="${key===currentFormat?'active':''}" data-format="${key}">${label}</button>`).join('')}<span></span><button class="save-label">● 已保存</button></div><div class="editor-title"><span class="episode-number">第 ${ep.no} 話</span><h2>${esc(ep.title)}</h2><span class="status draft">第 ${ep.versions?.[0]?.version || 1} 版</span></div><div class="atlas-editor"><textarea aria-label="${formatLabels[currentFormat]}內容">${esc(value)}</textarea><div class="atlas-editor-actions"><span>本機保存・可建立修訂版本</span><button class="outline-btn" data-history>查看版本紀錄</button><button class="dark-btn" data-save-episode>儲存新版本</button></div></div>`;
  editor.querySelectorAll('[data-format]').forEach(btn => btn.onclick = () => { currentFormat = btn.dataset.format; renderEpisodeWorkspace(); });
  editor.querySelector('[data-save-episode]').onclick = () => {
    const text = editor.querySelector('textarea').value; const previous = ep[currentFormat] || '';
    if (text === previous) { notify('內容沒有變更'); return; }
    ep[currentFormat] = text; ep.versions = ep.versions || []; ep.versions.unshift({ version: (ep.versions[0]?.version || 0) + 1, note: `更新${formatLabels[currentFormat]}內容`, at: new Date().toLocaleString('zh-TW') });
    persistEditor(); renderEpisodeWorkspace(); renderEpisodeList(); notify('已儲存新版本，舊版本仍保留');
  };
  editor.querySelector('[data-history]').onclick = () => {
    const history = (ep.versions || []).map(v => `<div><b>V${v.version}</b><span>${esc(v.note)}<br><small>${esc(v.at)}</small></span></div>`).join('') || '<p>尚無修訂紀錄</p>';
    const m = atlasModal('版本紀錄', '每次儲存都會留下修訂時間與備註。', `<div class="version-history">${history}</div>`, '關閉'); m.modal.querySelector('.atlas-save').onclick = m.close;
  };
}

function openNewEpisode() {
  const m = atlasModal('新增話數', '建立後可在四種內容格式間切換編輯。', `<div class="atlas-form"><label>話數標題<input name="title" placeholder="例如：第一個任務，查帳" required></label><label>大綱<textarea name="outline" placeholder="這一話要發生什麼事？"></textarea></label></div>`);
  m.modal.querySelector('.atlas-save').onclick = () => { const title=m.modal.querySelector('[name=title]').value.trim(); if(!title){notify('請先輸入話數標題');return;} const ep={id:`ep-${Date.now()}`,no:editorData.episodes.length+1,title,outline:m.modal.querySelector('[name=outline]').value,novel:'',comic:'',video:'',versions:[{version:1,note:'建立話數',at:new Date().toLocaleString('zh-TW')}]}; editorData.episodes.push(ep); currentEpisodeId=ep.id; currentFormat='outline'; persistEditor(); renderEpisodeList(); renderEpisodeWorkspace(); m.close(); showView('episodes'); notify('已建立話數，可開始編輯'); };
}
document.querySelectorAll('#newEpisode,#newEpisode2').forEach(button => { button.onclick = openNewEpisode; });
renderEpisodeList(); renderEpisodeWorkspace();

function openCharacterForm(existing = null) {
  const c=existing || {}; const fields=[['name','姓名'],['alias','別名'],['identity','身份'],['personality','個性'],['appearance','年齡／身高／外貌特徵'],['relations','人物關係'],['episodes','出現話數'],['prompt','AI 生成提示詞']];
  const content=`<div class="atlas-form">${fields.map(([key,label])=>`<label>${label}${key==='personality'||key==='appearance'||key==='relations'||key==='prompt'?`<textarea name="${key}">${esc(c[key])}</textarea>`:`<input name="${key}" value="${esc(c[key])}">`}</label>`).join('')}</div>`;
  const m=atlasModal(existing?'編輯角色':'新增角色','角色資料與作品關聯會保存於本機。',content); m.modal.querySelector('.atlas-save').onclick=()=>{const item={id:c.id||`ch-${Date.now()}`}; fields.forEach(([key])=>item[key]=m.modal.querySelector(`[name=${key}]`).value.trim()); const i=editorData.characters.findIndex(x=>x.id===item.id); if(i<0) editorData.characters.push(item); else editorData.characters[i]=item; persistEditor(); renderCharacters(); m.close(); notify(existing?'角色資料已更新':'已新增角色');};
}
function renderCharacters(){const grid=document.querySelector('.character-grid'); if(!grid)return; grid.querySelectorAll('.character-card:not(.add-card)').forEach(x=>x.remove()); const add=grid.querySelector('.add-card'); editorData.characters.forEach((c,i)=>{const b=document.createElement('button');b.className=`character-card ${i===0?'featured':''}`;b.innerHTML=`<div class="character-art ${i%2?'ji':'chu'}"><span>${esc(c.name?.slice(0,1))}</span></div><div class="character-info"><div><h3>${esc(c.name)}</h3><small>${esc(c.identity||c.alias)}</small></div><span class="count">${esc(c.episodes||'未設定')}</span></div><p>${esc(c.personality||'尚未填寫個性')}</p><div class="outfit-pills"><span>點擊編輯資料</span></div>`;b.onclick=()=>openCharacterForm(c);grid.insertBefore(b,add);});add.onclick=()=>openCharacterForm();}
const characterAdd=document.querySelector('#characters .page-heading .primary-btn'); if(characterAdd) characterAdd.onclick=()=>openCharacterForm(); const characterCardAdd=document.querySelector('.character-card.add-card'); if(characterCardAdd) characterCardAdd.onclick=()=>openCharacterForm(); renderCharacters();

function openSceneForm(existing=null){const s=existing||{};const fields=[['name','場景名稱'],['category','地點分類'],['time','時間'],['weather','天氣'],['description','場景描述'],['prompt','AI 生成提示詞'],['episodes','使用話數與場次']];const content=`<div class="atlas-form">${fields.map(([k,l])=>`<label>${l}${['description','prompt'].includes(k)?`<textarea name="${k}">${esc(s[k])}</textarea>`:`<input name="${k}" value="${esc(s[k])}">`}</label>`).join('')}</div>`;const m=atlasModal(existing?'編輯場景':'新增場景','固定欄位讓場景可被搜尋與重複使用。',content);m.modal.querySelector('.atlas-save').onclick=()=>{const item={id:s.id||`sc-${Date.now()}`};fields.forEach(([k])=>item[k]=m.modal.querySelector(`[name=${k}]`).value.trim());const i=editorData.scenes.findIndex(x=>x.id===item.id);if(i<0)editorData.scenes.push(item);else editorData.scenes[i]=item;persistEditor();renderScenes();m.close();notify(existing?'場景已更新':'已新增場景');};}
function renderScenes(){const grid=document.querySelector('.scene-grid');if(!grid)return;grid.innerHTML='';editorData.scenes.forEach((s,i)=>{const b=document.createElement('button');b.className=`scene-card ${i===0?'large':''}`;b.innerHTML=`<div class="scene-image ${i%2?'office':'study'}"><span>${esc(s.name)}</span></div><div class="scene-card-body"><div><h3>${esc(s.name)}</h3><small>${esc(s.category)}・${esc(s.time)}・${esc(s.weather)}</small></div><span class="count">${esc(s.episodes)}</span><p>${esc(s.description)}</p></div>`;b.onclick=()=>openSceneForm(s);grid.appendChild(b);});}
const sceneAdd=document.querySelector('#scenes .page-heading .primary-btn');if(sceneAdd)sceneAdd.onclick=()=>openSceneForm();renderScenes();

function renderEmptyWorkspace(){
  const emptyNote = '<div class="empty-workspace"><strong>尚未建立資料</strong><small>請從上方新增作品、話數或世界設定。</small></div>';
  const hero = document.querySelector('#overview .project-hero');
  if (hero) hero.innerHTML = `<div class="project-cover"><div class="cover-kicker">STORY ATLAS</div><div class="cover-title">開始建立你的<br><em>第一部作品</em></div><div class="cover-footer"><span>空白工作庫</span></div></div><div class="project-detail"><div class="detail-top"><div><p class="eyebrow">CURRENT PROJECT</p><h2>尚未選擇作品</h2></div><span class="status">未建立</span></div><p>先建立一本作品，再開始整理話數、角色、場景與圖像資產。</p><button class="dark-btn" id="emptyCreateWork">＋ 建立第一部作品</button></div>`;
  document.querySelector('#emptyCreateWork')?.addEventListener('click',()=>document.querySelector('.quiet-btn')?.click());
  const progress = document.querySelector('#overview .progress-grid'); if(progress) progress.innerHTML = emptyNote;
  const recent = document.querySelector('#overview .recent-list'); if(recent) recent.innerHTML = emptyNote;
  const stats = document.querySelector('#overview .stats'); if(stats) stats.innerHTML = '<div><strong>00</strong><small>話數</small></div><div><strong>00</strong><small>角色</small></div><div><strong>00</strong><small>場景</small></div><div><strong>00</strong><small>資產</small></div>';
  const workList = document.querySelector('.work-list'); if(workList) workList.innerHTML = emptyNote;
  const assets = document.querySelector('#assets .asset-grid'); if(assets) assets.innerHTML = emptyNote;
  if (!selectedWork) { const pickerButton = workPicker?.querySelector('button'); if(pickerButton) pickerButton.innerHTML = '請選擇作品<span>⌄</span>'; }
}
if (!editorData.episodes.length && !editorData.characters.length && !editorData.scenes.length && !editorData.assets.length) renderEmptyWorkspace();

document.querySelector('#assets .page-heading .primary-btn')?.addEventListener('click',()=>{const m=atlasModal('新增圖像資產','可先記錄檔名、類型、標籤與生成提示詞，之後再補上檔案。',`<div class="atlas-form"><label>檔案名稱<input name="name" placeholder="例如：楚云曦_正式朝服_v03.png"></label><label>資產類型<select name="type"><option>角色立繪</option><option>服裝參考圖</option><option>場景設定圖</option><option>平面圖</option><option>漫畫生成圖</option></select></label><label>備註／提示詞<textarea name="note"></textarea></label></div>`);m.modal.querySelector('.atlas-save').onclick=()=>{const name=m.modal.querySelector('[name=name]').value.trim();if(!name){notify('請輸入檔案名稱');return;}editorData.assets.push({id:`asset-${Date.now()}`,name,type:m.modal.querySelector('[name=type]').value,note:m.modal.querySelector('[name=note]').value});persistEditor();m.close();notify('資產紀錄已建立');};});

document.querySelector('.quiet-btn')?.addEventListener('click',()=>{const m=atlasModal('建立新作品','先建立作品名稱，之後可從左側目前工作庫切換。',`<div class="atlas-form"><label>書名<input name="title" placeholder="輸入作品名稱"></label><label>簡介<textarea name="desc"></textarea></label><label>狀態<select name="status"><option>構思中</option><option>連載中</option><option>完結</option></select></label></div>`);m.modal.querySelector('.atlas-save').onclick=()=>{const title=m.modal.querySelector('[name=title]').value.trim();if(!title){notify('請輸入書名');return;}workOptions.push(`《${title}》`);m.close();notify('作品已建立；重新整理後會保留目前工作區');};});
document.querySelector('.quiet-btn')?.addEventListener('contextmenu',e=>e.preventDefault());

const settingsButton = document.querySelector('.sidebar-bottom .nav-item');
if (settingsButton) settingsButton.onclick = () => {
  const m = atlasModal('本機資料設定', '清除後會移除這個瀏覽器保存的作品、話數、角色、場景、資產與版本紀錄。雲端資料不會刪除。', `<div class="atlas-form"><p style="color:#a26d2f;line-height:1.7">這是不可復原的本機清除操作。若你要重新開始，請按下方確認。</p></div>`, '清除本機資料');
  m.modal.querySelector('.atlas-save').onclick = () => { localStorage.removeItem(EDITOR_KEY); localStorage.removeItem(STORAGE_KEY); m.close(); location.reload(); };
};

if (new URLSearchParams(location.search).get('reset') === '1') {
  localStorage.removeItem(EDITOR_KEY);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(EDITOR_KEY, JSON.stringify({ episodes: [], characters: [], scenes: [], assets: [] }));
  history.replaceState({}, '', location.pathname);
  location.reload();
}
