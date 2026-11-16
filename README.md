# codex-JAILBREAK

> Codex 破甲：淬（Quench）人设经官方 `model_instructions_file` 配置整体替换内建 instructions。零宿主补丁，零依赖 Node 脚本。

Codex（OpenAI 开源 CLI，`codex-rs`）的提示词装配已在源码级摸清并逐条核验（本仓库镜像 `E:/VSCodeSpace/Agent/Codex/codex-src`，main @ commit `ee344ca`，2026-11-15 拉取；安装版 `codex-cli 0.169.0`）。

## ⛔ 通道结论

**replace 通道**：`~/.codex/config.toml` 的 `model_instructions_file` 指向淬人设文件。
官方定义（`config_toml.rs`）：「file containing model instructions that will **override the built-in instructions** for the selected model」，Provenance=`Custom`。生效后：

- 官方 identity 模板（`You are Codex, an agent based on GPT-6…`，来自 models-manager `instructions_template`）**整体退场**——淬人设成为唯一 base instructions，身份是原生声明，不是对抗取胜。
- AGENTS.md 通道（`~/.codex/AGENTS.md`，`CodexHomeUserInstructionsProvider` 读取，`AGENTS.override.md` 优先）仍照常注入 user_instructions——淬覆盖条款已声明 AGENTS.md 中身份描述让位于本文件。未铺 AGENTS.md 时无此叠加。
- 项目级 AGENTS.md（project root → cwd 逐层，`--- project-doc ---` 分隔）照常注入，属机械层。

## 用法

```bash
node bin/codex-JAILBREAK.js status    # 通道/种子/运行时/CLI 状态
node bin/codex-JAILBREAK.js apply     # 种子 → ~/.codex/quench-instructions.md + config 行幂等写入
node bin/codex-JAILBREAK.js verify    # hash 对比 + config 指向校验
node bin/codex-JAILBREAK.js revert    # 移除 config 行（人设文件保留）
```

修改人设：编辑 `persona/quench-instructions.md`（种子）→ `apply` → `verify`。

## 验证边界

- 配置链路可离线验证：`codex exec --skip-git-repo-check "你是谁"`——config 解析成功、会话建立（gpt-6.1-sol）、请求到达 `api.openai.com/v1/responses` 后 401（未登录）即链路正常。
- 行为验证需凭据：`codex login`（ChatGPT OAuth）或 API key 后，同命令应自称淬（Quench）。
- CLI 版本锚点：`codex-cli 0.169.0`（2026-11-15 实测）。升级后跑 `status` 复核通道仍在（`model_instructions_file` 是 schema 化的官方字段，升级不掉）。

## 与其它四端的通道对照

| 客户端 | 通道 | 型态 |
|---|---|---|
| DSH | `system-prompt/assemble` waterfall（插件） | 改写 |
| atomcode | `--system-prompt-file`（CLI 参数） | replace |
| zcode | 用户级 `~/.zcode/AGENTS.md`（官方 OVERRIDE preamble 背书） | 叠加 |
| **codex** | **`config.toml` `model_instructions_file`** | **replace** |
| kiro / breezell | 未侦察 | — |

## 官方注释的如实记录

`config_toml.rs` 对 `model_instructions_file` 的注释是「Users are STRONGLY DISCOURAGED… will likely degrade model performance」——官方劝阻的理由（模型行为偏离官方预期）正是本工具的目的。OpenAI API 无 ZCode 式 identity 服务端锁定证据（3012 类）——开源客户端、配置即官方支持。
