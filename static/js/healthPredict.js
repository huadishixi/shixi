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
  "收缩压 (mmHg)": "收缩压(mmHg)",
  "舒张压 (mmHg)": "舒张压(mmHg)",
  "血糖 (mmol/L)": "血糖(mmol/L)",
  "总胆固醇 (TC)": "总胆固醇(TC)",
  "低密度脂蛋白 (LDL)": "低密度脂蛋白(LDL)",
  "高密度脂蛋白 (HDL)": "高密度脂蛋白(HDL)",
  "甘油三酯 (TG)": "甘油三酯(TG)",
  "肌钙蛋白 I (cTnI, ng/mL)": "肌钙蛋白I(cTnI)",
  NIHSS: "NIHSS",
  mRS: "mRS",
  "缺血灶面积 (cm²)": "缺血灶面积(cm²)",
  "CRP (mg/L)": "CRP(mg/L)",
  "ESR (mm/h)": "ESR(mm/h)",
  "骨密度 T 值": "骨密度T值",
  "BMI (kg/m²)": "BMI",
  MMSE: "MMSE",
  "颈椎活动角度 (°)": "颈椎活动角度(°)",
  "SLR 角度 (°)": "SLR角度(°)",
  "排便频率 (次/周)": "排便频率(次/周)",
  "睡眠评分 (1–5)": "睡眠质量(1-5)",
  "VAS_关节炎 (0–10)": "VAS_关节炎",
  "VAS_颈椎 (0–10)": "VAS_颈椎",
  "VAS_腰椎 (0–10)": "VAS_腰椎",
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
      <div id="btn-list"></div>
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
function collectFormData(onlyUserInput = false) {
  const form = document.getElementById("dynamicHealthForm");
  let data = {};
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

  if (!onlyUserInput) {
    fillMissingValues(data);
  }

  return data;
}

// 填充缺失值
function fillMissingValues(data) {
  X_COLS.forEach((col) => {
    // 如果该字段已有用户输入的值，则跳过
    if (col in data) return;

    // 查找该字段对应的正常值
    const normalValue = findNormalValueForColumn(col);
    data[col] = normalValue;
  });
}

// 为特定字段查找正常值
function findNormalValueForColumn(columnName) {
  // 在所有疾病指标中查找该字段的正常范围
  for (const disease in zhibiaoMap) {
    const indicators = zhibiaoMap[disease];
    for (const [indicatorParam, levels] of Object.entries(indicators)) {
      let mappedKey = aliasToXcols[indicatorParam] || indicatorParam;

      if (mappedKey === columnName) {
        const normalRange = findNormalRange(levels);
        const defaultValue = getDefaultValueFromRange(normalRange);
        if (defaultValue !== null) {
          return defaultValue;
        }
      }
    }
  }

  return 0;
}

// 从范围字符串中提取默认值
function getDefaultValueFromRange(rangeStr) {
  if (!rangeStr) return null;

  // 尝试匹配各种范围格式
  const matches = rangeStr.match(/([\d\.\-]+)\s*[-~至]\s*([\d\.\-]+)/);
  if (matches && matches.length >= 3) {
    const min = parseFloat(matches[1]);
    const max = parseFloat(matches[2]);
    return (min + max) / 2; // 取中间值
  }

  // 匹配单值
  const singleMatch = rangeStr.match(/[\d\.\-]+/);
  if (singleMatch) {
    return parseFloat(singleMatch[0]);
  }

  return null;
}

