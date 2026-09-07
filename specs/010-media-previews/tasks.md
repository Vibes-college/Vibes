---
tense: 'frozen'
describes: '多媒体封面的三阶段执行清单'
status: 'in-progress'
amended-by: []
---

# 多媒体封面的三阶段执行清单

## 阶段一：结构与素材处理（US1）

独立验收：合法旧/新作品可读取，错误引用/地址/数据被拒绝；本地处理产物可播放且不修改输入。

- [x] T001 建立specs/010-media-previews/spec.md、质量清单与Draft PR #9，检查既有规范和工具。
- [x] T002 [US1] 在tests/unit/media.test.ts编写媒体联合结构、引用、URL、语言与预算边界测试。
- [x] T003 [US1] 在src/lib/media/及src/lib/content/实现素材、展示、语言、事实与校验。
- [x] T004 [US1] 在scripts/media-tools.ts与scripts/prepare-media.ts实现检查/转换/清单输出及测试。
- [x] T005 [US1] 在scripts/optimize-images.ts保留动画语义，更新预算及本地素材校验。

## 阶段二：首页、搜索与详情（US2/US3）

独立验收：六类代表内容能从列表/搜索进入详情并操作，控制不触发导航；旧内容正常。

- [x] T006 [US2] 在src/lib/media/card.ts和render.ts提供最小安全卡片数据与一致渲染，搜索不携带完整媒体。
- [x] T007 [US2] 在src/components/Explore.astro、src/scripts/search.ts接入媒体与独立导航，保留布局及无JS。
- [x] T008 [US2] 在src/scripts/media.ts实现可见调度、用户暂停、单声音与页面/搜索/后台清理。
- [x] T009 [US3] 在src/components/MediaDetail.astro和src/scripts/media-player.ts实现图库放大、完整视频/音频、字幕/章节/文字稿和循环停止。
- [x] T010 [US3] 在src/scripts/media-experience.ts、media-demo.ts、media-chart.ts实现点击启动/退出、真实数据图表与原站后备。
- [x] T011 [US3] 在src/components/WorkDetail.astro、src/styles/media.css及detail-gestures.ts整合，避免手势/链接冲突。
- [x] T012 [US3] 在src/config/media.ts和public/_headers配置明确媒体/嵌入来源，测试拒绝未登记来源。
- [x] T013 [US1] 在src/content/works/与public/media/加入真实YouTube、Spotify、游戏、论文、博客、X与yaoda骨骼动画作品，逐件核对来源/操作并编写正文；原始参数实验转草稿。扩展固定平台登记与测试，不虚构第三方内容或播放成功。

## 阶段三：验证、文档与交付（US4）

独立验收：完整verify/budget通过，实际内置浏览器审阅完成，Safari真机状态单列。

- [x] T014 [US4] 在tests/media.spec.ts验证六类操作、网络边界、失败/无JS、暂停与自动数量、搜索/切语言/详情切页/历史返回和手势。
- [x] T015 [US4] 在tests及scripts预算检查中覆盖素材体积和普通页面零媒体请求，保留既有硬门槛。
- [x] T016 对照最终源码更新docs/features/explore-browse.md、article-read.md、content-maintenance.md、project-commands.md及索引。
- [x] T017 对照最终源码更新docs/system/content-model.md、rules.md、markdown.md、checks-and-release.md及必要配置说明，最后刷新源码摘要。
- [ ] T018 执行npm run verify与npm run budget，保存resources/evidence/010-media-previews证据并修复实际失败。
- [x] T019 用内置浏览器审阅实际桌面/手机尺寸路径并记录表现、真机待测；运行converge，不将未测写成通过。
- [ ] T020 推送有效进度、更新PR #9、创建可体验阶段预览并核对；完成状态仅按实际任务，未授权不合并。

## 依赖与执行

T001→T002–T005→T006–T013→T014–T020。各媒体呈现共享结构与生命周期，按依赖顺序执行；只读技术研究按plan技能独立完成，不让研究代理修改实现。三个阶段同一需求、同一PR，不在完成数据层后停止。

## PR工作台与经验复核

重要变化、证据、阻塞与预览在PR描述/评论；tasks保持实际进度。已有搜索返回/iOS手势经验由T008/T011/T014覆盖，不清空旧有效验收，不虚构新经验。

## Phase 4: Convergence

- [x] T021 在src/scripts/media-chart.ts的数据表展开区恢复来源日期、上下文和有条件的关键结果，保持封面下方只有标题；依据FR008/FR016（partial）。
- [x] T022 在tests/media.spec.ts记录三种浏览器首次/缓存访问的内容出现、首帧与点击开播时间，保存原始结果并区分模拟与真机；依据SC005（missing）。
