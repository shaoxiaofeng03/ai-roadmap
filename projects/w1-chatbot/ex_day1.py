# dict 增删改查、list 推导式（filter+map）、f-string、try/except
# 初始化和赋值修改
l1 = [1,2,5,6,8]
l1.append(9)
print(l1)
l1[0] = 4
print(l1)
l1.insert(2, 7)
print(l1)
del l1[2]
print(l1)

for x in l1:
    print(x)

print(l1[1:])
print(l1[1:4])
print(l1[:4])
print(l1[:])
print(l1[::2])
print(l1[::-1])

# dict
d1={"name":"张三","age":20}
print(d1["name"])
print(d1["age"])
d1["score"] = 90
print(d1)
del d1["score"]
print(d1)
d1["score"] = 90
for k, v in d1.items():
    print(k, v)
d1["score"] = d1.get("score", 0) +1
print(d1["score"])
d1.setdefault("score", 50)
print(d1["score"])
name = d1["name"]
score = d1["score"]
print(f"hello {name} your score is {score:8.2f}")
l2 = [ x * x for x in l1]
print(l2)
l2 = [ x * x for x in l1 if x % 2 == 0]
print(l2)

for i in range(10):
    print(i)

try:
    for i in range(10):
        print(i)
except (ValueError, IndexError) as e1:
    print(e1)
except Exception as e:
    print(e)
finally:
    print("finally")

def count_down(n):
    while n > 0:
        yield n
        n -= 1
for i in count_down(4):
    print(i)

cd = count_down(6)
print(next(cd))
print(next(cd))
print(next(cd))
print(next(cd))
print(next(cd))