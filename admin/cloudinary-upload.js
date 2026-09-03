/* Bruniano Cloudinary media helper. */
(function(){
  const CLOUD_NAME = 'pomzhih4';
  const UPLOAD_PRESET = 'bruniano';
  const WIDGET_URL = 'https://upload-widget.cloudinary.com/global/all.js';
  const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  function loadWidget(){
    return new Promise((resolve,reject)=>{
      if(window.cloudinary?.createUploadWidget) return resolve(window.cloudinary);
      const s=document.createElement('script');
      s.src=WIDGET_URL;
      s.async=true;
      s.onload=()=>window.cloudinary?.createUploadWidget?resolve(window.cloudinary):reject(new Error('Cloudinary Widget non disponibile'));
      s.onerror=()=>reject(new Error('Impossibile caricare Cloudinary Widget'));
      document.head.appendChild(s);
    });
  }

  function createWidget({multiple=false,onUpload}){
    return loadWidget().then(cloudinary=>new Promise((resolve,reject)=>{
      const widget=cloudinary.createUploadWidget({
        cloudName:CLOUD_NAME,
        uploadPreset:UPLOAD_PRESET,
        multiple,
        maxFiles:multiple?20:1,
        sources:['local','camera'],
        folder:'bruniano',
        clientAllowedFormats:['jpg','jpeg','png','webp','avif','mp4','mov'],
        maxImageWidth:2400,
        maxImageHeight:2400,
        showAdvancedOptions:false,
        cropping:false,
        resourceType:'auto',
        styles:{palette:{window:'#ffffff',windowBorder:'#e6ebf3',tabIcon:'#125cff',menuIcons:'#657083',textDark:'#111a2c',textLight:'#ffffff',link:'#125cff',action:'#125cff',inactiveTabIcon:'#9aa5b5',error:'#c0392b',inProgress:'#125cff',complete:'#29bd72',sourceBg:'#f5f8fc'}}
      },(error,result)=>{
        if(error){reject(error);return;}
        if(result?.event==='success' && result.info){onUpload?.(result.info);}
        if(result?.event==='queues-end') resolve(true);
        if(result?.event==='close') resolve(null);
      });
      widget.open();
    }));
  }

  function isAllowedFile(file){
    const allowed=['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/quicktime'];
    return allowed.includes(String(file?.type||'').toLowerCase());
  }

  async function uploadOneFile(file){
    if(!file||!isAllowedFile(file)) throw new Error(`Formato non supportato: ${file?.name||'file'}`);
    const body=new FormData();
    body.append('file',file);
    body.append('upload_preset',UPLOAD_PRESET);
    body.append('folder','bruniano');
    const response=await fetch(UPLOAD_URL,{method:'POST',body});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.secure_url) throw new Error(data?.error?.message||`Upload non riuscito per ${file.name}`);
    return data;
  }

  async function uploadFiles(files,onUpload){
    const list=Array.from(files||[]).slice(0,20);
    if(!list.length) return [];
    const uploaded=[];
    for(const file of list){
      const info=await uploadOneFile(file);
      uploaded.push(info);
      onUpload?.(info);
    }
    return uploaded;
  }

  window.BrunianoCloudinary={
    uploadImage(onUpload){return createWidget({multiple:false,onUpload});},
    uploadMedia(onUpload){return createWidget({multiple:true,onUpload});},
    uploadFiles(files,onUpload){return uploadFiles(files,onUpload);}
  };
})();
