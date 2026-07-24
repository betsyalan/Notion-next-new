# NOTION_CONFIG 与 blog.config.js 配置对照表（4.10.2）

本文列出 `blog.config.js`（含 `conf/*.config.js`）全部配置键，并标注每个键**能否被 Notion 配置表（NOTION_CONFIG）覆盖**。配置表用法见 [config-site.md](../config-site.md)，配置项功能说明见 [features.md](./features.md)。

## 机制速览

- **优先级**：`Notion 配置表 > 主题 config.js > blog.config.js`（`lib/config.js` `siteConfig()`）。
- **配置表不是固定白名单**：Notion 配置数据库里每行是「配置名 / 配置值 / 启用（值填 `Yes`）」，可以添加**任意键名**的行，键名与下表一致即生效（`lib/db/notion/getNotionConfig.js`）。
- **值类型**：表中的值一律是文本，`siteConfig()` 会自动把 `true/false` 转布尔、纯数字转数值、以 `{`/`[` 开头的字符串按 JSON 解析成对象/数组。复杂结构（数组、对象）请写成单行 JSON 字符串，例如 `[18, 6]`。
- **INLINE_CONFIG**：键名为 `INLINE_CONFIG`、值为 JSON 对象时，整个对象会被展开合并进 NOTION_CONFIG，适合批量配置。
- **生效时机**：页面是 ISR 增量渲染（默认 60 秒，见 `NEXT_REVALIDATE_SECOND`），改配置表后最长一个周期生效；也可 `POST /api/revalidate` 立即刷新（需 `REVALIDATION_TOKEN`）。**无需重启、无需重新构建**。

### 覆盖性图例

| 标记 | 含义 |
| --- | --- |
| ✅ | 经 `siteConfig()` 全局通道读取，Notion 配置表同名键可直接覆盖，前端组件同步生效 |
| ⚠️ | 服务端专用键：不走全局通道，只有服务端数据管线（`getStaticProps`/`SiteDataApi`，通过 `extendConfig` 传入 NOTION_CONFIG）能读到覆盖值，前端组件读不到 |
| ❌ | 不能被 Notion 配置表覆盖：构建期固化（`next.config.js` 消费）或代码直接 `import BLOG` 读取 |

> ✅ 的判断依据是全站约 1500 处 `siteConfig()` 调用；个别键若在代码中直接 `import BLOG` 读取则不受配置表影响，发现遗漏欢迎提 PR 修正本文。

### 特殊键

- `CONTACT_EMAIL`：配置表中的值会被自动加密（base64）后再展示。
- `COMMENT_WALINE_SERVER_URL` / `COMMENT_WALINE_RECENT`：配置表里可写别名 `WALINE_SERVER_URL` / `WALINE_RECENT`（或 `NEXT_PUBLIC_WALINE_*`）。
- `TITLE` / `DESCRIPTION` / `AVATAR` / `HOME_BANNER_IMAGE`：默认取 Notion 主页的标题/描述/图标/封面，无需配置。

### ⚠️ 安全提示

NOTION_CONFIG **全表会随页面 props 下发到浏览器**，任何写进配置表的值（包括 `AI_SUMMARY_KEY` 这类密钥）都能在浏览器里被看到。**密钥类配置只放环境变量，不要写进 Notion 配置表。**

## 不可覆盖的键（❌）

