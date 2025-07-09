import requests
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__, template_folder="template", static_folder="static")
CORS(app)

# 加载模型和标准化器
model = joblib.load('multilabel_rf_model.pkl')
scaler = joblib.load('scaler.pkl')

# 预测输入和输出列
X_cols = [
    '收缩压(mmHg)',
    '舒张压(mmHg)',
    '血糖(mmol/L)',
    '总胆固醇(TC)',
    '低密度脂蛋白(LDL)',
    '高密度脂蛋白(HDL)',
    '甘油三酯(TG)',
    '肌钙蛋白I(cTnI)',
    'NIHSS',
    'mRS',
    '缺血灶面积(cm²)',
    'CRP(mg/L)',
    'ESR(mm/h)',
    'VAS_关节炎',
    '颈椎活动角度(°)',
    'VAS_颈椎',
    'SLR角度(°)',
    'VAS_腰椎',
    '骨密度T值',
    'MMSE',
    '排便频率(次/周)',
    '睡眠质量(1-5)',
    'BMI'
]

Y_cols = [
    '高血压', '冠心病', '脑卒中', '糖尿病',
    '骨质疏松', '老年性痴呆', '关节炎', '颈椎病',
    '腰椎间盘突出症', '便秘'
]

# 用 Pandas 读取本地 CSV
df = pd.read_csv("data/data.csv")

# 取输入输出数据
X = df[X_cols]
Y = df[Y_cols]

# 缺失值填均值
X = X.apply(pd.to_numeric, errors='coerce').fillna(X.mean())

# 先对整个数据标准化（相似度用）
X_scaled = scaler.transform(X)

@app.route("/")
def index():
    return render_template("health_predict.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    input_data = [float(data[col]) for col in X_cols]
    input_scaled = scaler.transform([input_data])

    pred = model.predict(input_scaled)[0].tolist()

    simlarity = cosine_similarity(input_scaled, X_scaled)
    top_idx = simlarity[0].argsort()[::-1][:100]
    close_labels = Y.iloc[top_idx]
    close_summary = (close_labels.sum() / 100).round(2).to_dict()

    result = []
    for tag, label in zip(Y_cols, pred):
        status = "有风险" if label == 1 else "健康"
        result.append({
            "疾病": tag,
            "状态": status,
            "相似人群患病率": close_summary[tag]
        })

    return jsonify(result)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
