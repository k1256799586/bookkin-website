# GitHub Pages 托管与发布

核对日期：2026-10-04。

- 官网公开仓库：[k1256799586/bookkin-website](https://github.com/k1256799586/bookkin-website)
- 默认访问地址：**https://k1256799586.github.io/bookkin-website/**
- 自定义域名操作：[Squarespace 接入说明](./domains.md)

上述是本站配置的仓库与目标地址。是否已经成功上线，以仓库 Actions 的实际部署结果和 HTTP 访问验证为准；本文不替代部署结果。

## 发布方式

官网采用 Astro 静态输出，GitHub Actions 构建后由 GitHub Pages 托管。页面不依赖正在运行的 Bookkin 应用服务器。现有应用仓库保持私有，DigitalOcean 部署、登录、分享及邮件验证服务沿用原入口。

在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。发布工作流应执行安装锁定依赖、检查、静态构建、上传 `dist` 和 Pages 部署。默认分支推送触发发布，也可在 Actions 手动触发。

项目使用 GitHub 官方的 `actions/checkout`、`actions/setup-node`、`actions/configure-pages`、`actions/upload-pages-artifact` 和 `actions/deploy-pages`。部署 job 依赖构建 job，使用 `github-pages` environment；权限为 `contents: read`、`pages: write` 和 `id-token: write`。部署输出 `page_url` 用于 Actions 中的访问入口。

具体版本以仓库工作流为准，不将文档样例中的版本号当作最新版。此次版本核对结果为 checkout `v7.0.1`、setup-node `v7`、configure-pages `v6`、upload-pages-artifact `v5`、deploy-pages `v5.0.1`；升级时先检查官方 release 和 runner 要求。参考 [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 和 [发布来源设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 地址与资源路径

`site.config.mjs` 集中保存公开配置。`SITE_URL` 表示完整公开根地址，默认是 `https://k1256799586.github.io/bookkin-website/`，由它推导 origin 与 `/bookkin-website/` base path。所有图片、字体、favicon、站内页面、canonical、分享元数据、sitemap、robots.txt 与二维码应使用同一套地址配置。

自定义域名生效时将 `SITE_URL` 改成例如 `https://download.example.com/`，构建得到 `/` base path 后重新部署。仅修改配置不能替代 GitHub Custom domain 绑定和 DNS 操作。自定义 Actions 发布不依赖仓库 `CNAME` 文件。详见 [GitHub 域名说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) 与 [Astro 的项目路径说明](https://docs.astro.build/en/guides/deploy/github/)。

### 默认项目路径下的 robots.txt 限制

搜索爬虫读取的是域名根目录的 `https://k1256799586.github.io/robots.txt`，不会把 `/bookkin-website/robots.txt` 当作有效的爬取规则文件。2026-10-04 核查时，账户根首页与根 robots.txt 均返回 404，未设置跳转；Google 对 robots.txt 的 404 按没有爬取限制处理。本站生成的项目路径 robots.txt 是为将来切到自定义域名根路径做准备，不能声称它已控制默认项目地址的爬取。参见 [Google robots.txt 位置与有效范围](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec)。

页面已通过 `rel="sitemap"` 暴露完整的 `https://k1256799586.github.io/bookkin-website/sitemap-index.xml`。站点所有者可把该地址直接提交到 Search Console；链接声明不保证被所有搜索引擎自动发现。无需为了当前官网自行建立另一个账户主页仓库。接入自定义域名后，检查新域名的 `/robots.txt` 与其中的 Sitemap 地址，再提交新的 sitemap。

站点源代码只包含可公开的官网内容、品牌素材和经过检查的展示图片。不提交后端、密钥、私有配置、账户信息或用户数据。下载链接与平台状态也是公开配置；未发布的平台用文本状态展示，不填写占位下载 URL。缺少 Contact、Privacy、Terms 时记录为待提供，不编造联系信息、政策或有效链接。

## 免费托管的适用范围

GitHub Free 可为公开仓库提供 Pages。当前限制包括：发布站点不超过 **1 GB**，源仓库建议不超过 **1 GB**，带宽软限制 **100 GB/月**，部署超时 **10 分钟**。通常的每小时 10 次构建软限制不适用于自定义 Actions 发布。实际仍可能遇到服务限流，较大安装包应使用 GitHub Releases 等分发渠道，不打包进官网。

GitHub 同时规定 Pages 不可用作经营线上业务、电商，或主要促成商业交易、提供商业 SaaS 的免费托管服务，也不适合密码或信用卡等敏感交易。本项目只在 Pages 上提供静态产品介绍和下载入口，应用运行、登录与用户数据留在原服务。**这一区分不等于 GitHub 对所有商业产品介绍页的明确豁免或批准。** 若本站将来主要承担付费订阅销售、交易或商业 SaaS 服务，应重新核对规则并选择适合该用途的托管。

规则来源：[GitHub Pages 使用限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)。

## 发布验证与排障

1. 检查工作流成功，Pages deployment URL 正确，默认地址返回成功响应。
2. 在默认项目路径下检查首页、下载锚点、图片、字体、favicon、sitemap、robots.txt、二维码目标与站内页面；浏览器网络面板不应出现资源 404。
3. 在手机和平板及桌面布局检查首屏、下载状态、焦点和键盘导航；启用减少动态效果后再次检查页面。
4. 从手机识别二维码，确认打开已部署官网的 `#download` 区域；只对配置中真实可用的发布入口显示下载链接。
5. 用一个临时的自定义域名 `SITE_URL` 构建检查根路径兼容性，然后恢复实际部署地址；不能把未接入的示例域名部署成正式 canonical。

若 Actions 无法启用或部署权限不足，先检查仓库是否公开、当前账户是否具备管理 Pages 的权限、Source 是否设为 Actions、Actions 是否被仓库/组织策略禁用，以及 `github-pages` environment 是否等待审批。记录具体错误和剩余账户操作，不能用成功构建代替成功上线。

若主页正常而图片或字体 404，优先检查是否漏了 `/bookkin-website/` 前缀；若自定义域名切换后仍请求该前缀，检查 `SITE_URL` 是否已切换并完成新的部署。若域名与证书检查失败，按 [域名接入说明](./domains.md) 排查所选主机名，避免改动现有应用和邮件记录。

## 官方参考

- [actions/checkout releases](https://github.com/actions/checkout/releases)
- [actions/setup-node releases](https://github.com/actions/setup-node/releases)
- [actions/configure-pages releases](https://github.com/actions/configure-pages/releases)
- [actions/upload-pages-artifact releases](https://github.com/actions/upload-pages-artifact/releases)
- [actions/deploy-pages releases](https://github.com/actions/deploy-pages/releases)
- [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
