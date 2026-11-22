import { verifyAdminSession, isSameOriginAdminRequest } from "../auth.mjs";
import { hasValidImageSignature } from "../media-validation.mjs";
import { MAX_CMS_IMAGE_BYTES, storeCmsMedia, deleteCmsMedia } from "../../cms/media-storage.mjs";

const COOKIE_NAME = "__Secure-iNexAdminSession";
const PAGE_SLUGS = new Set(["index","platform","solutions","awareness","company","contact","resources"]);
const IMAGE_TYPES = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"],["image/avif","avif"]]);
const MAX_JSON_BYTES = 64 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: {
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store, private, max-age=0",
    "X-Content-Type-Options":"nosniff",
    "X-Frame-Options":"DENY",
    "Referrer-Policy":"no-referrer",
    "Vary":"Cookie"
  }});
}
function cookieValue(request, name) {
  for (const item of (request.headers.get("Cookie") || "").split(";")) {
    const index = item.indexOf("=");
    if (index >= 0 && item.slice(0,index).trim() === name) return item.slice(index+1).trim();
  }
  return "";
}
async function isAdmin(request, env) {
  if (typeof env.INEX_ADMIN_EMAIL !== "string" || typeof env.INEX_ADMIN_SESSION_SECRET !== "string") return false;
  const token = cookieValue(request, COOKIE_NAME);
  return token ? verifyAdminSession(token, env.INEX_ADMIN_EMAIL.trim(), env.INEX_ADMIN_SESSION_SECRET) : false;
}
function dbReady(env) { return Boolean(env.INEX_CMS_DB && typeof env.INEX_CMS_DB.prepare === "function"); }
async function readJson(request) {
  if (Number(request.headers.get("Content-Length") || 0) > MAX_JSON_BYTES) throw new Error("حجم الطلب أكبر من الحد المسموح.");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_JSON_BYTES) throw new Error("حجم الطلب أكبر من الحد المسموح.");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new Error("صيغة الطلب غير صحيحة."); }
}
function validPage(value) { return typeof value === "string" && PAGE_SLUGS.has(value); }
function textValue(value, name, max, nullable = false) {
  if (value === null && nullable) return null;
  if (typeof value !== "string" || value.length > max) throw new Error("قيمة الحقل غير صحيحة: " + name);
  return value;
}
function validMediaKey(value) { return typeof value === "string" && /^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(value); }
function validImageUrl(value) {
  return typeof value === "string" && !value.startsWith("//") &&
    (value.startsWith("/assets/") || value.startsWith("/api/cms/media/"));
}
function validOrder(value) {
  const order = Number(value);
  if (!Number.isInteger(order) || order < -100000 || order > 1000000) throw new Error("ترتيب العنصر غير صالح.");
  return order;
}
async function listRows(env, page) {
  if (!dbReady(env)) return json({error:"قاعدة محتوى الموقع غير مربوطة بعد."},503);
  const query = page
    ? env.INEX_CMS_DB.prepare("SELECT * FROM cms_content WHERE page_slug = ? ORDER BY sort_order, id").bind(page)
    : env.INEX_CMS_DB.prepare("SELECT * FROM cms_content ORDER BY page_slug, sort_order, id");
  const result = await query.all();
  return json({rows:result.results || []});
}
async function createRow(request, env) {
  if (!dbReady(env)) return json({error:"قاعدة محتوى الموقع غير مربوطة بعد."},503);
  const body = await readJson(request);
  if (!validPage(body.page_slug)) return json({error:"اختر صفحة صحيحة."},400);
  if (!["text","image","card"].includes(body.content_type)) return json({error:"نوع المحتوى غير مدعوم."},400);
  const type = body.content_type;
  const labelEn = textValue(body.label_en || "", "label_en", 500);
  const labelAr = textValue(body.label_ar || "", "label_ar", 500);
  const contentEn = textValue(body.content_en ?? null, "content_en", 20000, true);
  const contentAr = textValue(body.content_ar ?? null, "content_ar", 20000, true);
  const altEn = textValue(body.alt_en ?? null, "alt_en", 500, true);
  const altAr = textValue(body.alt_ar ?? null, "alt_ar", 500, true);
  const section = textValue(body.section_label || "محتوى إضافي", "section_label", 300);
  const imageUrl = body.image_url == null ? null : textValue(body.image_url, "image_url", 2048);
  const storagePath = body.storage_path == null ? null : textValue(body.storage_path, "storage_path", 64);
  if (type === "image" && (!imageUrl || !validImageUrl(imageUrl))) return json({error:"يجب رفع صورة صالحة قبل إضافة عنصر الصورة."},400);
  if (imageUrl && !validImageUrl(imageUrl)) return json({error:"مصدر الصورة غير مسموح به."},400);
  if (storagePath && !validMediaKey(storagePath)) return json({error:"مسار الصورة غير صالح."},400);
  const mode = body.image_mode === "sprite" ? "sprite" : "file";
  const position = body.image_position == null ? null : textValue(body.image_position,"image_position",80);
  const order = validOrder(body.sort_order ?? 9000);
  const key = "custom-" + crypto.randomUUID();
  await env.INEX_CMS_DB.prepare(
    "INSERT INTO cms_content (page_slug,content_key,content_type,section_label,label_en,label_ar,content_en,content_ar,image_url,storage_path,alt_en,alt_ar,sort_order,is_published,is_visible,is_custom,image_mode,image_position) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,1,1,?,?)"
  ).bind(body.page_slug,key,type,section,labelEn,labelAr,contentEn,contentAr,imageUrl,storagePath,altEn,altAr,order,mode,position).run();
  const row = await env.INEX_CMS_DB.prepare("SELECT * FROM cms_content WHERE page_slug = ? AND content_key = ?").bind(body.page_slug,key).first();
  return json({row},201);
}
async function updateRow(request, env, url) {
  if (!dbReady(env)) return json({error:"قاعدة محتوى الموقع غير مربوطة بعد."},503);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) return json({error:"معرّف العنصر غير صالح."},400);
  const current = await env.INEX_CMS_DB.prepare("SELECT * FROM cms_content WHERE id = ?").bind(id).first();
  if (!current) return json({error:"العنصر المطلوب غير موجود."},404);
  const body = await readJson(request);
  const validators = {
    label_en:value=>textValue(value,"label_en",500),
    label_ar:value=>textValue(value,"label_ar",500),
    content_en:value=>textValue(value,"content_en",20000,true),
    content_ar:value=>textValue(value,"content_ar",20000,true),
    alt_en:value=>textValue(value,"alt_en",500,true),
    alt_ar:value=>textValue(value,"alt_ar",500,true),
    image_url:value=>{if(value===null)return null;const v=textValue(value,"image_url",2048);if(!validImageUrl(v))throw new Error("مصدر الصورة غير مسموح به.");return v;},
    storage_path:value=>{if(value===null)return null;const v=textValue(value,"storage_path",64);if(!validMediaKey(v))throw new Error("مسار الصورة غير صالح.");return v;},
    image_mode:value=>{if(value!=="file"&&value!=="sprite")throw new Error("وضع الصورة غير صالح.");return value;},
    image_position:value=>value===null?null:textValue(value,"image_position",80),
    sort_order:validOrder,
    is_visible:value=>{if(typeof value!=="boolean")throw new Error("حالة الظهور غير صالحة.");return value?1:0;},
    is_published:value=>{if(Number(current.is_custom)!==1)throw new Error("لا يمكن تغيير حالة النشر لهذا العنصر الأصلي.");if(typeof value!=="boolean")throw new Error("حالة النشر غير صالحة.");return value?1:0;}
  };
  const assignments=[], values=[];
  for (const [key,validate] of Object.entries(validators)) {
    if (!Object.prototype.hasOwnProperty.call(body,key)) continue;
    assignments.push(key+" = ?");
    values.push(validate(body[key]));
  }
  if (!assignments.length) return json({error:"لا توجد تعديلات للحفظ."},400);
  assignments.push("updated_at = ?");
  values.push(new Date().toISOString(),id);
  await env.INEX_CMS_DB.prepare("UPDATE cms_content SET "+assignments.join(", ")+" WHERE id = ?").bind(...values).run();
  const row = await env.INEX_CMS_DB.prepare("SELECT * FROM cms_content WHERE id = ?").bind(id).first();
  return json({row});
}
async function removeRow(env, url) {
  if (!dbReady(env)) return json({error:"قاعدة محتوى الموقع غير مربوطة بعد."},503);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) return json({error:"معرّف العنصر غير صالح."},400);
  const row = await env.INEX_CMS_DB.prepare("SELECT id,is_custom FROM cms_content WHERE id = ?").bind(id).first();
  if (!row) return json({error:"العنصر المطلوب غير موجود."},404);
  if (Number(row.is_custom) === 1) {
    await env.INEX_CMS_DB.prepare("DELETE FROM cms_content WHERE id = ?").bind(id).run();
    return json({ok:true,deleted:true});
  }
  await env.INEX_CMS_DB.prepare("UPDATE cms_content SET is_visible = 0,updated_at = ? WHERE id = ?").bind(new Date().toISOString(),id).run();
  return json({ok:true,hidden:true});
}
async function uploadMedia(request, env) {
  if (!dbReady(env)) return json({error:"قاعدة محتوى الموقع غير مربوطة بعد."},503);
  if (Number(request.headers.get("Content-Length") || 0) > MAX_CMS_IMAGE_BYTES + 128 * 1024) {
    return json({error:"حجم الصورة بعد الضغط يجب ألا يتجاوز 1.5MB."},413);
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") return json({error:"اختر ملف صورة أولًا."},400);
  const extension = IMAGE_TYPES.get(file.type);
  if (!extension) return json({error:"الصيغة غير مدعومة. استخدم JPEG أو PNG أو WebP أو AVIF."},415);
  if (file.size < 1 || file.size > MAX_CMS_IMAGE_BYTES) {
    return json({error:"حجم الصورة بعد الضغط يجب ألا يتجاوز 1.5MB."},413);
  }
  const imageBytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidImageSignature(file.type, imageBytes)) {
    return json({error:"محتوى الملف لا يطابق صيغة الصورة المعلنة."},415);
  }
  const key = crypto.randomUUID().toLowerCase()+"."+extension;
  await storeCmsMedia(env.INEX_CMS_DB,key,file.type,imageBytes);
  return json({key,url:"/api/cms/media/"+key,size_bytes:imageBytes.byteLength},201);
}
async function deleteMedia(request, env) {
  if (!dbReady(env)) return json({error:"قاعدة محتوى الموقع غير مربوطة بعد."},503);
  const body = await readJson(request);
  if (!validMediaKey(body.key)) return json({error:"مسار الصورة غير صالح."},400);
  await deleteCmsMedia(env.INEX_CMS_DB,body.key);
  return json({ok:true});
}
export async function onRequest(context) {
  const {request,env}=context, url=new URL(request.url);
  if (!(await isAdmin(request,env))) return json({error:"يلزم تسجيل الدخول إلى إدارة الموقع."},401);
  if (!["GET","POST","PATCH","DELETE"].includes(request.method)) return json({error:"طريقة الطلب غير مدعومة."},405);
  if (request.method!=="GET" && !isSameOriginAdminRequest(request,url)) return json({error:"تم رفض الطلب لعدم تطابق المصدر."},403);
  try {
    const route=url.pathname.slice("/admin/api/".length).replace(/\/+$/,"");
    if (route==="session" && request.method==="GET") return json({email:env.INEX_ADMIN_EMAIL.trim(),databaseReady:dbReady(env)});
    if (route==="content" && request.method==="GET") {
      const page=url.searchParams.get("page");
      if (page && !validPage(page)) return json({error:"الصفحة المطلوبة غير صحيحة."},400);
      return listRows(env,page);
    }
    if (route==="content" && request.method==="POST") return createRow(request,env);
    if (route==="content" && request.method==="PATCH") return updateRow(request,env,url);
    if (route==="content" && request.method==="DELETE") return removeRow(env,url);
    if (route==="media" && request.method==="POST") return uploadMedia(request,env);
    if (route==="media" && request.method==="DELETE") return deleteMedia(request,env);
    return json({error:"المسار المطلوب غير موجود."},404);
  } catch (error) {
    console.error("iNex Website CMS admin API failed:",error);
    return json({error:error instanceof Error?error.message:"حدث خطأ داخلي أثناء معالجة الطلب."},400);
  }
}