import pandas as pd
import json

# 1. 读取数据
df = pd.read_csv('data3.0.csv', encoding='utf-8-sig')

# 2. 各模块扣分函数（依据最新健康评分体系）
def hypertension_penalty(row):
    sbp, dbp = row['收缩压(mmHg)'], row['舒张压(mmHg)']
    if sbp >= 180 or dbp >= 110:
        return 8  # 重度
    if sbp >= 160 or dbp >= 100:
        return 5  # 中度
    if sbp >= 140 or dbp >= 90:
        return 2  # 轻度
    return 0      # 正常

def diabetes_penalty(row):
    gl = row['血糖(mmol/L)']
    if gl > 11.1:
        return 10  # 重度
    if gl >= 7.0:
        return 6   # 中度
    if gl >= 6.1:
        return 2   # 轻度
    return 0      # 正常

def coronary_penalty(row):
    tc, ldl, tg, ctni = (
        row['总胆固醇(TC)'], row['低密度脂蛋白(LDL)'],
        row['甘油三酯(TG)'], row['肌钙蛋白I(cTnI)']
    )
    if ctni > 0.04 or tc >= 7.8 or ldl >= 4.9 or tg >= 5.6:
        return 12  # 重度
    if tc >= 6.3 or ldl >= 3.9 or tg >= 2.3:
        return 8   # 中度
    if tc >= 5.2 or ldl >= 3.1 or tg >= 1.7:
        return 3   # 轻度
    return 0      # 正常

def stroke_penalty(row):
    nihss, mrs = row['NIHSS'], row['mRS']
    if nihss > 15 or mrs >= 5:
        return 15  # 重度
    if nihss >= 5 or mrs >= 3:
        return 10  # 中度
    if nihss >= 1 or mrs >= 1:
        return 5   # 轻度
    return 0      # 正常

def osteoporosis_penalty(row):
    bd, bmi = row['骨密度T值'], row['BMI']
    if bd <= -3.0:
        return 9   # 重度
    if bd <= -2.5 or bmi < 18.5:
        return 6   # 中度
    if bd < -1.0:
        return 3   # 轻度
    return 0      # 正常

def dementia_penalty(x):
    if x <= 9:
        return 14  # 重度
    if 10 <= x <= 18:
        return 10  # 中度
    if 19 <= x <= 23:
        return 5   # 轻度
    return 0      # 正常

def arthritis_penalty(row):
    vas = row['VAS_关节炎']
    if vas > 7:
        return 10  # 重度
    if vas >= 4:
        return 6   # 中度
    if vas >= 1:
        return 3   # 轻度
    return 0      # 正常

def cervical_penalty(row):
    vas = row['VAS_颈椎']
    if vas > 7:
        return 6   # 重度
    if vas >= 4:
        return 4   # 中度
    if vas >= 1:
        return 2   # 轻度
    return 0      # 正常

def lumbar_penalty(row):
    vas = row['VAS_腰椎']
    if vas > 7:
        return 6   # 重度
    if vas >= 4:
        return 4   # 中度
    if vas >= 1:
        return 2   # 轻度
    return 0      # 正常

def bowel_penalty(x):
    if x >= 3:
        return 0
    if x == 2:
        return 3
    if x == 1:
        return 6
    return 10      # <1次

def sleep_penalty(x):
    if x >= 4:
        return 0
    if x == 3:
        return 1
    if x == 2:
        return 3
    return 5       # 重度

# 3. 计算各模块扣分
df['高血压扣分'] = df.apply(hypertension_penalty, axis=1)
df['糖尿病扣分'] = df.apply(diabetes_penalty, axis=1)
df['冠心病扣分'] = df.apply(coronary_penalty, axis=1)
df['脑卒中扣分'] = df.apply(stroke_penalty, axis=1)
df['骨质疏松扣分'] = df.apply(osteoporosis_penalty, axis=1)
df['老年性痴呆扣分'] = df['MMSE'].apply(dementia_penalty)
df['关节炎扣分'] = df.apply(arthritis_penalty, axis=1)
df['颈椎病扣分'] = df.apply(cervical_penalty, axis=1)
df['腰椎间盘突出症扣分'] = df.apply(lumbar_penalty, axis=1)
df['排便频率扣分'] = df['排便频率(次/周)'].apply(bowel_penalty)
df['睡眠质量扣分'] = df['睡眠质量(1-5)'].apply(sleep_penalty)

# 4. 计算综合健康得分
penalty_cols = [
    '高血压扣分','糖尿病扣分','冠心病扣分','脑卒中扣分','骨质疏松扣分',
    '老年性痴呆扣分','关节炎扣分','颈椎病扣分','腰椎间盘突出症扣分',
    '排便频率扣分','睡眠质量扣分'
]
df['综合健康得分'] = 100 - df[penalty_cols].sum(axis=1)
df['综合健康得分'] = df['综合健康得分'].clip(lower=0)

# 5. 按年龄段分组并输出
bins = [60,65,70,75,80,85,90,95,100,105]
labels = ['60-64','65-69','70-74','75-79','80-84','85-89','90-94','95-99','100-104']
df['年龄段'] = pd.cut(df['年龄'], bins=bins, labels=labels, right=False)
age_summary = df.groupby('年龄段',observed=True)['综合健康得分'] \
    .agg(平均健康评分=('mean'), 人数=('count'), 标准差=('std')) \
    .round(2).reset_index()

records = age_summary.to_dict(orient='records')
with open('health_scores.json','w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print("已生成 health_scores.json：")
print(json.dumps(records, ensure_ascii=False, indent=2))
