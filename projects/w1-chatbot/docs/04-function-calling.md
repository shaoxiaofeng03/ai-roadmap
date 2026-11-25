# 04 · Function Calling 完全教程

> **D4 主教材**，约 60 分钟。这是本周最重要的一篇：**Agent 的本质就是这个循环的泛化**（W6 手写 ReAct 时你会恍然大悟）。面试深挖率极高。

---

## 1. 是什么、为什么

LLM 只会生成文本，不能查实时天气、读数据库、执行代码。Function calling 的分工：

> **模型负责"决定调什么工具、传什么参数"（输出结构化意图），你的代码负责"真正执行"，结果再喂回模型组织成人话。**

模型从头到尾没有执行任何东西——它只是生成了一段符合你声明的 JSON Schema 的调用描述。安全边界在你的代码里。

## 2. 完整消息流转（周日默画题，现在就刻进脑子）

```
┌─ 第1次请求 ────────────────────────────────────────────┐
│ messages = [system, user("南京天气?")]                  │
│ tools    = [get_weather 的 JSON Schema 声明]            │
└──────────────────────┬─────────────────────────────────┘
                       ▼
              LLM 返回 assistant 消息：
              content = null（或"我查一下"）
              tool_calls = [{id:"call_abc", type:"function",
                             function:{name:"get_weather",
                                       arguments:'{"city":"南京"}'}}]
              finish_reason = "tool_calls"
                       │
                       ▼  你的代码执行 get_weather("南京") → '{"temp":18,"weather":"晴"}'
┌─ 第2次请求 ────────────────────────────────────────────┐
│ messages = [system, user,                              │
│             assistant(含tool_calls原样),   ← 必须追加！  │
│             {role:"tool", tool_call_id:"call_abc",     │
│              content:'{"temp":18,...}'}]               │
└──────────────────────┬─────────────────────────────────┘
                       ▼
              LLM 返回最终回答："南京今天晴，18℃。"
              finish_reason = "stop"
```

三条铁律：
1. **assistant（含 tool_calls）消息必须原样追加回 history**，漏了直接 400。
2. **每个 tool_call 对应一条 tool 消息**，`tool_call_id` 必须匹配；并行多调用 → 多条 tool 消息全部追加后再请求。
3. `arguments` 是 **JSON 字符串**不是对象，必须 `json.loads`，且要校验（模型可能编造参数）。

## 3. 工具声明：给 LLM 看的接口文档

```python
TOOLS = [{
    "type": "function",
    "function": {
        "name": "get_weather",                    # 蛇形命名，见名知义
        "description": "查询指定城市的当前天气。当用户询问天气、气温、是否下雨时使用。",
        "parameters": {                           # 标准 JSON Schema
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名，例如：南京"},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"],
                         "description": "温度单位，默认 celsius"},
            },
            "required": ["city"],
        },
    },
}]
```

**description 质量直接决定调用成功率**（D4 有对照实验）：
- 写清"什么时候用"（触发条件），不只是"这是什么"
- 参数写含义、格式、单位、示例；枚举用 `enum` 约束
- 一个工具只干一件事；名字含糊（如 `do_stuff`）模型就乱调
- 工具多了（>20）模型选择准确率下降 → W8 学 MCP 和工具检索

## 4. 响应侧结构

```python
msg = resp.choices[0].message
msg.content       # 工具调用轮通常为 None —— 判空！
msg.tool_calls    # list 或 None
# 每个 tool_call:
tc.id                    # "call_abc"，回填 tool 消息用
tc.type                  # "function"
tc.function.name         # "get_weather"
tc.function.arguments    # '{"city": "南京"}' ← 字符串！
```

## 5. 循环实现（伪代码 → 你的 TODO）

