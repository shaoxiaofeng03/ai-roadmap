"""D6 加分项参考实现：流式输出 + function calling 合并
难点（见 docs/03 §5）：tool_calls 以碎片形式按 index 到达，需累积后统一执行。
先自己写，卡 1 小时以上再看。
"""
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
)

MODEL = "deepseek-chat"
MAX_STEPS = 5

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "查询指定城市的当前天气。",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string", "description": "城市名"}},
                "required": ["city"],
            },
        },
    }
]


def get_weather(city: str) -> str:
    return json.dumps({"city": city, "weather": "晴", "temp_c": 18}, ensure_ascii=False)


def execute_tool(name: str, arguments: str) -> str:
    try:
        args = json.loads(arguments)
    except json.JSONDecodeError:
        return json.dumps({"error": "参数不是合法 JSON"}, ensure_ascii=False)
    if name == "get_weather":
        return get_weather(**args)
    return json.dumps({"error": f"未知工具: {name}"}, ensure_ascii=False)


def stream_once(history):
    """一次流式调用：实时打印正文；把 delta.tool_calls 碎片按 index 累积。
    返回 (完整正文, {index: {"id","name","arguments"}})
    """
    stream = client.chat.completions.create(
        model=MODEL, messages=history, tools=TOOLS, stream=True
    )
    content_parts = []
    slots: dict = {}
    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        if delta is None:
            continue
        if delta.content:
            print(delta.content, end="", flush=True)
            content_parts.append(delta.content)
        for tcd in delta.tool_calls or []:
            slot = slots.setdefault(tcd.index, {"id": "", "name": "", "arguments": ""})
            if tcd.id:
                slot["id"] = tcd.id                       # id 只在首个碎片出现
            if tcd.function:
                if tcd.function.name:
                    slot["name"] += tcd.function.name      # name 也可能分片
                if tcd.function.arguments:
                    slot["arguments"] += tcd.function.arguments  # arguments 逐段拼接
    print()
    return "".join(content_parts), slots


def main():
    history = [{"role": "system", "content": "你是一个可以查询天气的助手。"}]
    print("试试：南京天气怎么样？（输入 exit 退出）")
    while True:
        user_input = input("\n你: ")
        if user_input.strip().lower() in ("exit", "quit"):
            break
        history.append({"role": "user", "content": user_input})

        finished = False
        for step in range(MAX_STEPS):
            print("助手: ", end="", flush=True)
            content, slots = stream_once(history)
            if not slots:  # 本轮没有工具调用 = 最终回答
                history.append({"role": "assistant", "content": content})
                finished = True
                break

            # 有工具调用：把累积完整的 assistant 消息（含 tool_calls）追加回 history
            history.append({
                "role": "assistant",
                "content": content or None,
                "tool_calls": [
                    {
                        "id": slots[i]["id"],
                        "type": "function",
                        "function": {"name": slots[i]["name"], "arguments": slots[i]["arguments"]},
                    }
                    for i in sorted(slots)
                ],
            })
            for i in sorted(slots):
                s = slots[i]
                print(f"  [工具] {s['name']}({s['arguments']})")
                result = execute_tool(s["name"], s["arguments"])
                history.append({"role": "tool", "tool_call_id": s["id"], "content": result})
                # 回到循环顶部：工具结果喂回后再发起一次流式请求

        if not finished:
            print("[防护] 达到最大工具轮数")
            history.append({"role": "assistant", "content": "（未能在规定轮数内完成）"})


if __name__ == "__main__":
    main()
