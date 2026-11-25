# 01 · Python 速成（Java 开发者版）

> **D2 主教材**，约 90 分钟读完 + 动手。目标不是精通 Python，而是：能写本周的代码、能读懂报错、能查文档。
> 所有示例都可以存成 `try.py` 用 `uv run try.py` 直接跑。

---

## 1. 心智模型：Python 和 Java 的五个根本差异

1. **动态类型**：变量没有类型声明，值有类型。`x = 1` 之后 `x = "hi"` 完全合法。类型提示（type hints）只是注释性质，运行时不强制。
2. **解释执行**：没有编译期检查，很多错误（拼错属性名、类型不对）要到运行时才炸。所以 Python 社区极度依赖测试和 linter。
3. **缩进即语法**：没有 `{}`，代码块靠 4 空格缩进。混用 tab 和空格直接报错。
4. **一切皆对象**：函数、类、模块都是对象，可以赋值、传参、返回。装饰器（≈ 注解+AOP）就是"接收函数返回函数"的高阶函数。
5. **鸭子类型**：不关心你是什么类，只关心你有没有这个方法。没有 `implements`，协议靠约定（后期会学 `Protocol` / pydantic）。

## 2. 工具链（你的机器已就绪）

| 操作 | 命令 | Java 类比 |
|---|---|---|
| 同步依赖 | `uv sync` | `mvn install` |
| 加依赖 | `uv add requests` | 改 pom + install |
| 跑脚本 | `uv run xxx.py` | `mvn exec:java` |
| 进虚拟环境 | `source .venv/Scripts/activate`（Git Bash） | 项目私有 JDK |
| 装 Python | `uv python install 3.12` | 装 JDK |

- `pyproject.toml` ≈ `pom.xml`；`.venv/` ≈ 项目私有的依赖仓库，**不提交 git**。
- uv 已装（0.13.8），Python 3.13.7 已装，本项目依赖已 sync 完。

## 3. 基础语法

```python
# 变量与基本类型：int / float / str / bool / None（≈ null）
name = "南京"          # str，单双引号等价
count = 42             # int，无长度限制（没有 long 溢出问题）
ratio = 0.7            # float
ok = True              # 注意首字母大写：True / False / None
nothing = None

# f-string ≈ String.format，但更强
print(f"{name} 有 {count} 个区，比例 {ratio:.2%}")   # :.2% 格式化

# 运算符
5 / 2      # 2.5  真除法（Java 里是 2！）
5 // 2     # 2    整除
5 % 2      # 1
2 ** 10    # 1024 幂

# 条件：没有括号和花括号，靠冒号 + 缩进
if count > 40:
    print("多")
elif count > 10:
    print("中")
else:
    print("少")

# 三元表达式
label = "多" if count > 40 else "少"

# 循环
for i in range(5):          # 0,1,2,3,4 ≈ for(int i=0;i<5;i++)
    print(i)
for i, ch in enumerate("abc"):   # 带下标遍历
    print(i, ch)
while count > 0:
    count -= 1              # 没有 count-- 这种写法

# 真值判断：空容器 / 0 / "" / None 都是 False
xs = []
if not xs:                  # ≈ if (xs == null || xs.isEmpty())
    print("空列表")
```

## 4. 数据结构（本周只用 list 和 dict，务必熟练）

```python
# list ≈ ArrayList
xs = [1, 2, 3]
xs.append(4)                # add
xs[0]                       # get(0)，负数下标从尾部数：xs[-1] 是最后一个
xs[1:3]                     # 切片 [2,3]（subList 的语法糖）
len(xs)                     # size()
3 in xs                     # contains

# dict ≈ HashMap（保持插入顺序）
d = {"city": "南京", "temp": 18}
d["city"]                   # get，key 不存在会抛 KeyError！
d.get("city")               # 安全 get，不存在返回 None
d.get("zip", "000000")      # ≈ getOrDefault
d["zip"] = "210000"         # put
del d["zip"]                # remove
"city" in d                 # containsKey
for k, v in d.items():      # entrySet 遍历
    print(k, v)

# tuple：不可变 list，常用于多返回值
point = (1, 2)
x, y = point                # 解构赋值（Java 没有的爽点）

# set ≈ HashSet
s = {1, 2, 3}
s.add(4)

# 列表推导式 ≈ Stream（本周高频）
nums = [1, -2, 3, -4]
positives = [x for x in nums if x > 0]          # filter
doubled   = [x * 2 for x in nums]               # map
combined  = [x * 2 for x in nums if x > 0]      # filter + map
# dict 推导式：{key: value for ...}
cities = [{"city": "南京", "temp": 18}, {"city": "上海", "temp": 21}]
by_name = {c["city"]: c["temp"] for c in cities}   # {'南京': 18, '上海': 21}
```

## 5. 函数

