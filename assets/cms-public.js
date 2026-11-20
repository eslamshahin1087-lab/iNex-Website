
const config=window.INEX_CMS_CONFIG||{};
(async()=>{
 if(!config.supabaseUrl||!config.publishableKey)return;
 const page=document.body.dataset.cmsPage;
 const region=document.querySelector('[data-cms-region="custom-content"]');
 if(!page)return;
 try{
  const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2.119.0");
  const client=createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.from("cms_content").select("*").eq("page_slug",page).eq("is_published",true).order("sort_order");
  if(error)throw error;
  const rows=data||[];
  const textNodes=new Map(),imageNodes=new Map(),customImages=[];
  document.querySelectorAll("[data-cms-key]").forEach(el=>textNodes.set(el.dataset.cmsKey,el));
  document.querySelectorAll("[data-cms-image-key]").forEach(el=>{const key=el.dataset.cmsImageKey;if(!imageNodes.has(key))imageNodes.set(key,[]);imageNodes.get(key).push(el);});
  const safeHtml=value=>{
   const parsed=new DOMParser().parseFromString(String(value??""),"text/html");
   const allowed=new Set(["BR","STRONG","B","EM","I","U","SMALL","SPAN","SUB","SUP"]);
   const copy=node=>{
    if(node.nodeType===Node.TEXT_NODE)return document.createTextNode(node.nodeValue||"");
    if(node.nodeType!==Node.ELEMENT_NODE)return document.createDocumentFragment();
    const frag=document.createDocumentFragment();
    if(!allowed.has(node.tagName)){node.childNodes.forEach(child=>frag.append(copy(child)));return frag;}
    const el=document.createElement(node.tagName.toLowerCase());
    node.childNodes.forEach(child=>el.append(copy(child)));
    return el;
   };
   const out=document.createDocumentFragment();
   parsed.body.childNodes.forEach(node=>out.append(copy(node)));
   return out;
  };
  const allowedImageUrl=value=>{
   if(!value)return null;
   if(value.startsWith("/")&&!value.startsWith("//"))return value;
   try{
    const url=new URL(value,location.origin);
    if(url.protocol!=="https:")return null;
    if(url.origin===location.origin||url.hostname.endsWith(".supabase.co"))return url.href;
   }catch(_){}
   return null;
  };
  const safeHtmlString=value=>{
   const box=document.createElement("div");
   box.append(safeHtml(value));
   return box.innerHTML;
  };
  const lang=()=>document.documentElement.lang==="ar"?"ar":"en";
  const updateImage=(row)=>{
   const nodes=imageNodes.get(row.content_key)||[];
   const src=allowedImageUrl(row.image_url);if(!src)return;
   nodes.forEach(el=>{
    el.hidden=!row.is_visible;
    if(el.tagName==="IMG"){
     el.src=src;
     const alt=lang()==="ar"?(row.alt_ar||row.alt_en):(row.alt_en||row.alt_ar);
     if(alt)el.alt=alt;
    }else{
     el.style.backgroundImage='url("'+src.replace(/"/g,"%22")+'")';
     if(row.image_mode==="sprite"){
      el.style.backgroundSize="600% 300%";
      el.style.backgroundPosition=row.image_position||"center";
      el.style.backgroundRepeat="no-repeat";
     }else{
      el.style.backgroundSize="contain";
      el.style.backgroundPosition="center";
      el.style.backgroundRepeat="no-repeat";
     }
    }
   });
  };
  const updateText=(row)=>{
   const el=textNodes.get(row.content_key);if(!el)return;
   el.hidden=!row.is_visible;
   const en=safeHtmlString(row.content_en??el.dataset.en??""),ar=safeHtmlString(row.content_ar??el.dataset.ar??"");
   el.dataset.en=en;el.dataset.ar=ar;el.dataset.html="true";
   el.replaceChildren(safeHtml(lang()==="ar"?ar:en));
  };
  rows.filter(row=>!row.is_custom).forEach(row=>{
   if(row.content_type==="image")updateImage(row);else updateText(row);
  });
  if(region){
   region.replaceChildren();
   rows.filter(row=>row.is_custom&&row.is_visible).forEach(row=>{
    const wrapper=document.createElement(row.content_type==="card"?"article":"div");
    wrapper.className=row.content_type==="card"?"info-card cms-created-block":"cms-created-block";
    const title=document.createElement("h3");
    title.dataset.ar=row.label_ar||"";title.dataset.en=row.label_en||"";
    title.textContent=lang()==="ar"?title.dataset.ar:title.dataset.en;
    if(title.dataset.ar||title.dataset.en)wrapper.append(title);
    if(row.content_type==="image"){
     const image=document.createElement("img");const src=allowedImageUrl(row.image_url);
     if(src)image.src=src;image.alt=lang()==="ar"?(row.alt_ar||row.alt_en||""):(row.alt_en||row.alt_ar||"");
     image.loading="lazy";image.dataset.cmsAltEn=row.alt_en||"";image.dataset.cmsAltAr=row.alt_ar||"";customImages.push(image);wrapper.append(image);
    }else{
     const body=document.createElement("p");
     body.dataset.ar=safeHtmlString(row.content_ar||"");body.dataset.en=safeHtmlString(row.content_en||"");
     body.replaceChildren(safeHtml(lang()==="ar"?body.dataset.ar:body.dataset.en));body.dataset.html="true";wrapper.append(body);
    }
    region.append(wrapper);
   });
  }
  const observer=new MutationObserver(()=>{
   rows.filter(row=>!row.is_custom).forEach(row=>row.content_type==="image"?updateImage(row):updateText(row));
   customImages.forEach(image=>{image.alt=lang()==="ar"?(image.dataset.cmsAltAr||image.dataset.cmsAltEn||""):(image.dataset.cmsAltEn||image.dataset.cmsAltAr||"");});
  });
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  window.dispatchEvent(new CustomEvent("inex:cms-loaded",{detail:{page,items:rows.length}}));
 }catch(error){
  console.warn("iNex CMS content could not be loaded; static website content remains active.",error);
 }
})();
