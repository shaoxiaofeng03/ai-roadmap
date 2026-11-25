# 06 · 周日检查点测验（闭卷）

> 闭卷作答写在 `quiz-my-answers.md`（自己建），再对照 `solutions/quiz_answers.md` 自评。
> 周日复盘时 Claude 会抽 3 题追问。**目标：10 题以上有把握。**

## 概念题

1. 默画 function calling 的完整消息流转（两次请求/响应的顺序，标注每个 role 和 tool_call_id 的作用）
2. system / user / assistant / tool 四种 role 各自的职责是什么？谁写入？
3. 为什么说 Chat API 是无状态的？多轮对话的历史存在哪里？这对成本有什么直接影响？
4. 流式输出解决什么问题？TTFT 和总时长各指什么？流式会降低总时长吗？
5. temperature 的作用？什么场景应该设 0？设 0 能保证输出完全确定吗？
6. 工具执行失败时，为什么推荐把错误作为 tool 结果返回给模型，而不是抛异常中断程序？
7. 为什么输出 token 的单价通常比输入贵？（概念级：prefill 与 decode 的区别）
8. 含 tool_calls 的 assistant 消息如果不追加回 history，会发生什么？
9. `tool_calls[i].function.arguments` 是什么类型？使用前必须做什么？为什么不能盲信？
10. finish_reason 有哪几种常见取值？分别该怎么办？被 length 截断时症状是什么？

## 编码题

11. 手写出"查询图书"工具的 tools 声明：工具名 `search_books`；参数 `keyword`（string，必填）、`limit`（integer，可选，只能是 10/20/50）。不查资料。

12. 找 bug——下面代码有 3 个错误，指出并改正：

```python
resp = client.chat.completions.create(model="deepseek-chat",
                                      messages=history, tools=TOOLS)
msg = resp.choices[0].message
if msg.tool_calls:
    history.append({"role": "assistant", "content": msg.content})
    for tc in msg.tool_calls:
        result = execute_tool(tc.function.name, tc.function.arguments)  # execute_tool 期望 (name: str, args: dict)
        history.append({"role": "tool", "content": result})
```

## 加分思考（面试深度，不作硬性要求）

13. 如果工具很多（比如 50 个），当前方案会遇到什么问题？你知道有哪些思路缓解？（W8 答案预告，先自己想）
