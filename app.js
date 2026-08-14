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
