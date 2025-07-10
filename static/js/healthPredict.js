const X_COLS = [
  "收缩压(mmHg)", "舒张压(mmHg)", "血糖(mmol/L)", "总胆固醇(TC)",
  "低密度脂蛋白(LDL)", "高密度脂蛋白(HDL)", "甘油三酯(TG)", "肌钙蛋白I(cTnI)",
  "NIHSS", "mRS", "缺血灶面积(cm²)", "CRP(mg/L)", "ESR(mm/h)", "VAS_关节炎",
  "颈椎活动角度(°)", "VAS_颈椎", "SLR角度(°)", "VAS_腰椎", "骨密度T值",
  "MMSE", "排便频率(次/周)", "睡眠质量(1-5)", "BMI"
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
  "NIHSS": "NIHSS",
  "mRS": "mRS",
  "缺血灶面积 (cm²)": "缺血灶面积(cm²)",
  "CRP (mg/L)": "CRP(mg/L)",
  "ESR (mm/h)": "ESR(mm/h)",
  "骨密度 T 值": "骨密度T值",
  "BMI (kg/m²)": "BMI",
  "MMSE": "MMSE",
  "疼痛 VAS (0–10)": "", // 特殊处理：可根据疾病类型映射到不同字段
  "颈椎活动角度 (°)": "颈椎活动角度(°)",
  "SLR 直腿抬高角度 (°)": "SLR角度(°)",
  "排便频率 (次/周)": "排便频率(次/周)",
  "睡眠评分 (1–5)": "睡眠质量(1-5)"
};

const painVASDiseaseMap = {
  "关节炎": "VAS_关节炎",
  "颈椎病": "VAS_颈椎",
  "腰椎间盘突出症": "VAS_腰椎"
};

let zhibiaoMap = {};

fetch('/static/dataset/zhibiao.json')
  .then(res => res.json())
  .then(data => {
    zhibiaoMap = data;
//    renderHealthPredictUI();  // 初始化页面时渲染模块
  });

function renderHealthPredictUI() {
    // 隐藏原有大屏内容
    const targetDiv = document.querySelector(".visual_chart_text");
    if (targetDiv) {
        targetDiv.style.display = "none";
    }

    const container = document.getElementById("healthPredictContainer");
    container.innerHTML = `
        <h4 class="mb-3 text-light">健康风险预测</h4>
        <p class="text-light">请选择您关心的疾病，系统将自动提示相关指标并评估健康风险：</p>
        <div id="diseaseCheckboxes" class="d-flex flex-wrap mb-3"></div>
        <form id="dynamicHealthForm" class="row g-3"></form>
        <button class="btn btn-primary mt-3" onclick="submitDynamicPrediction()">提交预测</button>
        <hr>
        <div id="predictionResult" class="mt-3"></div>
    `;

    const diseaseBox = document.getElementById("diseaseCheckboxes");
    Object.keys(zhibiaoMap).forEach(disease => {
        const checkbox = document.createElement("div");
        checkbox.className = "form-check me-4";
        checkbox.innerHTML = `
            <input type="checkbox" class="form-check-input" value="${disease}" id="dis-${disease}" onchange="updateHealthInputForm()">
            <label for="dis-${disease}" class="form-check-label text-light">${disease}</label>
        `;
        diseaseBox.appendChild(checkbox);
    });
}

function updateHealthInputForm() {
    const selectedDiseases = Array.from(document.querySelectorAll("#diseaseCheckboxes input:checked")).map(cb => cb.value);
    const form = document.getElementById("dynamicHealthForm");
    form.innerHTML = "";

    const added = new Set();

    selectedDiseases.forEach(disease => {
        const indicators = zhibiaoMap[disease];
        for (const [param, levels] of Object.entries(indicators)) {
            let mappedKey = aliasToXcols[param] || param;

            // 特殊处理疼痛VAS字段
            if (param === "疼痛 VAS (0–10)" && painVASDiseaseMap[disease]) {
                mappedKey = painVASDiseaseMap[disease];
            }

            if (!mappedKey || added.has(mappedKey)) continue;
            added.add(mappedKey);

            let normalRange = "";
            for (const [label, val] of Object.entries(levels)) {
                if (label.includes("正常")) {
                    normalRange = val;
                    break;
                }
            }

            const div = document.createElement("div");
            div.className = "col-md-4";
            div.innerHTML = `
                <label class="form-label text-light">${mappedKey}</label>
                <input type="number" step="0.1" class="form-control" name="${mappedKey}" placeholder="参考范围：${normalRange}">
            `;
            form.appendChild(div);
        }
    });
}

