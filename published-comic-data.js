(() => {
  'use strict';
  const published=window.STORY_ATLAS_PUBLISHED_STATE;
  const work=published?.state?.works?.find(item=>item.id==='work-1786697622274-tznnx');
  const episode=work?.episodes?.find(item=>Number(item.no)===1);
  if(!published || !episode)return;
  const pageNumbers=Array.from({length:28},(_,index)=>index+1);
  episode.comicPages=pageNumbers.map(number=>({
    label:`P${String(number).padStart(2,'0')}`,
    src:`public/comics/episode-01/p${String(number).padStart(2,'0')}.webp?v=20260927-page-renumber-v5`
  }));
  episode.updatedAt='2026-09-27';
  published.version=`${published.version}-comic-p01-p28-renumbered-v5`;
})();
