# Java 后端 → AI 应用 / Agent 开发 转型路线图

> 制定日期：2026-11-24 ｜ 目标：**2027 年 4 月底前拿到 AI 应用开发 / Agent 开发 offer**
> 总时长：20 周（W1–W20）+ 缓冲到 4 月底
> 已确认假设（2026-11-24 用户确认）：
> - 在职学习，每周 **22 小时**（工作日 2h × 5 + 周末 6h × 2）
> - Python 基础薄弱（按"Java 熟练、Python 零基础"设计速成路径）
> - 坐标**南京**，目标国内岗位；双栈定位：**Java 工程能力 + Python AI 生态**
> - 超出 15h 基线的时间盈余用作缓冲与加深（Java 镜像 / 额外练习 / 提前面试准备），不新增主线内容

---

## 0. 这份路线图的设计逻辑（为什么长这样）

1. **保优势转型，不是从零转行。** 你的 Java 后端能力（高并发、分布式、Spring、数据库）不是沉没成本，而是护城河。2026–2027 年企业级 AI 落地最缺的是"能把 AI 做成稳定生产系统的人"，而不是会调 API 的人。路线里刻意保留 Java 线（Spring AI / Spring AI Alibaba / Java MCP Server），毕业项目采用 **Spring Boot 网关 + Python Agent 服务** 的双栈架构——这是面试官眼里"即战力"的形状。
2. **项目驱动，评估为纲。** 不堆课程、不抄 demo。三个递进项目构成作品集，每个项目都带**评估报告**（RAGAS 指标 / Agent 任务成功率 / 消融实验）。会做评估的候选人和只会跑 demo 的候选人，在 2027 年的市场上是两种定价。
3. **不啃数学和深度学习理论。** 应用岗不考反向传播推导。ML 概念只学到"面试能讲清楚"的深度（Transformer 直觉、embedding、微调 vs RAG、推理常识），每周 1 小时副线解决。
4. **求职节奏倒排。** 4 月底拿 offer ← 3 月密集面试（金三）← 2 月底简历和项目包装完成 ← 2 月中毕业项目完工。所有学习里程碑都为这个时间线服务，**3 月初就开始投递，不等"学完"**。
5. **陪学机制内置。** 每周有明确的交付物和检查点，Claude 负责拆任务、讲概念、review 代码、出题测验、模拟面试、更新进度。进度落在 `PROGRESS.md` + 持久记忆，跨会话不丢。

---

## 1. 定位策略：目标岗位与差异化

### 目标岗位（按匹配度排序）
| 岗位名称 | 匹配点 | 备注 |
|---|---|---|
| AI 应用开发工程师 / 大模型应用工程师 | RAG + LLM 工程 + 后端能力 | 主赛道，需求量最大 |
| Agent 开发工程师 | LangGraph + MCP + 工具设计 | 主赛道，溢价高 |
| Java + AI 方向（企业 AI 平台 / AI 中台） | Spring AI Alibaba + 高并发 | 差异化赛道，竞争者少 |
| RAG / 知识库工程师 | P1 + 评估能力 | 垂直赛道 |
| AI Infra / LLM 网关方向 | Java 高并发 + 模型路由 | 备选，偏基础设施 |

### 你的差异化叙事（面试一句话定位）
> "我是有 X 年 Java 后端经验的工程师，转型 AI 应用开发。我能用 Python 生态（LangGraph / RAG / MCP）构建 Agent 应用，也能用 Java（Spring Boot / Spring AI）把它做成高并发、可观测、可评估的生产系统。三个项目都带量化评估数据。"

### 目标公司类型
- 大模型公司的应用层团队（智谱、月之暗面、MiniMax、阶跃、DeepSeek 等）
- 云厂商 AI 平台（阿里云、字节火山、腾讯云、百度智能云）
- AI 应用公司（客服 / 法律 / 医疗 / 编程 / 办公等垂直场景）
- 传统互联网公司的 AI 团队（美团、京东、网易、B 站等）
- 企业软件 / SaaS 公司（Java + AI 契合度最高，竞争相对小）

