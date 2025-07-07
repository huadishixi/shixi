import json

import pandas as pd
import os

# 假设你在shixi/process/health_score.py中运行
current_dir = os.path.dirname(__file__)
data_path = os.path.join(current_dir, "../data/data0705-3.csv")
output_path = os.path.join(current_dir, "../data/output/health_scores.json")

df = pd.read_csv(data_path)

# 年龄段划分
def age_group(age):
    if age < 60:
        return None
    upper = (age // 5) * 5 + 4
    lower = upper - 4
    return f"{lower}-{upper}"

df["年龄段"] = df["年龄"].apply(age_group)

disease_weights = {
    "脑卒中": 9,
    "冠心病": 7,
    "糖尿病": 6,
    "高血压": 4,
    "老年性痴呆": 7,
    "骨质疏松": 4,
    "关节炎": 2,
    "颈椎病": 1.5,
    "腰椎间盘突出症": 1.5
}

# # 疾病评分：9种，每种疾病扣3.33分，最高30分
# disease_cols = ["高血压", "冠心病", "脑卒中", "糖尿病", "骨质疏松", "老年性痴呆", "关节炎", "颈椎病", "腰椎间盘突出症"]
# df["慢性病得分"] = 30 - df[disease_cols].sum(axis=1) * 3.33

# 优化版：差异化疾病扣分，总分从30改为最多 42.5（也可以不限制满分）
def calc_disease_score(row):
    total = 0
    for disease, weight in disease_weights.items():
        if row[disease] == 1:
            total += weight
    return max(0, 30 - total)  # 如果你希望保留总分为30分上限，可以使用这个
    # return max(0, 100 - total)  # 如果你想让健康总评分上限仍为100，可按实际设置

df["慢性病得分"] = df.apply(calc_disease_score, axis=1)

# 生理指标评分函数（共35分）
def physiological_score(row):
    score = 0

    # 收缩压（理想 90–139）
    if 90 <= row["收缩压"] <= 139:
        score += 6
    else:
        score += max(0, 6 - abs(row["收缩压"] - 120) * 0.1)

    # 舒张压（理想 60–89）
    if 60 <= row["舒张压"] <= 89:
        score += 6
    else:
        score += max(0, 6 - abs(row["舒张压"] - 75) * 0.1)

    # 血糖（理想 3.9–6.1 mmol/L）
    if 3.9 <= row["血糖"] <= 6.1:
        score += 6
    else:
        score += max(0, 6 - abs(row["血糖"] - 5.2) * 1.5)

    # 胆固醇（理想 < 5.2 mmol/L）
    if row["胆固醇"] <= 5.2:
        score += 6
    else:
        score += max(0, 6 - (row["胆固醇"] - 5.2) * 2)

    # 心率（60–100 bpm）
    if 60 <= row["心率"] <= 100:
        score += 5
    else:
        score += max(0, 5 - abs(row["心率"] - 80) * 0.2)

    # 骨密度（正常 ≥ -1.0）
    if row["骨密度"] >= -1.0:
        score += 6
    else:
        score += max(0, (row["骨密度"] + 3) / 2 * 6)  # -3最差

    return min(score, 35)

df["生理指标得分"] = df.apply(physiological_score, axis=1)

# MMSE（满分30 -> 映射到15分）
def mmse_score(mmse):
    if mmse >= 27:
        return 15
    elif mmse >= 24:
        return 12
    elif mmse >= 20:
        return 9
    elif mmse >= 15:
        return 6
    else:
        return 3

df["功能状态得分"] = df["MMSE"].apply(mmse_score)

# 生活习惯评分：排便频率 + BMI + 睡眠质量
def lifestyle_score(row):
    score = 0
    # 排便频率（每日1次为10分）
    if row["排便频率"] >= 1:
        score += 10
    else:
        score += max(0, row["排便频率"] / 1 * 10)

    # BMI（18.5–24.9 为正常）
    if 18.5 <= row["BMI"] <= 24.9:
        score += 5
    else:
        score += max(0, 5 - abs(row["BMI"] - 21.5) * 0.5)

    # 睡眠质量（1–5分）
    score += max(0, min(row["睡眠质量"], 5))  # 上限5分

    return min(score, 20)

df["生活习惯得分"] = df.apply(lifestyle_score, axis=1)

# 计算总得分
df["健康总评分"] = df["慢性病得分"] + df["生理指标得分"] + df["功能状态得分"] + df["生活习惯得分"]

# 年龄段平均得分
result = df.groupby("年龄段")["健康总评分"].agg(["mean", "count", "std"]).reset_index()
result.columns = ["年龄段", "平均健康评分", "人数", "标准差"]

# 输出结果
print(result.round(2))

# 保存为 JSON
result_dict = result.round(2).to_dict(orient="records")

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(result_dict, f, ensure_ascii=False, indent=4)
