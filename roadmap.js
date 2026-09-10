(() => {
  'use strict';
  const data = window.STORY_ROADMAP;
  let seasonFilter = 'all';
  let query = '';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const epSeason = no => Math.min(4, Math.ceil(no / 21));
  const progress = Math.round((data.currentEpisode / data.totalEpisodes) * 100);

  function indexRail() {
    const current = Math.min(100, Math.max(0, data.currentIndex));
    return `<div class="index-rail" aria-label="亡國指數 ${current}，返回臨界點 ${data.returnThreshold}，完全滅國 ${data.collapseThreshold}">
      <div class="index-fill" style="width:${current}%"></div>
      <span class="index-mark return" style="left:${data.returnThreshold}%"><i>70</i><b>不可逆亡國線</b></span>
      <span class="index-mark collapse" style="left:${data.collapseThreshold}%"><i>100</i><b>完全滅國</b></span>
      <span class="index-current" style="left:${current}%"><i>${current}</i><b>目前</b></span>
    </div>`;
  }

  function seasonSection(season) {
    const active = season.no === 1;
    return `<article class="season-sheet ${active ? 'current' : ''}" id="season-${season.no}" data-season-panel="${season.no}">
      <header class="season-head">
        <div class="season-numeral">0${season.no}</div>
        <div><span>${esc(season.status)}・第 ${esc(season.range)} 話</span><h2>${esc(season.name)}</h2><p>${esc(season.thesis)}</p></div>
        <dl><div><dt>故事時間</dt><dd>${esc(season.date)}</dd></div><div><dt>指數方向</dt><dd>${esc(season.index)}</dd></div></dl>
      </header>
      <div class="season-body">
        <ol>${season.directions.map(item => `<li>${esc(item)}</li>`).join('')}</ol>
        <div class="season-turn"><span>季末轉折</span><p>${esc(season.climax)}</p><span>下一季鉤子</span><p>${esc(season.hook)}</p></div>
      </div>
    </article>`;
  }

  function episodeRows() {
    return data.episodes.filter(ep => {
      const matchesSeason = seasonFilter === 'all' || epSeason(ep[0]) === Number(seasonFilter);
      const haystack = `${ep[0]} ${ep[1]} ${ep[2]} ${ep[4]} ${ep[5]}`.toLowerCase();
      return matchesSeason && haystack.includes(query.toLowerCase());
    }).map(ep => `<button class="roadmap-episode ${ep[0] === data.currentEpisode ? 'now' : ''}" data-episode-no="${ep[0]}">
      <span class="ep-no">${String(ep[0]).padStart(2,'0')}</span>
      <span class="ep-story"><strong>${esc(ep[1])}</strong><small>${esc(ep[5])}</small></span>
      <span class="ep-date"><b>${esc(ep[2])}</b><small>倒數 ${esc(ep[3])} 日</small></span>
      <span class="ep-index"><b>${esc(ep[4])}</b><small>亡國指數</small></span>
      <span class="ep-relations"><i style="--score:${ep[6]}">紀→楚 ${ep[6]}</i><i style="--score:${ep[7]}">楚→紀 ${ep[7]}</i><i class="dark" style="--score:${ep[8]}">沈黑化 ${ep[8]}</i></span>
    </button>`).join('') || '<div class="roadmap-empty">找不到符合條件的話數。</div>';
  }

  function episodeList() {
    return `<div class="roadmap-toolbar">
      <div class="season-tabs" role="group" aria-label="季別篩選">
        ${[['all','全部'],['1','第一季'],['2','第二季'],['3','第三季'],['4','第四季']].map(([id,label]) => `<button class="${seasonFilter===id?'active':''}" data-season-filter="${id}">${label}</button>`).join('')}
      </div>
      <label class="roadmap-search"><span>⌕</span><input id="roadmapSearch" value="${esc(query)}" placeholder="搜尋話數、標題、日期或劇情" /></label>
    </div><div class="roadmap-list-head"><span>話</span><span>標題與簡要劇情</span><span>故事日期</span><span>指數</span><span>人物曲線</span></div><div id="roadmapEpisodeRows">${episodeRows()}</div>`;
  }

  function render() {
    return `<div class="roadmap-page">
      <section class="roadmap-hero">
        <div class="roadmap-sigil" aria-hidden="true"><span>亡</span><i>${data.currentIndex}</i></div>
        <div class="roadmap-title"><p>FOUR-SEASON STORY BLUEPRINT</p><h1>四季故事藍圖</h1><h3>${esc(data.title)}</h3><small>更新 ${esc(data.updatedAt)}・編輯用規劃頁</small></div>
        <div class="roadmap-progress"><b>${data.currentEpisode}<i>／${data.totalEpisodes}</i></b><span>目前話數</span><div><i style="width:${progress}%"></i></div><small>全書進度 ${progress}%</small></div>
      </section>
      <section class="index-section"><div><p>FALL OF THE DYNASTY</p><h2>亡國指數不是滅國進度條</h2><span>70代表大雍跨過不可逆的亡國臨界點；100才是王朝完全覆滅。</span></div>${indexRail()}</section>
      <section class="season-nav">${data.seasons.map(s => `<a href="#season-${s.no}"><b>0${s.no}</b><span>${esc(s.name)}</span><small>${esc(s.range)} 話</small></a>`).join('')}</section>
      <section class="roadmap-seasons"><div class="roadmap-kicker"><span>SEASON DIRECTION</span><h2>四季方向</h2></div>${data.seasons.map(seasonSection).join('')}</section>
      <section class="character-section"><div class="roadmap-kicker"><span>CHARACTER TRAJECTORY</span><h2>人物曲線</h2></div><div class="character-lines">${data.characterTracks.map(track => `<div><header><strong>${esc(track.name)}</strong><b>${track.value}</b></header><i><span style="width:${track.value}%"></span></i><p>${esc(track.note)}</p></div>`).join('')}</div></section>
      <section class="episode-section" id="current-episodes"><div class="roadmap-kicker"><span>EPISODE INDEX</span><h2>已完成話數</h2><p>戀愛與黑化指數為編輯追蹤值，不是系統正式數值。</p></div><div id="roadmapEpisodeList">${episodeList()}</div></section>
      <footer class="roadmap-note"><span>CANON NOTE</span><p>第7～10話已分散於四、五、六月；第11話由「三個月後」調整為「轉眼到了七月」，避免時間線衝突。</p></footer>
    </div>`;
  }

  function refreshList() {
    const root = document.querySelector('#roadmapEpisodeList');
    if (!root) return;
    root.innerHTML = episodeList();
    bindList();
  }

  function bindList() {
    document.querySelectorAll('[data-season-filter]').forEach(button => button.onclick = () => {
      seasonFilter = button.dataset.seasonFilter;
      refreshList();
    });
    const search = document.querySelector('#roadmapSearch');
    if (search) {
      search.oninput = event => {
        query = event.target.value;
        document.querySelector('#roadmapEpisodeRows').innerHTML = episodeRows();
      };
      search.focus({preventScroll:true});
      search.setSelectionRange(query.length, query.length);
    }
  }

  function bind() {
    bindList();
    document.querySelectorAll('.season-nav a').forEach(link => link.onclick = event => {
      event.preventDefault();
      document.querySelector(link.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  function focusCurrent() {
    document.querySelector('#current-episodes')?.scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(() => document.querySelector(`[data-episode-no="${data.currentEpisode}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}), 350);
  }

  window.StoryRoadmap = { render, bind, focusCurrent };
})();