function findNormalRange(levels) {
  for (const [label, val] of Object.entries(levels)) {
    if (label.includes("正常")) {
      return val;
    }
  }
  return "";
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
  const selectedDiseases = Array.from(
    document.querySelectorAll("#diseaseCheckboxes input:checked")
  ).map((cb) => cb.value);

  //  const filtered = result.filter((r) => selectedDiseases.includes(r.疾病));
  // === 强制构建所有用户勾选疾病的显示内容 ===
  const filtered = selectedDiseases.map((disease) => {
    const found = result.find((r) => r.疾病 === disease);
    return found || { 疾病: disease, 相似人群患病率: 0, 状态: "未知" };
  });

  const resultDiv = document.getElementById("predictionResult");

  let html = `
      <div class="result-container">
        <h5 class="result-title">预测结果</h5>
        <div class="result-grid">
    `;

  filtered.forEach((r) => {
    const percentage = (r.相似人群患病率 * 100).toFixed(1);
    let status = "";
    let riskLevel = "";

    if (percentage >= 0 && percentage < 20) {
      status = "概率极低";
      riskLevel = "healthy";
    } else if (percentage >= 20 && percentage < 50) {
      status = "概率低";
      riskLevel = "low";
    } else if (percentage >= 50 && percentage < 80) {
      status = "概率高";
      riskLevel = "high";
    } else if (percentage >= 80 && percentage <= 100) {
      status = "概率极高";
      riskLevel = "bad";
    }

    html += `
        <div class="result-card ${riskLevel}">
          <div class="disease-name">${r.疾病}</div>
          <div class="risk-status">${status}</div>
          <div class="risk-meter">
            <div class="meter-bar" style="width: ${percentage}%"></div>
            <div class="meter-text">${percentage}%</div>
          </div>
        </div>
      `;
  });

  resultDiv.innerHTML = html;

  const btnList = document.getElementById("btn-list");
  btnList.innerHTML = `
    <div style="text-align: center;">
      <div style="margin-top: 15px; display: inline-block;"">
        <button id="generateAdviceBtn" class="btn btn-primary">使用AI生成个性化建议</button>
        <button id="savePredictionBtn" class="btn btn-primary">保存预测结果</button>
      </div>
    </div>
  `;

  // === 按钮事件 ===
  document.getElementById("generateAdviceBtn").onclick = async function () {
    const userFormData = collectFormData(true); // 只取用户实际输入
    if (!userFormData) return;

    const userInputStr = Object.entries(userFormData)
      .map(([key, val]) => `${key}: ${val}`)
      .join("\n");

    const resultStr = filtered
      .map(
        (r) =>
          `疾病：${r.疾病}，状态：${r.状态}，相似人群患病率：${(
            r.相似人群患病率 * 100
          ).toFixed(1)}%`
      )
      .join("\n");

    const message = `用户输入：\n${userInputStr}\n\n预测结果：\n${resultStr}\n\n请根据用户输入的健康指标和平台分析出来的疾病风险，给出个性化建议`;

    // 在预测结果下方创建AI建议区域
    const aiAdviceContainer = document.createElement("div");
    aiAdviceContainer.className = "ai-advice-container";
    aiAdviceContainer.innerHTML = `
    <h5 class="ai-advice-title">AI健康建议</h5>
    <div class="ai-advice-loading">正在生成个性化建议...</div>
  `;

    // 插入到预测结果后面
    const predictionResult = document.getElementById("predictionResult");
    predictionResult.parentNode.insertBefore(
      aiAdviceContainer,
      predictionResult.nextSibling
    );

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.reply) {
        // 更新AI建议区域
        aiAdviceContainer.innerHTML = `
        <h5 class="ai-advice-title">AI健康建议</h5>
        <div class="ai-advice-content">${data.reply.replace(
          /\n/g,
          "<br>"
        )}</div>
      `;
      }
    } catch (error) {
      aiAdviceContainer.innerHTML = `
      <h5 class="ai-advice-title">AI健康建议</h5>
      <div class="ai-advice-error">生成建议时出错: ${error.message}</div>
    `;
    }
  };

  function downloadAsCSV() {
    const userFormData = collectFormData(true);
    if (!userFormData) return;

    // 获取AI建议（如果存在）
    const aiAdviceContainer = document.querySelector(".ai-advice-container");
    let aiAdvice = "";
    if (
      aiAdviceContainer &&
      !aiAdviceContainer.querySelector(".ai-advice-loading")
    ) {
      aiAdvice =
        aiAdviceContainer.querySelector(".ai-advice-content")?.innerText || "";
    }

    // 准备CSV内容
    let csvContent = "类别,项目,数值,说明\n";

    // 1. 添加元数据
    csvContent += `元数据,生成时间,${new Date().toLocaleString()},\n`;
    csvContent += `元数据,预测工具,健康风险预测系统,\n\n`;

    // 2. 添加用户输入参数
    csvContent += "输入参数\n";
    Object.entries(userFormData).forEach(([key, value]) => {
      csvContent += `输入,${key},${value},\n`;
    });
    csvContent += "\n";

    // 3. 添加预测结果
    csvContent += "预测结果\n";
    filtered.forEach((item) => {
      const probability = (item.相似人群患病率 * 100).toFixed(1) + "%";
      const riskLevel = getRiskLevel(item.相似人群患病率);
      const description = getRiskDescription(item.相似人群患病率);

      csvContent += `预测,${item.疾病},${probability},${riskLevel} (${description})\n`;
    });

    // 4. 添加AI建议（如果有）
    if (aiAdvice) {
      csvContent += "\nAI健康建议\n";
      // 将AI建议按行分割，每行作为一条记录
      const adviceLines = aiAdvice
        .split("\n")
        .filter((line) => line.trim() !== "");
      adviceLines.forEach((line, index) => {
        csvContent += `建议,${index + 1},,${line.replace(/,/g, "，")}\n`;
      });
    }

    // 辅助函数
    function getRiskLevel(probability) {
      if (probability < 0.2) return "低风险";
      if (probability < 0.5) return "中低风险";
      if (probability < 0.8) return "中高风险";
      return "高风险";
    }

    function getRiskDescription(probability) {
      if (probability < 0.2) return "建议保持现有健康习惯";
      if (probability < 0.5) return "建议关注相关指标";
      if (probability < 0.8) return "建议咨询专业医生";
      return "建议立即就医检查";
    }

    // 创建并下载CSV文件
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `健康风险评估_${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // 使用这个函数作为保存按钮的点击处理器
  document.getElementById("savePredictionBtn").onclick = downloadAsCSV;
}

// 初始化应用
document.addEventListener("DOMContentLoaded", initApp);
