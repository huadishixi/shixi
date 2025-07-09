from pyspark.sql.functions import mean as _mean
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
import joblib
from pyspark.sql import SparkSession

# 创建SparkSession
spark = SparkSession.builder \
    .appName("PatientHealthAnalysis") \
    .config("spark.sql.legacy.timeParserPolicy", "LEGACY") \
    .getOrCreate()

# ============== 1. 加载数据 ==============
df = spark.read.csv("hdfs://192.168.64.128:8020/data/data.csv", header=True, inferSchema=True)

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
y_cols = [
    '高血压', '冠心病', '脑卒中', '糖尿病',
    '骨质疏松', '老年性痴呆', '关节炎', '颈椎病',
    '腰椎间盘突出症', '便秘'
]

# 取特征和标签的Spark DataFrame
X = df.select(X_cols)
Y = df.select(y_cols)

# 计算均值填充缺失值
mean_values = X.agg(*[_mean(c).alias(c) for c in X_cols]).collect()[0].asDict()
X_filled = X.fillna(mean_values)

# 转换为Pandas DataFrame
X_pd = X_filled.toPandas()
Y_pd = Y.toPandas()

# Pandas里再次缺失值处理保险
X_pd = X_pd.fillna(X_pd.mean())

# 标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_pd)

# ============== 2. 拆训练测试集 ==============
X_train, X_test, Y_train, Y_test = train_test_split(X_scaled, Y_pd, test_size=0.2, random_state=42)

# ============== 3. 过采样处理 ==============
# 由于多标签SMOTE复杂，这里简单对每个标签单独做过采样，实际项目中可用多标签专用采样方法
smote = SMOTE(random_state=42)

# 由于多标签，分别对每个标签循环过采样，并合并
import numpy as np
X_resampled = []
Y_resampled = []
for i in range(Y_train.shape[1]):
    y_single = Y_train.iloc[:, i]
    X_res, y_res = smote.fit_resample(X_train, y_single)
    X_resampled.append(X_res)
    Y_resampled.append(y_res)

# 取最长的重采样结果（样本数最多），并对齐其他标签，用0填充不够的
max_len = max(len(x) for x in X_resampled)
X_final = np.zeros((max_len, X_train.shape[1]))
Y_final = np.zeros((max_len, Y_train.shape[1]))
for i in range(Y_train.shape[1]):
    length = len(Y_resampled[i])
    X_final[:length, :] = X_resampled[i]
    Y_final[:length, i] = Y_resampled[i]

X_train = X_final
Y_train = Y_final

# ============== 4. 多标签随机森林训练 ==============
rf = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42, class_weight='balanced')
multi_rf = MultiOutputClassifier(rf)

multi_rf.fit(X_train, Y_train)
Y_pred = multi_rf.predict(X_test)

print("=== 多标签分类报告 ===")
print(classification_report(Y_test, Y_pred, target_names=y_cols, zero_division=0))

# ============== 5. 保存模型和scaler ==============
joblib.dump(multi_rf, 'multilabel_rf_model.pkl')
joblib.dump(scaler, 'scaler.pkl')

print("已保存模型和scaler")
