# Squarespace Domains 域名接入

核对日期：2026-10-04。Squarespace 管理域名与 DNS，GitHub Pages 托管本站静态内容。

目前先使用 **https://k1256799586.github.io/bookkin-website/**。本文是未来接入说明，不代表已设置自定义域名，也不授权修改现有 DNS。

## 1. 先选官网地址

| 选择 | 示例 | 适用情况 |
| --- | --- | --- |
| 未使用的子域名，优先推荐 | `download.example.com` | 保留现有根域名、`www` 和应用入口，影响最小 |
| `www` | `www.example.com` | 仅在确认该主机名未用于现有服务后使用 |
| 根域名 | `example.com` | 仅在确认根域名可迁移，且已安排现有应用入口迁移后使用 |

所有 `example.com` 都是需要替换的示例。**不要直接占用或修改现有 `bookkin.net`、`www.bookkin.net`。** 首次接入建议选择一个确认未使用的子域名；本文不替用户保留任何主机名。

变更前导出或截图保存完整 DNS 记录，记录应用、登录、分享、密码重置和邮件验证入口。保留 DigitalOcean 应用路由，以及 MX、SPF、DKIM、DMARC 等邮件记录。只编辑明确分配给官网的主机名，不能为了通过 Pages 检查而删除其他服务记录或批量清空 Squarespace 默认记录。若域名使用外部权威 nameservers，应到实际 DNS 服务商操作，不能贸然切换 nameservers。

## 2. 验证域名所有权

在 GitHub 登录拥有官网仓库的账户 `k1256799586`：**头像 → Settings → Pages → Add a domain**。这是账户设置，不是仓库设置。输入最终选择的域名，复制 GitHub 生成的 TXT 主机名与验证值。

进入 **Squarespace Domains → 选择域名 → DNS → DNS settings → Custom Records → Add record**。

| Host / Name | Type | Value / Data / Text | TTL |
| --- | --- | --- | --- |
| GitHub 显示的完整记录名去掉 Squarespace 当前区域后缀；验证 `example.com` 时通常为 `_github-pages-challenge-k1256799586` | TXT | `<复制 GitHub 为此次验证生成的 token>` | Default：4 hours / `14400` 秒 |

不使用示例 token；验证子域名时也必须复制 GitHub 实际给出的 Host，不能直接套用根域名的例子。Squarespace 会补上域名后缀，保存后检查没有重复后缀。

例如验证 `example.com`，可运行：

```sh
dig TXT _github-pages-challenge-k1256799586.example.com +short
```

返回值与 GitHub 的 token 一致后，回到 GitHub 点击 **Verify**。验证后保留 TXT 记录，以持续保护域名。参见 [GitHub 域名验证](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)。

## 3. 绑定 Pages，再填写解析记录

