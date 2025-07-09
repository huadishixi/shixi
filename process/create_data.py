import numpy as np  # 数值计算库
import pandas as pd  # 数据处理库
import random  # 随机数生成库
from faker import Faker  # 用于生成假数据

# 初始化 Faker，用于生成中文姓名
fake = Faker('zh_CN')

# 设置随机种子以保证结果可复现
np.random.seed(42)
random.seed(42)

# ========== 1. 省份列表与人口权重 ==========
provinces = [
    '北京市','天津市','上海市','重庆市',
    '河北省','山西省','辽宁省','吉林省','黑龙江省',
    '江苏省','浙江省','安徽省','福建省','江西省','山东省',
    '河南省','湖北省','湖南省','广东省','海南省',
    '四川省','贵州省','云南省','陕西省','甘肃省',
    '青海省','台湾省','内蒙古自治区','广西壮族自治区',
    '西藏自治区','宁夏回族自治区','新疆维吾尔自治区',
    '香港特别行政区','澳门特别行政区'
]
# 人口权重（单位：百万），用于加权抽样省份
province_weights = {
    '北京市':21.89, '天津市':13.86, '上海市':24.87, '重庆市':32.02,
    '河北省':74.65, '山西省':37.05, '辽宁省':43.59, '吉林省':24.17, '黑龙江省':31.11,
    '江苏省':85.05, '浙江省':64.57, '安徽省':61.13, '福建省':39.41, '江西省':45.18, '山东省':101.52,
    '河南省':99.37, '湖北省':57.75, '湖南省':66.44, '广东省':126.01, '海南省':9.48,
    '四川省':83.75, '贵州省':38.56, '云南省':48.31, '陕西省':39.53, '甘肃省':26.38,
    '青海省':6.03, '台湾省':23.57, '内蒙古自治区':25.34, '广西壮族自治区':50.12,
    '西藏自治区':3.65, '宁夏回族自治区':7.21, '新疆维吾尔自治区':25.85,
    '香港特别行政区':7.37, '澳门特别行政区':0.68
}

# ========== 2. 各省慢性病患病率（示例来源：PDF“2020年后官方数据”） ==========
province_disease_prevalence = {
    '高血压': {
        '北京市':0.359,'天津市':0.345,'上海市':0.291,'重庆市':0.275,'河北省':0.278,'山西省':0.275,'内蒙古自治区':0.270,
        '辽宁省':0.274,'吉林省':0.275,'黑龙江省':0.275,'江苏省':0.275,'浙江省':0.275,'安徽省':0.275,'福建省':0.275,
        '江西省':0.275,'山东省':0.275,'河南省':0.275,'湖北省':0.275,'湖南省':0.277,'广东省':0.186,'海南省':0.275,
        '四川省':0.275,'贵州省':0.2878,'云南省':0.275,'陕西省':0.275,'甘肃省':0.2385,'青海省':0.275,'台湾省':0.275,
        '广西壮族自治区':0.275,'西藏自治区':0.275,'宁夏回族自治区':0.275,'新疆维吾尔自治区':0.275,'香港特别行政区':0.275,
        '澳门特别行政区':0.275
    },
    '糖尿病': {
        '北京市':0.157,'天津市':0.157,'上海市':0.111,'重庆市':0.130,'河北省':0.157,'山西省':0.157,'内蒙古自治区':0.199,
        '辽宁省':0.157,'吉林省':0.157,'黑龙江省':0.157,'江苏省':0.128,'浙江省':0.128,'安徽省':0.128,'福建省':0.111,
        '江西省':0.128,'山东省':0.157,'河南省':0.157,'湖北省':0.128,'湖南省':0.112,'广东省':0.104,'海南省':0.111,
        '四川省':0.130,'贵州省':0.062,'云南省':0.130,'陕西省':0.128,'甘肃省':0.128,'青海省':0.128,'台湾省':0.128,
        '广西壮族自治区':0.111,'西藏自治区':0.128,'宁夏回族自治区':0.128,'新疆维吾尔自治区':0.128,'香港特别行政区':0.128,
        '澳门特别行政区':0.128
    },
    # 其余疾病使用全国平均值（示例）
    '冠心病':         {prov:0.010  for prov in provinces},  # 全国约1.0%
    '脑卒中':         {prov:0.0147 for prov in provinces},  # 全国约1.47%
    '骨质疏松':       {prov:0.192  for prov in provinces},  # 50岁+约19.2%
    '老年性痴呆':     {prov:0.060  for prov in provinces},  # 60岁+约6.0%
    '关节炎':         {prov:0.130  for prov in provinces},  # 全国约13%
    '颈椎病':         {prov:0.200  for prov in provinces},  # 全国约20%
    '腰椎间盘突出症': {prov:0.152  for prov in provinces},  # 全国约15.2%
    '便秘':           {prov:0.134  for prov in provinces}   # 全国约13.4%
}