| 键 | 原因 |
| --- | --- |
| `NOTION_PAGE_ID` | 构建期决定 i18n locales 与多语言 rewrites（`next.config.js`），官方明确不支持配置表 |
| `LANG` | 构建期 i18n `defaultLocale` |
| `BUNDLE_ANALYZER` | 构建期打包开关 |
| `REVALIDATION_TOKEN` | API 路由直接读 `BLOG`，且属密钥 |
| `NOTION_INDEX` / `NOTION_PROPERTY_NAME` / `NOTION_ACTIVE_USER` / `NOTION_TOKEN_V2` | `conf/notion.config.js` 文件头注明不支持 NOTION_CONFIG 覆盖 |
| `REDIS_URL` / `ENABLE_CACHE` | 服务端缓存基础设施，直接读 `BLOG` |
| `SUB_PATH` / `isProd` / `VERSION` | 构建期或自动注入 |
| `LAYOUT_MAPPINGS` | 路由→布局映射对象，不适合文本化覆盖 |
| `ALGOLIA_ADMIN_APP_KEY` / `MAILCHIMP_API_KEY` / `MAILCHIMP_LIST_ID` | 服务端密钥，写进配置表会泄露到客户端 |

## 服务端专用键（⚠️）

以下键在 `siteConfig()` 中走 `extendConfig` 通道（`lib/config.js:25-57`），可在 Notion 配置表覆盖，但只对**服务端数据管线**生效（ISR 重新生成时应用），前端组件读到的是构建期值：

`NEXT_REVALIDATE_SECOND`、`POST_RECOMMEND_COUNT`、`IMAGE_COMPRESS_WIDTH`、`PSEUDO_STATIC`、`POSTS_SORT_BY`、`POSTS_PER_PAGE`、`POST_PREVIEW_LINES`、`POST_URL_PREFIX`、`POST_LIST_STYLE`、`POST_LIST_PREVIEW`、`POST_SCHEDULE_PUBLISH`、`IS_TAG_COLOR_DISTINGUISHED`、`TAG_SORT_BY_COUNT`、`THEME`、`LINK`、`AI_SUMMARY_API`、`AI_SUMMARY_KEY`、`AI_SUMMARY_CACHE_TIME`、`AI_SUMMARY_WORD_LIMIT`、`UUID_REDIRECT`

> 注：`THEME` 是特例——前端主题切换本身就会读 `NOTION_CONFIG.THEME`，所以配置表改主题对前后端都有效。

## 全量对照表

默认值一栏对较长的 CDN 地址等做了缩写；环境变量默认为 `NEXT_PUBLIC_<键名>`，例外已在说明中注明。

### blog.config.js 本体

| 键 | 默认值 | 覆盖 | 说明 |
| --- | --- | --- | --- |
| `API_BASE_URL` | `https://www.notion.so/api/v3` | ✅ | Notion API 地址，可配反代；env 为 `API_BASE_URL` |
| `NOTION_PAGE_ID` | `02ab…,en:7c1d…` | ❌ | 页面 ID，支持 `id,en:id` 多语言格式 |
| `THEME` | `next` | ⚠️ | 主题 ID；配置表改主题前后端均有效 |
| `LANG` | `zh-CN` | ❌ | 站点语言 |
| `SINCE` | `2021` | ✅ | 建站年份，留空用当前年 |
| `PSEUDO_STATIC` | `false` | ⚠️ | 文章 URL 以 `.html` 结尾；已生成 URL 在重取数时才变 |
| `NEXT_REVALIDATE_SECOND` | `60` | ⚠️ | ISR 缓存秒数 |
| `REVALIDATION_TOKEN` | `''` | ❌ | 按需刷新 Token；env `REVALIDATION_TOKEN` |
| `APPEARANCE` | `auto` | ✅ | `light` / `dark` / `auto` |
| `APPEARANCE_DARK_TIME` | `[18, 6]` | ✅ | 夜间时段，配置表写 JSON |
| `AUTHOR` | `Alan` | ✅ | 作者昵称，官方建议放配置表 |
| `BIO` | `藏蓝` | ✅ | 作者简介 |
| `LINK` | `http://…` | ⚠️ | 站点地址，影响分享/RSS/Sitemap |
| `KEYWORDS` | `公安联考, …` | ✅ | SEO 关键词；env `NEXT_PUBLIC_KEYWORD` |
| `BLOG_FAVICON` | `/favicon.ico` | ✅ | env `NEXT_PUBLIC_FAVICON` |
| `BEI_AN` | `''` | ✅ | 备案号 |
| `BEI_AN_LINK` | `''` | ✅ | 备案查询链接 |
| `BEI_AN_GONGAN` | `''` | ✅ | 公安备案号 |
| `ENABLE_RSS` | `true` | ✅ | RSS 订阅 |
| `CUSTOM_EXTERNAL_JS` | `['']` | ✅ | 外链脚本数组；无 env |
| `CUSTOM_EXTERNAL_CSS` | `['']` | ✅ | 外链样式数组；无 env |
| `CUSTOM_MENU` | `true` | ✅ | Notion Menu 类型菜单 |
| `CAN_COPY` | `true` | ✅ | 允许复制正文 |
| `LAYOUT_SIDEBAR_REVERSE` | `false` | ✅ | 侧栏左右反转 |
| `GREETING_WORDS` | `警校学习规划,…` | ✅ | 欢迎语（部分主题） |
| `GREETING_WORDS_TYPE_SPEED` | `200` | ✅ | 打字速度 |
| `GREETING_WORDS_BACK_SPEED` | `100` | ✅ | 回退速度 |
| `UUID_REDIRECT` | `false` | ⚠️ | UUID 重定向至 slug；env `UUID_REDIRECT` |

