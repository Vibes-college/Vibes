---
tense: 'frozen'
describes: 'Spec Kit原生项目适配机制依据'
status: 'complete'
amended-by: []
---

# 原生适配机制

## 命令与Skills

Spec Kit 1.0.4的preset manifest支持provides.templates中的command/replaces。PresetManager在Codex集成下将命令注册为Skills，集成upgrade时重新应用启用的preset。preset add --dev接收本地目录并复制到.specify/presets/<id>，登记来源、优先级和命令。该目录作为项目维护源，生成文件不手改。

采用项目命令完整替换，保留现有命令名称和必要职责；hook长说明集中为按需参考。只在AGENTS追加例外仍保留相反正文，直接改生成文件难以重建，故不采用。preset enable/set-priority并非重新生成命令的接口；更新后通过integration upgrade codex重新注册并验证产物。

## workflow

原生overlay支持按step id的replace/remove，不支持新增workflow输入。CommandStep只按CLI退出码判断完成，无法识别模型正常退出前提出的必要问题；独立派发各阶段也会与Skills的自主续行重复。删除两处gate不能解决这些执行边界，因此不提供自动workflow入口，也不修改上游流程。项目在当前对话调用阶段Skills，由同一会话承接授权、必要问题及用户指定的审阅点；CLI只用于生成与结构检查。

## 依据与验证

依据本机Spec Kit 1.0.4 CLI帮助及presets/**init**.py、presets/_commands.py、workflows/overlays/schema.py、workflows/steps/command/**init**.py、workflows/steps/gate/**init**.py源码。使用同版本原生解析和隔离生成验证，不启动模型或执行用户项目代码。OpenAI文章提供优化原则，具体机制以本机工具为准。

Spec Kit 1.0.4的集成manifest持续保留上游摘要，preset产物被普通upgrade报告为已修改，即使刚执行过升级也如此。隔离验证确认：核对差异全部是可重建的项目产物后，upgrade codex --force会先更新集成再应用preset，可重复生成相同内容。安装/启用命令不能替代重建；不以force覆盖未保留的人工修改。
