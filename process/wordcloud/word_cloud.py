import os
import jieba
from collections import Counter
import json
import re

medical_keywords = []

script_dir = os.path.dirname(os.path.abspath(__file__))

static_dir = os.path.abspath(os.path.join(script_dir, "../../static"))

with open(os.path.join(script_dir, "data", "医疗关键词.txt"), 'r', encoding='utf-8') as f:
    for line in f:
        # 按制表符拆分，取第一个字段，去除首尾空白
        word = line.split('\t')[0].strip()
        if word:
            medical_keywords.append(word)
#读取文本
with open(os.path.join(script_dir, "data", "医疗关键词.txt"), 'r', encoding='utf-8') as f:
    text = f.read()

#去除英文数字
text = re.sub(r'[a-zA-Z0-9]', '', text)

#分词，过滤单字词
words = jieba.cut(text)
words = [w for w in words if len(w) > 1]

#过滤医疗关键词
filtered_words = [w for w in words if w in medical_keywords]

#统计词频
from collections import Counter
word_counts = Counter(filtered_words)

#生成词频列表，格式符合ECharts需要
word_freq_list = [{"name": k, "value": v} for k, v in word_counts.items()]

#导出为JSON文件
with open(os.path.join(static_dir, "dataset", "word_freq.json"), 'w', encoding='utf-8') as f_out:
    json.dump(word_freq_list, f_out, ensure_ascii=False, indent=2)

print("词频数据已保存到 word_freq.json")

word_news_map = {}

for item in medical_data:
    title = item["标题"]
    url = item["链接"]
    content = item["内容"]

    content = re.sub(r'[a-zA-Z0-9]','',content)
    words = jieba.cut(content)
    words = [w for w in words if len(w) > 1 and w in medical_keywords]

    unique_words = set(words)
    for w in unique_words:
        if w in unique_words:
            if w not in word_news_map:
                word_news_map[w] = []
            word_news_map[w].append({
                'title': title,
                'url': url
            })
with open(os.path.join(static_dir, "dataset", "word_news.json"),'w',encoding='utf-8') as f:
    json.dump(word_news_map, f, ensure_ascii=False, indent=2)