### 南京本地目标清单（W14 细化，以 Boss直聘 / 脉脉核实当前在招岗位为准）
- **Java+AI 高契合**：润和软件、诚迈科技、中科创达（南京）、焦点科技（中国制造网）、南瑞集团（电力 AI）、江苏银行 / 南京银行金融科技
- **AI 应用公司**：硅基智能（AI 数字人）及南大 / 东大系 AI 创业团队
- **大厂研发中心**：华为南京研究所、中兴南京研发、趋势科技南京（安全+AI）
- **备选扩展**：若南京 pipeline 不足，上海 / 杭州（高铁 1–1.5h）混合办公 / 远程岗位，或考虑 relocation——W15 视面试反馈再决策

---

## 2. 目标能力模型（面试到底考什么）

| 能力块 | 具体要求 | 对应项目/周 |
|---|---|---|
| ① LLM 工程 | API / 流式 / 结构化输出 / function calling / 上下文管理 / 重试限流 / 成本与延迟优化 | W1–W2 |
| ② RAG | 全链路（加载→分块→嵌入→检索→重排→生成）+ 混合检索 + 查询改写 + **评估（RAGAS）** | W3–W5, P1 |
| ③ Agent | ReAct / 状态机 / 工具设计 / 记忆 / human-in-the-loop / 多智能体模式 / **MCP** / Agent 评估 | W6–W9, P2 |
| ④ 生产工程 | 可观测性（tracing）/ 评估流水线 / guardrails / 部署 / 高并发网关（Java 强项） | W10–W13, P3 |
| ⑤ 模型素养（概念级） | Transformer 直觉 / tokenization / embedding / 微调 vs RAG vs Prompt / LoRA 概念 / KV cache・量化・批处理常识 / 幻觉成因与缓解 | 副线 B |
| ⑥ 框架生态 | Python：LangChain / LangGraph / FastAPI；Java：Spring AI / Spring AI Alibaba / LangChain4j | 主线 + 副线 A |

**深度标准**：①–④ 要能"手写核心逻辑 + 讲清 trade-off + 有数据支撑"；⑤ 能讲清概念和决策框架即可；⑥ 主攻 LangGraph + Spring AI，其余了解定位。

---

## 3. 总体时间线（5 阶段）

| 阶段 | 周次 | 日期 | 主题 | 里程碑 |
|---|---|---|---|---|
| 一、LLM 基础 + RAG | W1–W5 | 11/24–12/28 | API 工程 → Prompt → RAG 全链路 + 评估 | **P1 完成**（带评估报告） |
| 二、Agent 核心 | W6–W9 | 12/29–1/25 | 手写 ReAct → LangGraph → MCP → Agent 评估 | **P2 完成**（Java MCP + Python Agent） |
| 三、毕业项目 | W10–W13 | 1/26–2/22 | 双栈企业级智能助手平台（含春节弹性周） | **P3 完成**（可部署 + 可观测 + 可评估） |
| 四、求职冲刺 | W14–W16 | 2/23–3/15 | 简历 + 题库 + 系统设计 + 模拟面试 + **开始投递** | 简历 v1、首批投递、2 次全真模拟 |
| 五、面试收割 | W17–W20 | 3/16–4/12 | 真实面试 → 复盘补漏 → offer 对比谈判 | **4 月底前 offer**（缓冲至 4 月底） |

---

## 4. 三个项目（作品集，递进复用）

### P1 企业知识库 RAG 问答系统（W3–W5）
- **技术栈**：Python + FastAPI + OpenAI 兼容 API（Qwen / DeepSeek）+ Chroma（入门）→ pgvector（生产）+ bge-m3（embedding）+ bge-reranker（重排）+ RAGAS（评估）
- **功能**：PDF / Markdown 摄入 → 分块策略对比 → 混合检索（BM25 + 向量，RRF 融合）→ 重排 → 带引用溯源的回答 → SSE 流式输出 → 简单 Web UI
- **评估**：自建 50–100 条 QA 评估集；RAGAS 四指标（faithfulness / answer relevancy / context precision / context recall）；做"分块策略 × 检索方式 × rerank 开关"消融实验，产出报告
- **面试可讲点**：为什么混合检索、rerank 提升多少、评估如何驱动迭代、lost in the middle 怎么处理、chunk size 的 trade-off
- **Java 镜像（可选加分）**：用 Spring AI + pgvector 复刻核心检索链路，对比两生态

