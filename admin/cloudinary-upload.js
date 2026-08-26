/* Bruniano Cloudinary media helper.
 * Uses Cloudinary Upload Widget from the browser. The only configuration
 * required is an unsigned upload preset created in Cloudinary.
 */
(function(){
  const CLOUD_NAME = 'pomzhih4';
  const UPLOAD_PRESET = 'BRUNIANO_UPLOAD_PRESET';
  const WIDGET_URL = 'https://upload-widget.cloudinary.com/global/all.js';

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
      if(UPLOAD_PRESET === 'BRUNIANO_UPLOAD_PRESET'){
        reject(new Error('Configura prima l\'Unsigned Upload Preset Cloudinary.'));
        return;
      }
      const widget=cloudinary.createUploadWidget({
        cloudName:CLOUD_NAME,
        uploadPreset:UPLOAD_PRESET,
        multiple,
        maxFiles:multiple?20:1,
        sources:['local','url','camera'],
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
        if(result?.event==='success' && result.info){
          onUpload?.(result.info);
          resolve(result.info);
        }
        if(result?.event==='close') resolve(null);
      });
      widget.open();
    }));
  }

  window.BrunianoCloudinary={
    uploadImage(onUpload){return createWidget({multiple:false,onUpload});},
    uploadMedia(onUpload){return createWidget({multiple:true,onUpload});}
  };
})();
