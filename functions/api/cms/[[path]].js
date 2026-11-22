const PAGE_SLUGS = new Set(["index","platform","solutions","awareness","company","contact","resources"]);
const MEDIA_KEY = /^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/;
function json(data,status=200) {
  return new Response(JSON.stringify(data),{status,headers:{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"public, max-age=60, stale-while-revalidate=300",
    "X-Content-Type-Options":"nosniff",
    "Cross-Origin-Resource-Policy":"same-origin"
  }});
}
export async function onRequest(context) {
  const {request,env}=context,url=new URL(request.url);
  const route=url.pathname.slice("/api/cms/".length).replace(/\/+$/,"");
  if (request.method!=="GET" && request.method!=="HEAD") return json({error:"طريقة الطلب غير مدعومة."},405);
  try {
    if (route==="content") {
      const page=url.searchParams.get("page");
      if (!PAGE_SLUGS.has(page)) return json({error:"الصفحة المطلوبة غير صحيحة."},400);
      if (!env.INEX_CMS_DB || typeof env.INEX_CMS_DB.prepare!=="function") return json({error:"خدمة محتوى الموقع غير متاحة حاليًا."},503);
      const result=await env.INEX_CMS_DB.prepare(
        "SELECT page_slug,content_key,content_type,section_label,label_en,label_ar,content_en,content_ar,image_url,alt_en,alt_ar,sort_order,is_published,is_visible,is_custom,image_mode,image_position FROM cms_content WHERE page_slug = ? AND is_published = 1 AND is_visible = 1 ORDER BY sort_order,id"
      ).bind(page).all();
      return json({rows:result.results||[]});
    }
    if (route.startsWith("media/")) {
      const key=route.slice("media/".length);
      if (!MEDIA_KEY.test(key)) return json({error:"الصورة المطلوبة غير موجودة."},404);
      if (!env.INEX_CMS_MEDIA || typeof env.INEX_CMS_MEDIA.get!=="function") return json({error:"خدمة الصور غير متاحة حاليًا."},503);
      const object=await env.INEX_CMS_MEDIA.get(key);
      if (!object) return json({error:"الصورة المطلوبة غير موجودة."},404);
      const headers=new Headers({
        "Content-Type":object.httpMetadata?.contentType||"application/octet-stream",
        "Cache-Control":object.httpMetadata?.cacheControl||"public, max-age=31536000, immutable",
        "X-Content-Type-Options":"nosniff",
        "Cross-Origin-Resource-Policy":"same-origin",
        "Content-Security-Policy":"default-src 'none'"
      });
      if (object.httpEtag) headers.set("ETag",object.httpEtag);
      if (request.headers.get("If-None-Match")===object.httpEtag && object.httpEtag) return new Response(null,{status:304,headers});
      return new Response(request.method==="HEAD"?null:object.body,{status:200,headers});
    }
    return json({error:"المسار المطلوب غير موجود."},404);
  } catch (error) {
    console.error("iNex Website CMS public API failed:",error);
    return json({error:"تعذر تحميل محتوى الموقع حاليًا."},500);
  }
}