# ========== 3. 年龄分布定义 ==========
group_defs  = ['60-64','65-69','70-74','75-79','80-84','85-89','90+']
group_probs = [0.18, 0.22, 0.20, 0.15, 0.12, 0.08, 0.05]  # 示例分布

# ========== 4. 样本生成 ==========
n_samples = 100000
data = []

for _ in range(n_samples):
    # 基本信息
    name  = fake.name()
    gender= random.choice(['男','女'])
    # 年龄
    age_group = np.random.choice(group_defs, p=group_probs)
    if age_group == '90+':
        age = random.randint(90, 100)
    else:
        low, high = map(int, age_group.split('-'))
        age = random.randint(low, high)
    # 身高、体重、BMI
    height = round(np.clip(np.random.normal(1.65, 0.07), 1.45, 1.85), 2)
    weight = round(np.clip(np.random.normal(60, 10), 40, 90), 2)
    bmi    = round(weight / (height**2), 2)
    # 出生省份：按人口权重加权抽样
    birthplace = random.choices(provinces,
                               weights=[province_weights[p] for p in provinces],
                               k=1)[0]

    # ----- 疾病标志生成：省级真实患病率 + 年龄微调 -----
    hypertension = int(
        np.random.rand() < province_disease_prevalence['高血压'][birthplace] + (age-60)*0.005
    )
    diabetes     = int(
        np.random.rand() < province_disease_prevalence['糖尿病'][birthplace]   + (age-60)*0.004
    )
    coronary     = int(
        np.random.rand() < province_disease_prevalence['冠心病'][birthplace]   + (age-60)*0.003
    )
    stroke       = int(
        np.random.rand() < province_disease_prevalence['脑卒中'][birthplace]     + (age-60)*0.002
    )
    osteoporosis = int(
        np.random.rand() < province_disease_prevalence['骨质疏松'][birthplace] + (age-60)*0.006
    )
    dementia     = int(
        np.random.rand() < province_disease_prevalence['老年性痴呆'][birthplace] + (age-60)*0.001
    )
    arthritis    = int(
        np.random.rand() < province_disease_prevalence['关节炎'][birthplace]    + (age-60)*0.004
    )
    cervical     = int(
        np.random.rand() < province_disease_prevalence['颈椎病'][birthplace]    + (age-60)*0.003
    )
    lumbar       = int(
        np.random.rand() < province_disease_prevalence['腰椎间盘突出症'][birthplace] + (age-60)*0.002
    )
    constipation = int(
        np.random.rand() < province_disease_prevalence['便秘'][birthplace]    + (age-60)*0.002
    )

    # 骨质疏松患者体重微调 & 重新计算 BMI
    if hypertension:
        sbp_ranges = [(140, 159), (160, 179), (180, 200)]
        systolic = round(random.uniform(*random.choice(sbp_ranges)), 2)
        dbp_ranges = [(90, 99), (100, 109), (110, 130)]
        diastolic = round(random.uniform(*random.choice(dbp_ranges)), 2)
    else:
        sm = 125 + (age-60)*0.3
        systolic = round(np.clip(np.random.normal(sm, 10), 90, 180), 2)
        dm = 80 + (age-60)*0.15
        diastolic = round(np.clip(np.random.normal(dm, 8), 60, 110), 2)

    # 糖尿病：空腹血糖 FPG
    if diabetes:
        fpg_ranges = [(6.1, 6.9), (7.0, 11.1), (11.1, 15.0)]
        glucose = round(random.uniform(*random.choice(fpg_ranges)), 2)
    else:
        gm = 5.5 + (age-60)*0.01
        glucose = round(np.clip(np.random.normal(gm, 1.2), 3.0, 15.0), 2)

    # 冠心病：血脂及肌钙蛋白
    if coronary:
        tc = round(random.uniform(5.2, 10.0), 2)
        ldl = round(random.uniform(3.1, 6.0), 2)
        hdl = round(random.uniform(0.3, 1.0) if gender=='女' else random.uniform(0.2, 0.9), 2)
        tg = round(random.uniform(1.7, 6.0), 2)
        ctni = round(random.uniform(0.04, 2.0), 3)
    else:
        tc = round(np.clip(np.random.normal(4.5 + (age-60)*0.02, 0.8), 3.0, 7.0), 2)
        ldl = round(np.clip(np.random.normal(2.5 + (age-60)*0.015, 0.6), 1.0, 4.0), 2)
        hdl = round(np.clip(np.random.normal(1.2 if gender=='女' else 1.0, 0.2), 0.8, 2.0), 2)
        tg = round(np.clip(np.random.normal(1.2 + (age-60)*0.01, 0.5), 0.5, 4.0), 2)
        ctni = round(np.clip(np.random.normal(0.01, 0.005), 0.001, 0.05), 3)

    # 脑卒中：NIHSS、mRS 和缺血灶面积
    if stroke:
        nihss = random.randint(5, 25)
        mrs = random.randint(2, 6)
        infarct_area = round(random.uniform(1.0, 15.0), 2)
    else:
        nihss = random.randint(0, 1)
        mrs = random.randint(0, 1)
        infarct_area = round(random.uniform(0.0, 1.0), 2)

    # 关节炎：CRP、ESR、VAS 评分
    if arthritis:
        crp = round(random.uniform(10.0, 50.0), 1)
        esr = random.randint(26, 80)
        vas_arth = random.randint(4, 10)
    else:
        crp = round(np.clip(np.random.normal(3.0, 2.0), 0.1, 10.0), 1)
        esr = random.randint(0, 15 if gender=='男' else 20)
        vas_arth = random.randint(0, 1)

    # 颈椎病：活动角度和 VAS 评分
    if cervical:
        angle_cerv = round(random.uniform(0, 60), 1)
        vas_cerv = random.randint(4, 10)
    else:
        angle_cerv = round(random.uniform(60, 90), 1)
        vas_cerv = random.randint(0, 1)

    # 腰椎间盘突出：SLR 角度和 VAS 评分
    if lumbar:
        slr_angle = round(random.uniform(0, 50), 1)
        vas_lum = random.randint(4, 10)
    else:
        slr_angle = round(random.uniform(70, 90), 1)
        vas_lum = random.randint(0, 1)

    # 骨质疏松：骨密度 T 值
    if osteoporosis:
        bone_density = round(random.uniform(-4.0, -1.1), 2)
    else:
        bdm = -1.0 - (age-60)*0.03
        bone_density = round(np.clip(np.random.normal(bdm, 0.8), -4, 1), 2)

    # 老年性痴呆：MMSE 评分
    if dementia:
        mmse = random.randint(10, 26)
    else:
        mm = np.random.normal(27 - (age-60)*0.07, 2.5)
        mmse = int(round(np.clip(mm, 15, 30)))

    # 排便频率和睡眠质量
    if constipation:
        bowel_freq = random.choice([0, 1, 2])
    else:
        bowel_freq = random.choice([3, 4, 5])
    sleep_quality = int(round(
        np.clip(np.random.normal(3.5 - (age-60)*0.01, 0.8), 1, 5)
    ))

    # 汇总数据行到列表
    data.append([
        name, gender, age, birthplace,
        height, weight, bmi,
        hypertension, diabetes, coronary, stroke, osteoporosis, dementia, arthritis, cervical, lumbar, constipation,
        systolic, diastolic, glucose, tc, ldl, hdl, tg, ctni,
        nihss, mrs, infarct_area, crp, esr, vas_arth,
        angle_cerv, vas_cerv, slr_angle, vas_lum,
        bone_density, mmse, bowel_freq, sleep_quality
    ])


