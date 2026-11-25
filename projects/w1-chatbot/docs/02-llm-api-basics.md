# 02 · LLM API 完全教程

> **D1 晚读 §1–§5 跑通 hello_llm.py；D2 读完全篇。** 这是整个转型的地基：后面 RAG、Agent、评估，全部建立在对这个请求/响应结构的理解上。

---

## 1. 最重要的心智模型：API 是无状态的

Chat Completions API 就是一个**无状态 HTTP POST 接口**（≈ 你写过的 REST 接口）：

- 模型**不记得**上一次请求。所谓"多轮对话"，是**客户端把完整历史 messages 数组每次全部重发**。
- 会话状态存在你的代码里（本周放内存 list，W8 学持久化、摘要压缩、向量化长期记忆）。
- 推论①：对话越长，每次请求的输入 token 越多 → **越贵越慢**。这就是为什么上下文管理是 AI 工程核心问题。
- 推论②：你可以随意编辑、截断、重排 history——模型看到的只是你这次发的数组。

```
第1轮: messages = [system, user1]                     → assistant1
第2轮: messages = [system, user1, assistant1, user2]  → assistant2
第3轮: messages = [system, user1, assistant1, user2, assistant2, user3] → ...
```

## 2. OpenAI 兼容协议：一套 SDK 通吃大部分厂商

OpenAI 的 `/v1/chat/completions` 请求格式成了事实标准。国内厂商大多提供"OpenAI 兼容端点"，只需换三件套：

| 厂商 | base_url | model 示例 | 备注 |
|---|---|---|---|
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` | 本周主力，便宜；`deepseek-reasoner` 是推理模型（贵/慢，本周不用） |
| 阿里百炼 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` / `qwen-turbo` / `qwen-max` | 新用户免费额度 |
| OpenAI | `https://api.openai.com/v1` | 见官网 | 需海外支付方式 |
| Anthropic Claude | 原生协议不同，用官方 `anthropic` SDK | `claude-opus-5-5` / `claude-sonnet-5-5` / `claude-haiku-5-5` | 选学，文档质量高 |

```python
client = OpenAI(api_key="sk-...", base_url="https://api.deepseek.com")
```

**面试考点**：能讲清"兼容协议兼容的是请求/响应格式，不是模型能力"；各家在 function calling、JSON mode、缓存等特性上有差异，换厂商要回归测试。

## 3. messages 与四种 role

```json
[
  {"role": "system",    "content": "你是一个简洁的助手。"},
  {"role": "user",      "content": "南京天气怎么样？"},
  {"role": "assistant", "content": "我来查一下。", "tool_calls": [ ... ]},
  {"role": "tool",      "tool_call_id": "call_abc123", "content": "{\"temp\": 18}"}
]
```

| role | 职责 | 谁写的 |
|---|---|---|
| `system` | 人设、规则、输出格式约束。放最前，整段对话生效 | 开发者 |
| `user` | 用户输入 | 用户 |
| `assistant` | 模型回复（含工具调用意图） | 模型产出，**你负责追加回 history** |
| `tool` | 工具执行结果，`tool_call_id` 必须与 assistant 消息里的调用 id 对应 | 你的代码 |

规则：
- system 一般一条放开头（部分模型支持多条）。
- user / assistant 交替；`tool` 消息必须紧跟在含 `tool_calls` 的 assistant 消息之后。
- content 可以是字符串，也可以是多模态数组（文本+图片，本周不用）。

## 4. 请求参数

```python
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=history,
    temperature=0.7,     # 采样随机性
    max_tokens=1024,     # 输出上限（不含输入）
    stream=False,        # 流式开关
    tools=TOOLS,         # 工具声明（见 04 文档）
)
```

| 参数 | 作用 | 实践建议 |
|---|---|---|
| `temperature` | 0–2，越高越随机/有创意，越低越确定 | 抽取/分类/工具调用设 0–0.3；闲聊 0.7–1.0。**0 不等于完全确定**（浮点/批处理仍有微小抖动） |
| `top_p` | 核采样，另一种随机性控制 | 与 temperature 二选一调，别同时动 |
| `max_tokens` | 输出 token 上限 | 设太小回答被截断（finish_reason=length）；按任务给足 |
| `stream` | 流式返回 | 面向用户的聊天必开（见 03 文档） |
| `tools` / `tool_choice` | 工具声明 / 强制策略 | 见 04 文档 |
| `stop` | 停止序列 | 遇到指定字符串停止生成 |
| `frequency_penalty` / `presence_penalty` | 抑制重复 | 默认 0，长文生成重复时再调 |

## 5. 响应结构（非流式）

