"""D3 任务：CLI 流式聊天机器人（多轮对话）
运行: uv run stream_chat.py
完成 TODO 1–3 后运行，对比 hello_llm.py 的体验差异（首 token 延迟）。
"""
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
)


def main():
    # 多轮对话 = 维护一个 messages 列表（≈ 会话历史，先放内存，W8 再学持久化与压缩）
    history = [{"role": "system", "content": "你是一个友好的中文助手。"}]
    print("输入 exit 退出")
    while True:
        user_input = input("\n你: ")
        if user_input.strip().lower() in ("exit", "quit"):
            break
        history.append({"role": "user", "content": user_input})

        # TODO 1: 调用 client.chat.completions.create(model=..., messages=history, stream=True)
        # TODO 2: 遍历返回的迭代器，取 chunk.choices[0].delta.content
        #         非空片段用 print(片段, end="", flush=True) 实时输出，
        #         同时把片段累积成完整回答字符串
        # TODO 3: 把完整回答以 {"role": "assistant", "content": 完整回答} 追加进 history
        # 提示: stream=True 返回迭代器，每个 chunk 是一小段增量（≈ 你熟悉的 SSE）
        raise NotImplementedError("完成 TODO 1-3")


if __name__ == "__main__":
    main()
