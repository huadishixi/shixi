const X_COLS = [
  "收缩压(mmHg)",
  "舒张压(mmHg)",
  "血糖(mmol/L)",
  "总胆固醇(TC)",
  "低密度脂蛋白(LDL)",
  "高密度脂蛋白(HDL)",
  "甘油三酯(TG)",
  "肌钙蛋白I(cTnI)",
  "NIHSS",
  "mRS",
  "缺血灶面积(cm²)",
  "CRP(mg/L)",
  "ESR(mm/h)",
  "VAS_关节炎",
  "颈椎活动角度(°)",
  "VAS_颈椎",
  "SLR角度(°)",
  "VAS_腰椎",
  "骨密度T值",
  "MMSE",
  "排便频率(次/周)",
  "睡眠质量(1-5)",
  "BMI",
];

// 前端字段别名 → 后端字段映射
const aliasToXcols = {
  "收缩压 (SBP, mmHg)": "收缩压(mmHg)",
  "舒张压 (DBP, mmHg)": "舒张压(mmHg)",
  "空腹血糖 (FBG, mmol/L)": "血糖(mmol/L)",
  "总胆固醇 (TC, mmol/L)": "总胆固醇(TC)",
  "低密度脂蛋白 (LDL, mmol/L)": "低密度脂蛋白(LDL)",
  "高密度脂蛋白 (HDL, mmol/L)": "高密度脂蛋白(HDL)",
  "甘油三酯 (TG, mmol/L)": "甘油三酯(TG)",
  "肌钙蛋白 I (cTnI, ng/mL)": "肌钙蛋白I(cTnI)",
  NIHSS: "NIHSS",
  mRS: "mRS",
  "缺血灶面积 (cm²)": "缺血灶面积(cm²)",
  "CRP (mg/L)": "CRP(mg/L)",
  "ESR (mm/h)": "ESR(mm/h)",
  "骨密度 T 值": "骨密度T值",
  "BMI (kg/m²)": "BMI",
  MMSE: "MMSE",
  "疼痛 VAS (0–10)": "", // 特殊处理：可根据疾病类型映射到不同字段
  "颈椎活动角度 (°)": "颈椎活动角度(°)",
  "SLR 直腿抬高角度 (°)": "SLR角度(°)",
  "排便频率 (次/周)": "排便频率(次/周)",
  "睡眠评分 (1–5)": "睡眠质量(1-5)",
};

const painVASDiseaseMap = {
  关节炎: "VAS_关节炎",
  颈椎病: "VAS_颈椎",
  腰椎间盘突出症: "VAS_腰椎",
};

let zhibiaoMap = {};

// 初始化应用
function initApp() {
  fetch("/static/dataset/zhibiao.json")
    .then((res) => res.json())
    .then((data) => {
      zhibiaoMap = data;
    })
    .catch((error) => {
      console.error("加载指标数据失败:", error);
    });

  setupEventListeners();
}

// 设置事件监听器
function setupEventListeners() {
  const predictBtn = document.getElementById("openHealthPredictBtn");
  if (predictBtn) {
    predictBtn.addEventListener("click", () => {
      const predictDiv = document.getElementById("healthPredictContainer");
      const overby = document.querySelector(".modal-overby");

      if (predictDiv) {
        predictDiv.classList.remove("hidden");
        overby.classList.remove("hidden");
        renderHealthPredictUI();
      }
    });
  }
}

// 渲染健康预测UI
function renderHealthPredictUI() {
  const container = document.getElementById("healthPredictContainer");
  container.innerHTML = `
      <div class="healthPredict-header">
        <h4 class="healthPredict-title">健康风险预测</h4>
        <button class="healthPredict-close" onclick="closeHealthPredict()">×</button>
        <p class="healthPredict-subtitle">请选择您关心的疾病，系统将自动提示相关指标并评估健康风险：</p>
      </div>
      <div id="diseaseCheckboxes" class="disease-checkboxes"></div>
      <form id="dynamicHealthForm" class="health-form"></form>
      <div class="healthPredict-actions">
        <button class="healthPredict-button" onclick="submitDynamicPrediction()">
          <span class="button-text">提交预测</span>
          <span class="button-icon">→</span>
        </button>
      </div>
      <hr class="healthPredict-divider">
      <div id="predictionResult" class="prediction-result"></div>
    `;

  renderDiseaseCheckboxes();
}

function closeHealthPredict() {
  const predictDiv = document.getElementById("healthPredictContainer");
  const overby = document.querySelector(".modal-overby");

  if (predictDiv) {
    predictDiv.classList.add("hidden");
  }
  if (overby) {
    overby.classList.add("hidden");
  }
}

// 渲染疾病复选框
function renderDiseaseCheckboxes() {
  const diseaseBox = document.getElementById("diseaseCheckboxes");
  diseaseBox.innerHTML = "";

  Object.keys(zhibiaoMap).forEach((disease) => {
    const checkbox = document.createElement("div");
    checkbox.className = "disease-option";
    checkbox.innerHTML = `
        <input type="checkbox" class="disease-checkbox" value="${disease}" id="dis-${disease}" onchange="updateHealthInputForm()">
        <label for="dis-${disease}" class="disease-label">${disease}</label>
      `;
    diseaseBox.appendChild(checkbox);
  });
}

