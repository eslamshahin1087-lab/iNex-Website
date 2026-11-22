const $=id=>document.getElementById(id);
let rows=[],toastTimer;
const pageNames={index:"الرئيسية",platform:"المنصة",solutions:"الحلول",awareness:"التوعية",company:"عن iNex",contact:"تواصل معنا",resources:"المعرفة"};
function setMessage(node,text,type=""){if(!node)return;node.textContent=text;node.className="form-message"+(type?" "+type:"");}
function toast(text){const node=$("toast");node.textContent=text;node.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),3200);}
function showBackendNotice(message){const node=$("backendNotice");if(node){node.hidden=false;node.textContent=message;}}
async function api(path,options={}){
 const method=options.method||"GET",headers={Accept:"application/json"},init={method,credentials:"same-origin",headers};
 if(options.body instanceof FormData)init.body=options.body;
 else if(options.body!==undefined){headers["Content-Type"]="application/json";init.body=JSON.stringify(options.body);}
 const response=await fetch("/admin/api/"+path,init);
 let result;
 try{result=await response.json();}catch{throw new Error("واجهات CMS غير متاحة في هذه المعاينة. استخدم Cloudflare Pages Preview بعد ربط خدمات CMS.");}
 if(!response.ok)throw new Error(result.error||"تعذر تنفيذ الطلب ("+response.status+").");
 return result;
}
async function deleteMedia(key){if(key)await api("media",{method:"DELETE",body:{key}});}
function makeField(label,value,kind="input"){
 const box=document.createElement("div");box.className="field";
 const lab=document.createElement("label");lab.textContent=label;box.append(lab);
 const element=document.createElement(kind==="textarea"?"textarea":"input");
 if(kind!=="textarea")element.type="text";element.value=value??"";box.append(element);
 return {box,el:element};
}
function makeCheck(label,checked){
 const wrap=document.createElement("label");wrap.className="check-label";
 const input=document.createElement("input");input.type="checkbox";input.checked=Boolean(checked);
 const span=document.createElement("span");span.textContent=label;wrap.append(input,span);
 return {wrap,input};
}
function badge(text,kind=""){const element=document.createElement("span");element.className="pill "+kind;element.textContent=text;return element;}
async function uploadImage(file){
 const allowed=["image/jpeg","image/png","image/webp","image/avif"];
 if(!file||!allowed.includes(file.type))throw new Error("صيغة غير مدعومة. اختر JPEG أو PNG أو WebP أو AVIF.");
 if(file.size<1||file.size>8*1024*1024)throw new Error("حجم الصورة يجب ألا يتجاوز 8MB.");
 const form=new FormData();form.append("file",file,file.name||"image");
 return api("media",{method:"POST",body:form});
}
async function loadRows(){
 $("contentStatus").textContent="جارٍ تحميل عناصر الموقع...";
 try{
  const result=await api("content");rows=Array.isArray(result.rows)?result.rows:[];
  $("totalCount").textContent=String(rows.length);
  $("publishedCount").textContent=String(rows.filter(row=>Boolean(row.is_published)&&Boolean(row.is_visible)).length);
  $("imageCount").textContent=String(rows.filter(row=>row.content_type==="image").length);
  renderRows();
 }catch(error){$("contentStatus").textContent="تعذر تحميل المحتوى: "+error.message;showBackendNotice(error.message);}
}
function selectedRows(){
 const page=$("pageFilter").value,type=$("typeFilter").value,term=$("searchInput").value.trim().toLowerCase();
 return rows.filter(row=>row.page_slug===page&&(type==="all"||row.content_type===type)&&
  (!term||[row.label_ar,row.label_en,row.content_ar,row.content_en,row.content_key].some(value=>String(value||"").toLowerCase().includes(term))));
}
function renderRow(row){
 const card=document.createElement("article");card.className="content-row";
 const heading=document.createElement("div");heading.className="row-heading";
 const left=document.createElement("div");left.className="row-title";
 const title=document.createElement("h3");title.textContent=row.label_ar||row.label_en||"عنصر بدون عنوان";
 const key=document.createElement("small");key.textContent=row.content_key;left.append(title,key);
 const badges=document.createElement("div");badges.className="row-badges";
 badges.append(badge(row.content_type==="image"?"صورة":row.content_type==="card"?"بطاقة":"نص",row.content_type));
 if(Boolean(row.is_custom))badges.append(badge("عنصر مضاف"));
 if(!Boolean(row.is_visible))badges.append(badge("مخفي","hidden"));
 heading.append(left,badges);card.append(heading);

 const labels=document.createElement("div");labels.className="row-grid";
 const labelEn=makeField("اسم العنصر – EN",row.label_en),labelAr=makeField("اسم العنصر – AR",row.label_ar);
 labels.append(labelEn.box,labelAr.box);card.append(labels);
 let bodyEn=null,bodyAr=null,altEn=null,altAr=null,file=null;
 if(row.content_type==="image"){
  const imageRow=document.createElement("div");imageRow.className="row-image";
  let preview;
  if(row.image_mode==="sprite"){
   preview=document.createElement("div");
   Object.assign(preview.style,{width:"96px",height:"76px",border:"1px solid #e1e8ef",borderRadius:"10px",backgroundColor:"#f7f9fb",
    backgroundImage:'url("'+(row.image_url||"")+'")',backgroundRepeat:"no-repeat",backgroundSize:"600% 300%",backgroundPosition:row.image_position||"center"});
  }else{preview=document.createElement("img");preview.src=row.image_url||"";preview.alt=row.alt_en||"";}
  const upload=makeField("استبدال الصورة (اختياري)","");
  file=document.createElement("input");file.type="file";file.accept="image/jpeg,image/png,image/webp,image/avif";
  upload.box.replaceChild(file,upload.el);
  const hint=document.createElement("small");hint.textContent="حتى 8MB – JPEG / PNG / WebP / AVIF";upload.box.append(hint);
  imageRow.append(preview,upload.box);card.append(imageRow);
  const altRow=document.createElement("div");altRow.className="row-grid";
  altEn=makeField("وصف الصورة – EN",row.alt_en);altAr=makeField("وصف الصورة – AR",row.alt_ar);
  altRow.append(altEn.box,altAr.box);card.append(altRow);
 }else{
  const bodyRow=document.createElement("div");bodyRow.className="row-grid";
  bodyEn=makeField("المحتوى – EN",row.content_en,"textarea");bodyAr=makeField("المحتوى – AR",row.content_ar,"textarea");
  bodyRow.append(bodyEn.box,bodyAr.box);card.append(bodyRow);
 }

 const settings=document.createElement("div");settings.className="row-settings";
 const visible=makeCheck("ظاهر على الموقع",row.is_visible),published=makeCheck("منشور",row.is_published);
 published.input.disabled=!Boolean(row.is_custom);
 if(!Boolean(row.is_custom))published.input.title="تحكم في العناصر الموجودة من خلال خيار ظاهر على الموقع.";
 const order=makeField("الترتيب",String(row.sort_order));order.el.type="number";order.el.style.width="92px";
 settings.append(visible.wrap,published.wrap,order.box);
 const actions=document.createElement("div");actions.className="row-actions";
 const save=document.createElement("button");save.type="button";save.className="primary-button";save.textContent="حفظ التعديلات";
 const remove=document.createElement("button");remove.type="button";remove.className="danger-button";
 remove.textContent=Boolean(row.is_custom)?"حذف العنصر":"إخفاء العنصر";
 actions.append(save,remove);settings.append(actions);card.append(settings);

 save.addEventListener("click",async()=>{
  save.disabled=true;save.textContent="جارٍ الحفظ...";let newKey=null;
  try{
   const update={label_en:labelEn.el.value,label_ar:labelAr.el.value,is_visible:visible.input.checked,sort_order:Number(order.el.value)||0};
   if(Boolean(row.is_custom))update.is_published=published.input.checked;
   if(bodyEn){update.content_en=bodyEn.el.value;update.content_ar=bodyAr.el.value;}
   if(altEn){update.alt_en=altEn.el.value;update.alt_ar=altAr.el.value;}
   const oldKey=row.storage_path||null;
   if(file?.files?.[0]){
    const uploaded=await uploadImage(file.files[0]);update.image_url=uploaded.url;update.storage_path=uploaded.key;
    update.image_mode="file";update.image_position=null;newKey=uploaded.key;
   }
   const result=await api("content?id="+encodeURIComponent(row.id),{method:"PATCH",body:update});
   if(newKey&&oldKey){try{await deleteMedia(oldKey);}catch(error){console.warn("Previous media was retained:",error);}}
   Object.assign(row,result.row);toast("تم حفظ التعديلات بنجاح.");await loadRows();
  }catch(error){
   if(newKey){try{await deleteMedia(newKey);}catch(cleanupError){console.warn("Incomplete upload cleanup failed:",cleanupError);}}
   toast("تعذر الحفظ: "+(error.message||"خطأ غير معروف"));
  }finally{save.disabled=false;save.textContent="حفظ التعديلات";}
 });
 remove.addEventListener("click",async()=>{
  if(!confirm(Boolean(row.is_custom)?"حذف هذا العنصر نهائيًا؟":"إخفاء هذا العنصر من الموقع؟"))return;
  remove.disabled=true;
  try{
   await api("content?id="+encodeURIComponent(row.id),{method:"DELETE"});
   if(Boolean(row.is_custom)&&row.storage_path){try{await deleteMedia(row.storage_path);}catch(error){console.warn("Unused R2 object could not be removed:",error);}}
   toast(Boolean(row.is_custom)?"تم حذف العنصر.":"تم إخفاء العنصر من الموقع.");await loadRows();
  }catch(error){toast("تعذر تنفيذ الطلب: "+(error.message||"خطأ غير معروف"));}
  finally{remove.disabled=false;}
 });
 return card;
}
function renderRows(){
 const container=$("contentList");container.replaceChildren();
 const list=selectedRows();$("contentStatus").textContent=list.length+" عنصر في صفحة "+pageNames[$("pageFilter").value];
 if(!list.length){const empty=document.createElement("div");empty.className="empty-state";empty.textContent="لا توجد عناصر تطابق البحث. يمكنك إضافة محتوى جديد من الزر أعلى الصفحة.";container.append(empty);return;}
 list.forEach(row=>container.append(renderRow(row)));
}
$("pageFilter").addEventListener("change",renderRows);
$("typeFilter").addEventListener("change",renderRows);
$("searchInput").addEventListener("input",renderRows);
$("toggleCreate").addEventListener("click",()=>{$("createPanel").hidden=!$("createPanel").hidden;$("createPanel").scrollIntoView({behavior:"smooth",block:"start"});});
$("closeCreate").addEventListener("click",()=>$("createPanel").hidden=true);
$("newType").addEventListener("change",()=>$("newImageFields").hidden=$("newType").value!=="image");
$("createForm").addEventListener("submit",async event=>{
 event.preventDefault();setMessage($("createMessage"),"جارٍ إضافة العنصر...");
 const type=$("newType").value,page=$("newPage").value,file=$("newImage").files?.[0];let uploadedKey=null;
 try{
  const titleEn=$("newTitleEn").value.trim(),titleAr=$("newTitleAr").value.trim();
  const bodyEn=$("newBodyEn").value.trim(),bodyAr=$("newBodyAr").value.trim();
  if(!titleEn&&!titleAr&&!bodyEn&&!bodyAr&&!file)throw new Error("أدخل عنوانًا أو محتوى أو اختر صورة.");
  let imageUrl=null,altEn=null,altAr=null;
  if(type==="image"){
   if(!file)throw new Error("اختر صورة أولًا.");
   const uploaded=await uploadImage(file);imageUrl=uploaded.url;uploadedKey=uploaded.key;
   altEn=$("newAltEn").value.trim()||titleEn;altAr=$("newAltAr").value.trim()||titleAr;
  }
  await api("content",{method:"POST",body:{
   page_slug:page,content_type:type,section_label:$("newSection").value.trim()||"محتوى إضافي",
   label_en:titleEn,label_ar:titleAr,content_en:bodyEn||null,content_ar:bodyAr||null,
   image_url:imageUrl,storage_path:uploadedKey,alt_en:altEn,alt_ar:altAr,sort_order:Number($("newOrder").value)||9000
  }});
  $("createForm").reset();$("newOrder").value="9000";$("newImageFields").hidden=true;$("createPanel").hidden=true;$("pageFilter").value=page;
  await loadRows();toast("تمت إضافة المحتوى إلى الموقع.");
 }catch(error){
  if(uploadedKey){try{await deleteMedia(uploadedKey);}catch(cleanupError){console.warn("Incomplete image cleanup failed:",cleanupError);}}
  setMessage($("createMessage"),error.message||"تعذر تنفيذ العملية.","error");
 }
});
$("logoutButton").addEventListener("click",async()=>{
 try{await fetch("/admin/__logout",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"logout=1"});}
 finally{location.replace("/admin/");}
});
(async()=>{
 try{
  const session=await api("session");$("adminIdentity").textContent=session.email||"Admin";
  if(!session.databaseReady){
   showBackendNotice("تم التحقق من جلسة الإدارة، لكن قاعدة بيانات CMS (INEX_CMS_DB) غير مربوطة بعد. لم يتم تعديل المحتوى.");
   $("contentStatus").textContent="بانتظار ربط قاعدة بيانات الموقع.";return;
  }
  if(!session.mediaReady)showBackendNotice("قاعدة البيانات متاحة، لكن مساحة الصور (INEX_CMS_MEDIA) غير مربوطة بعد. إدارة الصور غير متاحة.");
  await loadRows();
 }catch(error){
  showBackendNotice(error.message||"خدمة CMS غير متاحة في هذه البيئة.");
  $("contentStatus").textContent="تعذر الاتصال بخدمات إدارة الموقع.";
 }
})();