"""D1 任务：第一次 LLM API 调用（完整示例，直接跑）
运行: uv run hello_llm.py
Java 类比: OpenAI client ≈ 封装好的 WebClient；messages ≈ 请求体 DTO
"""
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()  # 把 .env 读进环境变量（≈ Spring 的 application.yml）

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",  # OpenAI 兼容协议：换 base_url 即可对接大部分厂商
)

resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "你是一个简洁的助手。"},
        {"role": "user", "content": "用一句话解释什么是 function calling。"},
    ],
    temperature=0.3,
    max_tokens=2000
)

print(resp.choices[0].message.content)
print("---")
print(f"token 用量: {resp.usage}")  # 成本意识从第一天开始：输入/输出 token 分别计费
print(resp)
