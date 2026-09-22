(() => {
  'use strict';
  const published=window.STORY_ATLAS_PUBLISHED_STATE;
  const work=published?.state?.works?.find(item=>item.title==='本宮要亡國，你們怎麼全升職了？');
  const episode=work?.episodes?.find(item=>Number(item.no)===1);
  if(!published || !episode)return;
  episode.comicPages=Array.from({length:12},(_,index)=>({
    label:`P${String(index+1).padStart(2,'0')}`,
    src:`public/comics/episode-01/p${String(index+1).padStart(2,'0')}.webp`
  }));
  published.version=`${published.version}-comic-p01-p12-v1`;
})();
