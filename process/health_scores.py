import pandas as pd
import json

# 1. 读取数据
df = pd.read_csv('data2.0.csv', encoding='utf-8-sig')

# 2. 扣分权重体系
chronic_weights = {
    '高血压':2,'糖尿病':3,'冠心病':4,'脑卒中':5,
    '骨质疏松':3,'老年性痴呆':5,'关节炎':3,
    '颈椎病':2,'腰椎间盘突出症':2,'便秘':1
}
physio_rules = {
    '收缩压': {'bounds':[(140,159),(160,179),(180,float('inf'))],'pts':(2,4,6)},
    '舒张压': {'bounds':[(90,99),(100,109),(110,float('inf'))],'pts':(2,4,6)},
    '血糖':   {'bounds':[(6.1,6.9),(7.0,11.1),(11.1,float('inf'))],'pts':(3,5,8)},
    '胆固醇': {'bounds':[(5.2,6.2),(6.2,7.8),(7.8,float('inf'))],'pts':(2,4,6)},
    '心率':   {'bounds':[(50,59),(40,49),(float('-inf'),40)], 'pts':(1,3,4),
               'upper':[(101,120),(121,130),(130,float('inf'))]},
    'BMI':    {'bounds':[(24.0,27.9),(28.0,31.9),(32.0,float('inf'))],'pts':(2,4,6)},
    '骨密度': {'bounds':[(-2.5,-1.1),(-3.0,-2.5),(float('-inf'),-3.0)],   'pts':(1,2,4)}
}
def mmse_penalty(x):
    if x>=27: return 0
    if 21<=x<=26: return 3
    if 10<=x<=20: return 7
    return 10
def bowel_penalty(x):
    if x>=3: return 0
    if x==2: return 3
    if x==1: return 6
    return 10
def sleep_penalty(x):
    if x>=4: return 0
    if x==3: return 3
    if x==2: return 7
    return 10

# 3. 扣分计算函数
def calc_chronic_penalty(row):
    return sum(w for d,w in chronic_weights.items() if row.get(d,0)==1)
def calc_physio_penalty(row):
    p=0
    for key,rule in physio_rules.items():
        val=row[key]
        if key=='心率':
            for (lo,hi),pt in zip(rule['upper'],rule['pts']):
                if lo<=val<=hi:
                    p+=pt; break
            else:
                for (lo,hi),pt in zip(rule['bounds'],rule['pts']):
                    if lo<=val<=hi:
                        p+=pt; break
        else:
            for (lo,hi),pt in zip(rule['bounds'],rule['pts']):
                if lo<=val<=hi:
                    p+=pt; break
    return min(p,40)

# 4. 应用扣分并计算总分
df['慢性病扣分']=df.apply(calc_chronic_penalty,axis=1)
df['生理指标扣分']=df.apply(calc_physio_penalty,axis=1)
df['认知能力扣分']=df['MMSE'].apply(mmse_penalty)
df['排便频率扣分']=df['排便频率'].apply(bowel_penalty)
df['睡眠质量扣分']=df['睡眠质量'].apply(sleep_penalty)

df['综合健康得分']=100-df[[
    '慢性病扣分','生理指标扣分','认知能力扣分',
    '排便频率扣分','睡眠质量扣分'
]].sum(axis=1)
df['综合健康得分']=df['综合健康得分'].clip(lower=0)

# 5. 按年龄段分组
bins=[60,65,70,75,80,85,90,95,100,105]
labels=['60-64','65-69','70-74','75-79','80-84',
        '85-89','90-94','95-99','100-104']
df['年龄段']=pd.cut(df['年龄'],bins=bins,labels=labels,right=False)

# 6. 汇总为 JSON
age_summary=df.groupby('年龄段',observed=False)['综合健康得分']\
    .agg(平均健康评分=('mean'), 人数=('count'), 标准差=('std'))\
    .round(2).reset_index()

records=age_summary.to_dict(orient='records')
with open('health_scores.json','w',encoding='utf-8') as f:
    json.dump(records,f,ensure_ascii=False,indent=2)

print("已生成 health_scores.json：")
print(json.dumps(records,ensure_ascii=False,indent=2))
