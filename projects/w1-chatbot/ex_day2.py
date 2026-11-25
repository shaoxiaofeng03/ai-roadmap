# D2（周三 2h）Python + 多轮对话
# Ex2.1 多轮非流式对话（基于 hello_llm.py 改造）
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # 把 .env 读进环境变量（≈ Spring 的 application.yml）

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",  # OpenAI 兼容协议：换 base_url 即可对接大部分厂商
)

messages=[
        {"role": "system", "content": "你是一个简洁的助手。"},
        {"role": "user", "content": "用一句话解释什么是 function calling。"}
    ]

resp = client.chat.completions.create(
    model="deepseek-chat",
    messages = messages,
    temperature=0.3,
    max_tokens=2000
)

print(resp.choices[0].message.content)
# 列表用 append；模型回复的角色是 assistant，不是 user
messages.append({"role": "assistant", "content": resp.choices[0].message.content})
messages.append({"role":"user", "content":"我叫张三"})
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages = messages,
    temperature=0.3,
    max_tokens=2000
)
print("----------------------")
print(resp.choices[0].message.content)

messages.append({"role": "assistant", "content": resp.choices[0].message.content})
messages.append({"role":"user", "content":"我叫什么"})
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages = messages,
    temperature=0.3,
    max_tokens=2000
)
print("----------------------")
print(resp.choices[0].message.content)

questions = ["我叫张三", "我叫什么", "改名字了李四", "我叫什么", "我曾经叫什么"]


def ask_model(message = None):
    if not message:
        return
    
    messages=[
        {"role": "system", "content": "你是一个简洁的助手。"}
    ]

    messages.append()
    resp = client.chat.completions.create(
        model="deepseek-chat",
        messages = messages,
        temperature=0.3,
        max_tokens=2000
    )

print(resp.choices[0].message.content)




# while + input 循环，维护 history 列表，user/assistant 交替追加
# 输入 exit/quit 退出
# 验收：先说"我叫张三"，再问"我叫什么"，模型答对
# 提示：01 §11 的迭代器先不管，02 §1 的心智模型是本题关键
# Ex2.2 数据结构练习（不碰 API，纯 Python）

# 从 history 列表推导式取出所有 user 消息的 content：[m["content"] for m in history if m["role"]=="user"]
# 统计所有消息 content 总字符数（sum + 生成器）
# Ex2.3 报错观察（理解 Python 报错格式）

# 故意访问 d["不存在的key"] 触发 KeyError；json.loads("不是json") 触发 JSONDecodeError
# 各用一句话描述报错最后一行告诉了你什么