### P2 工具型 Agent + MCP（W6–W9）
- **路径**：先**手写 ReAct 循环（不用框架）**→ 再用 LangGraph 重构（checkpoint / interrupt / human-in-the-loop）
- **工具**：web 搜索、SQL 只读查询、Python 代码执行（沙箱）、文件操作；工具设计讲规范（命名 / 描述 / schema / 错误返回）
- **记忆**：对话摘要压缩 + 向量长期记忆
- **MCP（双栈亮点）**：用 **Java（Spring AI MCP）实现 MCP Server** 暴露业务工具，Python Agent 通过 MCP client 接入——一个项目同时证明两种能力
- **评估与观测**：LangFuse tracing；20–30 个任务的评估集（任务成功率 / 轨迹质量 / 工具调用正确率）；guardrails（敏感操作人工确认）
- **面试可讲点**：框架 vs 手写的理解深度、状态机设计、MCP 与 function calling 的区别、工具错误恢复、如何定位 agent 哪一步出错

### P3 毕业项目：企业智能助手平台（W10–W13）
- **架构（推荐，双栈）**：
  ```
  前端 Demo ── Spring Boot 业务网关（鉴权/限流/会话/审计/SSE）
                    │
              Python LangGraph Agent 服务
              ├── P1 RAG 检索（知识库）
              ├── P2 MCP 工具（Java MCP Server：业务系统查询/操作）
              ├── 记忆 + human-in-the-loop（人工接管）
              └── LangFuse 全链路观测 + 评估流水线 + 成本统计
  部署：Docker Compose 一键起
  ```
- **场景三选一**（W10 定）：
  1. **智能客服**（推荐）：工单流程 + RAG + 业务工具 + 人工接管，企业需求最普遍
  2. **Deep Research**：多步研究 + 规划 + 引用 + 报告生成，Agent 深度最亮眼
  3. **智能运维助手**：告警分析 + 日志查询 +  runbook 执行，贴合后端背景
- **硬性要求**：评估流水线、全链路 tracing、guardrails、成本/延迟统计、架构图 README、demo 视频、一篇技术博客
- **标准**：这是简历第一项目，必须经得起 **30 分钟深挖**（W13 由 Claude 扮演面试官验收）
- **备选**（若目标偏 AI Infra）：Java LLM 网关——多模型路由、语义缓存、限流降级、fallback、评估，把 Java 高并发优势打满

---

## 5. 周计划（W1–W20）

> 每周结构：**主题 → 任务 → 交付物 → 检查点**。检查点 = 周末复盘时 Claude 出题验收的标准。
> 每周开始时对 Claude 说「**开始第 N 周**」获取详细拆解和代码骨架；周末说「**本周复盘**」进行测验和验收。

### 阶段一：LLM 基础 + RAG（W1–W5）

**W1（11/24–11/30）环境 + LLM API 入门**
- 任务：Python 速成（Java 开发者映射法：uv≈Maven、dict/list≈Map/List、装饰器≈注解+AOP、async/await≈CompletableFuture、pydantic≈Bean Validation）；申请 DeepSeek 或阿里百炼 Qwen API（OpenAI 兼容协议）；openai SDK：messages 结构（system/user/assistant）、流式输出、temperature/max_tokens；function calling 初体验（get_weather 工具，走通 tool_calls → tool 消息 → 最终回答）
- 交付物：CLI 流式聊天机器人 + 一个工具调用
- 检查点：能画出 function calling 完整消息流转图；能解释四种 role 的作用

**W2（12/1–12/7）Prompt 工程 + LLM 应用工程化**
- 任务：Prompt 结构（角色/任务/上下文/few-shot/CoT/输出格式）；结构化输出（JSON mode + pydantic 校验 + 失败兜底）；工程化：重试退避、限流、超时、token 成本统计、日志；prompt 注入攻击与防御意识
- 交付物：结构化信息抽取小工具（输入简历/JD → 输出规范 JSON），带重试与成本统计
- 检查点：few-shot / CoT 何时有效；JSON 解析失败的三层兜底策略

**W3（12/8–12/14）Embedding + 向量检索 + RAG 原理**
- 任务：embedding 与余弦相似度直觉；向量库选型认知（Chroma 入门 / pgvector 生产 / Milvus 大规模 / ES 混合检索）；RAG 全链路手写一遍：加载→分块→嵌入→入库→检索→拼接→生成
- 交付物：最小 RAG 脚本（对一批 Markdown/PDF 问答）+ 10 条手写测试 QA
- 检查点：RAG vs 长上下文 vs 微调的决策框架；chunk size 过大/过小各有什么问题

