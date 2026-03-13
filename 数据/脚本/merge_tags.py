import json
import os
from difflib import SequenceMatcher

BASE_DIR = r"c:\Users\yf217\Desktop\aichat\开发\开发5.0（故事生成器）\8.0\js\plugins\adult-tags\user-content"

def load_files():
    files = []
    for i in range(1, 33):
        filepath = os.path.join(BASE_DIR, f"{i}.txt")
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                files.append((i, data))
    return files

def calculate_similarity(str1, str2):
    return SequenceMatcher(None, str1, str2).ratio()

files = load_files()
all_tags = []

for file_num, data in files:
    for tag in data.get('tags', []):
        triggers = tuple(sorted(tag.get('触发条件', [])))
        content = tag.get('内容', '')
        all_tags.append({
            'file': file_num,
            'id': tag.get('id'),
            'triggers': triggers,
            'content': content,
            'tag': tag
        })

merged = []
processed = set()
threshold = 0.75

for i, tag1 in enumerate(all_tags):
    if i in processed:
        continue
    group = [tag1]
    processed.add(i)
    for j, tag2 in enumerate(all_tags):
        if j <= i or j in processed:
            continue
        sim = calculate_similarity(' '.join(tag1['triggers']), ' '.join(tag2['triggers']))
        if sim >= threshold:
            group.append(tag2)
            processed.add(j)
    if len(group) > 1:
        merged.append(group)

print(f"找到 {len(merged)} 组相似标签，每组平均 {sum(len(g) for g in merged)/len(merged):.1f} 个")

total_removed = 0

for idx, group in enumerate(merged):
    unique_triggers = set()
    for t in group[0]['triggers']:
        unique_triggers.add(t)
    for g in group[1:]:
        unique_triggers.update(g['triggers'])
    merged_triggers = list(unique_triggers)[:6]
    merged_content = group[-1]['content']

    group[0]['tag']['触发条件'] = merged_triggers
    group[0]['tag']['内容'] = merged_content

    filepath = os.path.join(BASE_DIR, f"{group[0]['file']}.txt")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for tag in data['tags']:
        if tag.get('id') == group[0]['id']:
            tag['触发条件'] = merged_triggers
            tag['内容'] = merged_content
            break
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    for g in group[1:]:
        filepath = os.path.join(BASE_DIR, f"{g['file']}.txt")
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        original_count = len(data['tags'])
        data['tags'] = [t for t in data['tags'] if t.get('id') != g['id']]
        removed_count = original_count - len(data['tags'])
        total_removed += removed_count
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    if idx % 50 == 0:
        print(f"已处理 {idx+1}/{len(merged)} 组")

print(f"\n合并完成! 共删除了 {total_removed} 个重复标签")
