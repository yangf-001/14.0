import json
import os

BASE_DIR = r"c:\Users\yf217\Desktop\aichat\开发\开发5.0（故事生成器）\8.0\js\plugins\adult-tags\user-content"

total_tags = 0

for i in range(1, 33):
    filepath = os.path.join(BASE_DIR, f"{i}.txt")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        tags = data.get('tags', [])
        total_tags += len(tags)

        for idx, tag in enumerate(tags):
            tag['id'] = idx + 1

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"文件 {i}.txt: {len(tags)} 个标签")

print(f"\n总计: {total_tags} 个标签")
print("编号更新完成!")
