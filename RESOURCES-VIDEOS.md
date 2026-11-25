# 视频与课程资源清单（B 站 + 英文官方源）

> 创建 2026-11-24（原 RESOURCES-BILIBILI.md），2026-11-25 扩充英文官方资源并更名。
> 按 ROADMAP.md 周次映射，每阶段只留一个主力资源（⭐），够用就停。
> 维护说明：链接可能失效或过时（尤其 LangGraph / MCP 这类快速迭代的内容），失效时用文末「搜索关键词备忘」重新找，找到后回来更新本文件，并标注 ⭐主力 / 备选，删掉失效链接。

---

## 使用原则（先读这个）

1. **优先级：英文官方一手源 > B 站优质中文课 > 第三方搬运。** 官方源内容准、更新快（LangChain/Anthropic 的课常带中文字幕）；英语吃力就用 B 站中文平替，效果不打折。
2. **视频只做两件事**：建立概念直觉（看动画/讲解）、卡住时查操作（看框架演示）。主线永远是每周代码交付物 + 官方文档 + 和 Claude 讨论。对应 ROADMAP 避坑第 2 条「囤课刷视频，输入成瘾」。
3. **警惕 SEO 标题党**：「全网最好」「允许白嫖」「草履虫都能看懂」这类标题的多为付费课搬运，版本旧、质量不稳。
4. **每周视频 ≤ 3 小时**，超出就挤压写代码时间。长课只挑对应本周主题的模块看，不追完整证书。
5. 看视频时手不能停：跟着敲，敲完能复述，才算看过。

## 平台入口（收藏这几个就够）