### conf/comment.config.js（评论）

| 键 | 默认值 | 覆盖 | 说明 |
| --- | --- | --- | --- |
| `COMMENT_HIDE_SINGLE_TAB` | `false` | ✅ | 单一评论组件时隐藏 Tab |
| `COMMENT_NOTION_ENABLE` | `false` | ✅ | Notion 数据库做评论存储 |
| `COMMENT_ARTALK_SERVER` | `''` | ✅ | Artalk 后端地址 |
| `COMMENT_ARTALK_JS` / `COMMENT_ARTALK_CSS` | cdnjs artalk 2.5.5 | ✅ | CDN 资源 |
| `COMMENT_TWIKOO_ENV_ID` | `''` | ✅ | env `NEXT_PUBLIC_COMMENT_ENV_ID` |
| `COMMENT_TWIKOO_COUNT_ENABLE` | `false` | ✅ | 列表显示评论数 |
| `COMMENT_TWIKOO_CDN_URL` | twikoo@1.7.9 | ✅ | CDN |
| `COMMENT_UTTERRANCES_REPO` | `''` | ✅ | utterances 仓库 |
| `COMMENT_GISCUS_REPO` / `REPO_ID` / `CATEGORY` / `CATEGORY_ID` | `''` | ✅ | Giscus 基本参数 |
| `COMMENT_GISCUS_MAPPING` | `pathname` | ✅ | 文章标定方式 |
| `COMMENT_GISCUS_STRICT` / `REACTIONS_ENABLED` / `EMIT_METADATA` | `0/1/0` | ✅ | 匹配/表情/Metadata |
| `COMMENT_GISCUS_INPUT_POSITION` | `bottom` | ✅ | 留言框位置 |
| `COMMENT_GISCUS_LANG` / `LOADING` / `CROSSORIGIN` | `zh-CN`/`lazy`/`anonymous` | ✅ | — |
| `COMMENT_CUSDIS_APP_ID` / `HOST` / `SCRIPT_SRC` | `''` 等 | ✅ | Cusdis |
| `COMMENT_GITALK_REPO` / `OWNER` / `ADMIN` / `CLIENT_ID` / `CLIENT_SECRET` | `''` | ✅ | Gitalk；`CLIENT_SECRET` 建议只用 env |
| `COMMENT_GITALK_DISTRACTION_FREE_MODE` | `false` | ✅ | 无 env |
| `COMMENT_GITALK_JS_CDN_URL` / `CSS_CDN_URL` | jsdelivr gitalk@1 | ✅ | CDN |
| `COMMENT_GITTER_ROOM` / `COMMENT_DAO_VOICE_ID` / `COMMENT_TIDIO_ID` | `''` | ✅ | — |
| `COMMENT_VALINE_CDN` | unpkg valine@1.5.1 | ✅ | env `NEXT_PUBLIC_VALINE_CDN` |
| `COMMENT_VALINE_APP_ID` / `APP_KEY` | `''` | ✅ | env `NEXT_PUBLIC_VALINE_ID` / `_KEY` |
| `COMMENT_VALINE_SERVER_URLS` / `PLACEHOLDER` | `''` / `抢个沙发吧~` | ✅ | — |
| `COMMENT_WALINE_SERVER_URL` | `''` | ✅ | 配置表可用别名 `WALINE_SERVER_URL` |
| `COMMENT_WALINE_RECENT` | `false` | ✅ | 配置表可用别名 `WALINE_RECENT` |
| `COMMENT_WEBMENTION_ENABLE` / `AUTH` / `HOSTNAME` / `TWITTER_USERNAME` / `TOKEN` | `false`/`''` | ✅ | Webmention |

