"""tool_chat.py 参考答案：非流式 + 工具循环 + 防护 + 错误自愈 + 成本统计
覆盖 D4 与 D5 全部要求。先自己写，卡 30 分钟以上才看。
"""
import json
import os
import re

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
)

MODEL = "deepseek-chat"
MAX_STEPS = 5  # 防护：模型可能陷入调用循环

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "查询指定城市的当前天气。当用户询问天气、气温、是否下雨时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "城市名，例如：南京"},
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "计算一个算术表达式并返回数值结果。",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "算术表达式，例如：(3+5)*2"},
                },
                "required": ["expression"],
            },
        },
    },
]


def get_weather(city: str) -> str:
    # mock：真实项目调天气 API；注意"城市不存在"这类分支要有合理返回（Ex4.3 思考）
    return json.dumps({"city": city, "weather": "晴", "temp_c": 18}, ensure_ascii=False)


def calculate(expression: str) -> str:
    # 学习用 demo：白名单校验 + 空 builtins。生产应使用表达式解析库或沙箱。
    if not re.fullmatch(r"[0-9+\-*/%(). ]+", expression):
        return json.dumps({"error": "表达式包含非法字符"}, ensure_ascii=False)
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return json.dumps({"result": result}, ensure_ascii=False)
    except Exception as e:  # noqa: BLE001 demo 里兜底给模型看
        return json.dumps({"error": f"计算失败: {e}"}, ensure_ascii=False)


def execute_tool(name: str, arguments: str) -> str:
    """统一入口：参数解析、未知工具、执行异常 —— 全部转为错误 JSON 喂回模型"""
    try:
        args = json.loads(arguments)  # arguments 是 JSON 字符串，必须解析
    except json.JSONDecodeError:
        return json.dumps({"error": "工具参数不是合法 JSON"}, ensure_ascii=False)
    try:
        if name == "get_weather":
            return get_weather(**args)
        if name == "calculate":
            return calculate(**args)
        return json.dumps({"error": f"未知工具: {name}"}, ensure_ascii=False)
    except TypeError as e:
        return json.dumps({"error": f"参数错误: {e}。期望参数请查看工具定义。"}, ensure_ascii=False)


def main():
    history = [{"role": "system", "content": "你是一个可以查询天气和做计算的助手，必要时调用工具。"}]
    cost = {"prompt": 0, "completion": 0}
    print("试试：南京天气怎么样？(3+5)*2 等于几？（输入 exit 退出）")
    while True:
        user_input = input("\n你: ")
        if user_input.strip().lower() in ("exit", "quit"):
            break
        history.append({"role": "user", "content": user_input})

        finished = False
        for step in range(MAX_STEPS):
            resp = client.chat.completions.create(
                model=MODEL, messages=history, tools=TOOLS
            )
            if resp.usage:
                cost["prompt"] += resp.usage.prompt_tokens
                cost["completion"] += resp.usage.completion_tokens
            msg = resp.choices[0].message

            if not msg.tool_calls:  # 无工具调用 = 最终回答
                print(f"助手: {msg.content}")
                history.append({"role": "assistant", "content": msg.content or ""})
                finished = True
                break

            # 1) 原样追加 assistant（含 tool_calls）—— 漏掉这步直接 400
            history.append({
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                    }
                    for tc in msg.tool_calls
                ],
            })
            # 2) 逐个执行，每个调用都回一条 tool 消息
            for tc in msg.tool_calls:
                print(f"  [工具] {tc.function.name}({tc.function.arguments})")
                result = execute_tool(tc.function.name, tc.function.arguments)
                print(f"  [结果] {result}")
                history.append({"role": "tool", "tool_call_id": tc.id, "content": result})

        if not finished:
            print("[防护] 达到最大工具轮数，本轮终止")
            history.append({"role": "assistant", "content": "（这个任务未能在规定轮数内完成）"})
        print(f"  [成本] 累计 输入 {cost['prompt']} tok / 输出 {cost['completion']} tok")


if __name__ == "__main__":
    main()