先进入 [官网仓库 Pages 设置](https://github.com/k1256799586/bookkin-website/settings/pages)，在 **Custom domain** 填入选定的主机名，例如 `download.example.com`，然后保存。这里只填域名，不填 `https://`、路径或 `#download`。完成 GitHub 绑定后再指向 DNS，避免留下无人绑定的 Pages 解析。

### 方案 A：一个独立子域名

选择 `download.example.com` 时，仅添加以下网站记录，不需要改变 `@` 或 `www`：

| Host / Name | Type | Value / Data | TTL |
| --- | --- | --- | --- |
| `download` | CNAME | `k1256799586.github.io` | Default：4 hours / `14400` 秒 |

如果选择一个确认可用的 `www.example.com`，将 Host 改成 `www`。CNAME 目标始终是 **`k1256799586.github.io`**，没有协议、仓库名、斜杠或端口；不能填 `k1256799586.github.io/bookkin-website/`，也不要把子域名指向当前应用根域名。

### 方案 B：根域名

仅在该根域名被明确分配给官网后使用。每行单独建立一条记录；A 提供 IPv4，AAAA 提供 IPv6，建议同时配置。

| Host / Name | Type | Value / Data | TTL |
| --- | --- | --- | --- |
| `@` | A | `185.199.108.153` | Default：4 hours / `14400` 秒 |
| `@` | A | `185.199.109.153` | Default：4 hours / `14400` 秒 |
| `@` | A | `185.199.110.153` | Default：4 hours / `14400` 秒 |
| `@` | A | `185.199.111.153` | Default：4 hours / `14400` 秒 |
| `@` | AAAA | `2606:50c0:8000::153` | Default：4 hours / `14400` 秒 |
| `@` | AAAA | `2606:50c0:8001::153` | Default：4 hours / `14400` 秒 |
| `@` | AAAA | `2606:50c0:8002::153` | Default：4 hours / `14400` 秒 |
| `@` | AAAA | `2606:50c0:8003::153` | Default：4 hours / `14400` 秒 |

若根域名与 `www` 都可交给官网，再添加 `www` 的 CNAME 到 `k1256799586.github.io`。Pages 可按 Custom domain 中选择的主地址执行根域名与 `www` 的跳转。**已有应用占用其中任何一个地址时，不执行这一步。** 不添加 `*` 通配符记录。

以上值来自 [GitHub 自定义域名 DNS 表](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#dns-records-for-your-custom-domain)。Squarespace 的输入方式见 [指向其他托管服务](https://support.squarespace.com/hc/en-us/articles/215744668-Pointing-a-Squarespace-domain)，TTL 见 [DNS 记录编辑说明](https://support.squarespace.com/hc/en-us/articles/360002101888-Adding-DNS-records-to-your-domain)。

### DNS CNAME 与仓库 CNAME 文件的区别

上面的 **CNAME 是 Squarespace DNS 记录**。仓库里的 `CNAME` 则是一个普通文本文件。本项目采用 GitHub Actions 发布，GitHub 不要求该文件，并会忽略已有的文件。不要用创建 `public/CNAME` 文件代替 GitHub Custom domain 设置与 DNS 配置。以 [GitHub 当前说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) 为准。

## 4. 更新站点地址并重新部署

根目录 `site.config.mjs` 的 `SITE_URL` 是官网完整公开根地址，必须包含结尾 `/`。项目会据此推导 origin 和 base path，并用于页面地址、canonical、sitemap、robots.txt、分享地址及下载二维码。

| 环境 | `SITE_URL` | 派生 base path | 下载二维码目标 |
| --- | --- | --- | --- |
| GitHub 默认地址 | `https://k1256799586.github.io/bookkin-website/` | `/bookkin-website/` | `https://k1256799586.github.io/bookkin-website/#download` |
| 自定义子域名示例 | `https://download.example.com/` | `/` | `https://download.example.com/#download` |
| 自定义根域名示例 | `https://example.com/` | `/` | `https://example.com/#download` |

保存最终 `SITE_URL` 后提交并部署。无需逐页硬编码路径，不要继续保留 `/bookkin-website/` 作为自定义域名的 base。不要修改 `WEB_APP_URL` 或应用自身的回调配置来配合官网域名；那些入口仍属于现有应用。

## 5. DNS、HTTPS 与最终检查

按所选方案检查；将示例地址替换为实际地址：

```sh
dig CNAME download.example.com +short
dig A example.com +short
dig AAAA example.com +short
curl -I https://download.example.com/
```

Squarespace 提示解析更新可能需要 24–48 小时。GitHub Pages 设置中的 DNS 检查通过、证书签发完成后，开启 **Enforce HTTPS**；该选项可能需约 24 小时才能出现。所选主机名上冲突的 A、AAAA、ALIAS、ANAME 或 CNAME 会影响证书签发，先查清用途再处理。参见 [GitHub HTTPS 说明](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)。

用无痕窗口及手机验证：首页和下载区域、图片字体与站内链接、二维码识别、canonical、sitemap/robots、HTTPS 和预期跳转。再次确认原应用的登录、分享、密码重置、邮件验证与收发邮件正常。对照变更前 DNS 快照，确认未改动任何应用或邮件记录。

如需回退，恢复**此次官网变更涉及的记录**及原 `SITE_URL` 并重新部署；不批量恢复或覆盖其他人的后续 DNS 变更。如果撤下自定义域名网站，要移除闲置的 Pages 指向，保留所有权验证记录，防止域名接管。

## 仍需提供

- 最终官网域名或明确可使用的子域名，以及相应 Squarespace/GitHub 设置权限。
- GitHub 现场生成的域名验证 TXT token。
- 正式 App 发布链接，以及已有且可公开的 Contact、Privacy、Terms 地址；缺少这些内容时不虚构链接或政策正文。
