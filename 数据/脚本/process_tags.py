import json
import os
import re
from collections import defaultdict
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

def simplify_trigger(trigger_list):
    simplified = []
    for t in trigger_list:
        t = t.strip()
        t = re.sub(r'^(被|有|没|不|很|非常|一直|永远|稍微|轻轻|只是)$', '', t)
        t = re.sub(r'(自动|分泌|高潮|喷射|硬挺|凸起|湿透|流水|发情|舒服|强烈|全身)$', '', t)
        t = re.sub(r'(男性|女性|男人|女人|老公|男友|丈夫|陌生人)$', '', t)
        t = re.sub(r'(一下|起来|过去|过来)$', '', t)
        t = t.strip()
        if t and len(t) >= 1:
            if t not in simplified:
                simplified.append(t)
    return simplified[:5] if simplified else trigger_list[:3]

def process_files():
    files = load_files()
    total_tags = 0
    modified_count = 0

    for file_num, data in files:
        tags = data.get('tags', [])
        file_changed = False

        for tag in tags:
            triggers = tag.get('触发条件', [])
            if len(triggers) > 0:
                original_len = len(triggers)
                simplified = simplify_trigger(triggers)
                if simplified != triggers:
                    tag['触发条件'] = simplified
                    file_changed = True
                    modified_count += 1

        if file_changed:
            filepath = os.path.join(BASE_DIR, f"{file_num}.txt")
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"简化完成! 共修改 {modified_count} 个标签")

def calculate_similarity(str1, str2):
    return SequenceMatcher(None, str1, str2).ratio()

def merge_similar_tags(threshold=0.75):
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

    for i, tag1 in enumerate(all_tags):
        if i in processed:
            continue

        group = [tag1]
        processed.add(i)

        for j, tag2 in enumerate(all_tags):
            if j <= i or j in processed:
                continue

            sim = calculate_similarity(
                ' '.join(tag1['triggers']),
                ' '.join(tag2['triggers'])
            )

            if sim >= threshold:
                group.append(tag2)
                processed.add(j)

        if len(group) > 1:
            merged.append(group)

    print(f"找到 {len(merged)} 组相似标签")

    for idx, group in enumerate(merged):
        print(f"\n处理组 {idx+1}/{len(merged)}:")
        print(f"  原始标签数: {len(group)}")

        merged_content = group[0]['content']
        merged_triggers = list(group[0]['triggers'])

        for g in group[1:]:
            merged_content = g['content']

        unique_triggers = set()
        for t in merged_triggers:
            unique_triggers.add(t)
            for g in group:
                unique_triggers.update(g['triggers'])

        merged_triggers = list(unique_triggers)[:6]

        group[0]['tag']['内容'] = merged_content
        group[0]['tag']['触发条件'] = merged_triggers

        print(f"  合并触发条件: {merged_triggers}")
        print(f"  合并内容: {merged_content[:50]}...")

        for g in group[1:]:
            g['tag']['内容'] = merged_content
            g['tag']['触发条件'] = merged_triggers

        for g in group:
            filepath = os.path.join(BASE_DIR, f"{g['file']}.txt")
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            for tag in data['tags']:
                if tag.get('id') == g['id']:
                    tag['内容'] = merged_content
                    tag['触发条件'] = merged_triggers
                    break

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n合并完成!")

if __name__ == "__main__":
    print("1. 简化触发条件")
    print("2. 合并相似标签 (阈值75%)")
    print("3. 全部执行")

    choice = input("请选择: ").strip()

    if choice == "1":
        process_files()
    elif choice == "2":
        merge_similar_tags(0.75)
    elif choice == "3":
        print("简化触发条件...")
        process_files()
        print("\n合并相似标签...")
        merge_similar_tags(0.75)
