---
tense: 'living'
describes: '通过GitHub改进文章并发布'
status: 'current'
shaped-by: ['016']
code-sources:
  ['scripts/content-policy.ts', 'playwright.content.config.ts', 'tests/content-publish.spec.ts']
code-revision: 'd30f87c653b315cb59fb4df7b0638f3fd75ba1190743f7c379158c30dc641e13'
---

# 从文章修改到正式发布

## 修改已有文章

1. 在正文上方点击「在GitHub上改进这篇文章」，进入该作品、该语言对应的.md或.mdx文件。GitHub要求登录；无仓库写权限时在自己的fork修改并提出PR。
2. 修改正文并填写清楚的提交说明。普通文章使用.md；需要交互时使用.mdx，保持已有组件导入与`client:visible`。代码示例放代码围栏，实际执行代码需要完整代码审阅。不要同时保留同语言的.md和.mdx。
3. 标题、摘要和发布状态在正文开头，作品来源、标签和展示信息在同目录work.json。新文章需同时提供这些文件，字段见[内容模型](content-model.md)；翻译须核对原文修订，见[内容维护](../features/content-maintenance.md)。图片可放public/media/{id}/，引用/media/{id}/文件名。
4. 提交PR，说明修改的资料来源、关联文章和人工核对结果。Draft仅检查进度；准备好审阅时转为Ready，查看verify和budget两个必要检查。错误详情从Actions的失败步骤进入。
5. 维护者审阅文章事实、引用、许可及交互；自动检查不能证明外部资源内容真实。维护者需要公开预览时，在审阅过的同仓库分支运行`npm run release:preview -- <PR号>`，将返回的真实URL与SHA填在PR描述中。没有生成就写「尚无预览」，不能把CI绿灯当作预览。
6. 维护者合并后main自动检查、构建并发布。Actions的Deploy and verify production成功且线上文章核验通过才算完成；页面未更新时核对/__release.json和对应main运行，先定位失败阶段，不反复提交相同修改。

fork的CI没有发布密钥，不自动部署预览；维护者先审阅，再把确认的贡献移入仓库分支建立预览PR。普通错字修改无需本机运行整站；贡献者可直接用GitHub编辑，维护者与CI负责最终验证。GitHub编辑并非站内投稿后台，站内仍只读。

## 检查如何选择

| 改动                                                                  | 路径                                 |
| --------------------------------------------------------------------- | ------------------------------------ |
| 作品.md、work.json、public/media下的栅格图片                          | 内容候选；继续schema、语法和资源检查 |
| .mdx仅使用批准的默认组件导入、静态HTML和组件client:visible            | 内容通道                             |
| 任意MDX表达式、export、未知导入/属性或事件、spread、原始Markdown HTML | 完整代码通道                         |
| 组件、网站源码、脚本、依赖、工作流或未知文件                          | 完整代码通道                         |

批准组件为MixDemo和既有十个beUI Demo；MixDemo保留zh/en的locale和0至100的initial数字字面值，其余组件只允许client:visible。准确列表在scripts/content-policy.ts。新增组件或扩展属性会改变可执行边界，需要代码验收，不能只改文件名绕过。删除、重命名及混合改动也参与分类；无法证明安全时完整回退。

内容通道执行类型/lint/格式/文档/单元检查、内容schema、Astro编译与整站构建、Pagefind索引、资源预算和发布预检，再用Chromium检查受影响文章的各语言正文、站内静态资源，及既有MDX交互和320px阅读。图片或共享页面变化会扩大页面冒烟范围。它不启动Paseo测试服务、不重复其测试、不跑全站三浏览器回归。普通`npm run verify`仍是完整回归；本地内容验收使用`npm run verify:content`，需要已核验的原生静态产物和Chromium。

CI从main完整验收保存的精确键缓存恢复Paseo静态输出，校验来源、补丁、文件与摘要。缓存缺失回退完整准备和回归；缓存损坏直接失败，不能发布缺少助手的站点。缓存不保证常驻，实际走哪条路见Actions摘要。生产永远消费本次main通过检查的产物，保留同SHA、预算和线上核验门槛。

## 耗时与规模限制

每次以Actions各步骤开始/结束时间分别记录依赖安装、检查、构建、冒烟、部署及线上核验。初次基础设施完整验收和缓存冷启动单独统计，不混入日常文章样本。省去的是无关回归；整站构建和索引仍随文章量增长。当前小目录耗时不能外推到几千篇，容量限制见[检查与发布](checks-and-release.md)。

编译失败修正文语法；缺图片修文件或引用；预算失败压缩资源或减少交互负担；组件/应用失败按完整代码路径处理。必需检查失败不跳过，上传成功但线上核验失败也不算发布成功。恢复及保留证据见[发布规则](checks-and-release.md#阶段预览与恢复)。