# ========== 5. 保存 & 输出 ==========
# 构建 DataFrame 并保存为 CSV
columns = [
    '姓名','性别','年龄','出生省份',
    '身高(m)','体重(kg)','BMI',
    '高血压','糖尿病','冠心病','脑卒中','骨质疏松','老年性痴呆','关节炎','颈椎病','腰椎间盘突出症','便秘',
    '收缩压(mmHg)','舒张压(mmHg)','血糖(mmol/L)',
    '总胆固醇(TC)','低密度脂蛋白(LDL)','高密度脂蛋白(HDL)','甘油三酯(TG)','肌钙蛋白I(cTnI)',
    'NIHSS','mRS','缺血灶面积(cm²)',
    'CRP(mg/L)','ESR(mm/h)','VAS_关节炎',
    '颈椎活动角度(°)','VAS_颈椎',
    'SLR角度(°)','VAS_腰椎',
    '骨密度T值','MMSE','排便频率(次/周)','睡眠质量(1-5)'
]
df = pd.DataFrame(data, columns=columns)
df.to_csv('data3.0.csv', index=False)

# 输出 JSON 格式的各省疾病统计
counts = df.groupby('出生省份')[
    ['高血压','糖尿病','冠心病','脑卒中','骨质疏松','老年性痴呆','关节炎','颈椎病','腰椎间盘突出症','便秘']
].sum()
counts.to_json(
    'data3.0.json',
    force_ascii=False,
    orient='index',
    indent=4  # 指定 4 个空格缩进
)