**W4（12/15–12/21）RAG 工程化（P1 主体）**
- 任务：分块策略对比（固定/语义/标题感知）+ metadata 过滤；混合检索（BM25 + 向量，RRF 融合）；bge-reranker 重排；FastAPI 服务化 + SSE 流式（Java 经验直接迁移）+ 简单前端；引用溯源
- 交付物：P1 v1（摄入/检索/问答/引用/流式全通）
- 检查点：召回与重排的分工；为什么混合检索比纯向量稳

**W5（12/22–12/28）RAG 评估与优化（P1 完成）**
- 任务：构建 50–100 条评估集；RAGAS 四指标跑通；查询改写 / multi-query / HyDE；lost in the middle 现象与对策；消融实验（分块 × 检索 × rerank）→ 评估报告；GitHub 仓库整理
- 交付物：**P1 完成** + 评估报告（第一个面试弹药）
- 检查点：每个 RAGAS 指标的定义与计算方式；能讲一个"评估发现问题→定位→优化→指标提升"的完整故事（带数字）

### 阶段二：Agent 核心（W6–W9）

**W6（12/29–1/4）Agent 原理：手写 ReAct**
- 任务：Agent vs Workflow 的本质区别；ReAct 循环（Thought→Action→Observation）；**不用框架**手写 while 循环 + function calling 工具 agent（搜索/计算器/SQL 只读查询）；工具设计规范；循环防护（max steps / 超时 / token 预算）
- 交付物：手写 ReAct agent（无框架，核心代码 < 300 行）
- 检查点：agent 的本质 = "LLM 调用循环 + 工具 + 终止条件"；工具描述写法如何影响调用成功率

**W7（1/5–1/11）LangGraph**
- 任务：StateGraph / node / edge / conditional edge；checkpoint 持久化；interrupt 与 human-in-the-loop；把 W6 agent 重构为 LangGraph 版；subgraph 概念
- 交付物：LangGraph 版 agent（带 checkpoint + 人工审批节点）
- 检查点：LangGraph 与 LangChain Chain 的区别；什么场景必须用状态机而不是链

**W8（1/12–1/18）MCP + 记忆 + 多智能体模式**
- 任务：MCP 协议（host/client/server，tools/resources/prompts，JSON-RPC）；**用 Java Spring AI MCP 写 MCP Server** 暴露业务工具；Python agent 经 MCP client 接入；记忆设计（对话摘要压缩 + 向量长期记忆）；多智能体模式（supervisor / handoff）与"什么时候不要用多 agent"
- 交付物：P2 主体（Java MCP Server + Python LangGraph agent 联通）
- 检查点：MCP 与 function calling 的区别与协议层价值；记忆压缩丢信息的风险

**W9（1/19–1/25）Agent 评估与可观测（P2 完成）**
- 任务：LangFuse 自托管 + tracing（span/token/成本/延迟）；Agent 评估：20–30 个任务集，任务成功率 / 轨迹质量 / 工具调用正确率；guardrails（输入过滤/输出校验/敏感操作确认）
- 交付物：**P2 完成** + trace 截图 + 评估报告
- 检查点：如何定位"agent 在哪一步出错"；agent 评估与 RAG 评估的方法论差异

### 阶段三：毕业项目（W10–W13）

**W10（1/26–2/1）毕业项目设计**
- 任务：场景三选一定稿；写设计文档：架构图 / 数据流 / 工具清单 / 评估方案 / 失败模式分析；Claude review 设计文档（第一次系统设计演练）；仓库骨架 + Docker Compose 雏形
- 交付物：设计文档 v1 + 仓库骨架
- 检查点：10 分钟讲清"为什么这个架构、trade-off 是什么、哪里会挂"

**W11（2/2–2/8，春节周・弹性）核心开发 ①**
- 任务：Agent 主流程 + RAG 集成 + 核心工具端到端跑通。春节（2/6）前后弹性安排：假期集中开发或休息，进度允许 ±1 周浮动，**不补课不焦虑，顺延即可**
- 交付物：主流程端到端 demo