### conf/contact.config.js（联系方式）

全部 ✅。默认均为 `''`（留空不显示对应图标）。

`CONTACT_EMAIL`（表中值自动加密）、`CONTACT_WEIBO`、`CONTACT_TWITTER`、`CONTACT_GITHUB`、`CONTACT_TELEGRAM`、`CONTACT_LINKEDIN`、`CONTACT_INSTAGRAM`、`CONTACT_BILIBILI`、`CONTACT_YOUTUBE`、`CONTACT_XIAOHONGSHU`、`CONTACT_ZHISHIXINGQIU`、`CONTACT_WEHCHAT_PUBLIC`

### conf/post.config.js（文章与列表）

| 键 | 默认值 | 覆盖 | 说明 |
| --- | --- | --- | --- |
| `POST_URL_PREFIX` | `article` | ⚠️ | 支持 `%year%/%month%/%day%`，空为 `/slug` |
| `POST_SCHEDULE_PUBLISH` | `true` | ⚠️ | 定时发布 |
| `POST_SHARE_BAR_ENABLE` | `true` | ✅ | 文章底部分享条；env `NEXT_PUBLIC_POST_SHARE_BAR` |
| `POSTS_SHARE_SERVICES` | `link,wechat,qq,…` | ✅ | 分享渠道列表；env `NEXT_PUBLIC_POST_SHARE_SERVICES` |
| `POST_TITLE_ICON` | `true` | ✅ | 标题 icon |
| `POST_DISABLE_GALLERY_CLICK` | `false` | ✅ | 画册禁止点击 |
| `POST_LIST_STYLE` | `page` | ⚠️ | `page` / `scroll` |
| `POST_LIST_PREVIEW` | `false` | ⚠️ | 列表预览；env `NEXT_PUBLIC_POST_PREVIEW` |
| `POST_PREVIEW_LINES` | `12` | ⚠️ | env `NEXT_PUBLIC_POST_POST_PREVIEW_LINES` |
| `POST_RECOMMEND_COUNT` | `6` | ⚠️ | 文末推荐数 |
| `LATEST_POST_COUNT` | `6` | ✅ | 最新文章数 |
| `POSTS_PER_PAGE` | `12` | ⚠️ | env `NEXT_PUBLIC_POST_PER_PAGE` |
| `POSTS_SORT_BY` | `notion` | ⚠️ | `notion` / `date` |
| `ARTICLE_EXPIRATION_DAYS` / `MESSAGE` / `ENABLED` | `90` / 文案 / `false` | ✅ | 过期提醒（部分主题） |
| `POST_WAITING_TIME_FOR_404` | `8` | ✅ | 加载超时跳 404 |
| `TAG_SORT_BY_COUNT` | `true` | ⚠️ | 无 env |
| `IS_TAG_COLOR_DISTINGUISHED` | `true` | ⚠️ | 代码中恒为 true |

