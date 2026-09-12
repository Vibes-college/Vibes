# 按需执行扩展hooks

仅在`.specify/extensions.yml`存在时读取本说明；没有配置时各阶段直接继续。公共规则集中在此，命令正文只标明对应before/after键。

1. 读取配置中本阶段的hooks键。没有条目时静默跳过；enabled=false不执行，未写enabled视为启用。配置无效时明确报告，只暂停依赖该配置才能继续的步骤，不声称hook已成功。
2. 非空condition交由Spec Kit的HookExecutor求值，Agent不猜测表达式、也不手动执行尚未确认条件的hook；缺少执行器时说明限制，若是当前阶段的必要门槛则暂停依赖步骤。
3. 没有condition的hook按声明执行。optional=false表示必需，optional=true表示可选；必需hook不是扩大授权：先核对当前用户范围、权限和项目边界；已授权的常规操作直接执行，真正缺少授权的动作才问。
4. optional hook只在用户明确请求或已授权任务确有需要时执行；不逐个推销、询问无关可选动作。未执行的可选项不阻塞完成。
5. 调用技能时使用当前集成支持的名称（Codex中speckit.xxx对应`$speckit-xxx`）。不能仅输出EXECUTE_COMMAND文本冒充执行。
6. 等待已启动且被当前步骤依赖的hook结束，核对结果；独立工作可继续。失败按项目规则修复本任务引起的问题，必要阻塞仍须报告。不要跨阶段重复执行已完成且结果有效的同一hook。
7. 当前阶段完成后以同样规则处理after键，报告实际结果，不为没有hooks生成空报告。
