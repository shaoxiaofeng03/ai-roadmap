# 03 · 流式输出（Streaming / SSE）

> **D3 主教材**，约 40 分钟。你做过 Java 后端，SSE/WebFlux 的概念可以直接迁移——这里补的是 LLM 场景的具体形态。

---

## 1. 为什么要流式：两个延迟指标

LLM 生成是**逐 token 串行**的，一段 500 token 的回答可能要 5–15 秒。

| 指标 | 非流式 | 流式 |
|---|---|---|
| **首 token 延迟（TTFT）** | = 总时长（用户干等 5–15s 看到全部） | ≈ 0.3–1s（立刻开始蹦字） |
| 总时长 | 相同 | 相同（甚至略长，传输开销） |

**流式不减少总计算量，它优化的是感知延迟。** 聊天产品必开；批处理/后台任务反而用非流式（简单、好解析）。

Java 类比：非流式 ≈ 一次性返回完整 JSON 的 REST；流式 ≈ SSE / WebFlux 的 `Flux<String>`。

## 2. SSE 协议底层（面试能讲清）

`stream=True` 时，HTTP 响应头是 `Content-Type: text/event-stream`，body 是一行行事件：

```
data: {"id":"...","choices":[{"delta":{"role":"assistant"},"index":0}]}

data: {"id":"...","choices":[{"delta":{"content":"你"},"index":0}]}

data: {"id":"...","choices":[{"delta":{"content":"好"},"index":0}]}

data: {"id":"...","choices":[{"delta":{},"index":0,"finish_reason":"stop"}]}

data: [DONE]
```

- 每个 `data:` 是一个 JSON chunk；增量在 **`delta`** 字段（非流式是 `message`）。
- 第一个 chunk 通常只有 `delta.role`；之后是 `delta.content` 碎片；最后 `finish_reason` 落地。
- `[DONE]` 是结束哨兵（SDK 已帮你处理，不用自己解析）。
- 与 WebSocket 的区别：SSE 是单向 HTTP 推流，简单、走标准网关；LLM 场景够用。

## 3. SDK 用法：返回迭代器

```python
stream = client.chat.completions.create(
    model="deepseek-chat",
    messages=history,
    stream=True,               # ← 唯一开关
)

answer_parts = []
for chunk in stream:           # 迭代器：模型每生成一段就产出一个 chunk（见 01 文档 §11 生成器）
    if not chunk.choices:      # 防御：usage-only chunk 等可能没有 choices
        continue
    delta = chunk.choices[0].delta
    if delta and delta.content:            # content 碎片可能为 None，必须判空
        print(delta.content, end="", flush=True)   # end="" 不换行；flush=True 立即刷到终端
        answer_parts.append(delta.content)

answer = "".join(answer_parts)             # 累积完整回答（追加 history 要用完整版！）
history.append({"role": "assistant", "content": answer})
```

三个新手必踩的坑：
1. **只 print 不累积** → history 里丢了 assistant 回答，下一轮模型"失忆"。
2. **不判 `delta.content` 空值** → 首尾 chunk 的 content 是 None，`print(None)` 或拼接报错。
3. **不 flush** → 输出攒在缓冲区，看起来还是一次性蹦出来。

## 4. 测量首 token 延迟（D3 实验）

```python
import time
start = time.perf_counter()
first_at = None
for chunk in stream:
    ...
    if delta and delta.content:
        if first_at is None:
            first_at = time.perf_counter()
        ...
print(f"\n[TTFT {first_at - start:.2f}s | 总时长 {time.perf_counter() - start:.2f}s]")
```

同一个问题分别用流式/非流式跑，记录两个数字——这就是你面试时"我实测过"的素材。

## 5. 流式 + 工具调用（周六加分项的原理）

开 tools 后，流式 chunk 里会出现 `delta.tool_calls` **碎片**：

```json
{"delta": {"tool_calls": [{"index": 0, "id": "call_abc", "function": {"name": "get_weather", "arguments": ""}}]}}
{"delta": {"tool_calls": [{"index": 0, "function": {"arguments": "{\"ci"}}]}}
{"delta": {"tool_calls": [{"index": 0, "function": {"arguments": "ty\": \"南京\"}"}}]}}
```

- `id` 和 `name` 只在第一个碎片出现；`arguments` 是**逐段拼接的 JSON 字符串**。
- 多个并行工具调用靠 **`index`** 区分槽位。
- 处理模式：按 index 累积 → 流结束后得到完整 tool_calls → 走 04 文档的工具循环。
- 参考实现见 `solutions/stream_tool_chat_solution.py`（**先自己试，卡住再看**）。

## 6. 工程视角（Java 优势区，面试加分）

- **客户端断连**：用户关页面，服务端应取消上游 LLM 请求，别白烧钱（FastAPI 里检测 disconnect，W4 实践）。
- **背压与超时**：SSE 长连接要设 idle timeout；网关（Nginx）需关 proxy_buffering，否则流被攒成一次性输出——你部署时大概率会遇到。
- **错误发生在流中间**：HTTP 200 已发出，错误只能以事件形式追加，客户端要处理"半截回答"。
- **可观测**：TTFT、总时长、token 数都要打点（W9 LangFuse 自动做）。

## 7. 动手

1. 完成 `stream_chat.py` TODO 1–3
2. 做 §4 的 TTFT 对比实验，把数字记下来
3. 故意删掉"累积完整回答"那行，观察多轮对话如何失忆（理解为什么必须累积）
4. 学有余力：读 §5，周六挑战流式+工具合并
