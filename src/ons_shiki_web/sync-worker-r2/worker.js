/*
 * OnscripterShiki 存档同步 —— Cloudflare Workers + R2 版
 *
 * 接口与 ons_shiki_sync_server.py 完全一致，网页端无需任何改动：
 *   GET  /                   状态文本（浏览器打开确认可达）
 *   POST /save/{存档码}       上传存档（body 为 zip/json 字节，同名覆盖）
 *   GET  /save/{存档码}       下载存档，不存在返回 404
 *
 * 部署步骤见 ../ons_shiki_sync_worker_README.md。简述：
 *   1. wrangler r2 bucket create ons-shiki-sync
 *   2. 确认本目录 wrangler.toml 中的桶名
 *   3. wrangler deploy
 *
 * 可选防滥用：在 wrangler.toml 中加
 *   [vars]
 *   SYNC_TOKEN = "你的密钥"
 * 之后服务地址需写成 https://xxx.workers.dev/<密钥>，
 * 网页端「服务器链接」原样填该地址即可，UI 不需要任何改动。
 */

const MAX_BODY = 64 * 1024 * 1024; // 64MB，与 python 版一致

function cors(extra = {}) {
  return {"Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*", ...extra};
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS")
      return new Response(null, {status: 204, headers: cors()});
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/")
      return new Response("onsyuri save-sync worker (r2) running\n", {headers: cors()});

    // SYNC_TOKEN 模式下，路径需要以 /{token} 开头
    let path = url.pathname;
    if (env.SYNC_TOKEN) {
      const prefix = "/" + env.SYNC_TOKEN;
      if (!path.startsWith(prefix + "/") && path !== prefix)
        return new Response("not found\n", {status: 404, headers: cors()});
      path = path.slice(prefix.length) || "/";
    }
    if (!path.startsWith("/save/"))
      return new Response("not found\n", {status: 404, headers: cors()});

    let slot = "";
    try {
      slot = decodeURIComponent(path.slice("/save/".length)).replace(/^\/+|\/+$/g, "");
    } catch (e) { slot = ""; } // 非法百分号编码
    // 与 python 版 \w 一致：字母数字下划线（含中文）和连字符
    if (!/^[\p{L}\p{N}_\-]{1,64}$/u.test(slot))
      return new Response("bad slot name\n", {status: 400, headers: cors()});

    if (request.method === "POST") {
      // 按实际字节数校验，兼容 chunked 等不带 Content-Length 的客户端
      const data = await request.arrayBuffer();
      if (data.byteLength <= 0 || data.byteLength > MAX_BODY)
        return new Response("body too large or empty\n", {status: 413, headers: cors()});
      await env.BUCKET.put(slot, data);
      return new Response("ok\n", {headers: cors()});
    }
    if (request.method === "GET") {
      const obj = await env.BUCKET.get(slot);
      if (obj === null)
        return new Response("no save for this slot\n", {status: 404, headers: cors()});
      return new Response(obj.body,
        {headers: cors({"Content-Type": "application/octet-stream"})});
    }
    return new Response("method not allowed\n", {status: 405, headers: cors()});
  }
}