### conf/analytics.config.js（统计与 SEO）

全部 ✅：`ANALYTICS_VERCEL`、`ANALYTICS_BUSUANZI_ENABLE`、`ANALYTICS_BAIDU_ID`、`ANALYTICS_CNZZ_ID`、`ANALYTICS_GOOGLE_ID`、`ANALYTICS_51LA_ID`、`ANALYTICS_51LA_CK`、`MATOMO_HOST_URL`、`MATOMO_SITE_ID`、`ANALYTICS_ACKEE_TRACKER`、`ANALYTICS_ACKEE_DATA_SERVER`、`ANALYTICS_ACKEE_DOMAIN_ID`、`SEO_GOOGLE_SITE_VERIFICATION`、`SEO_BAIDU_SITE_VERIFICATION`、`CLARITY_ID`、`UMAMI_HOST`、`UMAMI_ID`

### conf/image.config.js（图片）

| 键 | 默认值 | 覆盖 | 说明 |
| --- | --- | --- | --- |
| `NOTION_HOST` | `https://www.notion.so` | ✅ | 可反代 |
| `IMAGE_COMPRESS_WIDTH` | `1080` | ⚠️ | 压缩宽度 |
| `IMAGE_ZOOM_IN_WIDTH` | `1920` | ✅ | 放大画质宽度 |
| `IMAGE_COMPRESS_QUALITY` | `80` | ✅ | 0-100 |
| `RANDOM_IMAGE_URL` / `RANDOM_IMAGE_REPLACE_TEXT` | `''` / `images.unsplash.com` | ✅ | 随机图 API |
| `IMG_LAZY_LOAD_PLACEHOLDER` | base64 灰图 | ✅ | 懒加载占位 |
| `IMG_URL_TYPE` | `Notion` | ✅ | 已失效，仅 Notion 方案 |
| `IMG_SHADOW` | `false` | ✅ | 图片阴影 |
| `IMG_COMPRESS_WIDTH` | `800` | ✅ | Notion 图压缩宽度 |

### conf/font.config.js（字体）

全部 ✅：`FONT_STYLE`、`FONT_URL`（数组，配置表写 JSON）、`FONT_DISPLAY`（与 performance.config.js 重名，后者覆盖）、`FONT_PRELOAD`、`FONT_SUBSET`、`FONT_SANS`（无 env，JSON 数组）、`FONT_SERIF`（无 env，JSON 数组）、`FONT_AWESOME`（env `NEXT_PUBLIC_FONT_AWESOME_PATH`）

### conf/right-click-menu.js（右键菜单）

全部 ✅：`CUSTOM_RIGHT_CLICK_CONTEXT_MENU`（总开关）、`_THEME_SWITCH`、`_DARK_MODE`、`_SHARE_LINK`、`_RANDOM_POST`、`_CATEGORY`、`_TAG`（注意其 env 名为 `NEXT_PUBLIC_CUSTOM_RIGHT_CLICK_CONTEXT_MENU_THEME_TAG`）

### conf/code.config.js（代码块）

全部 ✅：`PRISM_JS_PATH`、`PRISM_JS_AUTO_LOADER`（均无 env）、`PRISM_THEME_PREFIX_PATH`、`PRISM_THEME_SWITCH`、`PRISM_THEME_LIGHT_PATH`、`PRISM_THEME_DARK_PATH`、`CODE_MAC_BAR`、`CODE_LINE_NUMBERS`、`CODE_COLLAPSE`、`CODE_COLLAPSE_EXPAND_DEFAULT`、`CODE_COLLAPSE_MIN_LINES`、`MERMAID_CDN`

### conf/animation.config.js（动效）