```json
{
  "id": "chatcmpl-xxx",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "回答文本", "tool_calls": null},
    "finish_reason": "stop"
  }],
  "usage": {"prompt_tokens": 25, "completion_tokens": 40, "total_tokens": 65}
}
```

取值路径（本周代码天天用）：
```python
msg = resp.choices[0].message
msg.content        # 回答文本（工具调用轮可能为 None！）
msg.tool_calls     # 工具调用列表或 None
resp.choices[0].finish_reason
resp.usage         # token 用量 → 成本统计的数据源
```

**finish_reason 必须检查**：

| 值 | 含义 | 你该做什么 |
|---|---|---|
| `stop` | 正常结束 | 输出回答 |
| `length` | 撞到 max_tokens 被截断 | 加大 max_tokens 或要求精简 |
| `tool_calls` | 模型要调工具 | 进入工具循环（04 文档） |
| `content_filter` | 内容审查拦截 | 提示用户/记录日志 |

## 6. Token 与计费

- **token ≠ 字 ≠ 词**。是模型词表里的片段：英文约 1 词 ≈ 1.3 token；中文约 1 字 ≈ 0.6–1.5 token（各家分词器不同）。
- **输入（prompt）和输出（completion）分开计费，输出通常贵 3–5 倍**。原因（面试概念题）：输入可并行预填充（prefill），输出必须逐 token 串行解码（decode），算力成本结构不同。
- 成本公式：`成本 = 输入token/1M × 输入单价 + 输出token/1M × 输出单价`。
  举例（**单价是假设值，实际以官网定价页为准**）：若输入 ¥2/1M、输出 ¥8/1M，一次 1000 输入 + 500 输出的调用 = ¥0.002 + ¥0.004 = ¥0.006。
- 多轮对话每轮重发全部历史 → 输入 token 随轮数线性增长。**这就是上下文管理的经济学动机。**
- 部分厂商有"缓存命中折扣"（重复前缀便宜），W2 工程化再展开。
- 本周实践：hello_llm.py 已打印 usage；D5 给聊天机器人加累计成本统计。

## 7. 上下文窗口

- 模型单次能处理的 token 总量上限（输入+输出），常见 32K–1M，以官网为准。
- 超限：API 直接报错（400），或早期模型静默截断。
- 应对：截断旧消息 / 摘要压缩 / 只保留相关历史（W8 记忆设计）。
- 相关现象 **lost in the middle**：超长上下文里，模型对中间位置的信息利用率下降——W5 RAG 评估会再遇到它。

## 8. 错误处理（本周先认识，W2 系统做）

| HTTP | 含义 | 处理 |
|---|---|---|
| 401 | key 错/未开通 | 检查 .env、充值状态 |
| 400 | 请求格式错（messages 顺序、参数非法） | 读错误信息，常见于工具消息顺序错 |
| 429 | 限流/余额不足 | 指数退避重试：1s→2s→4s |
| 500/503 | 服务端故障 | 重试 + 超时兜底 |
| 超时 | 网络/生成太久 | 设 timeout，流式可缓解 |

```python
# 最小重试示意（W2 会做成正式组件）
import time
for attempt in range(3):
    try:
        resp = client.chat.completions.create(...)
        break
    except Exception as e:
        if attempt == 2:
            raise
        time.sleep(2 ** attempt)
```

## 9. hello_llm.py 逐行解读

```python
load_dotenv()                     # .env → 环境变量（密钥不进代码、不进 git）
client = OpenAI(api_key=..., base_url=...)   # 构造客户端 ≈ 配置好的 WebClient
resp = client.chat.completions.create(       # POST /chat/completions
    model="deepseek-chat",                   # 选模型
    messages=[system, user],                 # 无状态：本次对话的全部上下文
    temperature=0.7,
)
print(resp.choices[0].message.content)       # 取回答
print(resp.usage)                            # 取 token 用量（成本意识）
```

## 10. 常见误区（面试也会考）

1. ❌ "模型记得我们聊过什么" → 无状态，历史是你重发的。
2. ❌ "temperature=0 输出永远一致" → 近似确定，不保证。
3. ❌ "max_tokens 是输入+输出总限制" → 只管输出；总限制是上下文窗口。
4. ❌ "回答被截断是模型坏了" → 先看 finish_reason 是不是 length。
5. ❌ "换个 base_url 就无缝换模型" → 格式兼容 ≠ 能力/特性兼容，要回归测试。

## 11. 动手

1. 跑通 `hello_llm.py`，观察 usage 数字
2. 把 temperature 改成 0 和 1.5，同一个问题各问 3 次，感受差异
3. 把 max_tokens 改成 10，观察 finish_reason 变化
4. 完成 `05-exercises.md` D2 练习（多轮非流式对话）
