import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI

app = Flask(__name__)
CORS(app)

script_dir = os.path.dirname(os.path.abspath(__file__))

process_dir = os.path.join(script_dir, "process")

# === 初始化 OpenAI 客户端 ===
client = OpenAI(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key="19ff5533-84a8-410b-8ddd-70a2feb4d57b",
)

# === 模型和数据加载 ===
model = joblib.load('model/multilabel_rf_model.pkl')  # 放在 model 目录下
scaler = joblib.load('model/scaler.pkl')

# 预测输入和输出列
X_cols = [
    '收缩压(mmHg)', '舒张压(mmHg)', '血糖(mmol/L)', '总胆固醇(TC)',
    '低密度脂蛋白(LDL)', '高密度脂蛋白(HDL)', '甘油三酯(TG)', '肌钙蛋白I(cTnI)',
    'NIHSS', 'mRS', '缺血灶面积(cm²)', 'CRP(mg/L)', 'ESR(mm/h)', 'VAS_关节炎',
    '颈椎活动角度(°)', 'VAS_颈椎', 'SLR角度(°)', 'VAS_腰椎', '骨密度T值',
    'MMSE', '排便频率(次/周)', '睡眠质量(1-5)', 'BMI'
]

Y_cols = [
    '高血压', '冠心病', '脑卒中', '糖尿病', '骨质疏松',
    '老年性痴呆', '关节炎', '颈椎病', '腰椎间盘突出症', '便秘'
]

# 加载数据
df = pd.read_csv(os.path.join(process_dir, "dataproject/data/data3.0.csv"))
X = df[X_cols].apply(pd.to_numeric, errors='coerce').fillna(df[X_cols].mean())
Y = df[Y_cols]
X_scaled = scaler.transform(X)

# === 路由 ===
@app.route("/")
def index():
    return render_template("index.html")  # 主页面

@app.route("/health")
def health_page():
    return render_template("health_predict.html")  # 健康预测页面

@app.route("/data/<path:filename>")
def serve_data(filename):
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__)))
    return send_from_directory(data_dir, filename)

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "")
    try:
        response = client.chat.completions.create(
            model="doubao-seed-1-6-250615",
            messages=[
                {
                    "role": "system",
                    "content": "一、AI 角色与背景设定你是 「川南渝西老年人健康智能助手」，基于区域老年人健康大数据平台的 AI 对话系统。"
                               "背景设定为：服务于川南渝西地区 60 岁以上老年人及其家属、社区医生、养老机构工作人员；深度整合区域内超 10 万份老年人健康档案和医养资源信息；由中南大学计算机学院大数据专业学生研发，具备医学数据分析与智能决策能力。"
                               "二、核心功能定位健康数据解读：解释体检指标（如血压、血糖、BMI）含义，分析异常值风险，关联历史数据生成趋势报告。慢病管理辅助：基于 LSTM/Prophet 模型预测高血压、糖尿病等慢性病发展趋势，推荐个性化干预方案（饮食 / 运动建议）。"
                               "数据可视化交互：解读大屏热力图 / 趋势曲线含义。只回答与老年人健康和医疗有关的问题，用户询问其他问题时要礼貌拒绝并提醒。"
                               "三、行为准则与对话风格专业且易懂：使用医学术语时附带通俗解释（如 “糖化血红蛋白 A1c：反映近 3 个月血糖控制情况”）；回答问题不需要列出标题和表格等特殊格式的答案，直接使用一到两段话回答即可。"
                               "数据驱动应答：所有建议基于平台真实数据（如 “根据区域数据，75 岁以上独居老人营养不良风险高出均值 23%”）；风险预警机制：检测到异常数据（如连续 3 天心率＞100 次 / 分）时主动提示 “建议联系家庭医生”；隐私保护优先："
                               "拒绝透露具体个人数据，仅提供群体统计分析（如 “该社区高血压患病率为 18.7%”）；多轮引导交互：对复杂问题（如 “如何改善睡眠质量”）主动追问 “是否有佩戴智能手环记录睡眠数据？”。"
                },
                {
                    "role": "user",
                    "content": [{"type": "text", "text": user_message}]
                }
            ],
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    input_data = [float(data[col]) for col in X_cols]
    input_df = pd.DataFrame([input_data], columns=X_cols)
    input_scaled = scaler.transform(input_df)

    pred = model.predict(input_scaled)[0].tolist()

    simlarity = cosine_similarity(input_scaled, X_scaled)
    top_idx = simlarity[0].argsort()[::-1][:100]
    close_labels = Y.iloc[top_idx]
    close_summary = (close_labels.sum() / 100).round(2).to_dict()

    result = []
    for tag, label in zip(Y_cols, pred):
        if close_summary[tag] == 0:
            continue
        status = "有风险" if label == 1 else "健康"
        result.append({
            "疾病": tag,
            "状态": status,
            "相似人群患病率": close_summary[tag]
        })

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, port=5000)