```python
def greet(name: str, greeting: str = "你好") -> str:   # 类型提示可选，默认参数 ≈ 重载
    return f"{greeting}, {name}"

greet("南京")                    # 你好, 南京
greet("南京", greeting="早上好")  # 关键字参数

def total(*args, **kwargs):      # *args=可变位置参数(tuple)，**kwargs=可变关键字参数(dict)
    print(args, kwargs)
total(1, 2, city="南京")         # (1, 2) {'city': '南京'}

# lambda ≈ 箭头函数，只能写单表达式
square = lambda x: x * x

# ⚠️ 头号大坑：可变默认参数全调用共享！
def bad(x, items=[]):            # 错！这个 [] 只创建一次
    items.append(x)
    return items
def good(x, items=None):         # 对：None 占位，内部初始化
    if items is None:
        items = []
    items.append(x)
    return items
```

## 6. 类（本周够用的最小集）

```python
class ChatSession:
    def __init__(self, system_prompt: str):   # 构造器
        self.history = [{"role": "system", "content": system_prompt}]  # self ≈ this，必须显式写

    def add_user(self, text: str):            # 实例方法第一个参数永远是 self
        self.history.append({"role": "user", "content": text})

s = ChatSession("你是助手")     # 没有 new 关键字
s.add_user("你好")
```

本周脚本用函数就够，类在 W4（FastAPI）会大量出现。

## 7. 模块与导入

```python
import os                       # ≈ import java.lang.*（整包）
from openai import OpenAI       # ≈ import 具体类
from dotenv import load_dotenv

# 每个 .py 文件就是一个模块。脚本入口惯例：
if __name__ == "__main__":      # ≈ public static void main：仅直接运行时执行，被 import 时不执行
    main()
```

## 8. 异常（没有 checked exception）

```python
import json
try:
    args = json.loads('{"city": "南京"}')
    city = args["city"]
except json.JSONDecodeError as e:      # 具体异常在前
    print(f"JSON 解析失败: {e}")
except KeyError as e:
    print(f"缺字段: {e}")
except Exception as e:                 # 兜底（≈ catch Exception）
    print(f"未知错误: {e}")
finally:
    print("总会执行")

# 主动抛：raise ValueError("参数不合法")
```

常见异常速查：`KeyError`（dict 缺 key）、`IndexError`（下标越界）、`TypeError`（类型不对）、`AttributeError`（属性/方法不存在，≈ 拼错方法名）、`ValueError`、`json.JSONDecodeError`。**读报错从最后一行看起， traceback 自底向上找自己的代码行。**

## 9. 文件与 JSON（≈ Jackson）

```python
import json

# with ≈ try-with-resources，自动关闭
with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)              # readValue（从文件）

obj = json.loads('{"a": 1}')         # readValue（从字符串）
text = json.dumps(obj, ensure_ascii=False)   # writeValueAsString；ensure_ascii=False 让中文原样输出
with open("out.json", "w", encoding="utf-8") as f:
    json.dump(obj, f, ensure_ascii=False, indent=2)
```

## 10. 环境变量与 .env

```python
import os
from dotenv import load_dotenv

load_dotenv()                        # 读取当前目录 .env 到环境变量（≈ application.yml）
key = os.getenv("DEEPSEEK_API_KEY")  # System.getenv；不存在返回 None
key = os.getenv("XX", "默认值")       # 带默认值
```

## 11. 迭代器与生成器（理解流式输出的关键！）

```python
# 可迭代对象：list/dict/文件/SDK 的 stream 返回值，都能用 for 遍历
# 生成器：用 yield 的函数，调用时不执行，每次 next() 才推进到下一个 yield
def countdown(n):
    while n > 0:
        yield n        # "产出一个值，暂停在这"
        n -= 1

for x in countdown(3):   # 3, 2, 1 —— 惰性求值，不会一次性算完
    print(x)
```

**为什么重要**：`client.chat.completions.create(stream=True)` 返回的就是一个迭代器——模型每生成一小段就产出一个 chunk，你 `for` 一次拿一段。这和 Java 的 `Stream`/`Iterator` 惰性求值是一个思想，也是 SSE 的客户端形态。

## 12. async/await（本周不用，先混个脸熟）

`async def` + `await` ≈ `CompletableFuture` 的语法糖版，W4 学 FastAPI 时再深入。本周所有代码用同步写法即可。

## 13. 坑清单（Java 肌肉记忆害你的地方）

1. 缩进混用 tab/空格 → `TabError`，统一 4 空格
2. `def f(x=[])` 可变默认参数共享 → 用 `None` 占位
3. `5/2 == 2.5` 不是 2；整除用 `//`
4. `==` 是值比较（≈ equals），`is` 是引用比较；判空用 `is None`
5. `d["不存在的key"]` 抛 KeyError，安全取值用 `.get()`
6. 字符串不可变（同 Java），大量拼接用 `"".join(parts)` 而不是 `+=`
7. 没有 `++`/`--`；`x += 1`
8. 布尔是 `True/False`（大写），逻辑运算用 `and/or/not`（不是 `&&/||/!`）
9. 中文输出乱码：文件读写显式 `encoding="utf-8"`；`json.dumps` 加 `ensure_ascii=False`
10. `.env` 和 `.venv/` 不提交 git

## 14. 学完自测

- [ ] 能不看资料写出：dict 增删改查、list 推导式（filter+map）、f-string、try/except
- [ ] 能解释 `yield` 和迭代器的关系
- [ ] 完成 `05-exercises.md` 的 D2 练习
