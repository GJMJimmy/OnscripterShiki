# Onscripter-Shiki

![GitHub release](https://img.shields.io/github/v/release/GJMJimmy/OnscripterShiki?color=green&label=ons-shiki&logo=4chan&style=flat-square)![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/YuriSizuku/OnscripterYuri/build_web.yml?label=web(wasm)&logo=firefox&style=flat-square)
## 项目简介

[OnscripterShiki](https://github.com/GJMJimmy/OnscripterShiki)是基于[OnscripterYuri](https://github.com/YuriSizuku/OnscripterYuri)二次开发的一个增强型 ONScripter 项目，主要修复web端bug、优化web端体验。

web部署教程可以参考[OnscripterYuri](https://github.com/YuriSizuku/OnscripterYuri)的`README`或这篇博客[如何在网站上游玩ONS版Galgame？](https://blog.gbjimmy.com/posts/ons-web/)

## 在原有基础上的修改

### Bug修复

- 修复虚拟按键`menu`、`skip`不起作用的问题
- 修复 `em_import` 不返回 Promise 导致"恢复存档后一刷新就丢档"的问题

### 新增功能

- **云存档**：把 Emscripten 的存档目录打包成 zip 上传/下载，可以部署到服务器或worker

- **界面美化**：增加可拖动悬浮球，单击打开/关闭菜单；菜单改为深色毛玻璃风格，可以自定义颜色和透明度 

- **离线游玩**：一键把全部游戏资源缓存到浏览器（Service Worker），断网后也能打开页面继续游玩

  

## 云存档使用教程


### 服务器

单存档 64MB 上限

在服务器运行：
```bash
python onsyuri_sync_server.py //默认监听 8765 端口
python onsyuri_sync_server.py --port [数字] //可以指定端口
```

### Worker

## 离线游玩
见[ons_shiki_sync_worker_README.md](https://github.com/GJMJimmy/OnscripterShiki/blob/master/src/ons_shiki_web/ons_shiki_sync_worker_README.md "ons_shiki_sync_worker_README.md")


### 部署好同步服务后
  
1. 打开菜单里的云同步面板，填入服务器地址和自定义的**存档码**

2. **上传 / 恢复**：上传会把当前存档打包发到该存档码下；恢复则按存档码拉取 zip 并自动写回本地 IndexedDB，刷新即生效

> 存档码就是身份凭证，请用不易被猜中的字符串。


游戏菜单（悬浮球）→「离线」→「缓存全部资源」，等待缓存完成后断网也能游玩。注意：

- 仅在 HTTPS 或 localhost 部署下生效
- 「清除离线缓存」可释放空间；游戏更新版本后需要重新缓存一次
