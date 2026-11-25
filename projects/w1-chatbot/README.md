# W1 学习包 · 环境 + LLM API 入门（11/24–11/30）

> **本周目标**：亲手写出流式聊天机器人 + function calling 工具循环，把「无状态 API + messages 数组」刻进脑子。
> **本文件夹自包含**：路线图、教材、练习、测验、参考答案、代码全在这里，基本不需要再找外部资料（`docs/07` 的链接仅用于查证/延伸）。

## 📁 导览

| 路径 | 是什么 | 什么时候用 |
|---|---|---|
| `README.md`（本文件） | W1 路线图 + 索引 | 今天读一遍，每天照着走 |
| `docs/01-python-for-java.md` | Python 速成（Java 开发者映射） | D2 通读 + 动手 |
| `docs/02-llm-api-basics.md` | LLM API 完全教程（role/参数/token/计费/错误） | D1 读 §1–5，D2 读完 |
| `docs/03-streaming.md` | 流式输出 / SSE | D3 |
| `docs/04-function-calling.md` | 工具调用完全教程 ⭐ 本周核心 | D4 |
| `docs/05-exercises.md` | 每日练习 + 验收标准 | 每天对照 |
| `docs/06-quiz.md` | 周日测验（闭卷） | D6 |
| `docs/07-references.md` | 延伸链接（仅查证用） | 需要时 |
| `hello_llm.py` | 完整示例：第一次 API 调用 | D1 |
| `stream_chat.py` | TODO 骨架：流式聊天（自己填） | D3 |
| `tool_chat.py` | TODO 骨架：工具循环（自己填） | D4 |
| `solutions/` | 参考答案 + 测验答案 | **先自己写**，卡 30 分钟以上才看 |

## ✅ 环境状态

- [x] uv 0.13.8、Python 3.13.7 已就绪（已检查）
- [x] 依赖已同步：`uv sync` 完成（openai 3.58 + python-dotenv）
- [x] **D1 待办**：申请 API key —— DeepSeek（platform.deepseek.com 注册→充 10 元→API keys 建 key）或阿里百炼（免费额度，见 `.env.example` 注释）
- [x] `cp .env.example .env` 填入 key → `uv run hello_llm.py` 有输出 → **把输出贴给 Claude 确认 D1 达标**

## 🗓 周计划（20h：工作日 2h×4 + 周末 6h×2）

| 天 | 教材 | 任务 | 完成标志 |
|---|---|---|---|
| 二 D1 | docs/02 §1–5 | 拿 key，跑通 hello_llm.py，读「无状态」心智模型 | 看到回答 + token 用量 |
| 三 D2 | docs/01 全篇 + docs/02 剩余 | Python 速成 + Ex2.1 多轮非流式对话 + Ex2.2–2.3 | 模型记得"我叫张三" |
| 四 D3 | docs/03 | 填 `stream_chat.py` TODO + TTFT 实验 + 失忆实验 | 逐字蹦 + 记录数字 |
| 五 D4 | docs/04 | 填 `tool_chat.py` TODO + description 对照实验 | 问天气触发工具 |
| 六 D5 | docs/04 §6–7 | calculator / 并行调用 / MAX_STEPS 防护 / 成本统计 / 拆模块整理；加分：`stream+tools` 合并 | 任意问法不崩 |
| 日 D6 | docs/06 | 补进度 → 闭卷测验 → 对 `solutions/quiz_answers.md` 自评 → 说「**本周复盘**」 | ≥10 题有把握，W1 ✅ |

## 🎯 周日晚验收标准（复盘时我逐项查）

1. `stream_chat.py`：流式 + 多轮记忆 + TTFT 打印，跑给我看
2. `tool_chat.py`：工具循环跑通，错误以 JSON 喂回模型，5 轮防护生效
3. 测验 ≥10/13 有把握；**function calling 消息流转能默画**
4. 实验数据落字（description 对照两组数字 / TTFT / token 随轮数增长）——这是你的第一批"实测素材"

## ⚠️ 常见坑

- `.env` 不生效：确认在**项目目录**运行、key 无多余空格引号、没有把文件命名成 `.env.txt`
- 401：key 错/未充值/未开通；429：限流，稍等重试；400：多半是 messages 结构问题（04 §9）
- 百炼用户：`base_url` 和 `model` 要一起换（`.env.example` 有对照）
- `print` 逐字输出要 `end=""` + `flush=True`
- 报错从**最后一行**读起，traceback 里找自己写的那一行

## 🧭 本周在路线图中的位置

W1（阶段一第 1/5 周）→ W2 Prompt 工程与结构化输出 → W3–W5 RAG 全链路 + 评估（P1）。
明天卡住随时问：贴报错/贴代码/「讲一下 X」。周日说「本周复盘」，我出题追问 + review 代码 + 更新 PROGRESS.md。
