// Episodes 1–3: approved color edition.
(() => {
  'use strict';
  const published=window.STORY_ATLAS_PUBLISHED_STATE;
  const work=published?.state?.works?.find(item=>item.id==='work-1786697622274-tznnx');
  if(!published || !work)return;
  const pageCounts=new Map([[1,37],[2,27],[3,34]]);
  for(const [episodeNo,pageCount] of pageCounts){
    const episode=work.episodes?.find(item=>Number(item.no)===episodeNo);
    if(!episode)continue;
    episode.comicPages=Array.from({length:pageCount},(_,index)=>{
      const episodeSlug=String(episodeNo).padStart(2,'0');
      const page=String(index+1).padStart(2,'0');
      return {label:`P${page}`,src:`public/comics/episode-${episodeSlug}-20261101-color/p${page}.webp?v=20261101-color-v1`};
    });
    episode.updatedAt='2026-11-01';
  }
  published.version=`${published.version}-comic-episodes01-03-color-20261101-v1`;
})();
