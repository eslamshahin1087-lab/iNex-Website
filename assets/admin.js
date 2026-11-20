const config=window.INEX_CMS_CONFIG||{};
const $=id=>document.getElementById(id);
let supabase=null,user=null,rows=[],toastTimer;
const pageNames={index:"الرئيسية",platform:"المنصة",solutions:"الحلول",awareness:"التوعية",company:"عن iNex",contact:"تواصل معنا",resources:"المعرفة"};
const configOk=()=>Boolean(config.supabaseUrl&&config.publishableKey&&/^https:\/\//.test(config.supabaseUrl));
function setMessage(node,text,type=""){node.textContent=text;node.className="form-message"+(type?" "+type:"");}
function toast(text){const node=$("toast");node.textContent=text;node.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),3200);}
function showLogin(){$("loginPanel").hidden=false;$("dashboard").hidden=true;}
function makeField(label,value,kind="input"){
 const box=document.createElement("div");box.className="field";
 const lab=document.createElement("label");lab.textContent=label;box.append(lab);
 const el=document.createElement(kind==="textarea"?"textarea":"input");if(kind!=="textarea")el.type="text";el.value=value??"";box.append(el);
 return {box,el};
}
function makeCheck(label,checked){
 const wrap=document.createElement("label");wrap.className="check-label";
 const input=document.createElement("input");input.type="checkbox";input.checked=Boolean(checked);
 const span=document.createElement("span");span.textContent=label;wrap.append(input,span);return {wrap,input};
}
function badge(text,kind=""){const el=document.createElement("span");el.className="pill "+kind;el.textContent=text;return el;}
function setAdminView(email){$("adminIdentity").textContent=email||"Admin";$("loginPanel").hidden=true;$("dashboard").hidden=false;}
async function checkAdmin(authUser){
 const {data,error}=await supabase.from("cms_admins").select("user_id,email,role,is_active").eq("user_id",authUser.id).maybeSingle();
 if(error||!data||!data.is_active){await supabase.auth.signOut();throw new Error("هذا الحساب غير مصرح له بإدارة الموقع. أضف المستخدم إلى جدول cms_admins أولًا.");}
 user=authUser;setAdminView(data.email||authUser.email);await loadRows();
}
async function loadRows(){
 $("contentStatus").textContent="جارٍ تحميل عناصر الموقع...";
 const {data,error}=await supabase.from("cms_content").select("*").order("page_slug").order("sort_order");
 if(error){$("contentStatus").textContent="تعذر تحميل المحتوى: "+error.message;return;}
 rows=data||[];
 $("totalCount").textContent=String(rows.length);
 $("publishedCount").textContent=String(rows.filter(r=>r.is_published&&r.is_visible).length);
 $("imageCount").textContent=String(rows.filter(r=>r.content_type==="image").length);
 renderRows();
}
function selectedRows(){
 const page=$("pageFilter").value,type=$("typeFilter").value,term=$("searchInput").value.trim().toLowerCase();
 return rows.filter(r=>r.page_slug===page&&(type==="all"||r.content_type===type)&&(!term||[r.label_ar,r.label_en,r.content_ar,r.content_en,r.content_key].some(v=>String(v||"").toLowerCase().includes(term))));
}
function imageAccepted(file){
 const mime=["image/jpeg","image/png","image/webp","image/avif"];
 if(!file||!mime.includes(file.type))throw new Error("صيغة غير مدعومة. اختر JPEG أو PNG أو WebP أو AVIF.");
 if(file.size>8*1024*1024)throw new Error("حجم الصورة أكبر من 8MB.");
}
async function uploadImage(file,page){
 imageAccepted(file);
 const fileName=(file.name||"image").toLowerCase().replace(/[^a-z0-9.-]+/g,"-").slice(-70);
 const path=user.id+"/"+page+"/"+Date.now()+"-"+crypto.randomUUID()+"-"+fileName;
 const {error}=await supabase.storage.from("inex-site-media").upload(path,file,{cacheControl:"3600",contentType:file.type,upsert:false});
 if(error)throw error;
 const {data}=supabase.storage.from("inex-site-media").getPublicUrl(path);
 return {path,url:data.publicUrl};
}
function renderRow(row){
 const card=document.createElement("article");card.className="content-row";
 const heading=document.createElement("div");heading.className="row-heading";
 const left=document.createElement("div");left.className="row-title";
 const title=document.createElement("h3");title.textContent=row.label_ar||row.label_en||"عنصر بدون عنوان";
 const key=document.createElement("small");key.textContent=row.content_key;left.append(title,key);
 const badges=document.createElement("div");badges.className="row-badges";
 badges.append(badge(row.content_type==="image"?"صورة":row.content_type==="card"?"بطاقة":"نص",row.content_type));
 if(row.is_custom)badges.append(badge("عنصر مضاف"));
 if(!row.is_visible)badges.append(badge("مخفي","hidden"));
 heading.append(left,badges);card.append(heading);

 const labels=document.createElement("div");labels.className="row-grid";
 const labelEn=makeField("اسم العنصر – EN",row.label_en),labelAr=makeField("اسم العنصر – AR",row.label_ar);
 labels.append(labelEn.box,labelAr.box);card.append(labels);
 let bodyEn=null,bodyAr=null,altEn=null,altAr=null,file=null,preview=null;
 if(row.content_type==="image"){
  const imageRow=document.createElement("div");imageRow.className="row-image";
  if(row.image_mode==="sprite"){preview=document.createElement("div");preview.style.width="96px";preview.style.height="76px";preview.style.border="1px solid #e1e8ef";preview.style.borderRadius="10px";preview.style.backgroundColor="#f7f9fb";preview.style.backgroundImage='url("'+(row.image_url||"")+'")';preview.style.backgroundRepeat="no-repeat";preview.style.backgroundSize="600% 300%";preview.style.backgroundPosition=row.image_position||"center";}else{preview=document.createElement("img");preview.src=row.image_url||"";preview.alt=row.alt_en||"";}
  const upload=makeField("استبدال الصورة (اختياري)","");file=document.createElement("input");file.type="file";file.accept="image/jpeg,image/png,image/webp,image/avif";upload.box.replaceChild(file,upload.el);
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
 const visible=makeCheck("ظاهر على الموقع",row.is_visible);
 const published=makeCheck("منشور",row.is_published);published.input.disabled=!row.is_custom;
 if(!row.is_custom)published.input.title="تحكم في العناصر الموجودة من خلال خيار ظاهر على الموقع.";
 const order=makeField("الترتيب",String(row.sort_order));order.el.type="number";order.el.style.width="92px";
 settings.append(visible.wrap,published.wrap,order.box);
 const actions=document.createElement("div");actions.className="row-actions";
 const save=document.createElement("button");save.type="button";save.className="primary-button";save.textContent="حفظ التعديلات";
 const remove=document.createElement("button");remove.type="button";remove.className="danger-button";remove.textContent=row.is_custom?"حذف العنصر":"إخفاء العنصر";
 actions.append(save,remove);settings.append(actions);card.append(settings);

 save.addEventListener("click",async()=>{
  save.disabled=true;save.textContent="جارٍ الحفظ...";
  let newPath=null;
  try{
   const update={label_en:labelEn.el.value,label_ar:labelAr.el.value,is_visible:visible.input.checked,sort_order:Number(order.el.value)||0,updated_at:new Date().toISOString()};
   if(row.is_custom)update.is_published=published.input.checked;
   if(bodyEn){update.content_en=bodyEn.el.value;update.content_ar=bodyAr.el.value;}
   if(altEn){update.alt_en=altEn.el.value;update.alt_ar=altAr.el.value;}
   const oldPath=row.storage_path||null;
   if(file?.files?.[0]){
    const uploaded=await uploadImage(file.files[0],row.page_slug);update.image_url=uploaded.url;update.storage_path=uploaded.path;update.image_mode="file";update.image_position=null;newPath=uploaded.path;
   }
   const {data,error}=await supabase.from("cms_content").update(update).eq("id",row.id).select("*").single();
   if(error)throw error;
   if(newPath&&oldPath)await supabase.storage.from("inex-site-media").remove([oldPath]);
   Object.assign(row,data);toast("تم حفظ التعديلات بنجاح.");await loadRows();
  }catch(err){if(newPath)await supabase.storage.from("inex-site-media").remove([newPath]);toast("تعذر الحفظ: "+(err.message||"خطأ غير معروف"));}
  finally{save.disabled=false;save.textContent="حفظ التعديلات";}
 });
 remove.addEventListener("click",async()=>{
  if(!confirm(row.is_custom?"حذف هذا العنصر نهائيًا؟":"إخفاء هذا العنصر من الموقع؟"))return;
  remove.disabled=true;
  try{
   if(row.is_custom){
    const {error}=await supabase.from("cms_content").delete().eq("id",row.id);if(error)throw error;
    if(row.storage_path)await supabase.storage.from("inex-site-media").remove([row.storage_path]);
    toast("تم حذف العنصر.");
   }else{
    const {error}=await supabase.from("cms_content").update({is_visible:false,updated_at:new Date().toISOString()}).eq("id",row.id);if(error)throw error;
    toast("تم إخفاء العنصر من الموقع.");
   }
   await loadRows();
  }catch(err){toast("تعذر تنفيذ الطلب: "+(err.message||"خطأ غير معروف"));}
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
 const type=$("newType").value,page=$("newPage").value,file=$("newImage").files?.[0];
 let uploadedPath=null;
 try{
  const titleEn=$("newTitleEn").value.trim(),titleAr=$("newTitleAr").value.trim();
  const bodyEn=$("newBodyEn").value.trim(),bodyAr=$("newBodyAr").value.trim();
  if(!titleEn&&!titleAr&&!bodyEn&&!bodyAr&&!file)throw new Error("أدخل عنوانًا أو محتوى أو اختر صورة.");
  let imageUrl=null,altEn=null,altAr=null;
  const key="custom-"+crypto.randomUUID();
  if(type==="image"){
   if(!file)throw new Error("اختر صورة أولًا.");
   const uploaded=await uploadImage(file,page);imageUrl=uploaded.url;uploadedPath=uploaded.path;
   altEn=$("newAltEn").value.trim()||titleEn;altAr=$("newAltAr").value.trim()||titleAr;
  }
  const {error}=await supabase.from("cms_content").insert({
   page_slug:page,content_key:key,content_type:type,section_label:$("newSection").value.trim()||"محتوى إضافي",
   label_en:titleEn,label_ar:titleAr,content_en:bodyEn||null,content_ar:bodyAr||null,
   image_url:imageUrl,storage_path:uploadedPath,alt_en:altEn,alt_ar:altAr,
   sort_order:Number($("newOrder").value)||9000,is_published:true,is_visible:true,is_custom:true
  });
  if(error)throw error;
  $("createForm").reset();$("newOrder").value="9000";$("newImageFields").hidden=true;$("createPanel").hidden=true;$("pageFilter").value=page;
  await loadRows();toast("تمت إضافة المحتوى إلى الموقع.");
 }catch(err){
  if(uploadedPath)await supabase.storage.from("inex-site-media").remove([uploadedPath]);
  setMessage($("createMessage"),err.message||"تعذر إضافة العنصر.","error");
 }
});
$("logoutButton").addEventListener("click",async()=>{await supabase?.auth.signOut();user=null;showLogin();});
$("forgotPassword").addEventListener("click",async()=>{
 if(!supabase)return;
 const email=$("email").value.trim();if(!email){setMessage($("loginMessage"),"أدخل بريدك الإلكتروني أولًا.","error");return;}
 const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+"/admin/"});
 setMessage($("loginMessage"),error?"تعذر إرسال رابط الاستعادة: "+error.message:"تم إرسال رابط استعادة كلمة المرور إذا كان الحساب مسجلًا.","success");
});
$("loginForm").addEventListener("submit",async event=>{
 event.preventDefault();if(!supabase)return;
 const button=$("loginForm").querySelector('button[type="submit"]');button.disabled=true;setMessage($("loginMessage"),"جارٍ التحقق من بيانات الدخول...");
 try{
  const {data,error}=await supabase.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
  if(error)throw error;await checkAdmin(data.user);
 }catch(err){setMessage($("loginMessage"),err.message||"تعذر تسجيل الدخول.","error");}
 finally{button.disabled=false;}
});
(async()=>{
 if(!configOk()){
  $("configNotice").hidden=false;
  $("loginForm").querySelectorAll("input,button").forEach(el=>{if(el.id!=="forgotPassword")el.disabled=true;});
  return;
 }
 try{
  const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2.119.0");
  supabase=createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data:{session}}=await supabase.auth.getSession();
  if(session?.user)await checkAdmin(session.user);
 }catch(err){setMessage($("loginMessage"),err.message||"تعذر تهيئة لوحة الإدارة.","error");}
})();