**W12（2/9–2/15）核心开发 ②**
- 任务：多轮会话 / 记忆 / 人工接管 / 业务闭环；前端 demo 页面完善
- 交付物：完整场景可演示

**W13（2/16–2/22）工程化收尾（P3 完成）**
- 任务：Docker Compose 一键部署；LangFuse 全链路；评估流水线 + 成本/延迟统计；guardrails；README（架构图+快速开始+评估数据）；demo 视频；一篇技术博客
- 交付物：**P3 完成**——简历第一项目
- 检查点：Claude 扮演面试官做 30 分钟项目深挖，能扛住

### 阶段四：求职冲刺（W14–W16）

**W14（2/23–3/1）简历 + 包装**
- 任务：一页简历（Java 经验重写为"支撑 AI 系统的工程能力"：高并发→LLM 网关、分布式→Agent 服务、数据库→向量检索）；三项目量化表述（评估提升 X% / P95 延迟 / 单次成本）；GitHub profile 整理；Claude 逐行改简历；定 30 家目标公司清单；开始刷题保手感（LeetCode Hot 100 medium，Java，3–5 题/周）
- 交付物：简历 v1 + 目标公司清单

**W15（3/2–3/8）面试冲刺 ① + 开始投递（金三）**
- 任务：八股题库三大模块（LLM 基础 / RAG / Agent）——Claude 出题、你作答、Claude 批改；系统设计两题：企业知识库问答系统、LLM 网关（Java 优势题）；**投递启动：10–15 家/周**（Boss直聘 / 内推 / 猎聘 / LinkedIn）
- 交付物：首批投递发出 + 错题本

**W16（3/9–3/15）面试冲刺 ② + 模拟面试**
- 任务：系统设计两题：Agent 平台、Deep Research；项目深挖话术（STAR + trade-off 故事）；**2 次全真模拟面试**（技术 + 项目 + 行为面，Claude 扮演面试官并复盘）；Java 八股复习（JVM / 并发 / Spring / MySQL / Redis——AI 应用岗仍会考）
- 交付物：模拟面试复盘记录 + 改进清单

### 阶段五：面试收割（W17–W20）

**W17–W18（3/16–3/29）面试循环**
- 任务：真实面试 → 记录每场被问的题 → Claude 帮分析缺口 → 针对性补漏；持续投递保持 pipeline（每周 8–10 家）；每周复盘调整
- 交付物：面试记录表（PROGRESS.md）+ 缺口清零

**W19–W20（3/30–4/12）Offer 冲刺**
- 任务：银四补投；offer 对比维度（方向含金量 / 团队 / 成长 / 薪资 / 稳定性）；谈薪策略；缓冲至 4 月底；入职准备（提前熟悉目标团队技术栈）
- 交付物：**offer** 🎯

---

## 6. 三条副线（贯穿主线，少量多次）

### 副线 A：Java + AI（每周 1–2h，W2–W13）
- Spring AI：ChatClient / Advisors / VectorStore / Tool Calling（docs.spring.io/spring-ai）
- Spring AI Alibaba：Graph 编排 / MCP 支持（github.com/alibaba/spring-ai-alibaba）——国内 Java+AI 岗位高频关键词
- LangChain4j：了解定位即可（docs.langchain4j.dev）
- W8 的 Java MCP Server 是副线与主线的合流点；W15 起 Java 八股复习保面试

### 副线 B：ML 概念（每周 1h，W1–W13，面试深度即可）
| 周 | 主题 | 资源 |
|---|---|---|
| W1–W2 | 神经网络 / Transformer 直觉 | 3Blue1Brown 系列（B 站有搬运） |
| W3–W4 | Attention / tokenization | Jay Alammar《The Illustrated Transformer》 |
| W5–W6 | embedding 本质 / 相似度 | 动手玩 bge-m3 |
| W7–W8 | 微调 vs RAG vs Prompt 决策框架；LoRA 概念 | Claude 讲解 + 讨论 |
| W9–W10 | 推理常识：KV cache / 量化 / 批处理 / 首 token 延迟 | Claude 讲解 |
| W11–W13 | 幻觉成因与缓解；模型能力边界 | 结合项目复盘 |

**红线**：不推导公式、不训练模型、不啃《深度学习》花书。应用岗考的是概念清晰 + 决策框架。

