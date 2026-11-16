export function outputName(row){return String(row.output||'video.mp4').split(/[\\/]/).at(-1)||'video.mp4';}
async function exists(dir,name){
  try{await dir.getFileHandle(name);return true;}catch(e){if(e.name==='NotFoundError')return false;throw e;}
}
export async function saveVideoToDirectory(directory,row,response){
  if(!response.ok||!response.body)throw Error('Không lấy được video từ máy chủ. Hãy tải lại trước khi file tạm hết hạn.');
  const name=outputName(row);let dir=directory;
  // Never overwrite an existing user file. Preserve the filename in a unique subfolder.
  if(await exists(dir,name)){
    dir=await directory.getDirectoryHandle('trung-ten',{create:true});
    let suffix=0;
    for(;;){
      const candidate=await dir.getDirectoryHandle(String(row.id).replace(/[^\w-]/g,'_')+(suffix?'-'+suffix:''),{create:true});
      if(!await exists(candidate,name)){dir=candidate;break;}suffix++;
    }
  }
  const handle=await dir.getFileHandle(name,{create:true});
  const writable=await handle.createWritable();
  await response.body.pipeTo(writable);
  return name;
}