| 平台 | 入口 | 说明 |
|---|---|---|
| DeepLearning.AI 短课 | [课程目录](https://www.deeplearning.ai/courses?types=short_course)（学习平台 learn.deeplearning.ai） | 免费短课每门 1–2h，与 Anthropic / LangChain / LlamaIndex / Chroma 官方联合出品。⚠️ 部分课程免费名额有限制，看到想学的尽早注册 |
| LangChain Academy | [academy.langchain.com](https://academy.langchain.com/) | LangGraph 官方免费课（"always free"），配套代码 [langchain-ai/langchain-academy](https://github.com/langchain-ai/langchain-academy) |
| Claude Academy（Anthropic 官方） | [academy.claude.com](https://academy.claude.com/) ｜ [课程目录](https://academy.claude.com/courses) | 20+ 门免费课：API 基础 / tool use / 结构化输出 / MCP / Agent。⚠️ 旧门户 anthropic.skilljar.com 于 2026 年 12 月初退役，只认新地址 |
| Hugging Face Learn | [Agents Course](https://huggingface.co/learn/agents-course) ｜ [MCP Course](https://huggingface.co/learn/mcp-course/en/unit0/introduction) | 体系化免费课，带作业和证书；ROADMAP 已列为备选，这里落到周次 |
| Karpathy YouTube | [youtube.com/andrejkarpathy](https://www.youtube.com/andrejkarpathy)（[General Audience 播放列表](https://www.youtube.com/playlist?list=PLAqhIrjkxbuW9U8-vZ_s_cjKPT_FqRStI)） | 零数学讲 LLM 的天花板，副线 B 主粮 |
| AI Engineer YouTube | [youtube.com/@aiDotEngineer](https://www.youtube.com/@aiDotEngineer) | 一线工程实践 talk（Agent/RAG/评估），W14 起的面试素材和行业语感 |

---

## W1 Python 速成

B 站**没有**好的「Java 开发者学 Python」中文课（搜到的多是英文搬运或上百小时全栈课，如小甲鱼/黑马——对 Java 熟手完全没必要）。

- 路线图的 W1 已按「Java 映射法」设计（uv≈Maven、dict≈Map、装饰器≈注解+AOP……），直接让 Claude 带着写即可。
- 实在想要视频：搜「Python 2小时 入门」看短速成，例如 [Udemy Basics of Python in 2 Hours 搬运](https://www.bilibili.com/video/BV1SE5j6NE1M/)。

## W1–W2 LLM API + Prompt 工程

| 来源 | 资源 | 链接 | 怎么用 |
|---|---|---|---|
| 官方 ⭐主力 | DeepLearning.AI《ChatGPT Prompt Engineering for Developers》（约 1h，吴恩达 × OpenAI） | [课程目录](https://www.deeplearning.ai/courses?types=short_course) 搜课程名 | W2 主课：prompt 原则 + 迭代优化 + 系统性方法 |
| 官方 | Claude Academy · Anthropic API 课程线（tool use / 结构化输出 / prompt caching） | [academy.claude.com/courses](https://academy.claude.com/courses) | W1 function calling、W2 结构化输出时按需查对应课，文档质量全行业最高 |
| B 站 | 吴恩达 × LangChain 创始人《大语言模型 LLM 应用开发》中文字幕完整版（8 集） | [BV1Rz4y1e7wH](https://www.bilibili.com/video/BV1Rz4y1e7wH/) | 中文平替，1–2h 看完 |
| B 站 | deeplearning.ai 短课中英文字幕合集（12 集） | [BV1ut421H7pZ](https://www.bilibili.com/video/BV1ut421H7pZ/) | 备用池 |

## W3–W5 RAG（P1）

| 来源 | 资源 | 链接 | 怎么用 |
|---|---|---|---|
| 官方 ⭐主力 | DeepLearning.AI《Building and Evaluating Advanced RAG with LlamaIndex》（含 TruEra 评估） | [课程目录](https://www.deeplearning.ai/courses?types=short_course) 搜课程名 | **W5 评估周主课**——RAG 评估的官方入门，和 RAGAS 方法论互补 |
| 官方 | DeepLearning.AI《Advanced Retrieval for AI with Chroma》（查询扩展 / re-ranking） | [课程页](https://www.deeplearning.ai/courses/advanced-retrieval-for-ai) | W4 检索优化周看，正对混合检索/重排主题 |
| 官方 | DeepLearning.AI《LangChain: Chat with Your Data》（RAG 全链路 8 步） | [课程目录](https://www.deeplearning.ai/courses?types=short_course) 搜课程名 | W3 备选：加载→分块→检索→问答全链路演示 |
| 中文 ⭐主力 | Datawhale《动手学大模型应用开发》（llm-universe） | [B 站专栏](https://www.bilibili.com/read/cv27715058/) ｜ [天池课程页](https://tianchi.aliyun.com/course/1738) ｜ [在线阅读](https://datawhalechina.github.io/llm-universe/) ｜ [GitHub](https://github.com/datawhalechina/llm-universe) | 和 P1「知识库助手」几乎同构。**文字为主视频为辅**，边看边写 p1-rag |
| B 站 | RAG 工作机制动画详解 | [BV17h1hBaEZj](https://www.bilibili.com/video/BV17h1hBaEZj/) / [BV1dUs8ztEZj](https://www.bilibili.com/video/BV1dUs8ztEZj/) | W3 开头看一遍建直觉 |
| B 站 | 官方话题页「RAG检索增强生成」 | [topic_id=1194989](https://m.bilibili.com/topic-detail?topic_id=1194989) | 检索入口，遇到具体问题再进去搜 |

⚠️ W5 的 RAGAS 本身**没有像样的视频课**，直接看官方文档（docs.ragas.io）+ Claude 讲解——评估是差异化弹药，没有现成课可抄。

## W6 手写 ReAct（不看视频周）

⚠️ **W6 刻意不配视频**——读 Anthropic《Building Effective Agents》（文字）+ Claude 带着手写。想补概念看 [HF Agents Course](https://huggingface.co/learn/agents-course) Unit 1（agent 定义与设计模式）即可。

## W7 LangGraph

| 来源 | 资源 | 链接 | 怎么用 |
|---|---|---|---|
| 官方 ⭐主力 | LangChain Academy《Introduction to LangGraph》（免费，约 6h / 55 lesson / 7 模块） | [academy.langchain.com](https://academy.langchain.com/) ｜ [配套代码](https://github.com/langchain-ai/langchain-academy) | W7 主教材。**只修核心模块**：Foundations → Memory → Human-in-the-loop；部署模块可跳过 |
| B 站 | LangGraph 入门·中文精翻配音版（疑似 LangChain Academy 内容翻译） | [BV1J9UaBjE8g](https://www.bilibili.com/video/BV1J9UaBjE8g/) | 中文平替——如果它就是官方课翻译，二者取一即可 |
| B 站 | 5 小时 LangGraph 教程（10 集，覆盖 1.0 新 API） | [BV1u92DBGEaa](https://www.bilibili.com/video/BV1u92DBGEaa/) | 备选 |

## W8–W9 MCP + 记忆 + Agent 评估（P2）

| 来源 | 资源 | 链接 | 怎么用 |
|---|---|---|---|
| 官方 ⭐主力 | DeepLearning.AI × Anthropic《MCP: Build Rich-Context AI Apps》（约 2h，11 lesson） | [课程页](https://learn.deeplearning.ai/courses/mcp-build-rich-context-ai-apps-with-anthropic/) | W8 主课：MCP 概念 → tools/resources/prompts → 动手实现 |
| 官方 | Claude Academy《Introduction to Model Context Protocol》+《MCP: Advanced Topics》 | [academy.claude.com/courses](https://academy.claude.com/courses) | W8 进阶：server/client 实现、双向通信、生产部署 |
| 官方 | [HF MCP Course](https://huggingface.co/learn/mcp-course/en/unit0/introduction) | 同左 | 体系化备选 |
| B 站 | 吴恩达《基于 LangGraph 构建长期记忆 Agent》（7 集，附课件代码） | [BV1k8L3zxEDz](https://www.bilibili.com/video/BV1k8L3zxEDz/) | W8 记忆设计 |
| B 站 | 《30 分钟吃透 MCP》（8 集） | [BV17dawzvEx5](https://www.bilibili.com/video/BV17dawzvEx5/) | 中文入门平替 |
| 文字 | MCP 中文入门指南 | [liaokongVFX/MCP-Chinese-Getting-Started-Guide](https://github.com/liaokongVFX/MCP-Chinese-Getting-Started-Guide) | 比视频高效，配合 modelcontextprotocol.io |
| B 站 | Spring AI Alibaba 系列之 MCP Server Boot（Java 向） | [BV1LHJG6LEtU](https://www.bilibili.com/video/BV1LHJG6LEtU/) | W8 写 Java MCP Server 前看 |
| — | W9 可观测/评估 | LangFuse 官方文档（langfuse.com）为主，中文视频少；[AI Engineer YouTube](https://www.youtube.com/@aiDotEngineer) 搜 "agent evaluation" 看一线实践 | |

## 副线 A：Java + AI（W2–W13，每周 1–2h）

| 来源 | 资源 | 链接 | 怎么用 |
|---|---|---|---|
| B 站官方 ⭐主力 | 尚硅谷《Spring AI 实战教程》（约 4h，23 万播放） | [BV1drNizZE79](https://www.bilibili.com/video/BV1drNizZE79/) ｜ [官网课程页](https://www.atguigu.com/video/336/) | 副线起点：ChatClient→向量化→RAG→实战，Java 味最正 |
| YouTube | Spring 官方频道搜 "Spring AI"（Spring Developer / Spring Academy spring.academy） | youtube.com 搜 `Spring Developer Spring AI` | 英文一手：新版本特性 talk，版本比中文课新 |
| B 站 | 尚硅谷 Java 学习路线（AI 升级版，含 Spring AI Alibaba / MCP 系列入口） | [opus 369163743450531164](https://www.bilibili.com/opus/369163743450531164) | 找第三方 SpringAI Alibaba 系列（RAG、SAA、MCP，8h49m，87 万播放） |
| B 站 | 《2025 版 Spring AI Alibaba 入门到进阶》 | [BV1woY5z7EpQ](https://www.bilibili.com/video/BV1woY5z7EpQ/) | 备选 |

## 副线 B：ML 概念直觉（每周 1h）

| 来源 | 资源 | 链接 | 怎么用 |
|---|---|---|---|
| 官方 ⭐主力 | Karpathy《[1hr Talk] Intro to Large Language Models》 | [频道](https://www.youtube.com/andrejkarpathy) / [General Audience 播放列表](https://www.youtube.com/playlist?list=PLAqhIrjkxbuW9U8-vZ_s_cjKPT_FqRStI) | W1–W2：LLM 是什么、预训练/微调、能力边界，1h 讲透 |
| 官方 ⭐主力 | Karpathy《Deep Dive into LLMs like ChatGPT》（3.5h，**零数学**） | [youtube.com/watch?v=7xTGNNLPyMI](https://www.youtube.com/watch?v=7xTGNNLPyMI) | W3–W6 每周切 40min 看一段：tokenization、幻觉成因、RLHF——副线 B 一半的考点都在里面。B 站搜「Karpathy 深入理解大模型」有中文字幕搬运 |
| 官方 | 3Blue1Brown **B 站官方账号** | [space.bilibili.com/88461692](https://space.bilibili.com/88461692/)（YouTube 原频道更全） | 只看两集：神经网络基础 + 「GPT 是什么 / Transformer 直观解释」（[中文配音版 BV1qM4m1d7is](https://www.bilibili.com/video/BV1qM4m1d7is/) 也可） |

⚠️ **不要**点进微积分/线代/概率论大合集，也不要看 Karpathy 的 "Let's build GPT"（动手训模型）——红线是不啃数学不训模型（ROADMAP 第 6 节副线 B）。

## W14–W20 求职阶段

- 不预先囤视频。[AI Engineer YouTube](https://www.youtube.com/@aiDotEngineer) 按主题搜（RAG eval / agent architecture / LLM gateway），既是面试素材也是行业语感，每周挑 1–2 个 talk 看。
- 算法轮（LeetCode）按需搜题解视频，不系统刷课。

---

## 搜索关键词备忘（链接会失效，关键词不会）

B 站：`LangGraph 1.0 实战`、`Spring AI Alibaba MCP`、`RAG 混合检索 rerank`、`function calling 原理`、`LangFuse 教程`、`多智能体 supervisor handoff`、`Karpathy 中文字幕`

YouTube / 英文：`LangChain Academy LangGraph`、`MCP course Anthropic`、`agent evaluation LangSmith`、`RAG production lessons`、`LLM gateway design`
