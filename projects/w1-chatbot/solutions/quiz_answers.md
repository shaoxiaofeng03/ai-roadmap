# 测验参考答案（闭卷做完再对！）

**1. function calling 消息流转**
第 1 次请求：`[system, user]` + `tools` 声明 → 响应为 assistant 消息（`content` 可为 null，`tool_calls=[{id, function:{name, arguments(字符串)}}]`，`finish_reason=tool_calls`）。
本地执行工具。第 2 次请求：`[system, user, assistant(含tool_calls原样), tool(tool_call_id对应, content=结果)]` → 响应 assistant 最终回答（`finish_reason=stop`）。
要点：assistant 必须原样追加；每个 tool_call 回一条 tool 消息；tool_call_id 一一对应。

**2. 四种 role**
system=开发者写的人设/规则，整段生效；user=用户输入；assistant=模型产出（含工具调用意图），由你的代码追加回 history；tool=你的代码写的工具执行结果，靠 tool_call_id 关联调用。

**3. 无状态**
模型不保存会话，每次请求客户端重发全部 messages。历史存在客户端（本周内存 list）。影响：输入 token 随轮数线性增长 → 越聊越贵越慢，且受上下文窗口限制 → 上下文管理（截断/摘要/RAG）成为核心工程问题。

**4. 流式**
解决感知延迟：TTFT（请求到第一个 token 的时间）从秒级降到亚秒级，体验从"干等"变"蹦字"。总时长不变（甚至略增），因为生成量没变——流式是展示方式，不是加速。

**5. temperature**
控制采样随机性：低→保守稳定，高→多样有创意。抽取/分类/工具参数生成设 0–0.3。0 不保证完全确定（浮点运算顺序、批处理非确定性），只能"近似确定"。

**6. 错误返回而非抛异常**
模型有自愈机会：看到 error JSON 会改参数重试、换工具或向用户澄清。抛异常=剥夺纠错路径、中断任务。边界：重试有限（MAX_STEPS）、敏感操作另加人工确认。

**7. 输出更贵的原因**
输入（prefill）可以并行矩阵运算一次性处理；输出（decode）必须逐 token 串行生成，每步都要读一遍 KV cache，算力利用率和延迟特性不同 → 单 token 成本高，所以厂商输出单价通常是输入的 3–5 倍。

**8. 漏追加 assistant(tool_calls)**
下一轮请求里 tool 消息找不到对应的调用记录 → 400 校验错误（多数厂商），或上下文逻辑断裂。这是新手最常撞的 400。

**9. arguments 是字符串**
JSON 字符串（如 `'{"city":"南京"}'`），必须 `json.loads` 解析，且解析后还要校验字段/类型/取值——模型可能编造参数（幻觉）。不能盲信的原因：它是生成的文本，不是程序构造的对象。

**10. finish_reason**
`stop`=正常完成；`length`=撞 max_tokens 截断（症状：回答半截断、无标点收尾 → 加大上限或分段续写）；`tool_calls`=要调工具进循环；`content_filter`=审查拦截。不检查就会把截断回答当完整回答用。

**11. 编码题参考**

```python
{
    "type": "function",
    "function": {
        "name": "search_books",
        "description": "根据关键词查询图书列表。当用户想找某类/某本图书时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "keyword": {"type": "string", "description": "搜索关键词，例如：三体"},
                "limit": {"type": "integer", "enum": [10, 20, 50],
                          "description": "返回条数，默认 10"},
            },
            "required": ["keyword"],
        },
    },
}
```

**12. 找 bug（3 个）**
1. assistant 消息没带 `tool_calls` 就追加了 → 后续 tool 消息无对应调用，400。修正：把 `tool_calls` 原样构造进该消息。
2. `tc.function.arguments` 是 JSON 字符串，直接传给了期望 dict 的 `execute_tool`。修正：先 `json.loads`（或在 execute_tool 内部解析并防御）。
3. `history.append({"role": "tool", ...})` 缺 `tool_call_id`。修正：`"tool_call_id": tc.id`。

**13. 加分思考（要点）**
50 个工具 → ① 每次请求 tools 声明本身吃掉大量 token（成本↑）；② 模型选择准确率↓（混浊相似工具）。缓解：工具检索（先向量召回 top-k 再声明）、分层/分组（supervisor 路由到子 agent 各持少量工具）、MCP 按需加载、命名与描述去歧义。W7/W8 会实战。