function submitDynamicPrediction() {
    const form = document.getElementById("dynamicHealthForm");
    const data = {};
    const allowNegative = "骨密度T值";
    let hasNegative = false;

    Array.from(form.elements).forEach(el => {
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
        return;
    }

    // 自动补全缺失值（默认正常值）
    const selectedDiseases = Array.from(document.querySelectorAll("#diseaseCheckboxes input:checked")).map(cb => cb.value);

    selectedDiseases.forEach(disease => {
        const indicators = zhibiaoMap[disease];
        for (const [param, levels] of Object.entries(indicators)) {
            let mappedKey = aliasToXcols[param] || param;
            if (param === "疼痛 VAS (0–10)" && painVASDiseaseMap[disease]) {
                mappedKey = painVASDiseaseMap[disease];
            }
            if (!mappedKey || mappedKey in data) continue;

            for (const [label, val] of Object.entries(levels)) {
                if (label.includes("正常")) {
                    const numMatch = val.match(/[\d\.\-]+/g);
                    if (numMatch) {
                        data[mappedKey] = parseFloat(numMatch[0]);
                    }
                    break;
                }
            }
        }
    });

    // 填补完整 X_COLS 所需字段
    X_COLS.forEach(col => {
        if (!(col in data)) {
            data[col] = 0;
        }
    });

    fetch('/predict', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        const filtered = result.filter(r => r["相似人群患病率"] > 0);
        let html = `<table class="table table-bordered table-striped text-light">
                      <thead><tr><th>疾病</th><th>状态</th><th>相似人群患病率</th></tr></thead><tbody>`;
        filtered.forEach(r => {
            const statusClass = r.状态 === "有风险" ? "text-danger" : "text-success";
            html += `<tr><td>${r.疾病}</td><td class="${statusClass}">${r.状态}</td><td>${(r.相似人群患病率 * 100).toFixed(1)}%</td></tr>`;
        });
        html += "</tbody></table>";
        document.getElementById("predictionResult").innerHTML = html;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const predictBtn = document.getElementById("openHealthPredictBtn");
  const defaultDiv = document.getElementById("defaultContent");
  const predictDiv = document.getElementById("healthPredictContainer");

  predictBtn.addEventListener("click", () => {
    if (defaultDiv) defaultDiv.style.display = "none";
    if (predictDiv) {
      predictDiv.style.display = "block";
      renderHealthPredictUI();  // 渲染预测UI
    }
  });
});


//const diseaseToParams = {
//    "高血压": ['收缩压(mmHg)', '舒张压(mmHg)'],
//    "冠心病": ['总胆固醇(TC)', '低密度脂蛋白(LDL)', '高密度脂蛋白(HDL)'，"甘油三酯(TG)"，"肌钙蛋白I(cTnI)"],
//    "脑卒中": ['NIHSS', 'mRS', '缺血灶面积(cm²)'],
//    "糖尿病": ['血糖(mmol/L)'],
//    "骨质疏松": ['骨密度T值'，"BMI"],
//    "老年性痴呆": ['MMSE'],
//    "关节炎": ['VAS_关节炎', "CRP(mg/L)", "ESR(mm/h)"],
//    "颈椎病": ['颈椎活动角度(°)', 'VAS_颈椎'],
//    "腰椎间盘突出症": ['SLR角度(°)', 'VAS_腰椎'],
//    "便秘": ['排便频率(次/周)']
//    "睡眠质量": ['睡眠质量(1-5)']
//};
//
////const X_COLS = [
////  "收缩压(mmHg)", "舒张压(mmHg)", "血糖(mmol/L)", "总胆固醇(TC)", "低密度脂蛋白(LDL)", "高密度脂蛋白(HDL)",
////  "甘油三酯(TG)", "肌钙蛋白I(cTnI)", "NIHSS", "mRS", "缺血灶面积(cm²)", "CRP(mg/L)", "ESR(mm/h)",
////  "VAS_关节炎", "颈椎活动角度(°)", "VAS_颈椎", "SLR角度(°)", "VAS_腰椎", "骨密度T值", "MMSE",
////  "排便频率(次/周)", "睡眠质量(1-5)", "BMI"
////];
//
//
//let zhibiaoMap = {};
//
//fetch('/static/dataset/zhibiao.json')
//  .then(res => res.json())
//  .then(data => {
//    zhibiaoMap = data;
//  });
//
//
//function renderHealthPredictUI() {
//    const container = document.getElementById("healthPredictContainer");
//    if (!container) {
//        alert("找不到目标区域 healthPredictContainer！");
//        return;
//    }
//
//    // 构建模块提示、选择器和输入表单容器
//    container.innerHTML = `
//        <h4 class="mb-3">健康风险预测</h4>
//        <p>请选择您关心的疾病，系统将自动提示相关指标并评估健康风险：</p>
//        <div id="diseaseCheckboxes" class="form-check form-check-inline mb-3"></div>
//        <form id="dynamicHealthForm" class="row g-3"></form>
//        <button class="btn btn-primary mt-3" onclick="submitDynamicPrediction()">提交预测</button>
//        <hr>
//        <div id="predictionResult" class="mt-3"></div>
//    `;
//
//    // 生成疾病多选框
//    const diseaseBox = document.getElementById("diseaseCheckboxes");
//    Object.keys(diseaseToParams).forEach(disease => {
//        const label = document.createElement("label");
//        label.className = "form-check-label me-3";
//        const input = document.createElement("input");
//        input.type = "checkbox";
//        input.className = "form-check-input me-1";
//        input.value = disease;
//        input.onchange = updateHealthInputForm;
//        label.appendChild(input);
//        label.appendChild(document.createTextNode(disease));
//        diseaseBox.appendChild(label);
//    });
//}
//
////function updateHealthInputForm() {
////    const checkedDiseases = Array.from(document.querySelectorAll("#diseaseCheckboxes input:checked")).map(cb => cb.value);
////    const form = document.getElementById("dynamicHealthForm");
////    form.innerHTML = "";
////
////    const added = new Set();
////
////    checkedDiseases.forEach(disease => {
////        const indicators = zhibiaoMap[disease];
////        if (!indicators) return;
////
////        for (const [param, levels] of Object.entries(indicators)) {
////            if (added.has(param)) continue;
////            added.add(param);
////
////            let normalRange = "";
////            for (const [label, val] of Object.entries(levels)) {
////                if (label.includes("正常")) {
////                    normalRange = val;
////                    break;
////                }
////            }
////
////            const div = document.createElement("div");
////            div.className = "col-md-4";
////            div.innerHTML = `
////                <label class="form-label">${param}</label>
////                <input type="number" step="0.1" class="form-control" name="${param}" placeholder="正常值：${normalRange}">
////                <small class="form-text text-light">正常范围：${normalRange}</small>
////            `;
////            form.appendChild(div);
////        }
////    });
////}
//
//function submitDynamicPrediction() {
//    const form = document.getElementById("dynamicHealthForm");
//    const data = {};
//    const allowNegative = "骨密度T值";
//    let hasNegative = false;
//
//    const filledFields = new Set();
//
//    Array.from(form.elements).forEach(el => {
//        if (el.name) {
//            const val = el.value.trim();
//            if (val !== "") {
//                if (parseFloat(val) < 0 && el.name !== allowNegative) {
//                    hasNegative = true;
//                }
//                data[el.name] = parseFloat(val);
//                filledFields.add(el.name);
//            }
//        }
//    });
//
//    if (hasNegative) {
//        alert("该数值不能为负数！");
//        return;
//    }
//
//    // 自动补全未输入的值（正常范围中的“数字”部分）：
//    const selectedDiseases = Array.from(document.querySelectorAll("#diseaseCheckboxes input:checked")).map(cb => cb.value);
//    selectedDiseases.forEach(disease => {
//        const indicators = zhibiaoMap[disease];
//        for (const [param, levels] of Object.entries(indicators)) {
//            if (param in data) continue;
//
//            for (const [label, val] of Object.entries(levels)) {
//                if (label.includes("正常")) {
//                    const numMatch = val.match(/[\d\.\-]+/g);
//                    if (numMatch) {
//                        data[param] = parseFloat(numMatch[0]);  // 默认用范围下限
//                    }
//                    break;
//                }
//            }
//        }
//    });
//
//    // 填补 X_cols 中所有字段（模型所需字段）
//    X_COLS.forEach(col => {
//        if (!(col in data)) {
//            data[col] = 0;
//        }
//    });
//
//    fetch('/predict', {
//        method: 'POST',
//        headers: {'Content-Type': 'application/json'},
//        body: JSON.stringify(data)
//    })
//    .then(res => res.json())
//    .then(result => {
//        const filtered = result.filter(r => r["相似人群患病率"] > 0);
//        let html = `<table class="table table-bordered table-striped text-light">
//                      <thead><tr><th>疾病</th><th>状态</th><th>相似人群患病率</th></tr></thead><tbody>`;
//        filtered.forEach(r => {
//            const statusClass = r.状态 === "有风险" ? "text-danger" : "text-success";
//            html += `<tr><td>${r.疾病}</td><td class="${statusClass}">${r.状态}</td><td>${(r.相似人群患病率 * 100).toFixed(1)}%</td></tr>`;
//        });
//        html += "</tbody></table>";
//        document.getElementById("predictionResult").innerHTML = html;
//    });
//}
//
//
//
//function renderHealthPredictUI() {
//    // ① 隐藏原来的内容
//    const targetDiv = document.querySelector(".visual_chart_text");  // 或 document.getElementById("你的容器ID")
//    if (targetDiv) {
//        targetDiv.style.display = "none"; // 隐藏原有内容
//    }
//
//    // ② 显示我们自己的健康预测模块（写到 container 中）
//    const container = document.getElementById("healthPredictContainer");
//    container.innerHTML = `
//        <h4 class="mb-3">健康风险预测</h4>
//        <p>请选择您关心的疾病，系统将自动提示相关指标并评估健康风险：</p>
//        <div id="diseaseCheckboxes" class="d-flex flex-wrap mb-3"></div>
//        <form id="dynamicHealthForm" class="row g-3"></form>
//        <button class="btn btn-primary mt-3" onclick="submitDynamicPrediction()">提交预测</button>
//        <hr>
//        <div id="predictionResult" class="mt-3"></div>
//    `;
//
//    // ③ 多选疾病列表
//    const diseaseBox = document.getElementById("diseaseCheckboxes");
//    Object.keys(diseaseToParams).forEach(disease => {
//        const checkbox = document.createElement("div");
//        checkbox.className = "form-check me-4";
//        checkbox.innerHTML = `
//            <input type="checkbox" class="form-check-input" value="${disease}" id="dis-${disease}" onchange="updateHealthInputForm()">
//            <label for="dis-${disease}" class="form-check-label">${disease}</label>
//        `;
//        diseaseBox.appendChild(checkbox);
//    });
//}
//
//function updateHealthInputForm() {
//    const checked = Array.from(document.querySelectorAll("#diseaseCheckboxes input:checked"))
//                         .map(cb => cb.value);
//    const params = new Set();
//    checked.forEach(disease => {
//        diseaseToParams[disease].forEach(param => params.add(param));
//    });
//
//    const form = document.getElementById("dynamicHealthForm");
//    form.innerHTML = "";
//
//    Array.from(params).forEach(param => {
//        const div = document.createElement("div");
//        div.className = "col-md-4";
//        div.innerHTML = `
//            <label class="form-label">${param}</label>
//            <input type="number" step="0.1" name="${param}" class="form-control" value="0">
//        `;
//        form.appendChild(div);
//    });
//}
//
//
//
