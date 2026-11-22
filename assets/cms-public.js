const config = window.INEX_CMS_CONFIG || {};
(async () => {
  const page = document.body.dataset.cmsPage;
  const region = document.querySelector('[data-cms-region="custom-content"]');
  if (!page) return;
  try {
    const base = (config.publicApiBase || "/api/cms").replace(/\/$/,"");
    const response = await fetch(base + "/content?page=" + encodeURIComponent(page), {
      method:"GET",credentials:"same-origin",headers:{Accept:"application/json"}
    });
    if (!response.ok) throw new Error("CMS API unavailable: " + response.status);
    const payload = await response.json();
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const textNodes = new Map(), imageNodes = new Map(), customImages = [];
    document.querySelectorAll("[data-cms-key]").forEach(node=>textNodes.set(node.dataset.cmsKey,node));
    document.querySelectorAll("[data-cms-image-key]").forEach(node=>{
      const key=node.dataset.cmsImageKey;
      if(!imageNodes.has(key))imageNodes.set(key,[]);
      imageNodes.get(key).push(node);
    });
    const safeHtml=value=>{
      const parsed=new DOMParser().parseFromString(String(value??""),"text/html");
      const allowed=new Set(["BR","STRONG","B","EM","I","U","SMALL","SPAN","SUB","SUP"]);
      const copy=node=>{
        if(node.nodeType===Node.TEXT_NODE)return document.createTextNode(node.nodeValue||"");
        if(node.nodeType!==Node.ELEMENT_NODE)return document.createDocumentFragment();
        const fragment=document.createDocumentFragment();
        if(!allowed.has(node.tagName)){node.childNodes.forEach(child=>fragment.append(copy(child)));return fragment;}
        const element=document.createElement(node.tagName.toLowerCase());
        node.childNodes.forEach(child=>element.append(copy(child)));
        return element;
      };
      const output=document.createDocumentFragment();
      parsed.body.childNodes.forEach(node=>output.append(copy(node)));
      return output;
    };
    const safeHtmlString=value=>{
      const container=document.createElement("div");
      container.append(safeHtml(value));
      return container.innerHTML;
    };
    const language=()=>document.documentElement.lang==="ar"?"ar":"en";
    const imageUrl=value=>{
      if(typeof value!=="string")return null;
      return value.startsWith("/assets/")||value.startsWith("/api/cms/media/")?value:null;
    };
    const updateImage=row=>{
      const nodes=imageNodes.get(row.content_key)||[];
      const source=imageUrl(row.image_url);
      if(!source)return;
      nodes.forEach(node=>{
        node.hidden=!Boolean(row.is_visible);
        if(node.tagName==="IMG"){
          node.src=source;
          const alt=language()==="ar"?(row.alt_ar||row.alt_en):(row.alt_en||row.alt_ar);
          if(alt)node.alt=alt;
        }else{
          node.style.backgroundImage='url("'+source.replace(/"/g,"%22")+'")';
          if(row.image_mode==="sprite"){
            node.style.backgroundSize="600% 300%";
            node.style.backgroundPosition=row.image_position||"center";
            node.style.backgroundRepeat="no-repeat";
          }else{
            node.style.backgroundSize="contain";
            node.style.backgroundPosition="center";
            node.style.backgroundRepeat="no-repeat";
          }
        }
      });
    };
    const updateText=row=>{
      const node=textNodes.get(row.content_key);
      if(!node)return;
      node.hidden=!Boolean(row.is_visible);
      const en=safeHtmlString(row.content_en??node.dataset.en??"");
      const ar=safeHtmlString(row.content_ar??node.dataset.ar??"");
      node.dataset.en=en;node.dataset.ar=ar;node.dataset.html="true";
      node.replaceChildren(safeHtml(language()==="ar"?ar:en));
    };
    rows.filter(row=>!Boolean(row.is_custom)).forEach(row=>{
      if(row.content_type==="image")updateImage(row);else updateText(row);
    });
    if(region){
      region.replaceChildren();
      rows.filter(row=>Boolean(row.is_custom)&&Boolean(row.is_visible)).forEach(row=>{
        const wrapper=document.createElement(row.content_type==="card"?"article":"div");
        wrapper.className=row.content_type==="card"?"info-card cms-created-block":"cms-created-block";
        const title=document.createElement("h3");
        title.dataset.ar=row.label_ar||"";title.dataset.en=row.label_en||"";
        title.textContent=language()==="ar"?title.dataset.ar:title.dataset.en;
        if(title.dataset.ar||title.dataset.en)wrapper.append(title);
        if(row.content_type==="image"){
          const image=document.createElement("img"),source=imageUrl(row.image_url);
          if(source)image.src=source;
          image.alt=language()==="ar"?(row.alt_ar||row.alt_en||""):(row.alt_en||row.alt_ar||"");
          image.loading="lazy";image.dataset.cmsAltEn=row.alt_en||"";image.dataset.cmsAltAr=row.alt_ar||"";
          customImages.push(image);wrapper.append(image);
        }else{
          const body=document.createElement("p");
          body.dataset.ar=safeHtmlString(row.content_ar||"");body.dataset.en=safeHtmlString(row.content_en||"");
          body.replaceChildren(safeHtml(language()==="ar"?body.dataset.ar:body.dataset.en));
          body.dataset.html="true";wrapper.append(body);
        }
        region.append(wrapper);
      });
    }
    const observer=new MutationObserver(()=>{
      rows.filter(row=>!Boolean(row.is_custom)).forEach(row=>{
        if(row.content_type==="image")updateImage(row);else updateText(row);
      });
      customImages.forEach(image=>{
        image.alt=language()==="ar"?(image.dataset.cmsAltAr||image.dataset.cmsAltEn||""):(image.dataset.cmsAltEn||image.dataset.cmsAltAr||"");
      });
      region?.querySelectorAll(".cms-created-block h3").forEach(title=>{
        title.textContent=language()==="ar"?title.dataset.ar:title.dataset.en;
      });
      region?.querySelectorAll(".cms-created-block p").forEach(body=>{
        body.replaceChildren(safeHtml(language()==="ar"?body.dataset.ar:body.dataset.en));
      });
    });
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    window.dispatchEvent(new CustomEvent("inex:cms-loaded",{detail:{page,items:rows.length}}));
  } catch(error) {
    console.warn("iNex CMS could not be loaded; static website content remains active.",error);
  }
})();