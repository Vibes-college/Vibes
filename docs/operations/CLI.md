---
tense: 'living'
describes: '项目命令说明'
status: 'current'
shaped-by: ['001', '002']
---

# 项目命令说明

需要Node22.20或兼容更新版本。首次或依赖变化后运行`npm ci`；首次运行E2E时执行`npx playwright install chromium`，Linux CI使用`--with-deps`。Playwright已在锁文件中，不新增npm依赖。

| 命令                   | 行为与使用场景                                                    |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | Astro开发服务，地址以终端为准，通常为127.0.0.1:4321               |
| `npm run preview`      | 构建后以wrangler.local.jsonc启动本地4322预览，Ctrl+C停止          |
| `npm run docs:check`   | 治理文档标签、目录/索引、关系、冻结保护；篇幅仅提示               |
| `npm run format:check` | 检查格式，不修改文件                                              |
| `npm run check`        | 类型→lint→格式→文档→单元测试；不启动浏览器或清库                  |
| `npm run test:e2e`     | 构建→Playwright启动专用本地Worker→桌面/手机Chromium测试→清理服务  |
| `npm run verify`       | check→db:reset→test:e2e，完整验收，失败停止；不部署               |
| `npm run budget`       | 构建并检查脚本和首页体积；限值见[常量](../technical/CONSTANTS.md) |
| `npm run ci:scope`     | 根据CHECK_BASE_REF或origin/main计算docs/tools/full，不执行检查    |
| `npm run db:reset`     | 删除本项目本机测试D1数据，迁移并填入固定样例                      |
| `npm run db:migrate`   | 只应用本地未执行迁移；不接受线上参数                              |
| `npm run deploy`       | 校验同SHA云端/本地检查后发布固定独立测试Worker，需已有授权        |

按[CI范围规则](CI.md)选择必需检查，不因纯文档变化运行整站浏览器。`verify`始终表示完整验收，不会按路径悄悄缩减。日常工具修改运行check；页面和测试基础设施修改运行verify与budget。

## 浏览器测试

本地与CI使用同一配置和测试文件，无需ego lite。4322必须空闲，测试禁止复用现成服务，避免误测另一个任务。浏览器未安装、端口占用、启动超时和断言失败都返回失败。Playwright负责启动与清理服务，失败追踪保存在被忽略的test-results/；CI失败时保存7天。

手机项目是Chromium设备模拟，包含触摸横滑和320px列表/详情检查，不代表真实iPhone或Safari通过。ego-browser仅在有视觉或体验验收目的时按需使用，不是自动化E2E前提。`npx playwright test --headed`可查看测试过程，运行前先构建。

## 数据库和部署边界

本地配置与数据位置固定为wrangler.local.jsonc和.wrangler/project-local；db:reset仅删除其中v3/d1。数据库仅有命令测试表，网站读取src/content/works/及src/data/taxonomy.json；不配置或操作线上数据库。单独test:e2e不清库。已应用的迁移不改写，用新迁移表达变更。

Worker部署与.openai/hosting.json对应的Sites站点独立。检查通过不代表已发布；不切换旧vibes.college。缺失origin/main时docs:check会失败，可fetch或指定可信DOCS_BASE_REF。

## 检查失败

按具体错误修复，再运行受影响检查。`npm run format`会排版所有受支持文件，局部问题优先只格式化相应文件；无需重跑无关浏览器检查。类型覆盖网站和工具；SQL测试实际执行，单元测试用Node内置测试器。

## 内容维护与规模测量

- `npm run content:validate`检查整个目录并报告各语言发布数量，不写文件。
- `npm run content:revision -- <id>`报告当前原文摘要、语言状态与待复核标记，不批准或发布翻译。
- `npm run build`先校验内容，再Astro构建，最后为dist生成Pagefind语言索引；零发布内容不生成索引并移除旧索引；缺内容或校验失败停止。
- `node --experimental-strip-types scripts/measure-explore.ts`在.scratch生成隔离5000×2样例、构建、验证分页/正文搜索并测冷/热延迟；会使用系统分配的独立空闲端口，结束清理。真实内容和dist不覆盖，不部署样例；报告位于resources/evidence/001-multilingual-explore/。

英文发布前须核对全文再记录sourceRevision；原文修改使旧译文标待复核，更新摘要前必须再次审核。详细字段见[内容维护](../features/content-maintenance.md)。

`npm run release:restore -- <version-id>`恢复本地已记录的测试站版本；记录和门槛见[CI](CI.md)。不能传任意域名、账户或合成内容。