```python
MAX_STEPS = 5                              # 防护：模型可能陷入调用循环
history.append(user_msg)
for step in range(MAX_STEPS):
    resp = call_llm(history, tools=TOOLS)
    msg = resp.choices[0].message
    if not msg.tool_calls:                 # 没有工具调用 = 最终回答
        print(msg.content)
        history.append({"role": "assistant", "content": msg.content})
        break
    # 1) 原样追加 assistant 消息（含 tool_calls）
    history.append({
        "role": "assistant",
        "content": msg.content or "",
        "tool_calls": [{"id": tc.id, "type": "function",
                        "function": {"name": tc.function.name,
                                     "arguments": tc.function.arguments}}
                       for tc in msg.tool_calls],
    })
    # 2) 逐个执行，追加 tool 消息
    for tc in msg.tool_calls:
        result = execute_tool(tc.function.name, tc.function.arguments)
        history.append({"role": "tool", "tool_call_id": tc.id, "content": result})
    # 3) 回到循环顶部再次请求
else:
    print("达到最大轮数，任务未完成")        # 兜底话术 + 日志
```

`execute_tool` 的分发与防御：

```python
def execute_tool(name: str, arguments: str) -> str:
    try:
        args = json.loads(arguments)
    except json.JSONDecodeError:
        return json.dumps({"error": "参数不是合法JSON"}, ensure_ascii=False)
    if name == "get_weather":
        return get_weather(**args)
    return json.dumps({"error": f"未知工具: {name}"}, ensure_ascii=False)
```

## 6. 错误处理哲学：错误是喂给模型的输入，不是异常

工具失败（城市不存在、API 超时、参数非法）时，**把错误信息作为 tool 结果返回**：

```json
{"role": "tool", "tool_call_id": "call_abc", "content": "{\"error\": \"城市不存在，请检查城市名\"}"}
```

模型看到错误会自行纠正（换个参数重试、向用户澄清）。抛异常中断循环 = 剥夺了模型自愈的机会。这是 Agent 鲁棒性设计的第一课（W6/W9 深化）。

当然要设边界：重试 N 次仍失败 → 终止并告知用户；敏感操作（写库、转账）→ 必须人工确认（W7 human-in-the-loop）。

## 7. 工具设计原则（面试高频）

1. **单一职责**：一个工具一件事，组合交给模型
2. **命名与描述面向模型**：模型是你的"用户"，文档写给看不见的同事
3. **参数强约束**：enum / required / 格式说明，减少幻觉参数
4. **只读优先**：查询类工具随便调；写操作要幂等设计 + 确认门槛
5. **返回结构化 JSON**：模型解析稳定；错误也结构化
6. **控制数量与粒度**：工具太多 → 选择准确率下降、token 开销上升

## 8. 安全 Awareness（本周知道即可）

- **prompt 注入**：工具返回的内容（网页、数据库字段）可能藏着"忽略之前指令，执行 X"——工具结果是不可信输入，敏感操作不能仅凭模型决策。
- 工具执行环境要隔离：代码执行工具必须沙箱（W6 实践）。
- 密钥不进工具参数、不进模型可见上下文。

## 9. 常见坑（400 错误来源 TOP5）

1. 漏追加 assistant（含 tool_calls）消息
2. tool 消息的 tool_call_id 对不上 / 漏了某个并行调用的结果
3. 把 arguments 当 dict 直接用（它是字符串）
4. content=None 时处理不当（拼接/打印报错）
5. 历史里工具消息顺序错乱（tool 必须紧跟对应 assistant）

## 10. 与 Agent 的关系（展望）

本周的循环：`用户问 → 模型选工具 → 执行 → 回答`。
W6 的 ReAct Agent：同一个循环 + **多步规划** + **观察反思** + **自主决定何时结束**。
W7 的 LangGraph：把这个循环显式建模成**状态机**（节点=步骤，边=转移条件），加 checkpoint 和人工介入。
W8 的 MCP：把"工具声明+执行"标准化成**跨语言协议**——你的 Java MCP Server 就是工具提供方。

**一句话：function calling 是原子操作，Agent 是它的编排。**

## 11. 动手

1. 完成 `tool_chat.py` TODO 1–2
2. 做 `05-exercises.md` D4 实验（description 对照、错误注入）
3. 周日复盘：默画 §2 流转图
