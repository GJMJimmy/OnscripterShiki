# 存档同步 · Cloudflare Workers 部署指南

把存档同步服务部署到 Cloudflare Workers（免费额度足够个人使用），无需自己维护任何机器。
网页端（OnscripterYuri / Tsukiweb）的「服务器链接」直接填 Worker 地址即可，**游戏页面无需任何改动**。

两个版本任选其一，各自位于独立目录（`worker.js` + `wrangler.toml` 已配置好，进入目录即可部署）：

| 目录 | 存储 | 强一致 | 单份上限 | 免费额度 | 是否需绑卡 |
|---|---|---|---|---|---|
| **`sync-worker-r2/`**（推荐） | R2 对象存储 | 是（传完即可取） | 64MB | 10GB 存储 + 每月百万级操作 | 需要绑卡（免费额度内不扣费） |
| **`sync-worker-kv/`** | Workers KV | 否（传播最长 60 秒） | 24MB | 每天 1000 次写 | 不需要 |

> 存档都很小（KB～MB 级），两版的额度对个人使用都绰绰有余。能绑卡就选 R2。

## 准备

1. 注册/登录 [Cloudflare](https://dash.cloudflare.com/) 账号；
2. 安装 Node.js（≥18）后执行：

```bash
npm install -g wrangler
wrangler login        # 会打开浏览器授权
```

## 部署 R2 版（sync-worker-r2/）

```bash
cd src/onsshiki_web/sync-worker-r2
wrangler r2 bucket create onsyuri-sync        # 创建桶
# 如需修改桶名，编辑 wrangler.toml 的 bucket_name
wrangler deploy
```

## 部署 KV 版（sync-worker-kv/）

```bash
cd src/onsshiki_web/sync-worker-kv
wrangler kv namespace create onsyuri-sync     # 创建命名空间，复制输出的 id
# 把 id 粘贴进 wrangler.toml 的 kv_namespaces.id
wrangler deploy
```

部署成功后会输出形如 `https://onsyuri-sync-xxx.workers.dev` 的地址。

## 验证

浏览器打开 `https://xxx.workers.dev/`，看到
`onsyuri save-sync worker (r2/kv) running` 即部署成功。

命令行验证上传/下载回环：

```bash
curl -X POST --data-binary "hello" "https://xxx.workers.dev/save/test1"
curl "https://xxx.workers.dev/save/test1"        # 应输出 hello
curl -s -o /dev/null -w "%{http_code}\n" "https://xxx.workers.dev/save/nothing"   # 404
```

然后在游戏里：悬浮菜单 → 云同步（或标题页云按钮），服务器链接填
`https://xxx.workers.dev`，存档码随意（不同游戏用不同存档码即可互不干扰）。

## 可选：防滥用密钥

Worker 是公开端点，任何知道地址的人都能读写。若介意，在对应目录的 `wrangler.toml` 里取消注释：

```toml
[vars]
SYNC_TOKEN = "起一个够长的密钥"
```

重新 `wrangler deploy` 后，服务地址变为 `https://xxx.workers.dev/<密钥>`，
网页端「服务器链接」原样填带密钥的完整地址即可（UI 不需要任何改动）。

## 可选：自定义域名

`*.workers.dev` 在中国大陆经常无法直连。如果你有自己的域名并已接入 Cloudflare：
Workers 面板 → 你的 Worker → Settings → Domains & Routes → Add Custom Domain，
绑定一个子域（如 `sync.example.com`），国内一般即可直连，网页端填新地址即可。
没有域名时，访问 Worker 需要设备能直连或走代理。