全部 ✅：`FIREWORKS`、`FIREWORKS_COLOR`（无 env，JSON 数组）、`MOUSE_FOLLOW`、`MOUSE_FOLLOW_EFFECT_TYPE`（无 env，1-12）、`MOUSE_FOLLOW_EFFECT_COLOR`（无 env）、`SAKURA`、`NEST`、`FLUTTERINGRIBBON`、`RIBBON`、`STARRY_SKY`、`ANIMATE_CSS_URL`

### conf/widget.config.js（挂件与音乐）

全部 ✅：`THEME_SWITCH`、`WIDGET_PET`、`WIDGET_PET_LINK`、`WIDGET_PET_SWITCH_THEME`、`SPOILER_TEXT_TAG`、`MUSIC_PLAYER`、`MUSIC_PLAYER_VISIBLE`、`MUSIC_PLAYER_AUTO_PLAY`、`MUSIC_PLAYER_LRC_TYPE`、`MUSIC_PLAYER_CDN_URL`、`MUSIC_PLAYER_ORDER`、`MUSIC_PLAYER_AUDIO_LIST`（无 env，JSON 对象数组）、`MUSIC_PLAYER_METING`、`MUSIC_PLAYER_METING_SERVER`、`MUSIC_PLAYER_METING_ID`、`MUSIC_PLAYER_METING_LRC_TYPE`（已废弃）、`FACEBOOK_PAGE_TITLE`、`FACEBOOK_PAGE`、`FACEBOOK_PAGE_ID`、`FACEBOOK_APP_ID`

### conf/ad.config.js（广告）

全部 ✅：`ADSENSE_GOOGLE_ID`、`ADSENSE_GOOGLE_TEST`、`ADSENSE_GOOGLE_SLOT_IN_ARTICLE`、`ADSENSE_GOOGLE_SLOT_FLOW`、`ADSENSE_GOOGLE_SLOT_NATIVE`、`ADSENSE_GOOGLE_SLOT_AUTO`、`AD_WWADS_ID`（env `NEXT_PUBLIC_WWAD_ID`）、`AD_WWADS_BLOCK_DETECT`

### conf/plugin.config.js（第三方插件）

| 键 | 默认值 | 覆盖 | 说明 |
| --- | --- | --- | --- |
| `ALGOLIA_APP_ID` | `null` | ✅ | — |
| `ALGOLIA_ADMIN_APP_KEY` | `null` | ❌ | 服务端密钥；env `ALGOLIA_ADMIN_APP_KEY`（无前缀） |
| `ALGOLIA_SEARCH_ONLY_APP_KEY` | `null` | ✅ | 客户端搜索 KEY |
| `ALGOLIA_INDEX` | `null` | ✅ | 索引名 |
| `MAILCHIMP_LIST_ID` / `MAILCHIMP_API_KEY` | `null` | ❌ | 服务端密钥（无前缀 env） |

### conf/ai.config.js（AI）

| 键 | 默认值 | 覆盖 | 说明 |
| --- | --- | --- | --- |
| `AI_SUMMARY_API` / `AI_SUMMARY_KEY` / `AI_SUMMARY_CACHE_TIME` / `AI_SUMMARY_WORD_LIMIT` | `''` / `''` / `1800` / `1000` | ⚠️ | 服务端专用；**密钥不要写进配置表**（会下发到浏览器） |
| `TianliGPT_CSS` / `TianliGPT_JS` / `TianliGPT_KEY` | tianli CDN / `''` | ✅ | env 为 `NEXT_PUBLIC_TIANLI_GPT_*` |
| `COZE_BOT_ID` / `COZE_SRC_URL` / `COZE_TITLE` | `''` 等 | ✅ | Coze 机器人 |
| `CHATBASE_ID` | `null` | ✅ | — |
| `DIFY_CHATBOT_ENABLED` / `BASE_URL` / `TOKEN` | `false` / `''` / `''` | ✅ | Dify |
| `WEB_WHIZ_ENABLED` / `BASE_URL` / `CHAT_BOT_ID` | `false` 等 | ✅ | Webwhiz |

