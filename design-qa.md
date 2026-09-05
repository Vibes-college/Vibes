# Explore 手机优先界面验收

final result: passed

## 对照依据与范围

- 首页参考：`docs/design-assets/mobile-discovery.png`，608×1210；仅比较紧凑分类栏。用户要求保留当前 MVP 卡片，不复制小红书内容和导航。
- 详情参考：`docs/design-assets/mobile-detail.png`，604×1046；比较原站、预览、标题、简介、信息行和向下箭头的顺序与比例。现有内容使用 Transformers.js 作样本，原站素材、作者、正文不同是预期差异。
- 手机截图：`research/qa/explore-detail/home-mobile.png`（390×779）、`detail-mobile.png`（390×676）。参考图等比例缩放至 390px 宽后，同图并排比较：`home-comparison.png`、`detail-comparison.png`。CSS viewport 与截图为 1:1；来源截图只作密度归一化，不声称是同一内容的像素级复刻。
- 正文截图：`research/qa/explore-detail/body-mobile.png`（780×1688，390×844 CSS，2 倍像素密度）。展开第二节，检查段落、子标题、表格和来源排版。保留当前 16px/24px 正文与 14px/24px 表格，与现场读取的 Arena 排版尺度一致。
- 桌面截图：`research/qa/explore-detail/detail-desktop.png`、`home-desktop.png`（1280×900）。桌面使用相同内容顺序与 780px 最大详情宽度。
- 截图证据存于本地 research，按项目现有规则不提交；用户提供的参考图在 docs/design-assets 中保存。

## 发现、修复与复验

1. P2：390px 首页分类撑宽到 411px，导致页面横向溢出。为 fieldset 增加 `min-width: 0`，保持栏内滚动。修复后浏览器读数为 viewport=390、scrollWidth=390，分类栏宽350；最终 home-comparison 已重新对照。
2. P2：复用卡片预览的内部缩放使详情预览多出留白。仅在详情覆盖预览宽高至100%，保留首页卡片原样。最终 detail-comparison 已重新对照，原站与预览连续排列。
3. P2：初稿手机标题、描述和标签行偏松。手机标题调整为18px，描述和标签13px，信息行纵向内边距1px；同尺寸截图复验后比例接近参考，长介绍因实际内容不同自然换行。
4. 字体与颜色：沿用现有无衬线字体，详情使用近白背景、灰色简介、深色主信息；正文保留已有层级。没有引入额外字体依赖。
5. 图像：保留现有 MVP 预览组件，不伪造原站实时截图；图标使用 Heroicons 原始 SVG，许可证位于 public/icons/LICENSE。
6. 文案：标签从作品已有数据产生；没有复制截图中的聊天、互动数、Prompt 或合集作为假功能。

完整手机并排图已可清楚阅读分类、标签行和标题，无需另裁切这些区域。正文另有展开状态截图。没有剩余 P0/P1/P2 问题。

## 操作验收

- `npm run check`：类型、lint、格式、6项单元测试通过。
- `npm run test:e2e`：真实 ego-browser 在本地 Cloudflare 预览执行分类、搜索、空结果、刷新、历史返回、320px宽度、章节展开收起、触摸切换、前后按钮、关闭JavaScript阅读与404，全部通过。
- 手动 ego-browser：390px 和 1280px布局、来源信息行、作者/类型筛选、键盘相邻切换、首条边界、普通纵向阅读、原生章节无JavaScript操作。
- `npm run budget`：JS gzip 1428字节、首页 gzip 11265字节，均低于现有预算。
- 本地观察阶段事件队列未发现异常记录；没有将所有外部网站的可访问性或云端 CI 状态算作已验证。

## 后续限制

本轮不新增实时网站预览、完整 connection、收藏、评论或编辑。相邻作品按全部目录顺序切换，不局限于搜索结果。样本内容与用户截图不同，因此验证的是布局、交互和信息层级，不是素材一致性。
