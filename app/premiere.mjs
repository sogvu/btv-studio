export const OUTPUT_MODE='premiere-mp4-v1';
// Metadata alone cannot establish CFR. Only keep the original after a full
// timestamp/decode check; unknown results always use the existing converter.
export function originalCandidate(info,file){
 const videos=info.streams?.filter(s=>s.codec_type==='video')||[],v=videos[0];
 return !!(/\.mp4$/i.test(file)&&info.format?.format_name?.split(',').includes('mp4')&&info.format?.tags?.major_brand?.trim()!=='qt'&&videos.length===1&&v.codec_name==='h264'&&v.pix_fmt==='yuv420p'&&v.width>0&&v.height>0&&v.width%2===0&&v.height%2===0&&!['smpte2084','arib-std-b67'].includes(v.color_transfer)&&rate(v.avg_frame_rate)>=1&&rate(v.avg_frame_rate)<=240&&info.streams.filter(s=>s.codec_type==='audio').every(s=>s.codec_name==='aac'&&Number(s.sample_rate)===48000));
}
export function constantRateDetected(log){return /VFR:\s*0\.0+\s+\(0\/[1-9]\d*\)/.test(log);}
export function inspectOriginalArgs(file){return ['-hide_banner','-nostdin','-xerror','-threads','1','-i',file,'-map','0:v:0','-map','0:a?','-sn','-dn','-filter_threads','1','-vf','vfrdet','-f','null','-'];}
function rate(value){const p=String(value||'').split('/').map(Number);return p.length===2?p[0]/p[1]:p[0];}
export function frameRate(video={}){
 const avg=rate(video.avg_frame_rate),nominal=rate(video.r_frame_rate);
 const value=Number.isFinite(avg)&&avg>=1&&avg<=240?avg:Number.isFinite(nominal)&&nominal>=1&&nominal<=240?nominal:30;
 const common=['24000/1001','24','25','30000/1001','30','48','50','60000/1001','60','120'];
 const closest=common.reduce((a,b)=>Math.abs(rate(b)-value)<Math.abs(rate(a)-value)?b:a,common[0]);
 return Math.abs(rate(closest)-value)/value<0.02?closest:String(Math.round(value*1000))+'/1000';
}
export function premiereArgs(source,target,info){
 const v=info.streams.find(s=>s.codec_type==='video')||{};
 const hdr=['smpte2084','arib-std-b67'].includes(v.color_transfer);
 const filters=[...(hdr?['zscale=t=linear:npl=100','format=gbrpf32le','zscale=p=bt709','tonemap=tonemap=hable:desat=0','zscale=t=bt709:m=bt709:r=tv']:[]),'pad=ceil(iw/2)*2:ceil(ih/2)*2','format=yuv420p'];
 return ['-hide_banner','-nostdin','-y','-threads','1','-i',source,'-map','0:v:0','-map','0:a:0?','-sn','-dn','-filter_threads','1','-vf',filters.join(','),...(hdr?['-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709']:[]),'-c:v','libx264','-profile:v','high','-pix_fmt','yuv420p','-crf','18','-preset','veryfast','-threads','1','-r',frameRate(v),'-fps_mode','cfr','-c:a','aac','-b:a','192k','-ar','48000','-af','aresample=async=1','-movflags','+faststart','-avoid_negative_ts','make_zero','-max_muxing_queue_size','2048','-progress','pipe:1','-nostats',target];
}
export function verifyPremiere(info){
 const v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.filter(s=>s.codec_type==='audio');
 if(!v||v.codec_name!=='h264'||v.pix_fmt!=='yuv420p'||a.some(s=>s.codec_name!=='aac'||Number(s.sample_rate)!==48000))throw Error('File xuất chưa đạt cấu hình MP4 cho Premiere.');
}
