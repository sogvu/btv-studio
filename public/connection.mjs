export function createSessionClient(initialToken,fetchImpl=globalThis.fetch,{timeoutMs=45000}={}){
 let token=initialToken,renewing=null;
 async function request(url,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(new DOMException('Máy chủ phản hồi quá chậm.','TimeoutError')),timeoutMs);try{return await fetchImpl(url,{...options,credentials:'same-origin',cache:'no-store',signal:options.signal||controller.signal});}finally{clearTimeout(timer);}}
 async function renew(){if(!renewing)renewing=(async()=>{const res=await request('/');if(!res.ok)throw Error('Không lấy được phiên kết nối mới ('+res.status+').');const html=await res.text(),next=html.match(/name="btv-token"\s+content="([a-f0-9]{64})"/i)?.[1];if(!next)throw Error('Máy chủ đang khởi động lại. Đang chờ kết nối…');token=next;})().finally(()=>renewing=null);return renewing;}
 async function authorizedFetch(url,options={}){if(!url.startsWith('/')||url.startsWith('//'))throw Error('Đường dẫn không hợp lệ.');const send=()=>request(url,{...options,headers:{...options.headers,'x-btv-token':token}});let res=await send();if(res.status===403){let expired=false;try{const body=await res.clone().json();expired=body.code==='SESSION_EXPIRED'||/Phiên không hợp lệ/.test(body.error||'');}catch{}if(expired){await renew();res=await send();}}return res;}
 return {fetch:authorizedFetch};
}