// 更新健康输入表单
function updateHealthInputForm() {
  const selectedDiseases = Array.from(
    document.querySelectorAll("#diseaseCheckboxes input:checked")
  ).map((cb) => cb.value);
  const form = document.getElementById("dynamicHealthForm");
  form.innerHTML = "";

  const added = new Set();

  selectedDiseases.forEach((disease) => {
    const indicators = zhibiaoMap[disease];
    for (const [param, levels] of Object.entries(indicators)) {
      let mappedKey = aliasToXcols[param] || param;

      // 特殊处理疼痛VAS字段
      if (param === "疼痛 VAS (0–10)" && painVASDiseaseMap[disease]) {
        mappedKey = painVASDiseaseMap[disease];
      }

      if (!mappedKey || added.has(mappedKey)) continue;
      added.add(mappedKey);

      const normalRange = findNormalRange(levels);
      const unit = getUnitFromKey(mappedKey);

      const div = document.createElement("div");
      div.className = "form-group";
      div.innerHTML = `
          <label class="form-label">${param}</label>
          <div class="input-container">
            <input type="number" step="0.1" class="form-input" name="${mappedKey}" placeholder="${normalRange}">
            <span class="input-unit">${unit}</span>
          </div>
        `;
      form.appendChild(div);
    }
  });
}

// 查找正常范围
function findNormalRange(levels) {
  for (const [label, val] of Object.entries(levels)) {
    if (label.includes("正常")) {
      return val;
    }
  }
  return "";
}

// 从键名中提取单位
function getUnitFromKey(key) {
  const unitMatch = key.match(/\(([^)]+)\)/);
  return unitMatch && unitMatch[1] ? unitMatch[1] : "";
}

// 提交动态预测
function submitDynamicPrediction() {
  const formData = collectFormData();
  if (!formData) return;

  showLoadingState();

  fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  })
    .then(handleResponse)
    .catch(handleError);
}

// 收集表单数据
function collectFormData() {
  const form = document.getElementById("dynamicHealthForm");
  const data = {};
  const allowNegative = "骨密度T值";
  let hasNegative = false;

  Array.from(form.elements).forEach((el) => {
    if (el.name) {
      const val = el.value.trim();
      if (val !== "") {
        if (parseFloat(val) < 0 && el.name !== allowNegative) {
          hasNegative = true;
        }
        data[el.name] = parseFloat(val);
      }
    }
  });

  if (hasNegative) {
    alert("该数值不能为负数！");
    return null;
  }

  fillMissingValues(data);
  return data;
}

// 填充缺失值
function fillMissingValues(data) {
  const selectedDiseases = Array.from(
    document.querySelectorAll("#diseaseCheckboxes input:checked")
  ).map((cb) => cb.value);

  selectedDiseases.forEach((disease) => {
    const indicators = zhibiaoMap[disease];
    for (const [param, levels] of Object.entries(indicators)) {
      let mappedKey = aliasToXcols[param] || param;
      if (param === "疼痛 VAS (0–10)" && painVASDiseaseMap[disease]) {
        mappedKey = painVASDiseaseMap[disease];
      }
      if (!mappedKey || mappedKey in data) continue;

      const normalRange = findNormalRange(levels);
      const numMatch = normalRange.match(/[\d\.\-]+/g);
      if (numMatch) {
        data[mappedKey] = parseFloat(numMatch[0]);
      }
    }
  });

  // 填补完整 X_COLS 所需字段
  X_COLS.forEach((col) => {
    if (!(col in data)) {
      data[col] = 0;
    }
  });
}

// 显示加载状态
function showLoadingState() {
  const resultDiv = document.getElementById("predictionResult");
  resultDiv.innerHTML = '<div class="loading-spinner">分析中...</div>';
}

// 处理响应
function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json().then(renderPredictionResults);
}

// 处理错误
function handleError(error) {
  const resultDiv = document.getElementById("predictionResult");
  resultDiv.innerHTML = `<div class="error-message">预测失败: ${error.message}</div>`;
}

// 渲染预测结果
function renderPredictionResults(result) {
  const filtered = result.filter((r) => r["相似人群患病率"] > 0);
  const resultDiv = document.getElementById("predictionResult");

  let html = `
      <div class="result-container">
        <h5 class="result-title">预测结果</h5>
        <div class="result-grid">
    `;

  filtered.forEach((r) => {
    const riskLevel = r.状态 === "有风险" ? "high-risk" : "low-risk";
    const percentage = (r.相似人群患病率 * 100).toFixed(1);

    html += `
        <div class="result-card ${riskLevel}">
          <div class="disease-name">${r.疾病}</div>
          <div class="risk-status">${r.状态}</div>
          <div class="risk-meter">
            <div class="meter-bar" style="width: ${percentage}%"></div>
            <div class="meter-text">${percentage}%</div>
          </div>
        </div>
      `;
  });

  html += `</div></div>`;
  resultDiv.innerHTML = html;
}

// 初始化应用
document.addEventListener("DOMContentLoaded", initApp);
