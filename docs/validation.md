# 验证记录

日期：2026-10-04。范围：独立 Bookkin 官网；现有应用与 DNS 未改动。

## 已完成

| 项目 | 结果与证据 |
| --- | --- |
| 产品真实性 | 对照现有产品实现核对书架、扫描与录入、收藏与集合、读者发现与关注、社区发布/点赞/保存/评论。未宣称未核实的商店发布、私信送达或电子书阅读能力。 |
| 产品画面 | 三张实际 Flutter 界面截图，390 × 900 逻辑像素、2× 导出；使用本地示例内容，非线上账户。已逐张检查可见字段、头像与数量。来源、替换方法及素材性质见 [ASSETS.md](../ASSETS.md)。 |
| 发布文件检查 | 已检查待发布源码、配置、工作流、依赖清单及素材清单；未发现私有应用源码、后端、密钥、账户存储、真实用户数据或内部部署配置。安全关键字命中为文档说明、GitHub 标准权限或测试占位数据。此项为限定范围检查，不作绝对安全保证。 |
| 配置与下载测试 | `npm test`：**9 个测试全部通过**。覆盖项目/域名根路径、无下载时不生成链接、TestFlight 标识、商店优先级、正式 APK 严格布尔确认与非空版本、HTTPS/Contact 校验。测试使用独立示例配置。 |
| Astro 检查 | 本次主任务 `astro check`：**0 errors、0 warnings、0 hints**。 |
| 两种部署路径 | 本次主任务静态构建与产物验证通过：默认 `/bookkin-website/`，以及临时 `https://website.example.com/` 根路径。示例域名仅用于兼容性测试。最终产物已恢复默认 GitHub Pages 地址。 |
| 默认产物复核 | 独立执行 `node scripts/verify-build.mjs` 通过：13 个页面资源、字体、锚点、canonical、分享元数据、sitemap，以及二维码实际解码值。二维码为 `https://k1256799586.github.io/bookkin-website/#download`。 |
| 工作流 | 使用 GitHub 官方 Pages Actions，构建后部署；PR 仅检查。检查域名根路径后重新构建真实项目路径，只上传最终 `dist`。部署 job 具备 Pages/OIDC 权限并依赖构建结果。 |
| 可公开范围与状态 | 两个平台均为不可点击的 Coming soon；未分发 debug APK。未确认的 Contact、Privacy、Terms 留空，不生成无效页脚链接。官网不收集账户资料，不包含登录、支付或应用后端。 |

`robots.txt` 在 GitHub 默认项目子目录下不具有爬取规则效力；根路径限制与 sitemap 提交方法已记录在 [托管说明](./hosting.md)。本次检查未把子目录 robots.txt 的存在当作搜索引擎已采用的证据。

## 线上与浏览器验收

- 2026-10-04，部署提交 `add7900` 的 [GitHub Actions 工作流](https://github.com/k1256799586/bookkin-website/actions/runs/37197550887) **success**。公开官网 [https://k1256799586.github.io/bookkin-website/](https://k1256799586.github.io/bookkin-website/) 返回 **HTTPS 200**。公开源仓库与原私有应用仓库独立。
- 独立 HTTP 验收检查 28 个 URL：首页及全部 23 项引用资源（含 9 个字体）正常；favicon、App icon、分享图、二维码、sitemap 与 robots 内容类型正确，无混合内容或意外跳转。
- 线上二维码像素实际解码为 `https://k1256799586.github.io/bookkin-website/#download`；canonical 与 sitemap 使用相同部署根地址。不存在的子路径返回真正的 HTTP 404、Bookkin 自定义错误页和 `noindex`。
- 浏览器检查 320 px、390 px 手机、768 px 平板和 1440 px 桌面宽度：无横向溢出；手机保留顶部 Download，下载区可见真实平台状态和网页版入口。桌面显示可识别的二维码。
- Features、How it works、Download 与返回顶部锚点可用；下载区定位在固定导航下方。Enter 可打开/关闭原生 FAQ，Tab 可移动到导航，键盘焦点有明确轮廓。图片具备说明性替代文字，装饰图形隐藏于辅助技术。
- 正文颜色计算对比度为 5.00:1，卡片正文 5.41:1，主文字 13.70:1，浅绿区正文 5.19:1。`prefers-reduced-motion: reduce` 的 CSS 关闭平滑滚动、过渡和动画；该规则已代码核对，未修改用户系统偏好做实机切换。
- 线上浏览器控制台未见错误或警告，真实 App 截图已逐一确认加载。桌面与手机的官网效果截图随交付提供，存放于本地 `.local/screenshots/`，不随网站发布。

## 未执行的接入

自定义域名仍待用户确定。TXT 验证、Pages Custom domain 绑定、Squarespace DNS 与新域名 HTTPS 尚未执行。现有应用入口和 DNS 均未改动。完整操作表见 [Squarespace 接入说明](./domains.md)。

## 仍缺少的资料

- 可验证的 App Store / Google Play / TestFlight 入口；如提供 APK，需正式签名发布包、版本及分发地址。
- 确认可公开使用的联系方法、Privacy 与 Terms 页面。
- 最终官网域名或明确可用的子域名；接入步骤见 [域名说明](./domains.md)。

这些缺失项不阻止静态介绍官网发布；在资料确认前保持当前准确状态。