### 副线 C：算法手感（W14 起，每周 3–5 题）
- LeetCode Hot 100 medium 为主，用 Java 写；AI 应用岗算法轮普遍比纯后端浅，但零准备会挂

---

## 7. 面试题库大纲（W15 起由 Claude 按模块生成 → 你作答 → 批改）

1. **LLM 基础**：tokenization / 上下文窗口 / temperature・top_p / 幻觉成因与缓解 / 结构化输出保障 / prompt 注入防御 / 成本与延迟优化（缓存、批处理、模型分级）
2. **RAG**：分块 trade-off / embedding 选型 / 混合检索与 RRF / rerank 原理 / 查询改写・HyDE / lost in the middle / RAGAS 指标定义 / GraphRAG 概念 / 多跳检索 / 评估集构建方法
3. **Agent**：ReAct vs Plan-and-Execute / 工具设计原则 / 错误恢复与循环防护 / 记忆设计 / 何时用多 agent（及何时不用）/ MCP vs function calling / human-in-the-loop / agent 评估方法 / LangGraph 状态机设计
4. **系统设计**（4 题精练）：企业知识库问答系统 / 智能客服 Agent 平台 / LLM 网关（限流・缓存・路由・降级，Java 优势题）/ Deep Research Agent
5. **Java + AI 交叉**：Spring AI 架构 / SSE 流式与背压 / 高并发 LLM 调用的线程模型 / 向量库选型（pgvector vs Milvus vs ES）/ JVM・并发・Spring 八股
6. **行为面**：转型动机（讲成"优势延伸"不是"逃离后端"）/ 项目深挖 STAR / trade-off 故事 / 学习方法论

---

## 8. 资源清单（精选，不贪多）

> 视频/课程资源按周次映射见同目录 **`RESOURCES-VIDEOS.md`**（B 站 + 英文官方源，每阶段一个主力，≤3h/周）。

**必读 / 必做**
- Anthropic《Building Effective Agents》：anthropic.com/engineering/building-effective-agents（Agent 设计圣经，W6 前读完）
- LangGraph 官方文档 + tutorials：langchain-ai.github.io/langgraph（W7 主教材）
- MCP 规范：modelcontextprotocol.io（W8 主教材）
- Spring AI 文档：docs.spring.io/spring-ai；Spring AI Alibaba：github.com/alibaba/spring-ai-alibaba
- RAGAS 文档：docs.ragas.io（W5）；LangFuse：langfuse.com（开源可自托管，W9）
- DeepLearning.AI 短课（免费，每门 1–2h）：AI Agents in LangGraph / Building Agentic RAG with LlamaIndex / MCP 相关课程（deeplearning.ai/short-courses）
- Hugging Face Agents Course：huggingface.co/learn/agents-course（体系化备选）

**API 与模型**
- 国内主力（便宜、OpenAI 兼容协议）：DeepSeek（platform.deepseek.com）、阿里百炼 Qwen（bailian.console.aliyun.com）
- OpenAI 兼容协议是事实标准：学会 `base_url + api_key + model` 三件套即可通吃大部分厂商
- Claude API（可选，文档质量高）：platform.claude.com/docs；当前模型 ID：`claude-opus-5-5`（旗舰默认）/ `claude-sonnet-5-5`（日常）/ `claude-haiku-5-5`（轻量任务）；官方 SDK：Python `anthropic`、Java `com.anthropic`
- Embedding / Rerank 开源模型：BAAI bge-m3、bge-reranker（HuggingFace 下载，本地跑）

**概念理解**
- 3Blue1Brown 神经网络 / Transformer 系列（B 站有官方搬运）
- Jay Alammar《The Illustrated Transformer》（jalammar.github.io）
- OpenAI Cookbook（github.com/openai/openai-cookbook）、Anthropic Cookbook（github.com/anthropics/anthropic-cookbook）

** vector 库**：Chroma（入门零配置）→ pgvector（生产首选，PostgreSQL 生态，Java 友好）→ Milvus（大规模）→ Elasticsearch（BM25 混合检索）

---

## 9. 避坑指南（转型者高频死法）

