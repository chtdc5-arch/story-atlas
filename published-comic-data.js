(() => {
  'use strict';
  const published=window.STORY_ATLAS_PUBLISHED_STATE;
  const work=published?.state?.works?.find(item=>item.id==='work-1786697622274-tznnx');
  const episode=work?.episodes?.find(item=>Number(item.no)===1);
  if(!published || !episode)return;
  const pageNumbers=Array.from({length:29},(_,index)=>index+1);
  episode.comicPages=pageNumbers.map(number=>({
    label:`P${String(number).padStart(2,'0')}` ,
    src:`public/comics/episode-01/p${String(number).padStart(2,'0')}.webp?v=${[22,24,27,29].includes(number) ? '20260928-approved-v8' : '20260927-image-repair-v7'}`
  }));
  episode.updatedAt='2026-09-28';
  published.version=`${published.version}-comic-p22-p24-p27-p29-approved-v8`;
})();

// Episode 2: final illustrated pages, lettering baked into each image.
(() => {
  'use strict';
  const published=window.STORY_ATLAS_PUBLISHED_STATE;
  const work=published?.state?.works?.find(item=>item.id==='work-1786697622274-tznnx');
  const episode=work?.episodes?.find(item=>Number(item.no)===2);
  if(!published || !episode)return;
  episode.comicPages=Array.from({length:31},(_,index)=>{
    const page=String(index+1).padStart(2,'0');
    return {label:`P${page}`,src:`public/comics/episode-02/p${page}.webp?v=20261006-final-v1`};
  });
  episode.updatedAt='2026-10-06';
  published.version=`${published.version}-comic-episode02-final-20261006-v1`;
})();
