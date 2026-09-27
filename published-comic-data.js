(() => {
  'use strict';
  const published=window.STORY_ATLAS_PUBLISHED_STATE;
  const work=published?.state?.works?.find(item=>item.id==='work-1786697622274-tznnx');
  const episode=work?.episodes?.find(item=>Number(item.no)===1);
  if(!published || !episode)return;
  const pageNumbers=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21,22,23,24,25,27,28,29,30];
  episode.comicPages=pageNumbers.map(number=>({
    label:`P${String(number).padStart(2,'0')}`,
    src:`public/comics/episode-01/p${String(number).padStart(2,'0')}.webp`
  }));
  episode.updatedAt='2026-09-27';
  published.version=`${published.version}-comic-p01-p30-except-p20-p26-v4`;
})();
