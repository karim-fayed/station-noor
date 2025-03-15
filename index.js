addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // توفير ملف HTML عند الوصول إلى root ("/")
  if (pathname === "/") {
    return new Response(await fetchAsset('public/index.html'), {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // توفير ملفات CSS و JavaScript و الصور حسب الحاجة
  if (pathname.endsWith('.css')) {
    return new Response(await fetchAsset(`public${pathname}`), {
      headers: { 'Content-Type': 'text/css' }
    });
  }

  if (pathname.endsWith('.js')) {
    return new Response(await fetchAsset(`public${pathname}`), {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  if (pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.jpeg') || pathname.endsWith('.gif')) {
    return new Response(await fetchAsset(`public${pathname}`), {
      headers: { 'Content-Type': 'image/png' }
    });
  }

  // في حال لم يتم العثور على الملف، إرجاع 404
  return new Response('404 Not Found', { status: 404 });
}

async function fetchAsset(path) {
  // تحميل الملف من المجلد
  const asset = await fetch(`https://noorstations.com${path}`);
  return await asset.text();
}
