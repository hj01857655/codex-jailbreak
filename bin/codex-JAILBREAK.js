// codex-JAILBREAK：Codex 破甲管理脚本（零依赖，Node 18+）。
//
// 通道：~/.codex/config.toml 的 model_instructions_file——官方一等配置
// （codex-rs/core/src/config/mod.rs: model_instructions_file 覆盖内建
// instructions，Provenance=Custom），replace 型通道：淬合并版人设
// 直接成为唯一 base instructions，官方 identity 模板整体退场。
// 备选通道 ~/.codex/AGENTS.md（用户级叠加式，CodexHomeUserInstructionsProvider
// 读取，优先 AGENTS.override.md）——本工具未启用，人设文件里已声明
// AGENTS.md 中与身份相关的描述让位于 replace 文件。
//
// config.toml 里 model_instructions_file 之外的手写行一律保留：
// 本脚本只幂等维护指向人设文件的那一行。
import { spawnSync } from "node:child_process";
import {
  createHash,
} from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")));
const SEED = join(ROOT, "persona", "quench-instructions.md");
const CODEX_HOME = process.env.CODEX_HOME || join(homedir(), ".codex");
const RUNTIME = join(CODEX_HOME, "quench-instructions.md");
const CONFIG = join(CODEX_HOME, "config.toml");
const CONFIG_LINE_KEY = "model_instructions_file";

const CONFIG_LINE = (path) => `model_instructions_file = '${path.replace(/'/g, "''")}'`;

const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);

function readConfig() {
  return existsSync(CONFIG) ? readFileSync(CONFIG, "utf8") : "";
}

/** 幂等写 config 行：保留其它行，仅维护 model_instructions_file 指向。
    TOML 要求顶层键位于 [table] 段之前，新行插入到首个 table 段前。 */
function upsertConfigLine(path) {
  const lines = readConfig().split(/\r?\n/).filter((l) => !l.trimStart().startsWith(CONFIG_LINE_KEY));
  const entry = CONFIG_LINE(path);
  const insertAt = lines.findIndex((l) => l.trimStart().startsWith("["));
  if (insertAt === -1) lines.push(entry);
  else lines.splice(insertAt, 0, entry);
  writeFileSync(CONFIG, lines.join("\n"), "utf8");
}

function dropConfigLine() {
  if (!existsSync(CONFIG)) return false;
  const kept = readConfig()
    .split(/\r?\n/)
    .filter((l) => !l.trimStart().startsWith(CONFIG_LINE_KEY));
  writeFileSync(CONFIG, kept.join("\n"), "utf8");
  return true;
}

function configTarget() {
  const m = readConfig().match(/^\s*model_instructions_file\s*=\s*['"]([^'"]+)['"]/m);
  return m ? m[1] : null;
}

function cliVersion() {
  const r = spawnSync("codex --version", { encoding: "utf8", shell: true });
  return r.status === 0 ? r.stdout.trim() : `不可用（${r.status}）`;
}

function main() {
  const cmd = process.argv[2] || "status";

  if (cmd === "apply") {
    mkdirSync(CODEX_HOME, { recursive: true });
    copyFileSync(SEED, RUNTIME);
    upsertConfigLine(RUNTIME);
    console.log(`apply: 人设 → ${RUNTIME}`);
    console.log(`apply: config 行 → ${CONFIG}`);
    return verify(true);
  }

  if (cmd === "revert") {
    dropConfigLine();
    console.log(`revert: 已移除 ${CONFIG} 中的 ${CONFIG_LINE_KEY} 行（人设文件保留）`);
    return;
  }

  if (cmd === "status") {
    console.log("Codex 破甲状态");
    console.log(`  codex_home  : ${CODEX_HOME}`);
    console.log(`  种子        : ${SEED} ${existsSync(SEED) ? `(${sha256(SEED)})` : "缺失"}`);
    console.log(`  运行时人设  : ${existsSync(RUNTIME) ? `${sha256(RUNTIME)}` : "缺失"}`);
    console.log(`  config 指向 : ${configTarget() || "未设置"}`);
    console.log(`  CLI         : ${cliVersion()}`);
    return;
  }

  if (cmd === "verify") {
    return verify(false);
  }

  console.log("用法: node bin/codex-JAILBREAK.js [status|apply|verify|revert]");
  process.exitCode = 2;
}

function verify(quiet) {
  const problems = [];
  const configTarget_ = configTarget();
  if (configTarget_ !== RUNTIME) problems.push(`config 指向 ${configTarget_ || "缺失"}，期望 ${RUNTIME}`);
  if (!existsSync(RUNTIME)) problems.push("运行时人设缺失");
  else if (sha256(RUNTIME) !== sha256(SEED)) problems.push("运行时人设与种子漂移（先跑 apply）");
  if (problems.length === 0) {
    console.log(`verify: PASS（人设 ${sha256(RUNTIME)}，config 指向正确）`);
  } else {
    console.log(`verify: FAIL\n  - ${problems.join("\n  - ")}`);
    process.exitCode = 1;
  }
}

main();
