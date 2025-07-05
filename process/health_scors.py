import pandas as pd

# 读取数据
df = pd.read_csv("../data/data1.csv")

# 年龄段分类函数
def age_group(age):
    if age < 60:
        return None
    upper = (age // 5) * 5 + 4
    lower = upper - 4
    return f"{lower}-{upper}"

df["年龄段"] = df["年龄"].apply(age_group)

# 慢性病评分（共9种，每个疾病扣3.33分）
disease_cols = ["高血压", "冠心病", "脑卒中", "糖尿病", "骨质疏松", "老年性痴呆", "关节炎", "颈椎病", "腰椎间盘突出症"]
df["慢性病得分"] = 30 - df[disease_cols].sum(axis=1) * 3.33

# 生理指标评分
def physiological_score(row):
    score = 0
    # 收缩压（理想：90~139）
    if 90 <= row["收缩压"] <= 139:
        score += 6
    else:
        score += max(0, 6 - abs(row["收缩压"] - 120) * 0.1)

    # 舒张压（理想：60~89）
    if 60 <= row["舒张压"] <= 89:
        score += 6
    else:
        score += max(0, 6 - abs(row["舒张压"] - 75) * 0.1)

    # 血糖（理想：70~140）
    if 70 <= row["血糖"] <= 140:
        score += 6
    else:
        score += max(0, 6 - abs(row["血糖"] - 100) * 0.1)

    # 胆固醇（理想：<200）
    if row["胆固醇"] < 200:
        score += 6
    else:
        score += max(0, 6 - (row["胆固醇"] - 200) * 0.05)

    # 心率（理想：60–100）
    if 60 <= row["心率"] <= 100:
        score += 6
    else:
        score += max(0, 6 - abs(row["心率"] - 80) * 0.1)

    # 骨密度（假设大于0.8较好）
    if row["骨密度"] >= 0.8:
        score += 10
    else:
        score += max(0, row["骨密度"] / 0.8 * 10)

    return min(score, 40)

df["生理指标得分"] = df.apply(physiological_score, axis=1)

# MMSE（满分30）
def mmse_score(mmse):
    if mmse >= 27:
        return 20
    elif mmse >= 24:
        return 15
    else:
        return 10

df["认知功能得分"] = df["MMSE"].apply(mmse_score)

# 排便频率（每天1次 → 满分10）
def bowel_score(freq):
    if freq >= 1:
        return 10
    else:
        return max(0, freq / 1 * 10)

df["生活习惯得分"] = df["排便频率"].apply(bowel_score)

# 计算总分
df["健康总评分"] = df["慢性病得分"] + df["生理指标得分"] + df["认知功能得分"] + df["生活习惯得分"]

# 分年龄段统计平均分
result = df.groupby("年龄段")["健康总评分"].mean().reset_index()
result.columns = ["年龄段", "平均健康评分"]

# 输出结果
print(result)
