export function downloadTuning(cloud=false){return ['--concurrent-fragments',cloud?'4':'8','--abort-on-unavailable-fragments',...(cloud?['--max-filesize','200M']:[])];}
export function cpuThreads(cloud,available,workers=1){if(cloud)return 1;return Math.max(1,Math.min(8,Math.floor((Number(available)||1)/Math.max(1,Number(workers)||1))));}
