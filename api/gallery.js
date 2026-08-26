const { sql } = require('./_db');

function send(res,status,body){res.status(status).json(body)}

module.exports=async(req,res)=>{
  try{
    if(req.method==='GET'){
      const admin=req.query?.admin==='1';
      const rows=await sql`SELECT id,title,media_type,media_url,alt_text,sort_order,is_published,created_at FROM gallery_items ${admin?sql``:sql`WHERE is_published=true`} ORDER BY sort_order ASC,created_at ASC`;
      return send(res,200,{items:rows});
    }
    if(req.method==='POST'||req.method==='PUT'){
      const b=req.body||{},id=b.id||null,title=String(b.title||'').trim(),mediaType=String(b.media_type||'image').trim(),mediaUrl=String(b.media_url||'').trim(),altText=String(b.alt_text||title).trim(),sortOrder=Number.isFinite(Number(b.sort_order))?Number(b.sort_order):0,isPublished=Boolean(b.is_published);
      if(!mediaUrl)return send(res,400,{error:'URL media obbligatorio'});
      if(id){const r=await sql`UPDATE gallery_items SET title=${title},media_type=${mediaType},media_url=${mediaUrl},alt_text=${altText},sort_order=${sortOrder},is_published=${isPublished} WHERE id=${id} RETURNING *`;if(!r.length)return send(res,404,{error:'Media non trovato'});return send(res,200,r[0])}
      const r=await sql`INSERT INTO gallery_items(title,media_type,media_url,alt_text,sort_order,is_published) VALUES(${title},${mediaType},${mediaUrl},${altText},${sortOrder},${isPublished}) RETURNING *`;return send(res,201,r[0]);
    }
    if(req.method==='DELETE'){const id=req.body?.id;if(!id)return send(res,400,{error:'ID obbligatorio'});await sql`DELETE FROM gallery_items WHERE id=${id}`;return send(res,200,{ok:true})}
    res.setHeader('Allow','GET,POST,PUT,DELETE');return send(res,405,{error:'Metodo non consentito'})
  }catch(e){console.error(e);return send(res,500,{error:'Errore nella gestione della galleria'})}
};
