# 05 · 每日练习（D2–D6）

> 每个练习都有**验收标准**——达到才继续，达不到是正常学习过程，问我。
> 参考答案在 `solutions/`，规则：**先自己写，卡 30 分钟以上才看**。看完合上重写一遍，才算会。

---

## D2（周三 2h）Python + 多轮对话

**Ex2.1 多轮非流式对话**（基于 hello_llm.py 改造）
- while + input 循环，维护 history 列表，user/assistant 交替追加
- 输入 exit/quit 退出
- 验收：先说"我叫张三"，再问"我叫什么"，模型答对
- 提示：01 §11 的迭代器先不管，02 §1 的心智模型是本题关键

**Ex2.2 数据结构练习**（不碰 API，纯 Python）
- 从 history 列表推导式取出所有 user 消息的 content：`[m["content"] for m in history if m["role"]=="user"]`
- 统计所有消息 content 总字符数（sum + 生成器）

**Ex2.3 报错观察**（理解 Python 报错格式）
- 故意访问 `d["不存在的key"]` 触发 KeyError；`json.loads("不是json")` 触发 JSONDecodeError
- 各用一句话描述报错最后一行告诉了你什么

## D3（周四 2h）流式

**Ex3.1 完成 `stream_chat.py` TODO 1–3**
- 教材：03 §3
- 验收：回答逐字出现；追问时记得上文

**Ex3.2 TTFT 实验**
- 按 03 §4 加计时，同一个问题分别跑流式/非流式，记录 TTFT 和总时长
- 把数字写在 README 的实验记录小节里（这就是你未来的"实测"素材）

**Ex3.3 失忆实验**
- 故意注释掉"assistant 回答追加回 history"那行，跑两轮对话，观察现象并解释为什么

## D4（周五 2h）Function Calling

**Ex4.1 完成 `tool_chat.py` TODO 1–2**
- 教材：04 §5 伪代码（自己实现，别抄 solutions）
- 验收：问"南京今天天气怎么样"→ 终端能看到工具被调用 → 回答包含 mock 的 18℃/晴

**Ex4.2 description 对照实验**（面试素材 ⭐）
- 把 get_weather 的 description 改成含糊的 `"weather tool"`
- 用 5 个问法（"明天下雨吗""要带伞吗""南京多少度"…）测调用成功率，改回精确描述再测一轮
- 记录两组数字，写一句结论

**Ex4.3 幻觉观察**
- 问"不存在城天气如何"，观察 mock（任何城市都返回晴）下模型行为
- 思考：真实项目应该怎么设计返回值让这个场景得到合理处理？（把你的想法记下来，W6 要用）

## D5（周六 6h）健壮性 + 完整功能

**Ex5.1 加 calculator 工具**
- 04 §7 原则自行设计 schema；执行侧参考 solutions 的白名单正则
- 验收：问"(3+5)*2 等于几"触发工具

**Ex5.2 并行/多工具**
- 问"南京天气怎么样？顺便算下 23*17"，观察一次返回多个 tool_calls（或分两轮）
- 确认你的循环两种都处理正确

**Ex5.3 错误路径**
- 在 execute_tool 里临时加个 bug（比如给不存在的工具名），验证错误 JSON 返回后模型是否自行纠正
- 验证 MAX_STEPS 防护：想个会让模型反复调用的问法（如"一直查天气直到下雪"），确认 5 轮后体面退出

**Ex5.4 成本统计**
- 累计每次请求 usage 的 prompt/completion tokens，每轮对话后打印
- 观察：第 N 轮的 prompt tokens 是怎么增长的？印证 02 §6 的"历史重发"成本

**Ex5.5 代码整理 + README**
- 把工具定义、client 初始化拆模块（tools.py / main.py）
- 项目 README.md 加一节：功能、运行方式、实验数据

**Ex5.6（加分）流式 + 工具合并**
- 教材：03 §5。按 index 累积碎片，流结束后走工具循环
- 卡 1 小时以上再看 `solutions/stream_tool_chat_solution.py`

## D6（周日 6h）收尾 + 自测

- 补完未达标的项
- 闭卷做 `06-quiz.md`（全部写在纸上/markdown 里，不许翻文档）
- 对照 `solutions/quiz_answers.md` 自评，错题标注"为什么错"
- 对 Claude 说「**本周复盘**」——我会抽 3 题追问 + 代码 review + 更新 PROGRESS.md + 给 W2 拆解
- 有余力：W2 预习一句——想一想"temperature 调低就能保证 JSON 输出合法吗？"（W2 主题就是结构化输出的工程方案）
