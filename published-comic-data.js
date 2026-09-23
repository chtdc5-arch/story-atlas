(() => {
  'use strict';
  const published=window.STORY_ATLAS_PUBLISHED_STATE;
  const work=published?.state?.works?.find(item=>item.id==='work-1786697622274-tznnx');
  const episode=work?.episodes?.find(item=>Number(item.no)===1);
  if(!published || !episode)return;
  episode.comicPages=Array.from({length:16},(_,index)=>({
    label:`P${String(index+1).padStart(2,'0')}`,
    src:`public/comics/episode-01/p${String(index+1).padStart(2,'0')}.webp`
  }));
  published.version=`${published.version}-comic-p01-p16-v3`;
})();
