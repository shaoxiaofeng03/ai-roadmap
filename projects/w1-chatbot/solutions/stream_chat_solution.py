"""stream_chat.py 参考答案：流式多轮对话 + TTFT 计时（Ex3.2）
规则：先自己写，卡 30 分钟以上才看；看完合上重写。
"""
import os
import time

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
)


def main():
    history = [{"role": "system", "content": "你是一个友好的中文助手。"}]
    print("输入 exit 退出")
    while True:
        user_input = input("\n你: ")
        if user_input.strip().lower() in ("exit", "quit"):
            break
        history.append({"role": "user", "content": user_input})

        start = time.perf_counter()
        first_at = None
        parts = []

        print("助手: ", end="", flush=True)
        stream = client.chat.completions.create(
            model="deepseek-chat",
            messages=history,
            stream=True,
        )
        for chunk in stream:
            if not chunk.choices:          # usage-only chunk 等情况
                continue
            delta = chunk.choices[0].delta
            if delta and delta.content:    # 首尾 chunk 的 content 可能为 None
                if first_at is None:
                    first_at = time.perf_counter()
                print(delta.content, end="", flush=True)
                parts.append(delta.content)
        print()

        answer = "".join(parts)
        history.append({"role": "assistant", "content": answer})  # 累积完整回答，否则下轮失忆
        if first_at:
            print(f"[TTFT {first_at - start:.2f}s | 总 {time.perf_counter() - start:.2f}s | 历史 {len(history)} 条]")


if __name__ == "__main__":
    main()
