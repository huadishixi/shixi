import os
import json

script_dir = os.path.dirname(os.path.abspath(__file__))

# 读取原始 txt 文件
with open(os.path.join(script_dir, "data", "医疗内容.txt"), "r", encoding="utf-8") as f:
    content = f.read()

# 用分隔线分割每条记录
items = content.strip().split("============================================================")

# 存放结果
result = []

for item in items:
    item = item.strip()
    if not item:
        continue

    # 按格式提取三段
    try:
        title_line = item.splitlines()[0].strip()
        link_line = item.splitlines()[1].strip()
        content_lines = item.splitlines()[2:]  # 剩下的都是内容

        title = title_line.replace("【标题】", "").strip()
        link = link_line.replace("【链接】", "").strip()
        body = "\n".join(content_lines).replace("【内容】", "").strip()

        result.append({
            "标题": title,
            "链接": link,
            "内容": body
        })

    except Exception as e:
        print(f"解析错误: {e}")
        continue

# 输出到 json 文件
with open(os.path.join(script_dir, "data", "医疗内容.json"), "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("转换完成，已保存为 医疗.json")
