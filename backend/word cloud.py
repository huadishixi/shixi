# import jieba
# from collections import Counter
# from wordcloud import WordCloud
# import matplotlib.pyplot as plt
# import re
#
# medical_keywords = [
#     "健康", "健康管理", "健康档案", "健康体检", "健康码", "健康证", "健康意识", "健康教育", "健康促进", "健康保险",
#     "健康饮食", "健康习惯", "健康风险", "健康筛查", "健康扶贫", "健康中国", "健康产业", "健康服务", "健康数据", "健康信息化",
#     "医疗服务", "医疗改革", "医疗保险", "医保", "医保支付", "医保政策", "医疗纠纷", "医疗风险", "医疗器械",
#     "医疗器械注册", "医疗设备", "医疗质量", "医疗水平", "医疗机构", "医疗资源", "医疗卫生", "医疗救助", "医疗体系", "医疗保障",
#     "医疗大数据", "智慧医疗", "数字医疗", "远程医疗", "互联网医疗", "基层医疗", "公立医院", "私立医院", "综合医院", "专科医院",
#     "社区医院", "三级医院", "二级医院", "乡镇卫生院", "护理", "护理服务", "护士", "护士长", "护理质量", "护理管理", "护士培训", "护理研究",
#     "临床", "临床护理", "临床医学", "临床试验", "临床研究", "医学", "基础医学", "转化医学", "预防医学", "精准医学",
#     "中医", "中医药", "中医治疗", "中医调理", "中西医结合", "药品", "药品管理", "药品审批", "药品研发", "新药",
#     "仿制药", "药企", "医药公司", "医药代表", "处方药", "非处方药", "药物安全", "药物临床", "疫苗", "疫苗接种",
#     "公共卫生", "传染病", "流行病", "疫情防控", "新冠", "核酸检测", "抗原检测", "抗疫", "免疫", "免疫治疗",
#     "基因检测", "基因编辑", "生物技术", "干细胞", "器官移植", "康复", "康复治疗", "康复医学", "康复中心", "康复护理",
#     "康复设备", "心理健康", "心理咨询", "心理疏导", "心理治疗", "精神卫生", "精神疾病", "抑郁症", "焦虑症", "精神分裂症",
#     "老年病", "慢病管理", "慢性病", "糖尿病", "高血压", "心脑血管", "心血管疾病", "癌症", "肿瘤", "肿瘤治疗",
#     "放疗", "化疗", "外科手术", "微创手术", "介入治疗", "病理", "病理学", "病理分析", "病理检测", "健康检测",
#     "医学影像", "核医学", "放射科", "超声科", "CT", "MRI", "B超", "心电图", "检验科", "化验",
#     "采血", "输血", "体外诊断", "精准诊断", "远程诊断","多学科会诊",
#     "急诊", "住院", "病房", "手术室", "无影灯", "麻醉", "麻醉科", "麻醉师", "ICU", "重症监护",
#     "护理床", "医疗耗材", "一次性耗材", "院感", "医院感染", "手卫生", "医疗废物", "医护", "医师", "执业医师",
#     "主治医师", "副主任医师", "主任医师", "住院医师", "医联体", "医共体", "分级诊疗", "双向转诊", "家庭医生", "签约医生"
# ]
#
# #读取文本
# with open('医疗内容.txt', 'r', encoding='utf-8') as f:
#     text = f.read()
#
# # 去除英文数字
# text = re.sub(r'[a-zA-Z0-9]', '', text)
#
# #分词
# words = jieba.cut(text)
# words = [w for w in words if len(w) > 1]  # 过滤单字词
#
# #只保留医疗关键词里的词
# filtered_words = [w for w in words if w in medical_keywords]
#
# # 统计词频
# word_counts = Counter(filtered_words)
#
# # 生成词云
# wc = WordCloud(
#     font_path='msyh.ttc',
#     width=1200,
#     height=800,
#     background_color='white'
# )
# wc.generate_from_frequencies(word_counts)
#
# # 显示和保存
# plt.imshow(wc, interpolation='bilinear')
# plt.axis('off')
# plt.show()
#
# wc.to_file('wordcloud.png')
#
# print("限定医疗热词的词云生成完毕")

import jieba
from collections import Counter
import json
import re

medical_keywords = []

with open('医学关键词.txt', 'r', encoding='utf-8') as f:
    for line in f:
        # 按制表符拆分，取第一个字段，去除首尾空白
        word = line.split('\t')[0].strip()
        if word:
            medical_keywords.append(word)
#读取文本
with open('医疗内容.txt', 'r', encoding='utf-8') as f:
    text = f.read()

#去除英文数字
text = re.sub(r'[a-zA-Z0-9]', '', text)

#分词，过滤单字词
import jieba
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
with open('word_freq.json', 'w', encoding='utf-8') as f_out:
    json.dump(word_freq_list, f_out, ensure_ascii=False, indent=2)

print("词频数据已保存到 word_freq.json")