### conf/performance.config.js（性能）

全部 ✅：`PRELOAD_CRITICAL_RESOURCES`、`LAZY_LOAD_IMAGES`、`LAZY_LOAD_THRESHOLD`、`ENABLE_CODE_SPLITTING`、`CHUNK_SIZE_LIMIT`、`BROWSER_CACHE_TTL`、`CDN_CACHE_TTL`、`ENABLE_GZIP`、`ENABLE_BROTLI`、`FONT_DISPLAY`（与 font.config.js 重名，本文件覆盖之）、`PRELOAD_FONTS`、`DEFER_THIRD_PARTY_SCRIPTS`、`WEBP_SUPPORT`、`AVIF_SUPPORT`、`PREFETCH_LINKS`、`PREFETCH_IMAGES`、`ENABLE_WEB_VITALS`、`PERFORMANCE_BUDGET`（无 env，JSON 对象）

> 注：性能键多由构建期/客户端脚本读取，改配置表后需等 ISR 重新渲染页面才会体现在 HTML 中。

### conf/top-tag.config.js / conf/layout-map.config.js

| 键 | 默认值 | 覆盖 | 说明 |
| --- | --- | --- | --- |
| `TOP_TAG` | `''` | ✅ | 全局置顶标签；env `NEXT_PUBLIC_TOP_TAG` 或 `TOP_TAG` |
| `LAYOUT_MAPPINGS` | 路由→布局对象 | ❌ | 复杂对象映射，不适合配置表 |

### conf/notion.config.js（Notion 数据源）

全部 ❌（文件头注明"不支持 NOTION_CONFIG 覆盖"）：`NOTION_INDEX`、`NOTION_PROPERTY_NAME`（含 22 个字段名映射子键）、`NOTION_ACTIVE_USER`、`NOTION_TOKEN_V2`

### conf/dev.config.js（开发与基础设施）

| 键 | 默认值 | 覆盖 | 说明 |
| --- | --- | --- | --- |
| `SUB_PATH` | `''` | ❌ | 子目录部署，构建期 |
| `DEBUG` | `false` | ✅ | 调试按钮 |
| `BACKGROUND_LIGHT` / `BACKGROUND_DARK` | — | ❌ | 已作废 |
| `REDIS_URL` / `ENABLE_CACHE` | `''` / `true` | ❌ | 缓存基础设施（无前缀 env） |
| `isProd` / `BUNDLE_ANALYZER` / `VERSION` | 自动 | ❌ | 环境判定/构建期/自动注入 |

### conf/techgrow.config.js（公众号导流）

全部 ✅（均支持 `NEXT_PUBLIC_*` 与不带前缀两种 env）：`TECH_GROW_BLOG_ID`、`TECH_GROW_NAME`、`TECH_GROW_QRCODE`、`TECH_GROW_KEYWORD`、`TECH_GROW_BTN_TEXT`、`TECH_GROW_VALIDITY_DURATION`、`TECH_GROW_WHITE_LIST`、`TECH_GROW_YELLOW_LIST`、`TECH_GROW_JS_URL`、`TECH_GROW_CSS_URL`、`TECH_GROW_CAPTCHA_URL`、`TECH_GROW_BASE_URL`

## 补充说明

- `conf/themeColorPalette.js`、`conf/themeSwitch.manifest.js` **不被** `blog.config.js` 聚合，属于主题切换面板数据源；各主题专属的 `XXX_*` 键走 `THEME_CONFIG` 通道，优先级在 Notion 配置表之下。
- 修改 Notion 配置表后**无需重启或重建**，等一个 ISR 周期（默认 60 秒）或调用 `POST /api/revalidate` 即可全站生效。
- 修改 `blog.config.js` / `conf/*.js` 文件则需要**重新构建**（这些文件在构建期被 webpack 打进服务端与客户端 bundle）。
