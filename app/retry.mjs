export const retryDelay=round=>Math.min(300000,30000*2**Math.min(Math.max(0,round-1),4));
export async function retryQueue({rows,workers,processRow,shouldStop,autoRetry,wait,onWait=()=>{},onRound=()=>{}}){
  let pending=rows.filter(r=>r.status!=='done'),round=0;
  while(pending.length&&!shouldStop()){
    round++;onRound(round);let index=0;
    await Promise.all(Array.from({length:workers},async()=>{
      while(index<pending.length&&!shouldStop()){
        const row=pending[index++];row.attempts=(row.attempts||0)+1;
        await processRow(row);
      }
    }));
    pending=pending.filter(r=>r.status==='error');
    if(!pending.length||shouldStop()||!autoRetry)break;
    const delay=retryDelay(round);onWait({round,delay,remaining:pending.length});
    await wait(delay);
  }
}
