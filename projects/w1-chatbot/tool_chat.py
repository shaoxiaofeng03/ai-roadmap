"""D4 任务：function calling 工具循环（先做非流式版，跑通逻辑）
运行: uv run tool_chat.py

核心消息流转（周日复盘要能默画）：
  user → LLM → 有 tool_calls?
    是 → 执行工具 → 追加 assistant(含tool_calls)消息 + tool(结果)消息 → 再调 LLM → ...
    否 → 最终回答

周六加分项：与 stream_chat.py 合并成「流式 + 工具」版（需累积 delta.tool_calls 碎片）。
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

# 工具声明 = JSON Schema（≈ 给 LLM 看的接口文档：名字/描述/参数契约）
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "查询指定城市的当前天气",  # 描述质量直接影响调用成功率
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名，例如：南京"}
                },
                "required": ["city"],
            },
        },
    }
]


def get_weather(city: str) -> str:
    """mock 实现：真实项目里这里会调天气 API"""
    return json.dumps({"city": city, "weather": "晴", "temp_c": 18}, ensure_ascii=False)


def execute_tool(name: str, arguments: str) -> str:
    args = json.loads(arguments)  # LLM 返回的参数是 JSON 字符串，必须解析
    if name == "get_weather":
        return get_weather(**args)
    # 错误也要作为结果返回给 LLM（让它自行纠正），而不是抛异常中断循环
    return json.dumps({"error": f"未知工具: {name}"}, ensure_ascii=False)


def main():
    history = [{"role": "system", "content": "你是一个可以查询天气的助手。"}]
    print("试试问：南京今天天气怎么样？（输入 exit 退出）")
    while True:
        user_input = input("\n你: ")
        if user_input.strip().lower() in ("exit", "quit"):
            break
        history.append({"role": "user", "content": user_input})

        # TODO 1: 调用 API（非流式），传 tools=TOOLS
        # TODO 2: 检查 resp.choices[0].message.tool_calls 是否非空
        #   有工具调用时：
        #     a. 把整个 assistant 消息追加进 history（可用 message.model_dump()，
        #        注意剔除值为 None 的字段）
        #     b. 对每个 tool_call 执行 execute_tool(tc.function.name, tc.function.arguments)
        #     c. 追加 {"role": "tool", "tool_call_id": tc.id, "content": 工具结果}
        #     d. 再次调用 API —— 用 while 循环直到没有 tool_calls，最多 5 轮防护
        #   无工具调用时：打印最终回答，并追加进 history
        raise NotImplementedError("完成 TODO 1-2")


if __name__ == "__main__":
    main()