1. ❌ 先系统学数学 / 深度学习 / 啃花书 → ✅ 应用岗不考推导，概念副线 1h/周足够
2. ❌ 囤课刷视频，输入成瘾 → ✅ 每周必须有代码交付物，输出驱动输入
3. ❌ 做无评估的 toy demo → ✅ **评估报告是你和 90% 候选人的分水岭**，P1 起每个项目必带
4. ❌ 丢掉 Java 全转 Python，和应届生拼刺刀 → ✅ 双栈是你的护城河，毕业项目必须体现
5. ❌ 追每个新框架（AutoGen / CrewAI / 各种新轮子）→ ✅ 主攻 LangGraph + Spring AI，其他知道定位即可
6. ❌ 手写 agent 之前先上框架 → ✅ W6 先手写 ReAct，理解本质后再用框架，面试深度完全不同
7. ❌ 等"学完了"再投简历 → ✅ 3 月初就投，面试本身是最好的学习；金三银四不等人
8. ❌ 项目贪多求大 → ✅ 三个项目递进复用，一个能扛 30 分钟深挖的项目胜过五个 demo
9. ❌ 简历写"熟悉 LangChain" → ✅ 写"构建 X 系统，RAGAS faithfulness 从 A 提升到 B，P95 延迟 Xms"
10. ❌ 春节周排满计划然后崩盘 → ✅ W11 天然弹性，顺延不焦虑

---

## 10. 陪学机制（Claude 怎么陪你）

### 触发口令（ anytime，新会话也有效——进度在文件和记忆里）
| 你说 | Claude 做 |
|---|---|
| 「开始第 N 周」 | 生成本周**自包含学习包**（结构见下节「每周学习包惯例」）+ 对话引导 |
| 「本周复盘」 | 出 5–10 道检查点测验题 → 批改 → review 交付物 → 更新 PROGRESS.md → 调整下周 |
| 「讲一下 X」 | 深度讲解概念（用 Java 类比），直到你能复述 |
| 「review 这段代码」 | 按生产标准 review：正确性 / 工程化 / 面试可讲点 |
| 「模拟面试」 | 扮演面试官（技术 / 项目深挖 / 行为面），逐题复盘打分 |
| 「帮我改简历」 | 逐行改，量化表述，针对目标岗位定制 |
| 贴报错 / 贴面试题 | 一起 debug / 分析考点和缺口 |

### 每周学习包惯例（自包含，用户要求于 2026-11-24 确立）
每周内容集中在 `projects/wN-xxx/` 一个文件夹内，做到**基本不需要再找外部资料**：
- `README.md` —— 本周路线图：导览表、每日计划（教材↔任务↔完成标志）、验收标准、环境状态、常见坑
- `docs/01–07` —— 完整教学内容直接写入（教程+示例代码，按学习日编号），`05` 每日练习、`06` 周日闭卷测验、`07` 延伸链接（仅查证用）
- 代码骨架（留 TODO 自己写）+ 完整可跑示例
- `solutions/` —— 参考答案（先自己写、卡 30 分钟以上才看）+ 测验答案

### 节奏建议
- 每周固定两次会话：**周初「开始第 N 周」+ 周末「本周复盘」**，中间随时提问
- Claude 无法主动提醒你——发起权在你；但每次你来，Claude 都记得目标、进度和上周内容（持久记忆 + PROGRESS.md）
- 交付物代码放 `ai-roadmap/projects/`（p1-rag / p2-agent / p3-capstone），复盘时直接 review

### 调整规则
- 周完成率 < 70%：不硬赶，砍下周范围或整体顺延；**项目可以缩水，评估不能砍**
- 每周时间 < 10h：砍 Java 镜像和副线 A 深度，保单项目主线；> 25h：加微调实践（LoRA 跑一次）和开源贡献
- 连续 2 周落后：触发路线重排（Claude 重新倒排时间线，优先保 P3 + 投递时间）
- 市场反馈优先：W15 起若面试暴露系统性缺口，立即插入补漏周，计划为面试让路

---

## 11. 进度追踪

见同目录 **`PROGRESS.md`**（周状态表 / 里程碑 / 面试记录 / 复盘日志）。
每周复盘时由 Claude 更新；里程碑达成时在表中打 ✅。

**第一个行动（今天就能做）**：W1 第一步——装 Python 环境（uv）+ 申请一个 DeepSeek 或阿里百炼 API key。对 Claude 说「开始第 1 周」即可拿到完整拆解。
